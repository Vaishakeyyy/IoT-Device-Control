import 'dotenv/config';
import mysql, { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

const dbName = process.env.MYSQL_DATABASE || 'robros_dashboard';

const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
};

const pool = mysql.createPool({
  ...mysqlConfig,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: false,
});

async function createDatabaseIfNeeded() {
  const connection = await mysql.createConnection(mysqlConfig);
  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  } finally {
    await connection.end();
  }
}

async function seedDefaults() {
  const [userCountRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM users');
  const userCount = Number(userCountRows[0]?.count || 0);

  if (userCount === 0) {
    await pool.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', ['admin@robros.io', 'admin123', 'admin']);
    await pool.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', ['vaishakh884@gmail.com', 'user456', 'user']);
  } else {
    await pool.query("UPDATE users SET email = 'admin@robros.io' WHERE email = 'admin@synapse.io'");

    const [adminRows] = await pool.query<RowDataPacket[]>("SELECT email FROM users WHERE email = 'admin@robros.io'");
    if (adminRows.length === 0) {
      await pool.query("INSERT INTO users (email, password, role) VALUES ('admin@robros.io', 'admin123', 'admin')");
    }

    const [userRows] = await pool.query<RowDataPacket[]>("SELECT email FROM users WHERE email = 'vaishakh884@gmail.com'");
    if (userRows.length === 0) {
      await pool.query("INSERT INTO users (email, password, role) VALUES ('vaishakh884@gmail.com', 'user456', 'user')");
    }
  }

  const [deviceCountRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM devices');
  const deviceCount = Number(deviceCountRows[0]?.count || 0);

  if (deviceCount === 0) {
    const devices = [
      ['dev-1', "Vaishakh's Mobile", 'smart-plug', 'Home Office', 0, 0, '%', 0, 'offline', '12m ago', null],
      ['dev-2', 'Warehouse Temp Sensor', 'thermostat', 'Garage', 1, 72, 'F', 8, 'online', 'Just now', null],
      ['dev-3', 'Power draw inverter', 'smart-plug', 'Living Room', 1, 100, 'W', 1450, 'online', 'Just now', null],
      ['dev-4', 'Server Room CO2 Meter', 'smart-plug', 'Home Office', 1, 1100, 'ppm', 15, 'warning', 'Just now', 'CO2 level elevated'],
      ['dev-5', 'My Phone Battery charger', 'vacuum', 'Master Bedroom', 1, 85, '%', 5, 'online', '3m ago', null],
      ['dev-6', 'Office Humidity Sensor', 'irrigation', 'Kitchen', 1, 57, '%', 12, 'online', 'Just now', null],
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

export async function initDb() {
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

export const db = {
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return rows as T[];
  },

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const rows = await db.query<T>(sql, params);
    return rows[0];
  },

  async execute(sql: string, params: any[] = []): Promise<ResultSetHeader> {
    const [result] = await pool.execute<ResultSetHeader>(sql, params);
    return result;
  },
};
