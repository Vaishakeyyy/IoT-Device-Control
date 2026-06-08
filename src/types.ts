export type DeviceType =
  | 'light'
  | 'thermostat'
  | 'smart-plug'
  | 'lock'
  | 'camera'
  | 'speaker'
  | 'vacuum'
  | 'irrigation';

export interface IoTDevice {
  id: string;
  name: string;
  type: DeviceType;
  room: string;
  isOn: boolean;
  value: number; // For brightness (0-100), temp (50-90°F), speed (1-3), volume (0-100)
  targetValue?: number; // Optional target for smooth transitions
  metricUnit?: string; // "°F", "%", "W", etc.
  energyUsage: number; // Instant power drawing in Watts (e.g. 12W, 1500W)
  status: 'online' | 'offline' | 'standby';
  lastSeen: string;
  alert?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  triggerType: 'time' | 'sensor' | 'manual';
  triggerDetail: string; // "22:00" or "Temp > 78°F"
  targetDeviceId: string;
  action: 'turn_on' | 'turn_off' | 'set_value';
  actionValue?: number;
  isEnabled: boolean;
  days: string[]; // ['Mon', 'Tue', ...]
}

export interface EnergyDataPoint {
  time: string;
  lighting: number;
  heating: number;
  appliances: number;
  total: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  deviceId?: string;
  deviceName?: string;
  type: 'info' | 'success' | 'warning' | 'control';
  message: string;
  room?: string;
}

export const ROOMS = [
  'All Rooms',
  'Living Room',
  'Kitchen',
  'Master Bedroom',
  'Home Office',
  'Backyard',
  'Garage',
];

export const DEVICE_TYPES: { type: DeviceType; label: string; icon: string }[] = [
  { type: 'light', label: 'Smart Light', icon: 'Lightbulb' },
  { type: 'thermostat', label: 'Thermostat', icon: 'Thermometer' },
  { type: 'smart-plug', label: 'Smart Plug', icon: 'Plug' },
  { type: 'lock', label: 'Smart Lock', icon: 'Lock' },
  { type: 'camera', label: 'Security Camera', icon: 'Video' },
  { type: 'speaker', label: 'Audio System', icon: 'Volume2' },
  { type: 'vacuum', label: 'Robot Vacuum', icon: 'Cpu' },
  { type: 'irrigation', label: 'Smart Watering', icon: 'Droplets' },
];
