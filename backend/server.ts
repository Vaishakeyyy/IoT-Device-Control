import express from 'express';
import path from 'path';
// Vite import removed for separate frontend configuration
import { db } from './db.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to resolve user role
  function getUserRole(email: string | undefined): 'admin' | 'user' {
    if (!email) return 'user';
    try {
      const stmt = db.prepare('SELECT role FROM users WHERE LOWER(email) = ?');
      const user = stmt.get(email.toLowerCase()) as { role: string } | undefined;
      return user ? (user.role as 'admin' | 'user') : 'user';
    } catch {
      return 'user';
    }
  }

  // ==========================================
  // RELATIONAL API ENDPOINTS (SQL BACKED)
  // ==========================================

  // Authentication: Login endpoint
  app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please specify login email and access code.' });
    }

    try {
      const stmt = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?');
      const user = stmt.get(email.toLowerCase()) as { email: string; password?: string; role: string } | undefined;

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
  app.get('/api/users', (req, res) => {
    try {
      const stmt = db.prepare('SELECT id, email, role FROM users ORDER BY id DESC');
      const usersList = stmt.all();
      res.json(usersList);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to list telemetry profiles.' });
    }
  });

  // User Management: Add user directly from App Panel (Simplified to ID and Password)
  app.post('/api/users/add', (req, res) => {
    const { email, password } = req.body; // email is treated as "ID"
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing operator ID or password.' });
    }

    try {
      const checkStmt = db.prepare('SELECT count(*) as count FROM users WHERE LOWER(email) = ?');
      const { count } = checkStmt.get(email.toLowerCase()) as { count: number };

      if (count > 0) {
        return res.status(409).json({ error: 'Operator ID already programmed into memory.' });
      }

      // Always defaults to 'user' role
      const insertStmt = db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)');
      insertStmt.run(email.toLowerCase(), password, 'user');

      res.status(201).json({ success: true, message: 'New user initialized successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Database insertion error.' });
    }
  });

  // User Management: Delete user profile (Admins override)
  app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    try {
      const stmt = db.prepare('DELETE FROM users WHERE id = ?');
      stmt.run(id);
      res.json({ success: true, message: `Profile ${id} decommissioned.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Registration removal failure.' });
    }
  });

  // Devices endpoints
  app.get('/api/devices', (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM devices');
      const list = stmt.all().map((device: any) => ({
        ...device,
        isOn: Boolean(device.isOn),
      }));
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to access devices database.' });
    }
  });

  // Toggle endpoint with support for user requests queue
  app.post('/api/devices/toggle', (req, res) => {
    const { id, isOn } = req.body;
    const userEmail = req.headers['x-user-email'] as string | undefined;
    const role = getUserRole(userEmail);

    if (role === 'user') {
      try {
        const stmt = db.prepare('INSERT INTO requests (user_email, action_type, target_id, details, timestamp, status) VALUES (?, ?, ?, ?, ?, ?)');
        stmt.run(
          userEmail || 'operator',
          'toggle_device',
          id,
          JSON.stringify({ isOn }),
          new Date().toISOString(),
          'pending'
        );
        return res.json({ pending: true, message: 'Toggle proposed: pending administrator approval' });
      } catch (err: any) {
        return res.status(500).json({ error: 'Failed to propose system change.' });
      }
    }

    try {
      const stmt = db.prepare('UPDATE devices SET isOn = ?, lastSeen = ? WHERE id = ?');
      stmt.run(isOn ? 1 : 0, 'Just now', id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to toggle system status.' });
    }
  });

  // Add endpoint with support for user requests queue
  app.post('/api/devices/add', (req, res) => {
    const { id, name, type, room, value, metricUnit, energyUsage, status, wifi_ip } = req.body;
    const userEmail = req.headers['x-user-email'] as string | undefined;
    const role = getUserRole(userEmail);

    if (role === 'user') {
      try {
        const stmt = db.prepare('INSERT INTO requests (user_email, action_type, target_id, details, timestamp, status) VALUES (?, ?, ?, ?, ?, ?)');
        stmt.run(
          userEmail || 'operator',
          'add_device',
          id,
          JSON.stringify({ id, name, type, room, value, metricUnit, energyUsage, status, wifi_ip }),
          new Date().toISOString(),
          'pending'
        );
        return res.json({ pending: true, message: 'Addition proposed: pending administrator approval' });
      } catch (err: any) {
        return res.status(500).json({ error: 'Failed to propose device addition.' });
      }
    }

    try {
      const stmt = db.prepare(`
        INSERT INTO devices (id, name, type, room, isOn, value, metricUnit, energyUsage, status, lastSeen, wifi_ip)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, 'Just now', ?)
      `);
      stmt.run(id, name, type, room, value || 0, metricUnit || '', energyUsage || 0, status || 'online', wifi_ip || null);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to insert live node to registry.' });
    }
  });

  // Delete endpoint with support for user requests queue
  app.delete('/api/devices/:id', (req, res) => {
    const { id } = req.params;
    const userEmail = req.headers['x-user-email'] as string | undefined;
    const role = getUserRole(userEmail);

    if (role === 'user') {
      try {
        const stmt = db.prepare('INSERT INTO requests (user_email, action_type, target_id, details, timestamp, status) VALUES (?, ?, ?, ?, ?, ?)');
        stmt.run(
          userEmail || 'operator',
          'delete_device',
          id,
          JSON.stringify({ id }),
          new Date().toISOString(),
          'pending'
        );
        return res.json({ pending: true, message: 'Decommission proposed: pending administrator approval' });
      } catch (err: any) {
        return res.status(500).json({ error: 'Failed to propose device decommissioning.' });
      }
    }

    try {
      const stmt = db.prepare('DELETE FROM devices WHERE id = ?');
      stmt.run(id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to clear device record.' });
    }
  });

  // ==========================================
  // REQUEST APPROVALS QUEUE SYSTEM
  // ==========================================

  app.get('/api/requests', (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM requests ORDER BY id DESC');
      const list = stmt.all();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve pending approvals.' });
    }
  });

  app.post('/api/requests/:id/approve', (req, res) => {
    const { id } = req.params;
    const adminEmail = req.headers['x-user-email'] as string | undefined;
    
    if (getUserRole(adminEmail) !== 'admin') {
      return res.status(403).json({ error: 'Operational override forbidden. Root privileges required.' });
    }

    try {
      const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(id) as any;
      if (!request) {
        return res.status(404).json({ error: 'Telemetry request profile not found.' });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ error: 'Request already processed.' });
      }

      const details = JSON.parse(request.details);

      if (request.action_type === 'toggle_device') {
        const stmt = db.prepare('UPDATE devices SET isOn = ?, lastSeen = ? WHERE id = ?');
        stmt.run(details.isOn ? 1 : 0, 'Approved just now', request.target_id);
      } else if (request.action_type === 'add_device') {
        const stmt = db.prepare(`
          INSERT INTO devices (id, name, type, room, isOn, value, metricUnit, energyUsage, status, lastSeen, wifi_ip)
          VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, 'Approved just now', ?)
        `);
        stmt.run(details.id, details.name, details.type, details.room, details.value || 0, details.metricUnit || '', details.energyUsage || 0, details.status || 'online', details.wifi_ip || null);
      } else if (request.action_type === 'delete_device') {
        const stmt = db.prepare('DELETE FROM devices WHERE id = ?');
        stmt.run(request.target_id);
      }

      db.prepare("UPDATE requests SET status = 'approved' WHERE id = ?").run(id);
      res.json({ success: true, message: 'Proposed telemetry action fully approved and executed.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Execution mismatch on relational application layers.' });
    }
  });

  app.post('/api/requests/:id/reject', (req, res) => {
    const { id } = req.params;
    const adminEmail = req.headers['x-user-email'] as string | undefined;
    
    if (getUserRole(adminEmail) !== 'admin') {
      return res.status(403).json({ error: 'Operational override forbidden. Root privileges required.' });
    }

    try {
      const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(id) as any;
      if (!request) {
        return res.status(404).json({ error: 'Telemetry request profile not found.' });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ error: 'Request already processed.' });
      }

      db.prepare("UPDATE requests SET status = 'rejected' WHERE id = ?").run(id);
      res.json({ success: true, message: 'Proposed telemetry action fully rejected.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Execution mismatch.' });
    }
  });

  // ==========================================
  // VITE DEVELOPMENT OR STATIC ASSETS ROUTING
  // ==========================================
  
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
