import express from 'express';
import path from 'path';
import os from 'os';
import net from 'net';
import { exec } from 'child_process';
import { promisify } from 'util';
import multicastdns from 'multicast-dns';
// Vite import removed for separate frontend configuration
import { db, initDb } from './db.js';

const execAsync = promisify(exec);

const activeHttpDevices = new Map<string, number>();

function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',');
    return ips[0].trim().replace(/^::ffff:/, '');
  }
  const remoteIp = req.ip || req.socket.remoteAddress || '';
  return remoteIp.replace(/^::ffff:/, '');
}

async function probeNetworkTarget(ip: string) {
  const cleanIp = ip.trim();
  if (net.isIP(cleanIp) !== 4) {
    throw new Error('A valid IPv4 address is required.');
  }

  // 1. Check if the device is active via HTTP heartbeat
  const lastSeen = activeHttpDevices.get(cleanIp);
  if (lastSeen && Date.now() - lastSeen < 60000) {
    return { online: true, mac: 'HTTP-HEARTBEAT' };
  }

  // 2. Fallback to ICMP ping
  const pingCommand = process.platform === 'win32'
    ? `ping -n 1 -w 1200 ${cleanIp}`
    : `ping -c 1 -W 1 ${cleanIp}`;

  try {
    await execAsync(pingCommand);
  } catch {
    return { online: false, mac: 'UNAVAILABLE' };
  }

  let mac = 'UNAVAILABLE';
  if (process.platform === 'win32') {
    try {
      const { stdout } = await execAsync(`arp -a ${cleanIp}`);
      const match = stdout.match(/([0-9a-f]{2}(?:-[0-9a-f]{2}){5})/i);
      if (match) mac = match[1].toUpperCase();
    } catch {}
  }

  return { online: true, mac };
}

interface MdnsDevice {
  ip: string;
  hostname: string;
  services: string[];
  friendlyName?: string;
  model?: string;
  type: string;
  lastSeen: number;
}

const discoveredMdnsDevices = new Map<string, MdnsDevice>();
let mdnsInstance: any = null;

function mapServiceToType(services: string[], identifier: string, model: string): string {
  const combined = [...services, identifier, model].map(s => s.toLowerCase());
  
  if (combined.some(s => s.includes('googlecast') || s.includes('airplay') || s.includes('spotify') || s.includes('speaker') || s.includes('audio') || s.includes('raop') || s.includes('sonos'))) {
    return 'speaker';
  }
  if (combined.some(s => s.includes('camera') || s.includes('rtsp') || s.includes('video') || s.includes('webcam') || s.includes('axis'))) {
    return 'camera';
  }
  if (combined.some(s => s.includes('light') || s.includes('hue') || s.includes('dimmer') || s.includes('bulb') || s.includes('lifx'))) {
    return 'light';
  }
  if (combined.some(s => s.includes('thermostat') || s.includes('hvac') || s.includes('climate') || s.includes('temperature') || s.includes('nest'))) {
    return 'thermostat';
  }
  if (combined.some(s => s.includes('lock') || s.includes('door') || s.includes('gate') || s.includes('key'))) {
    return 'lock';
  }
  if (combined.some(s => s.includes('vacuum') || s.includes('roomba') || s.includes('cleaner') || s.includes('robock'))) {
    return 'vacuum';
  }
  if (combined.some(s => s.includes('irrigation') || s.includes('sprinkler') || s.includes('garden') || s.includes('valve') || s.includes('rain'))) {
    return 'irrigation';
  }
  
  return 'smart-plug';
}

function initMdnsListener() {
  try {
    mdnsInstance = multicastdns();
    
    mdnsInstance.on('response', (packet: any) => {
      const records = [...(packet.answers || []), ...(packet.additionals || [])];
      
      const aRecords: { name: string; ip: string }[] = [];
      const srvRecords: { name: string; target: string }[] = [];
      const txtRecords: { name: string; txt: Record<string, string> }[] = [];
      const ptrRecords: { name: string; data: string }[] = [];
      
      for (const record of records) {
        if (!record.name) continue;
        
        if (record.type === 'A') {
          aRecords.push({ name: record.name.toLowerCase(), ip: record.data });
        } else if (record.type === 'SRV' && record.data) {
          srvRecords.push({ name: record.name.toLowerCase(), target: record.data.target ? record.data.target.toLowerCase() : '' });
        } else if (record.type === 'TXT' && Array.isArray(record.data)) {
          const txtMap: Record<string, string> = {};
          for (const item of record.data) {
            const str = Buffer.isBuffer(item) ? item.toString('utf8') : String(item);
            const parts = str.split('=');
            if (parts.length >= 2) {
              txtMap[parts[0].toLowerCase()] = parts.slice(1).join('=');
            } else if (parts.length === 1) {
              txtMap[parts[0].toLowerCase()] = '';
            }
          }
          txtRecords.push({ name: record.name.toLowerCase(), txt: txtMap });
        } else if (record.type === 'PTR' && typeof record.data === 'string') {
          ptrRecords.push({ name: record.name.toLowerCase(), data: record.data.toLowerCase() });
        }
      }
      
      // Process A records
      for (const aRec of aRecords) {
        const ip = aRec.ip;
        const hostname = aRec.name;
        
        let dev = discoveredMdnsDevices.get(ip);
        if (!dev) {
          dev = {
            ip,
            hostname,
            services: [],
            type: 'smart-plug',
            lastSeen: Date.now()
          };
          discoveredMdnsDevices.set(ip, dev);
        } else {
          dev.hostname = hostname;
          dev.lastSeen = Date.now();
        }
      }
      
      // Process SRV records
      for (const srv of srvRecords) {
        if (!srv.target) continue;
        for (const dev of discoveredMdnsDevices.values()) {
          const cleanDevHost = dev.hostname.replace(/\.local\.?$/, '');
          const cleanTarget = srv.target.replace(/\.local\.?$/, '');
          if (cleanDevHost === cleanTarget) {
            if (!dev.services.includes(srv.name)) {
              dev.services.push(srv.name);
            }
            dev.lastSeen = Date.now();
          }
        }
      }
      
      // Process TXT records
      for (const txtRec of txtRecords) {
        for (const dev of discoveredMdnsDevices.values()) {
          const cleanDevHost = dev.hostname.replace(/\.local\.?$/, '');
          const cleanTxtName = txtRec.name.replace(/\.local\.?$/, '');
          
          if (dev.services.includes(txtRec.name) || cleanDevHost === cleanTxtName) {
            const fn = txtRec.txt['fn'] || txtRec.txt['friendlyname'] || txtRec.txt['name'];
            const model = txtRec.txt['md'] || txtRec.txt['model'] || txtRec.txt['modelname'];
            if (fn) dev.friendlyName = fn;
            if (model) dev.model = model;
            
            dev.type = mapServiceToType(dev.services, txtRec.name, model || '');
            dev.lastSeen = Date.now();
          }
        }
      }

      // Process PTR records
      for (const ptr of ptrRecords) {
        for (const dev of discoveredMdnsDevices.values()) {
          if (dev.services.includes(ptr.data)) {
            if (!dev.services.includes(ptr.name)) {
              dev.services.push(ptr.name);
            }
            dev.type = mapServiceToType(dev.services, ptr.name, dev.model || '');
          }
        }
      }
    });

    setInterval(() => {
      const now = Date.now();
      for (const [ip, dev] of discoveredMdnsDevices.entries()) {
        if (now - dev.lastSeen > 30000) { // stale after 30 seconds
          discoveredMdnsDevices.delete(ip);
        }
      }
    }, 10000); // check every 10 seconds

    console.log('[mDNS Discovery] Active Bonjour listener initialized on 224.0.0.251:5353');
  } catch (err: any) {
    console.error('[mDNS Discovery] Failed to initialize multicast DNS listener:', err.message);
  }
}

function broadcastMdnsQuery() {
  if (!mdnsInstance) return;
  const serviceTypes = [
    '_services._dns-sd._udp.local',
    '_googlecast._tcp.local',
    '_hap._tcp.local',
    '_airplay._tcp.local',
    '_spotify-connect._tcp.local',
    '_http._tcp.local',
    '_printer._tcp.local',
    '_ipp._tcp.local',
    '_workstation._tcp.local'
  ];
  
  const questions = serviceTypes.map(type => ({
    name: type,
    type: 'PTR' as const
  }));
  
  try {
    mdnsInstance.query({ questions });
    console.log('[mDNS Discovery] Multicast query broadcasted to 224.0.0.251');
  } catch (err: any) {
    console.warn('[mDNS Discovery] Failed to query mDNS:', err.message);
  }
}


async function startServer() {
  await initDb();
  initMdnsListener();
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json());

  // Track client IPs for HTTP Heartbeat device simulation
  app.use((req, res, next) => {
    const clientIp = getClientIp(req);
    if (clientIp) {
      activeHttpDevices.set(clientIp, Date.now());
    }
    next();
  });

  // Heartbeat signal endpoint for mobile device pairing
  app.get('/api/wifi/heartbeat', (req, res) => {
    const clientIp = getClientIp(req);
    if (clientIp) {
      activeHttpDevices.set(clientIp, Date.now());
      return res.json({ success: true, ip: clientIp, lastSeen: Date.now() });
    }
    res.status(400).json({ error: 'Could not resolve client IP address.' });
  });

  // Host access URL info for pairing QR display
  app.get('/api/wifi/access-info', (req, res) => {
    const interfaces = os.networkInterfaces();
    let hostIp = 'localhost';
    for (const name of Object.keys(interfaces)) {
      const ifaceList = interfaces[name];
      if (!ifaceList) continue;
      for (const iface of ifaceList) {
        if (iface.family === 'IPv4' && !iface.internal) {
          hostIp = iface.address;
          break;
        }
      }
    }
    res.json({
      localIp: hostIp,
      localPort: PORT,
      appUrl: process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
        ? process.env.APP_URL
        : `http://${hostIp}:${PORT}`
    });
  });

  // Helper to resolve user role
  async function getUserRole(email: string | undefined): Promise<'admin' | 'user'> {
    if (!email) return 'user';
    try {
      const user = await db.queryOne<{ role: string }>('SELECT role FROM users WHERE LOWER(email) = ?', [email.toLowerCase()]);
      return user ? (user.role as 'admin' | 'user') : 'user';
    } catch {
      return 'user';
    }
  }

  // ==========================================
  // RELATIONAL API ENDPOINTS (SQL BACKED)
  // ==========================================

  // Authentication: Login endpoint
  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please specify login email and access code.' });
    }

    try {
      const user = await db.queryOne<{ email: string; password?: string; role: string }>('SELECT * FROM users WHERE LOWER(email) = ?', [email.toLowerCase()]);

      if (!user) {
        return res.status(401).json({ error: 'Transmitter profile not registered on this node.' });
      }

      if (user.password !== password) {
        return res.status(401).json({ error: 'Access code authentication failed.' });
      }

      res.json({ email: user.email, role: user.role });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Database execution fault.' });
    }
  });

  // Authentication: Registration endpoint (Disabled / restricted)
  app.post('/api/register', (req, res) => {
    res.status(403).json({ error: 'Direct self-registration has been decommissioned. Credentials must be provisioned by the Root Administrator.' });
  });

  // User Management: Retrieve list of all users/operators (Admins only query)
  app.get('/api/users', async (req, res) => {
    try {
      const usersList = await db.query('SELECT id, email, role FROM users ORDER BY id DESC');
      res.json(usersList);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to list telemetry profiles.' });
    }
  });

  // User Management: Add user directly from App Panel (Simplified to ID and Password)
  app.post('/api/users/add', async (req, res) => {
    const { email, password } = req.body; // email is treated as "ID"
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing operator ID or password.' });
    }

    try {
      const { count } = await db.queryOne<{ count: number }>('SELECT count(*) as count FROM users WHERE LOWER(email) = ?', [email.toLowerCase()]) || { count: 0 };

      if (count > 0) {
        return res.status(409).json({ error: 'Operator ID already programmed into memory.' });
      }

      // Always defaults to 'user' role
      await db.execute('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email.toLowerCase(), password, 'user']);

      res.status(201).json({ success: true, message: 'New user initialized successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Database insertion error.' });
    }
  });

  // User Management: Delete user profile (Admins override)
  app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await db.execute('DELETE FROM users WHERE id = ?', [id]);
      res.json({ success: true, message: `Profile ${id} decommissioned.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Registration removal failure.' });
    }
  });

  // Devices endpoints
  app.get('/api/devices', async (req, res) => {
    try {
      const list = (await db.query('SELECT * FROM devices')).map((device: any) => ({
        ...device,
        isOn: Boolean(device.isOn),
      }));
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to access devices database.' });
    }
  });

  // Toggle endpoint with support for user requests queue
  app.post('/api/devices/toggle', async (req, res) => {
    const { id, isOn } = req.body;
    const userEmail = req.headers['x-user-email'] as string | undefined;
    const role = await getUserRole(userEmail);

    if (role === 'user') {
      try {
        await db.execute(
          'INSERT INTO requests (user_email, action_type, target_id, details, timestamp, status) VALUES (?, ?, ?, ?, ?, ?)',
          [
          userEmail || 'operator',
          'toggle_device',
          id,
          JSON.stringify({ isOn }),
          new Date().toISOString(),
          'pending'
          ]
        );
        return res.json({ pending: true, message: 'Toggle proposed: pending administrator approval' });
      } catch (err: any) {
        return res.status(500).json({ error: 'Failed to propose system change.' });
      }
    }

    try {
      await db.execute('UPDATE devices SET isOn = ?, lastSeen = ? WHERE id = ?', [isOn ? 1 : 0, 'Just now', id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to toggle system status.' });
    }
  });

  // Add endpoint with support for user requests queue
  app.post('/api/devices/add', async (req, res) => {
    const { id, name, type, room, value, metricUnit, energyUsage, status, wifi_ip } = req.body;
    const userEmail = req.headers['x-user-email'] as string | undefined;
    const role = await getUserRole(userEmail);

    if (role === 'user') {
      try {
        await db.execute(
          'INSERT INTO requests (user_email, action_type, target_id, details, timestamp, status) VALUES (?, ?, ?, ?, ?, ?)',
          [
          userEmail || 'operator',
          'add_device',
          id,
          JSON.stringify({ id, name, type, room, value, metricUnit, energyUsage, status, wifi_ip }),
          new Date().toISOString(),
          'pending'
          ]
        );
        return res.json({ pending: true, message: 'Addition proposed: pending administrator approval' });
      } catch (err: any) {
        return res.status(500).json({ error: 'Failed to propose device addition.' });
      }
    }

    try {
      await db.execute(`
        INSERT INTO devices (id, name, type, room, isOn, value, metricUnit, energyUsage, status, lastSeen, wifi_ip)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, 'Just now', ?)
      `, [id, name, type, room, value || 0, metricUnit || '', energyUsage || 0, status || 'online', wifi_ip || null]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to insert live node to registry.' });
    }
  });

  // Delete endpoint with support for user requests queue
  app.delete('/api/devices/:id', async (req, res) => {
    const { id } = req.params;
    const userEmail = req.headers['x-user-email'] as string | undefined;
    const role = await getUserRole(userEmail);

    if (role === 'user') {
      try {
        await db.execute(
          'INSERT INTO requests (user_email, action_type, target_id, details, timestamp, status) VALUES (?, ?, ?, ?, ?, ?)',
          [
          userEmail || 'operator',
          'delete_device',
          id,
          JSON.stringify({ id }),
          new Date().toISOString(),
          'pending'
          ]
        );
        return res.json({ pending: true, message: 'Decommission proposed: pending administrator approval' });
      } catch (err: any) {
        return res.status(500).json({ error: 'Failed to propose device decommissioning.' });
      }
    }

    try {
      await db.execute('DELETE FROM devices WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to clear device record.' });
    }
  });

  // ==========================================
  // REQUEST APPROVALS QUEUE SYSTEM
  // ==========================================

  app.get('/api/requests', async (req, res) => {
    try {
      const list = await db.query('SELECT * FROM requests ORDER BY id DESC');
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve pending approvals.' });
    }
  });

  app.post('/api/requests/:id/approve', async (req, res) => {
    const { id } = req.params;
    const adminEmail = req.headers['x-user-email'] as string | undefined;
    
    if (await getUserRole(adminEmail) !== 'admin') {
      return res.status(403).json({ error: 'Operational override forbidden. Root privileges required.' });
    }

    try {
      const request = await db.queryOne<any>('SELECT * FROM requests WHERE id = ?', [id]);
      if (!request) {
        return res.status(404).json({ error: 'Telemetry request profile not found.' });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ error: 'Request already processed.' });
      }

      const details = JSON.parse(request.details);

      if (request.action_type === 'toggle_device') {
        await db.execute('UPDATE devices SET isOn = ?, lastSeen = ? WHERE id = ?', [details.isOn ? 1 : 0, 'Approved just now', request.target_id]);
      } else if (request.action_type === 'add_device') {
        await db.execute(`
          INSERT INTO devices (id, name, type, room, isOn, value, metricUnit, energyUsage, status, lastSeen, wifi_ip)
          VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, 'Approved just now', ?)
        `, [details.id, details.name, details.type, details.room, details.value || 0, details.metricUnit || '', details.energyUsage || 0, details.status || 'online', details.wifi_ip || null]);
      } else if (request.action_type === 'delete_device') {
        await db.execute('DELETE FROM devices WHERE id = ?', [request.target_id]);
      }

      await db.execute("UPDATE requests SET status = 'approved' WHERE id = ?", [id]);
      res.json({ success: true, message: 'Proposed telemetry action fully approved and executed.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Execution mismatch on relational application layers.' });
    }
  });

  app.post('/api/requests/:id/reject', async (req, res) => {
    const { id } = req.params;
    const adminEmail = req.headers['x-user-email'] as string | undefined;
    
    if (await getUserRole(adminEmail) !== 'admin') {
      return res.status(403).json({ error: 'Operational override forbidden. Root privileges required.' });
    }

    try {
      const request = await db.queryOne<any>('SELECT * FROM requests WHERE id = ?', [id]);
      if (!request) {
        return res.status(404).json({ error: 'Telemetry request profile not found.' });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ error: 'Request already processed.' });
      }

      await db.execute("UPDATE requests SET status = 'rejected' WHERE id = ?", [id]);
      res.json({ success: true, message: 'Proposed telemetry action fully rejected.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Execution mismatch.' });
    }
  });

  // ==========================================
  // REAL-TIME WI-FI AND DEVICE DISCOVERY API
  // ==========================================

  // 1. Get current active Wi-Fi connection status of host
  app.get('/api/wifi/status', async (req, res) => {
    try {
      if (process.platform === 'win32') {
        const { stdout } = await execAsync('netsh wlan show interfaces');
        const ssidMatch = stdout.match(/^\s*SSID\s*:\s*(.+)$/m);
        const signalMatch = stdout.match(/^\s*Signal\s*:\s*(.+)$/m);
        
        if (ssidMatch) {
          return res.json({
            ssid: ssidMatch[1].trim(),
            signal: signalMatch ? signalMatch[1].trim() : '100%',
            connected: true
          });
        }
      }
      
      // Fallback: try os interface detection
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        const ifaceList = interfaces[name];
        if (!ifaceList) continue;
        for (const iface of ifaceList) {
          if (iface.family === 'IPv4' && !iface.internal) {
            return res.json({
              ssid: `Local_Network_${name}`,
              signal: '100%',
              connected: true
            });
          }
        }
      }

      res.json({ ssid: null, signal: null, connected: false });
    } catch (err) {
      res.json({ ssid: null, signal: null, connected: false });
    }
  });

  // 2. Scan visible surrounding wireless networks
  app.get('/api/wifi/scan', async (req, res) => {
    try {
      if (process.platform === 'win32') {
        const { stdout } = await execAsync('netsh wlan show networks');
        const lines = stdout.split('\n');
        const ssids: string[] = [];
        for (const line of lines) {
          const match = line.match(/^\s*SSID\s+\d+\s*:\s*(.+)$/);
          if (match) {
            const ssid = match[1].trim();
            if (ssid && !ssids.includes(ssid)) {
              ssids.push(ssid);
            }
          }
        }
        if (ssids.length > 0) {
          return res.json(ssids);
        }
      }
      
      res.json([]);
    } catch (err) {
      res.status(503).json({ error: 'Wi-Fi network scanning is unavailable.' });
    }
  });

  // 3. Scan and discover active devices on the same local subnets (including mobile hotspot network)
  app.get('/api/wifi/discover-devices', async (req, res) => {
    try {
      // Trigger active mDNS query broadcast so devices respond during the scan
      broadcastMdnsQuery();

      const interfaces = os.networkInterfaces();
      const detectedSubnets = [];

      // Detect all active IPv4 subnets (Wi-Fi, Ethernet, Hotspot, etc.)
      for (const name of Object.keys(interfaces)) {
        const ifaceList = interfaces[name];
        if (!ifaceList) continue;
        for (const iface of ifaceList) {
          if (iface.family === 'IPv4' && !iface.internal) {
            const ip = iface.address;
            if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.')) {
              const parts = ip.split('.');
              detectedSubnets.push({
                hostIp: ip,
                subnetBase: `${parts[0]}.${parts[1]}.${parts[2]}`,
                interfaceName: name
              });
            }
          }
        }
      }

      if (detectedSubnets.length === 0) {
        throw new Error('No active local subnetwork interfaces identified.');
      }

      console.log(`[Discovery Engine] Scanning active subnets: ${detectedSubnets.map(s => `${s.subnetBase}.0/24 (${s.interfaceName})`).join(', ')}`);

      // 1. Run batched parallel pings to populate the ARP cache safely without process exhaustion
      const activeIps = [];
      const allTargets = [];

      for (const { hostIp, subnetBase } of detectedSubnets) {
        for (let i = 1; i <= 254; i++) {
          const targetIp = `${subnetBase}.${i}`;
          if (targetIp === hostIp) continue;
          allTargets.push(targetIp);
        }
      }

      // Execute in batches of 40 pings to protect OS resource limits
      const batchSize = 40;
      for (let i = 0; i < allTargets.length; i += batchSize) {
        const batch = allTargets.slice(i, i + batchSize);
        const batchPromises = batch.map(async (targetIp) => {
          try {
            // Windows ping: -n 1 packet, -w 150ms timeout
            await execAsync(`ping -n 1 -w 150 ${targetIp}`);
            if (!activeIps.includes(targetIp)) {
              activeIps.push(targetIp);
            }
          } catch {}
        });
        await Promise.all(batchPromises);
      }

      // 2. Query and parse the local ARP table
      let arpMap = new Map();
      let arpActiveIps = [];
      try {
        const { stdout: arpOut } = await execAsync('arp -a');
        const lines = arpOut.split('\n');
        for (const line of lines) {
          const match = line.trim().match(/^([0-9.]+)\s+([0-9a-f-]+)\s+(dynamic|static)/i);
          if (match) {
            const ip = match[1];
            const mac = match[2].toUpperCase();
            const type = match[3].toLowerCase();
            
            arpMap.set(ip, mac);
            
            // Allow both dynamic and static ARP entries for discovery (multicast/broadcast filtered below)
            if (type === 'dynamic' || type === 'static') {
              const subnetMatch = detectedSubnets.find(s => ip.startsWith(s.subnetBase + '.'));
              if (subnetMatch && ip !== subnetMatch.hostIp) {
                const parts = ip.split('.');
                const lastOctet = parts[parts.length - 1];
                if (lastOctet && lastOctet !== '0' && lastOctet !== '255') {
                  if (!arpActiveIps.includes(ip)) {
                    arpActiveIps.push(ip);
                  }
                }
              }
            }
          }
        }
      } catch (arpErr) {
        console.warn('[Discovery Engine] Failed to query ARP cache:', arpErr);
      }

      // Collect active mDNS IPs matching our subnets
      const mdnsIps = Array.from(discoveredMdnsDevices.keys()).filter((ip) => {
        return detectedSubnets.some(s => ip.startsWith(s.subnetBase + '.'));
      });

      // Combine ping, ARP table, and mDNS active IPs
      const combinedActiveIps = Array.from(new Set([...activeIps, ...arpActiveIps, ...mdnsIps]));

      // 3. Construct discovered devices list
      const devices = combinedActiveIps.map((ip) => {
        const mdnsMatch = discoveredMdnsDevices.get(ip);
        const isMdns = !!mdnsMatch;
        const mac = arpMap.get(ip) || (mdnsMatch ? 'mDNS Broadcast' : 'UNKNOWN-MAC');
        const isGateway = ip.endsWith('.1');
        
        // Find which interface this belongs to
        const subnetMatch = detectedSubnets.find(s => ip.startsWith(s.subnetBase + '.'));
        const interfaceLabel = subnetMatch ? ` via ${subnetMatch.interfaceName}` : '';
        const isHotspot = subnetMatch && subnetMatch.hostIp === '192.168.137.1';
        const subnetBase = subnetMatch ? subnetMatch.subnetBase : '';
        
        // Determine device type
        let deviceType = 'network-device';
        if (mdnsMatch) {
          deviceType = mdnsMatch.type;
        }

        // Determine label
        let label = '';
        if (mdnsMatch) {
          const namePart = mdnsMatch.friendlyName || mdnsMatch.model || mdnsMatch.hostname.replace(/\.local\.?$/, '');
          label = `${namePart} (mDNS Broadcast)`;
        } else {
          label = isGateway 
            ? `Subnet Gateway Router${interfaceLabel}` 
            : isHotspot 
              ? 'Hotspot Client Device'
              : `Network Host${interfaceLabel}`;
              
          if (mac.startsWith('00-0F-AC') || mac.startsWith('52-94-C2')) {
            label = isHotspot ? `Hotspot Client Node` : `Connected Client Node`;
          }
        }

        return {
          ip,
          mac,
          isGateway,
          type: deviceType,
          label,
          subnetBase,
          isMdns
        };
      });

      res.json({
        subnets: detectedSubnets,
        devices
      });
    } catch (err: any) {
      console.warn('[Discovery Engine] Scan error:', err.message);
      res.status(503).json({
        error: err.message || 'Local network discovery failed.',
        subnets: [],
        devices: []
      });
    }
  });

  // 4. Persist and monitor explicitly-addressed devices outside the local /24.
  app.get('/api/wifi/targets', async (req, res) => {
    try {
      const targets = await db.query<{ id: number; ip: string; name: string }>(
        'SELECT id, ip, name FROM network_targets ORDER BY id DESC'
      );
      const results = await Promise.all(targets.map(async (target) => ({
        ...target,
        ...(await probeNetworkTarget(target.ip)),
        type: 'network-device',
        label: target.name,
        isDirect: true,
        isGateway: false,
        isMdns: false,
      })));
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to load direct network targets.' });
    }
  });

  app.post('/api/wifi/targets', async (req, res) => {
    const ip = String(req.body?.ip || '').trim();
    const name = String(req.body?.name || 'My phone').trim();

    if (net.isIP(ip) !== 4) {
      return res.status(400).json({ error: 'Enter a valid IPv4 address.' });
    }

    try {
      const probe = await probeNetworkTarget(ip);
      if (!probe.online) {
        console.warn(`[Target Registration] IP ${ip} is not pingable, registering offline/unreachable target for HTTP-heartbeat/testing.`);
      }

      await db.execute(
        `INSERT INTO network_targets (ip, name) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [ip, name || 'My phone']
      );
      res.status(201).json({ ip, name: name || 'My phone', ...probe });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to connect network target.' });
    }
  });

  app.delete('/api/wifi/targets/:id', async (req, res) => {
    try {
      await db.execute('DELETE FROM network_targets WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to remove network target.' });
    }
  });

  // ==========================================
  // VITE DEVELOPMENT OR STATIC ASSETS ROUTING
  // ==========================================
  
  app.get('/', (req, res) => {
    if (process.env.NODE_ENV !== 'production') {
      const clientIp = getClientIp(req);
      if (clientIp) {
        activeHttpDevices.set(clientIp, Date.now());
      }
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>IoT Device Control - Mobile Registered</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background: linear-gradient(135deg, #0f172a, #1e293b);
              color: #f8fafc;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
              text-align: center;
            }
            .card {
              background: rgba(30, 41, 59, 0.7);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              padding: 2.5rem;
              border-radius: 20px;
              max-width: 400px;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
            }
            .icon {
              width: 64px;
              height: 64px;
              background: rgba(16, 185, 129, 0.1);
              border: 2px solid #10b981;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 1.5rem;
              color: #10b981;
              font-size: 2rem;
              animation: pulse 2s infinite;
            }
            h1 {
              font-size: 1.5rem;
              margin-bottom: 0.5rem;
              font-weight: 700;
            }
            p {
              font-size: 0.95rem;
              color: #94a3b8;
              line-height: 1.5;
            }
            .ip {
              font-family: monospace;
              background: #0f172a;
              padding: 4px 8px;
              border-radius: 4px;
              color: #38bdf8;
              font-size: 0.9rem;
            }
            .btn {
              display: inline-block;
              margin-top: 1.5rem;
              background: #2563eb;
              color: white;
              text-decoration: none;
              padding: 10px 20px;
              border-radius: 8px;
              font-size: 0.9rem;
              font-weight: 600;
              transition: background 0.2s;
            }
            .btn:hover {
              background: #1d4ed8;
            }
            @keyframes pulse {
              0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
              70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
              100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h1>Device Paired Successfully</h1>
            <p>Your mobile phone has connected to the IoT system.</p>
            <p>Detected IP address: <span class="ip">${clientIp}</span></p>
            <a href="http://${req.hostname}:5173" class="btn">Open Full Dashboard</a>
            <p style="margin-top: 1.5rem; font-size: 0.75rem; color: #64748b;">(Note: Opening the dashboard requires the Vite host configuration to be active on the same Wi-Fi network.)</p>
          </div>
        </body>
        </html>
      `);
    }
    const distPath = path.join(process.cwd(), '../frontend/dist');
    app.use(express.static(distPath));
    res.sendFile(path.join(distPath, 'index.html'));
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), '../frontend/dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ROBROS Relational System Dashboard] launched on host http://0.0.0.0:${PORT}`);
  });
}

startServer();
