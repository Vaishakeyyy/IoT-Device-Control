import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'database.db');
const db = new Database(dbPath);

// Enable WAL mode for performance
db.pragma('journal_mode = WAL');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    room TEXT NOT NULL,
    isOn INTEGER NOT NULL DEFAULT 0,
    value INTEGER NOT NULL DEFAULT 0,
    metricUnit TEXT NOT NULL,
    energyUsage INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    lastSeen TEXT NOT NULL,
    alert TEXT,
    wifi_ip TEXT
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    node TEXT NOT NULL,
    parameter TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_id TEXT,
    details TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
  );
`);

// Seed default users if empty
const checkUsers = db.prepare('SELECT count(*) as count FROM users');
const { count: userCount } = checkUsers.get() as { count: number };

if (userCount === 0) {
  const insertUser = db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)');
  // Seed admin profile
  insertUser.run('admin@robros.io', 'admin123', 'admin');
  // Seed current user profile
  insertUser.run('vaishakh884@gmail.com', 'user456', 'user');
} else {
  // Migrate existing data or ensure robros and operator accounts exist
  try {
    db.prepare("UPDATE users SET email = 'admin@robros.io' WHERE email = 'admin@synapse.io'").run();
  } catch (e) {
    // Ignore migration error if already exists or fails
  }

  try {
    const checkRobros = db.prepare("SELECT email FROM users WHERE email = 'admin@robros.io'").get();
    if (!checkRobros) {
      db.prepare("INSERT INTO users (email, password, role) VALUES ('admin@robros.io', 'admin123', 'admin')").run();
    }
  } catch (e) {}

  try {
    const checkVaishakh = db.prepare("SELECT email FROM users WHERE email = 'vaishakh884@gmail.com'").get();
    if (!checkVaishakh) {
      db.prepare("INSERT INTO users (email, password, role) VALUES ('vaishakh884@gmail.com', 'user456', 'user')").run();
    }
  } catch (e) {}
}

// Seed default devices if empty
const checkDevices = db.prepare('SELECT count(*) as count FROM devices');
const { count: deviceCount } = checkDevices.get() as { count: number };

if (deviceCount === 0) {
  const insertDevice = db.prepare(`
    INSERT INTO devices (id, name, type, room, isOn, value, metricUnit, energyUsage, status, lastSeen, alert)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertDevice.run(
    'dev-1',
    "Vaishakh's Mobile",
    'smart-plug',
    'Home Office',
    0,
    0,
    '%',
    0,
    'offline',
    '12m ago',
    null
  );

  insertDevice.run(
    'dev-2',
    'Warehouse Temp Sensor',
    'thermostat',
    'Garage',
    1,
    72,
    '°F',
    8,
    'online',
    'Just now',
    null
  );

  insertDevice.run(
    'dev-3',
    'Power draw inverter',
    'smart-plug',
    'Living Room',
    1,
    100,
    'W',
    1450,
    'online',
    'Just now',
    null
  );

  insertDevice.run(
    'dev-4',
    'Server Room CO2 Meter',
    'smart-plug',
    'Home Office',
    1,
    1100,
    'ppm',
    15,
    'warning',
    'Just now',
    'CO2 level elevated'
  );

  insertDevice.run(
    'dev-5',
    'My Phone Battery charger',
    'vacuum',
    'Master Bedroom',
    1,
    85,
    '%',
    5,
    'online',
    '3m ago',
    null
  );

  insertDevice.run(
    'dev-6',
    'Office Humidity Sensor',
    'irrigation',
    'Kitchen',
    1,
    57,
    '%',
    12,
    'online',
    'Just now',
    null
  );
}

// Dynamic database schema patch to ensure wifi_ip column is present in pre-existing DBs
try {
  db.prepare("ALTER TABLE devices ADD COLUMN wifi_ip TEXT").run();
} catch (e) {
  // Column already exists, safe to ignore
}

export { db };
