var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_os = __toESM(require("os"), 1);
var import_net = __toESM(require("net"), 1);
var import_child_process = require("child_process");
var import_util = require("util");
var import_multicast_dns = __toESM(require("multicast-dns"), 1);

// db.ts
var import_config = require("dotenv/config");
var import_promise = __toESM(require("mysql2/promise"), 1);
var dbName = process.env.MYSQL_DATABASE || "robros_dashboard";
var mysqlHost = process.env.MYSQL_HOST || "localhost";
var isLocalHost = /^(localhost|127\.0\.0\.1|::1)$/.test(mysqlHost);
var mysqlSslSetting = String(process.env.MYSQL_SSL || "").toLowerCase();
var useSsl = mysqlSslSetting === "true" ? true : mysqlSslSetting === "false" ? false : !isLocalHost;
var mysqlConfig = {
  host: mysqlHost,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  ...(useSsl ? { ssl: { minVersion: "TLSv1.2" } } : {})
};
var pool = import_promise.default.createPool({
  ...mysqlConfig,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: false
});
async function createDatabaseIfNeeded() {
  const connection = await import_promise.default.createConnection(mysqlConfig);
  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  } finally {
    await connection.end();
  }
}
async function seedDefaults() {
  const [userCountRows] = await pool.query("SELECT COUNT(*) as count FROM users");
  const userCount = Number(userCountRows[0]?.count || 0);
  if (userCount === 0) {
    await pool.query("INSERT INTO users (email, password, role) VALUES (?, ?, ?)", ["admin@robros.io", "admin123", "admin"]);
    await pool.query("INSERT INTO users (email, password, role) VALUES (?, ?, ?)", ["vaishakh884@gmail.com", "user456", "user"]);
  } else {
    await pool.query("UPDATE users SET email = 'admin@robros.io' WHERE email = 'admin@synapse.io'");
    const [adminRows] = await pool.query("SELECT email FROM users WHERE email = 'admin@robros.io'");
    if (adminRows.length === 0) {
      await pool.query("INSERT INTO users (email, password, role) VALUES ('admin@robros.io', 'admin123', 'admin')");
    }
    const [userRows] = await pool.query("SELECT email FROM users WHERE email = 'vaishakh884@gmail.com'");
    if (userRows.length === 0) {
      await pool.query("INSERT INTO users (email, password, role) VALUES ('vaishakh884@gmail.com', 'user456', 'user')");
    }
  }
  const [deviceCountRows] = await pool.query("SELECT COUNT(*) as count FROM devices");
  const deviceCount = Number(deviceCountRows[0]?.count || 0);
  if (deviceCount === 0) {
    const devices = [
      ["dev-1", "Vaishakh's Mobile", "smart-plug", "Home Office", 0, 0, "%", 0, "offline", "12m ago", null],
      ["dev-2", "Warehouse Temp Sensor", "thermostat", "Garage", 1, 72, "F", 8, "online", "Just now", null],
      ["dev-3", "Power draw inverter", "smart-plug", "Living Room", 1, 100, "W", 1450, "online", "Just now", null],
      ["dev-4", "Server Room CO2 Meter", "smart-plug", "Home Office", 1, 1100, "ppm", 15, "warning", "Just now", "CO2 level elevated"],
      ["dev-5", "My Phone Battery charger", "vacuum", "Master Bedroom", 1, 85, "%", 5, "online", "3m ago", null],
      ["dev-6", "Office Humidity Sensor", "irrigation", "Kitchen", 1, 57, "%", 12, "online", "Just now", null]
    ];
    for (const device of devices) {
      await pool.query(
        `INSERT INTO devices (id, name, type, room, isOn, value, metricUnit, energyUsage, status, lastSeen, alert)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        device
      );
    }
  }
}
async function initDb() {
  await createDatabaseIfNeeded();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'user'
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS devices (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(100) NOT NULL,
      room VARCHAR(255) NOT NULL,
      isOn TINYINT(1) NOT NULL DEFAULT 0,
      value INT NOT NULL DEFAULT 0,
      metricUnit VARCHAR(50) NOT NULL,
      energyUsage INT NOT NULL DEFAULT 0,
      status VARCHAR(100) NOT NULL,
      lastSeen VARCHAR(100) NOT NULL,
      alert TEXT,
      wifi_ip VARCHAR(45)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS network_targets (
      id INT PRIMARY KEY AUTO_INCREMENT,
      ip VARCHAR(45) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      timestamp VARCHAR(100) NOT NULL,
      node VARCHAR(255) NOT NULL,
      parameter VARCHAR(255) NOT NULL,
      value DOUBLE NOT NULL,
      unit VARCHAR(50) NOT NULL
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS requests (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_email VARCHAR(255) NOT NULL,
      action_type VARCHAR(100) NOT NULL,
      target_id VARCHAR(255),
      details TEXT NOT NULL,
      timestamp VARCHAR(100) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending'
    )
  `);
  await seedDefaults();
}
var db = {
  async query(sql, params = []) {
    const [rows] = await pool.query(sql, params);
    return rows;
  },
  async queryOne(sql, params = []) {
    const rows = await db.query(sql, params);
    return rows[0];
  },
  async execute(sql, params = []) {
    const [result] = await pool.execute(sql, params);
    return result;
  }
};

// server.ts
var execAsync = (0, import_util.promisify)(import_child_process.exec);
async function probeNetworkTarget(ip) {
  if (import_net.default.isIP(ip) !== 4) {
    throw new Error("A valid IPv4 address is required.");
  }
  const pingCommand = process.platform === "win32" ? `ping -n 1 -w 1200 ${ip}` : `ping -c 1 -W 1 ${ip}`;
  try {
    await execAsync(pingCommand);
  } catch {
    return { online: false, mac: "UNAVAILABLE" };
  }
  let mac = "UNAVAILABLE";
  if (process.platform === "win32") {
    try {
      const { stdout } = await execAsync(`arp -a ${ip}`);
      const match = stdout.match(/([0-9a-f]{2}(?:-[0-9a-f]{2}){5})/i);
      if (match) mac = match[1].toUpperCase();
    } catch {
    }
  }
  return { online: true, mac };
}
var discoveredMdnsDevices = /* @__PURE__ */ new Map();
var mdnsInstance = null;
function mapServiceToType(services, identifier, model) {
  const combined = [...services, identifier, model].map((s) => s.toLowerCase());
  if (combined.some((s) => s.includes("googlecast") || s.includes("airplay") || s.includes("spotify") || s.includes("speaker") || s.includes("audio") || s.includes("raop") || s.includes("sonos"))) {
    return "speaker";
  }
  if (combined.some((s) => s.includes("camera") || s.includes("rtsp") || s.includes("video") || s.includes("webcam") || s.includes("axis"))) {
    return "camera";
  }
  if (combined.some((s) => s.includes("light") || s.includes("hue") || s.includes("dimmer") || s.includes("bulb") || s.includes("lifx"))) {
    return "light";
  }
  if (combined.some((s) => s.includes("thermostat") || s.includes("hvac") || s.includes("climate") || s.includes("temperature") || s.includes("nest"))) {
    return "thermostat";
  }
  if (combined.some((s) => s.includes("lock") || s.includes("door") || s.includes("gate") || s.includes("key"))) {
    return "lock";
  }
  if (combined.some((s) => s.includes("vacuum") || s.includes("roomba") || s.includes("cleaner") || s.includes("robock"))) {
    return "vacuum";
  }
  if (combined.some((s) => s.includes("irrigation") || s.includes("sprinkler") || s.includes("garden") || s.includes("valve") || s.includes("rain"))) {
    return "irrigation";
  }
  return "smart-plug";
}
function initMdnsListener() {
  try {
    mdnsInstance = (0, import_multicast_dns.default)();
    mdnsInstance.on("response", (packet) => {
      const records = [...packet.answers || [], ...packet.additionals || []];
      const aRecords = [];
      const srvRecords = [];
      const txtRecords = [];
      const ptrRecords = [];
      for (const record of records) {
        if (!record.name) continue;
        if (record.type === "A") {
          aRecords.push({ name: record.name.toLowerCase(), ip: record.data });
        } else if (record.type === "SRV" && record.data) {
          srvRecords.push({ name: record.name.toLowerCase(), target: record.data.target ? record.data.target.toLowerCase() : "" });
        } else if (record.type === "TXT" && Array.isArray(record.data)) {
          const txtMap = {};
          for (const item of record.data) {
            const str = Buffer.isBuffer(item) ? item.toString("utf8") : String(item);
            const parts = str.split("=");
            if (parts.length >= 2) {
              txtMap[parts[0].toLowerCase()] = parts.slice(1).join("=");
            } else if (parts.length === 1) {
              txtMap[parts[0].toLowerCase()] = "";
            }
          }
          txtRecords.push({ name: record.name.toLowerCase(), txt: txtMap });
        } else if (record.type === "PTR" && typeof record.data === "string") {
          ptrRecords.push({ name: record.name.toLowerCase(), data: record.data.toLowerCase() });
        }
      }
      for (const aRec of aRecords) {
        const ip = aRec.ip;
        const hostname = aRec.name;
        let dev = discoveredMdnsDevices.get(ip);
        if (!dev) {
          dev = {
            ip,
            hostname,
            services: [],
            type: "smart-plug",
            lastSeen: Date.now()
          };
          discoveredMdnsDevices.set(ip, dev);
        } else {
          dev.hostname = hostname;
          dev.lastSeen = Date.now();
        }
      }
      for (const srv of srvRecords) {
        if (!srv.target) continue;
        for (const dev of discoveredMdnsDevices.values()) {
          const cleanDevHost = dev.hostname.replace(/\.local\.?$/, "");
          const cleanTarget = srv.target.replace(/\.local\.?$/, "");
          if (cleanDevHost === cleanTarget) {
            if (!dev.services.includes(srv.name)) {
              dev.services.push(srv.name);
            }
            dev.lastSeen = Date.now();
          }
        }
      }
      for (const txtRec of txtRecords) {
        for (const dev of discoveredMdnsDevices.values()) {
          const cleanDevHost = dev.hostname.replace(/\.local\.?$/, "");
          const cleanTxtName = txtRec.name.replace(/\.local\.?$/, "");
          if (dev.services.includes(txtRec.name) || cleanDevHost === cleanTxtName) {
            const fn = txtRec.txt["fn"] || txtRec.txt["friendlyname"] || txtRec.txt["name"];
            const model = txtRec.txt["md"] || txtRec.txt["model"] || txtRec.txt["modelname"];
            if (fn) dev.friendlyName = fn;
            if (model) dev.model = model;
            dev.type = mapServiceToType(dev.services, txtRec.name, model || "");
            dev.lastSeen = Date.now();
          }
        }
      }
      for (const ptr of ptrRecords) {
        for (const dev of discoveredMdnsDevices.values()) {
          if (dev.services.includes(ptr.data)) {
            if (!dev.services.includes(ptr.name)) {
              dev.services.push(ptr.name);
            }
            dev.type = mapServiceToType(dev.services, ptr.name, dev.model || "");
          }
        }
      }
    });
    setInterval(() => {
      const now = Date.now();
      for (const [ip, dev] of discoveredMdnsDevices.entries()) {
        if (now - dev.lastSeen > 3e4) {
          discoveredMdnsDevices.delete(ip);
        }
      }
    }, 1e4);
    console.log("[mDNS Discovery] Active Bonjour listener initialized on 224.0.0.251:5353");
  } catch (err) {
    console.error("[mDNS Discovery] Failed to initialize multicast DNS listener:", err.message);
  }
}
function broadcastMdnsQuery() {
  if (!mdnsInstance) return;
  const serviceTypes = [
    "_services._dns-sd._udp.local",
    "_googlecast._tcp.local",
    "_hap._tcp.local",
    "_airplay._tcp.local",
    "_spotify-connect._tcp.local",
    "_http._tcp.local",
    "_printer._tcp.local",
    "_ipp._tcp.local",
    "_workstation._tcp.local"
  ];
  const questions = serviceTypes.map((type) => ({
    name: type,
    type: "PTR"
  }));
  try {
    mdnsInstance.query({ questions });
    console.log("[mDNS Discovery] Multicast query broadcasted to 224.0.0.251");
  } catch (err) {
    console.warn("[mDNS Discovery] Failed to query mDNS:", err.message);
  }
}
async function startServer() {
  await initDb();
  initMdnsListener();
  const app = (0, import_express.default)();
  const PORT = Number(process.env.PORT || 3e3);
  app.use(import_express.default.json());
  async function getUserRole(email) {
    if (!email) return null;
    try {
      const user = await db.queryOne("SELECT role FROM users WHERE LOWER(email) = ?", [email.toLowerCase()]);
      return user ? user.role : null;
    } catch {
      return null;
    }
  }
  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Please specify login email and access code." });
    }
    try {
      const user = await db.queryOne("SELECT * FROM users WHERE LOWER(email) = ?", [email.toLowerCase()]);
      if (!user) {
        return res.status(401).json({ error: "Transmitter profile not registered on this node." });
      }
      if (user.password !== password) {
        return res.status(401).json({ error: "Access code authentication failed." });
      }
      res.json({ email: user.email, role: user.role });
    } catch (err) {
      res.status(500).json({ error: err.message || "Database execution fault." });
    }
  });
  app.post("/api/register", (req, res) => {
    res.status(403).json({ error: "Direct self-registration has been decommissioned. Credentials must be provisioned by the Root Administrator." });
  });
  app.get("/api/users", async (req, res) => {
    try {
      const usersList = await db.query("SELECT id, email, role FROM users ORDER BY id DESC");
      res.json(usersList);
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to list telemetry profiles." });
    }
  });
  app.post("/api/users/add", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing operator ID or password." });
    }
    try {
      const { count } = await db.queryOne("SELECT count(*) as count FROM users WHERE LOWER(email) = ?", [email.toLowerCase()]) || { count: 0 };
      if (count > 0) {
        return res.status(409).json({ error: "Operator ID already programmed into memory." });
      }
      await db.execute("INSERT INTO users (email, password, role) VALUES (?, ?, ?)", [email.toLowerCase(), password, "user"]);
      res.status(201).json({ success: true, message: "New user initialized successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message || "Database insertion error." });
    }
  });
  app.delete("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await db.execute("DELETE FROM users WHERE id = ?", [id]);
      res.json({ success: true, message: `Profile ${id} decommissioned.` });
    } catch (err) {
      res.status(500).json({ error: err.message || "Registration removal failure." });
    }
  });
  app.get("/api/devices", async (req, res) => {
    try {
      const list = (await db.query("SELECT * FROM devices")).map((device) => ({
        ...device,
        isOn: Boolean(device.isOn)
      }));
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: "Failed to access devices database." });
    }
  });
  app.post("/api/devices/toggle", async (req, res) => {
    const { id, isOn } = req.body;
    const userEmail = req.headers["x-user-email"];
    const role = await getUserRole(userEmail);
    if (!userEmail || !role) {
      return res.status(401).json({ error: "Session invalid. Please sign in again." });
    }
    if (role === "user") {
      try {
        await db.execute(
          "INSERT INTO requests (user_email, action_type, target_id, details, timestamp, status) VALUES (?, ?, ?, ?, ?, ?)",
          [
            userEmail || "operator",
            "toggle_device",
            id,
            JSON.stringify({ isOn }),
            (/* @__PURE__ */ new Date()).toISOString(),
            "pending"
          ]
        );
        return res.json({ pending: true, message: "Toggle proposed: pending administrator approval" });
      } catch (err) {
        return res.status(500).json({ error: "Failed to propose system change." });
      }
    }
    try {
      await db.execute("UPDATE devices SET isOn = ?, lastSeen = ? WHERE id = ?", [isOn ? 1 : 0, "Just now", id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to toggle system status." });
    }
  });
  app.post("/api/devices/add", async (req, res) => {
    const { id, name, type, room, value, metricUnit, energyUsage, status, wifi_ip } = req.body;
    const userEmail = req.headers["x-user-email"];
    const role = await getUserRole(userEmail);
    if (!userEmail || !role) {
      return res.status(401).json({ error: "Session invalid. Please sign in again." });
    }
    if (role === "user") {
      try {
        await db.execute(
          "INSERT INTO requests (user_email, action_type, target_id, details, timestamp, status) VALUES (?, ?, ?, ?, ?, ?)",
          [
            userEmail || "operator",
            "add_device",
            id,
            JSON.stringify({ id, name, type, room, value, metricUnit, energyUsage, status, wifi_ip }),
            (/* @__PURE__ */ new Date()).toISOString(),
            "pending"
          ]
        );
        return res.json({ pending: true, message: "Addition proposed: pending administrator approval" });
      } catch (err) {
        return res.status(500).json({ error: "Failed to propose device addition." });
      }
    }
    try {
      await db.execute(`
        INSERT INTO devices (id, name, type, room, isOn, value, metricUnit, energyUsage, status, lastSeen, wifi_ip)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, 'Just now', ?)
      `, [id, name, type, room, value || 0, metricUnit || "", energyUsage || 0, status || "online", wifi_ip || null]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to insert live node to registry." });
    }
  });
  app.delete("/api/devices/:id", async (req, res) => {
    const { id } = req.params;
    const userEmail = req.headers["x-user-email"];
    const role = await getUserRole(userEmail);
    if (!userEmail || !role) {
      return res.status(401).json({ error: "Session invalid. Please sign in again." });
    }
    if (role === "user") {
      try {
        await db.execute(
          "INSERT INTO requests (user_email, action_type, target_id, details, timestamp, status) VALUES (?, ?, ?, ?, ?, ?)",
          [
            userEmail || "operator",
            "delete_device",
            id,
            JSON.stringify({ id }),
            (/* @__PURE__ */ new Date()).toISOString(),
            "pending"
          ]
        );
        return res.json({ pending: true, message: "Decommission proposed: pending administrator approval" });
      } catch (err) {
        return res.status(500).json({ error: "Failed to propose device decommissioning." });
      }
    }
    try {
      await db.execute("DELETE FROM devices WHERE id = ?", [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to clear device record." });
    }
  });
  app.get("/api/requests", async (req, res) => {
    try {
      const list = await db.query("SELECT * FROM requests ORDER BY id DESC");
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: "Failed to retrieve pending approvals." });
    }
  });
  app.post("/api/requests/:id/approve", async (req, res) => {
    const { id } = req.params;
    const adminEmail = req.headers["x-user-email"];
    const adminRole = await getUserRole(adminEmail);
    if (!adminEmail || !adminRole) {
      return res.status(401).json({ error: "Session invalid. Please sign in again." });
    }
    if (adminRole !== "admin") {
      return res.status(403).json({ error: "Operational override forbidden. Root privileges required." });
    }
    try {
      const request = await db.queryOne("SELECT * FROM requests WHERE id = ?", [id]);
      if (!request) {
        return res.status(404).json({ error: "Telemetry request profile not found." });
      }
      if (request.status !== "pending") {
        return res.status(400).json({ error: "Request already processed." });
      }
      const details = JSON.parse(request.details);
      if (request.action_type === "toggle_device") {
        await db.execute("UPDATE devices SET isOn = ?, lastSeen = ? WHERE id = ?", [details.isOn ? 1 : 0, "Approved just now", request.target_id]);
      } else if (request.action_type === "add_device") {
        await db.execute(`
          INSERT INTO devices (id, name, type, room, isOn, value, metricUnit, energyUsage, status, lastSeen, wifi_ip)
          VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, 'Approved just now', ?)
        `, [details.id, details.name, details.type, details.room, details.value || 0, details.metricUnit || "", details.energyUsage || 0, details.status || "online", details.wifi_ip || null]);
      } else if (request.action_type === "delete_device") {
        await db.execute("DELETE FROM devices WHERE id = ?", [request.target_id]);
      }
      await db.execute("UPDATE requests SET status = 'approved' WHERE id = ?", [id]);
      res.json({ success: true, message: "Proposed telemetry action fully approved and executed." });
    } catch (err) {
      res.status(500).json({ error: err.message || "Execution mismatch on relational application layers." });
    }
  });
  app.post("/api/requests/:id/reject", async (req, res) => {
    const { id } = req.params;
    const adminEmail = req.headers["x-user-email"];
    const adminRole = await getUserRole(adminEmail);
    if (!adminEmail || !adminRole) {
      return res.status(401).json({ error: "Session invalid. Please sign in again." });
    }
    if (adminRole !== "admin") {
      return res.status(403).json({ error: "Operational override forbidden. Root privileges required." });
    }
    try {
      const request = await db.queryOne("SELECT * FROM requests WHERE id = ?", [id]);
      if (!request) {
        return res.status(404).json({ error: "Telemetry request profile not found." });
      }
      if (request.status !== "pending") {
        return res.status(400).json({ error: "Request already processed." });
      }
      await db.execute("UPDATE requests SET status = 'rejected' WHERE id = ?", [id]);
      res.json({ success: true, message: "Proposed telemetry action fully rejected." });
    } catch (err) {
      res.status(500).json({ error: err.message || "Execution mismatch." });
    }
  });
  app.get("/api/wifi/status", async (req, res) => {
    try {
      if (process.platform === "win32") {
        const { stdout } = await execAsync("netsh wlan show interfaces");
        const ssidMatch = stdout.match(/^\s*SSID\s*:\s*(.+)$/m);
        const signalMatch = stdout.match(/^\s*Signal\s*:\s*(.+)$/m);
        if (ssidMatch) {
          return res.json({
            ssid: ssidMatch[1].trim(),
            signal: signalMatch ? signalMatch[1].trim() : "100%",
            connected: true
          });
        }
      }
      const interfaces = import_os.default.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        const ifaceList = interfaces[name];
        if (!ifaceList) continue;
        for (const iface of ifaceList) {
          if (iface.family === "IPv4" && !iface.internal) {
            return res.json({
              ssid: `Local_Network_${name}`,
              signal: "100%",
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
  app.get("/api/wifi/scan", async (req, res) => {
    try {
      if (process.platform === "win32") {
        const { stdout } = await execAsync("netsh wlan show networks");
        const lines = stdout.split("\n");
        const ssids = [];
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
      res.status(503).json({ error: "Wi-Fi network scanning is unavailable." });
    }
  });
  app.get("/api/wifi/discover-devices", async (req, res) => {
    try {
      broadcastMdnsQuery();
      const interfaces = import_os.default.networkInterfaces();
      const detectedSubnets = [];
      for (const name of Object.keys(interfaces)) {
        const ifaceList = interfaces[name];
        if (!ifaceList) continue;
        for (const iface of ifaceList) {
          if (iface.family === "IPv4" && !iface.internal) {
            const ip = iface.address;
            if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.")) {
              const parts = ip.split(".");
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
        throw new Error("No active local subnetwork interfaces identified.");
      }
      console.log(`[Discovery Engine] Scanning active subnets: ${detectedSubnets.map((s) => `${s.subnetBase}.0/24 (${s.interfaceName})`).join(", ")}`);
      const activeIps = [];
      const allTargets = [];
      for (const { hostIp, subnetBase } of detectedSubnets) {
        for (let i = 1; i <= 254; i++) {
          const targetIp = `${subnetBase}.${i}`;
          if (targetIp === hostIp) continue;
          allTargets.push(targetIp);
        }
      }
      const batchSize = 40;
      for (let i = 0; i < allTargets.length; i += batchSize) {
        const batch = allTargets.slice(i, i + batchSize);
        const batchPromises = batch.map(async (targetIp) => {
          try {
            await execAsync(`ping -n 1 -w 150 ${targetIp}`);
            if (!activeIps.includes(targetIp)) {
              activeIps.push(targetIp);
            }
          } catch {
          }
        });
        await Promise.all(batchPromises);
      }
      let arpMap = /* @__PURE__ */ new Map();
      let arpActiveIps = [];
      try {
        const { stdout: arpOut } = await execAsync("arp -a");
        const lines = arpOut.split("\n");
        for (const line of lines) {
          const match = line.trim().match(/^([0-9.]+)\s+([0-9a-f-]+)\s+(dynamic|static)/i);
          if (match) {
            const ip = match[1];
            const mac = match[2].toUpperCase();
            const type = match[3].toLowerCase();
            arpMap.set(ip, mac);
            if (type === "dynamic" || type === "static") {
              const subnetMatch = detectedSubnets.find((s) => ip.startsWith(s.subnetBase + "."));
              if (subnetMatch && ip !== subnetMatch.hostIp) {
                const parts = ip.split(".");
                const lastOctet = parts[parts.length - 1];
                if (lastOctet && lastOctet !== "0" && lastOctet !== "255") {
                  if (!arpActiveIps.includes(ip)) {
                    arpActiveIps.push(ip);
                  }
                }
              }
            }
          }
        }
      } catch (arpErr) {
        console.warn("[Discovery Engine] Failed to query ARP cache:", arpErr);
      }
      const mdnsIps = Array.from(discoveredMdnsDevices.keys()).filter((ip) => {
        return detectedSubnets.some((s) => ip.startsWith(s.subnetBase + "."));
      });
      const combinedActiveIps = Array.from(/* @__PURE__ */ new Set([...activeIps, ...arpActiveIps, ...mdnsIps]));
      const devices = combinedActiveIps.map((ip) => {
        const mdnsMatch = discoveredMdnsDevices.get(ip);
        const isMdns = !!mdnsMatch;
        const mac = arpMap.get(ip) || (mdnsMatch ? "mDNS Broadcast" : "UNKNOWN-MAC");
        const isGateway = ip.endsWith(".1");
        const subnetMatch = detectedSubnets.find((s) => ip.startsWith(s.subnetBase + "."));
        const interfaceLabel = subnetMatch ? ` via ${subnetMatch.interfaceName}` : "";
        const isHotspot = subnetMatch && subnetMatch.hostIp === "192.168.137.1";
        const subnetBase = subnetMatch ? subnetMatch.subnetBase : "";
        let deviceType = "network-device";
        if (mdnsMatch) {
          deviceType = mdnsMatch.type;
        }
        let label = "";
        if (mdnsMatch) {
          const namePart = mdnsMatch.friendlyName || mdnsMatch.model || mdnsMatch.hostname.replace(/\.local\.?$/, "");
          label = `${namePart} (mDNS Broadcast)`;
        } else {
          label = isGateway ? `Subnet Gateway Router${interfaceLabel}` : isHotspot ? "Hotspot Client Device" : `Network Host${interfaceLabel}`;
          if (mac.startsWith("00-0F-AC") || mac.startsWith("52-94-C2")) {
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
    } catch (err) {
      console.warn("[Discovery Engine] Scan error:", err.message);
      res.status(503).json({
        error: err.message || "Local network discovery failed.",
        subnets: [],
        devices: []
      });
    }
  });
  app.get("/api/wifi/targets", async (req, res) => {
    try {
      const targets = await db.query(
        "SELECT id, ip, name FROM network_targets ORDER BY id DESC"
      );
      const results = await Promise.all(targets.map(async (target) => ({
        ...target,
        ...await probeNetworkTarget(target.ip),
        type: "network-device",
        label: target.name,
        isDirect: true,
        isGateway: false,
        isMdns: false
      })));
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to load direct network targets." });
    }
  });
  app.post("/api/wifi/targets", async (req, res) => {
    const ip = String(req.body?.ip || "").trim();
    const name = String(req.body?.name || "My phone").trim();
    if (import_net.default.isIP(ip) !== 4) {
      return res.status(400).json({ error: "Enter a valid IPv4 address." });
    }
    try {
      const probe = await probeNetworkTarget(ip);
      if (!probe.online) {
        return res.status(422).json({ error: `${ip} is not reachable from this backend.` });
      }
      await db.execute(
        `INSERT INTO network_targets (ip, name) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        [ip, name || "My phone"]
      );
      res.status(201).json({ ip, name: name || "My phone", ...probe });
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to connect network target." });
    }
  });
  app.delete("/api/wifi/targets/:id", async (req, res) => {
    try {
      await db.execute("DELETE FROM network_targets WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to remove network target." });
    }
  });
  if (process.env.NODE_ENV === "production") {
    const distPath = import_path.default.join(process.cwd(), "../frontend/dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ROBROS Relational System Dashboard] launched on host http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
