import React, { useState, useEffect } from 'react';
import { ROOMS } from './types';
import {
  initialDevices,
  initialAutomations,
  initialLogs,
  energyMockHistory,
} from './mockData';
import { DeviceCard } from './components/DeviceCard';
import { DashboardStats } from './components/DashboardStats';
import { TelemetryChart } from './components/TelemetryChart';
import { SchedulePlan } from './components/SchedulePlan';
import { AddDeviceModal } from './components/AddDeviceModal';
import { ActivityLogViewer } from './components/ActivityLogViewer';
import { SimulationCenter } from './components/SimulationCenter';
import { LoginPage } from './components/LoginPage';
import {
  LayoutDashboard,
  Cpu,
  AlertTriangle,
  Sliders,
  Clock,
  Compass,
  Search,
  Plus,
  Lock,
  Unlock,
  Key,
  LogOut,
  User,
  Activity,
  CheckCircle,
  Wifi,
  Laptop,
  Flame,
  Globe,
  Settings,
  Sun,
  Moon,
  Leaf,
  Terminal,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const THEMES = [
  { id: 'light', name: 'Light Slate', desc: 'Clean, light minimalist', isDark: false },
  { id: 'lightdark', name: 'Dim Slate (Light Dark)', desc: 'Soft slate-gray dimmer theme', isDark: true },
  { id: 'dark', name: 'Cosmic Dark', desc: 'Sleek terminal dark blue', isDark: true },
  { id: 'dracula', name: 'Dracula Obsidian', desc: 'Rich purples & hot pinks', isDark: true },
  { id: 'nordic', name: 'Nordic Frost', desc: 'Frost teals & cold slate', isDark: true },
  { id: 'forest', name: 'Forest Moss', desc: 'Pine greens & warm stones', isDark: false },
  { id: 'cyberpunk', name: 'Vintage Cyber', desc: 'Amber glowing terminal', isDark: true },
];

export default function App() {
  // Session Authentication State (different user and admin)
  const [currentUser, setCurrentUser] = useState(null);
  const [showAdminRequiredModal, setShowAdminRequiredModal] = useState(false);
  const [blockedActionName, setBlockedActionName] = useState('');

  // Primary Workspace tab identifier
  const [activeTab, setActiveTab] = useState('dashboard');

  // Theme Management System
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'lightdark';
  });

  useEffect(() => {
    const html = document.documentElement;
    // Remove all previous theme classes
    html.classList.remove('theme-light', 'theme-lightdark', 'theme-dark', 'theme-dracula', 'theme-nordic', 'theme-forest', 'theme-cyberpunk', 'dark');

    // Add active theme class
    html.classList.add(`theme-${activeTheme}`);

    // If it is a dark-derived theme, add legacy 'dark' class so standard dark classes continue to function perfectly!
    const darkThemes = ['dark', 'lightdark', 'dracula', 'nordic', 'cyberpunk'];
    if (darkThemes.includes(activeTheme)) {
      html.documentElement?.classList?.add('dark'); // safe fallback
      html.classList.add('dark');
    }
    
    localStorage.setItem('app-theme', activeTheme);
  }, [activeTheme]);

  // Application state
  const [devices, setDevices] = useState(() => {
    // Customize devices to perfectly reflect the screenshot names
    const customized = [...initialDevices];
    customized[0] = {
      id: 'dev-1',
      name: "Vaishakh's Mobile",
      type: 'smart-plug',
      room: 'Home Office',
      isOn: false,
      value: 0,
      metricUnit: '%',
      energyUsage: 0,
      status: 'offline',
      lastSeen: '12m ago',
    };
    customized[1] = {
      id: 'dev-2',
      name: 'Warehouse Temp Sensor',
      type: 'thermostat',
      room: 'Garage',
      isOn: true,
      value: 72,
      metricUnit: '°F',
      energyUsage: 8,
      status: 'online',
      lastSeen: 'Just now',
    };
    customized[2] = {
      id: 'dev-3',
      name: 'Power draw inverter',
      type: 'smart-plug',
      room: 'Living Room',
      isOn: true,
      value: 100,
      metricUnit: 'W',
      energyUsage: 1450,
      status: 'online',
      lastSeen: 'Just now',
    };
    customized[3] = {
      id: 'dev-4',
      name: 'Server Room CO2 Meter',
      type: 'smart-plug',
      room: 'Home Office',
      isOn: true,
      value: 1100,
      metricUnit: 'ppm',
      energyUsage: 15,
      status: 'warning',
      lastSeen: 'Just now',
      alert: 'CO2 level elevated',
    };
    customized[4] = {
      id: 'dev-5',
      name: 'My Phone Battery charger',
      type: 'vacuum',
      room: 'Master Bedroom',
      isOn: true,
      value: 85,
      metricUnit: '%',
      energyUsage: 5,
      status: 'online',
      lastSeen: '3m ago',
    };
    customized[5] = {
      id: 'dev-6',
      name: 'Office Humidity Sensor',
      type: 'irrigation',
      room: 'Kitchen',
      isOn: true,
      value: 57,
      metricUnit: '%',
      energyUsage: 12,
      status: 'online',
      lastSeen: 'Just now',
    };
    return customized;
  });

  const [automations, setAutomations] = useState(initialAutomations);
  const [logs, setLogs] = useState(initialLogs);
  const [energyHistory, setEnergyHistory] = useState(energyMockHistory);

  // Commands count incrementor
  const [commandsCount, setCommandsCount] = useState(1);

  // Filters and dialog UI states
  const [selectedRoom, setSelectedRoom] = useState('All Rooms');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [systemAlert, setSystemAlert] = useState(null);

  // LIVE DATA STREAM list state
  const [liveStream, setLiveStream] = useState([
    { id: 'str-1', timestamp: '12:52:05', node: 'DEV-021', parameter: 'power', value: 1892.2, unit: 'W' },
    { id: 'str-2', timestamp: '12:52:03', node: 'DEV-005', parameter: 'motion', value: -0.22, unit: 'events/s' },
    { id: 'str-3', timestamp: '12:51:58', node: 'DEV-002', parameter: 'co2', value: 1253.2, unit: 'ppm' },
    { id: 'str-4', timestamp: '12:51:55', node: 'DEV-001', parameter: 'humidity', value: 57.2, unit: '%' },
    { id: 'str-5', timestamp: '12:51:51', node: 'DEV-001', parameter: 'temperature', value: 21.2, unit: '°C' },
    { id: 'str-6', timestamp: '12:51:48', node: 'DEV-010', parameter: 'power', value: 15.0, unit: 'W' },
    { id: 'str-7', timestamp: '12:51:44', node: 'DEV-002', parameter: 'co2', value: 1250.0, unit: 'ppm' },
  ]);

  // SPARKLINE History buffer for rendering trends
  const [sparkHistory, setSparkHistory] = useState({
    temp: [21.0, 21.1, 21.2, 21.0, 21.3, 21.2, 21.2, 21.1, 21.2, 21.2, 21.2, 21.2],
    humidity: [56.8, 57.0, 57.2, 57.1, 57.0, 57.3, 57.2, 57.2, 57.1, 57.2, 57.2, 57.2],
    co2: [1240, 1245, 1248, 1253, 1250, 1255, 1253, 1252, 1253, 1253, 1253, 1253],
    motion: [0.1, 0.2, 0.1, 0.3, 0.2, 0.1, 0.2, 0.2, 0.4, 0.2, 0.2, 0.2],
    power: [1860, 1865, 1870, 1872, 1875, 1870, 1873, 1872, 1875, 1872, 1872, 1872],
  });

  // Current averages and levels on Dashboard scales
  const [sensorValues, setSensorValues] = useState({
    temp: 21.2,
    humidity: 57.2,
    co2: 1253.2,
    motion: 0.2,
    power: 1872.7,
  });

  // Static Alerts register (mimics screenshot layout warning blocks)
  const [activeAlerts, setActiveAlerts] = useState([
    {
      id: 'al-1',
      category: 'WARNING',
      text: 'Division status is warning; Server Room temperature elevated slightly.',
      meta: 'Server Team CO2 — Server Room',
      type: 'warning',
    },
    {
      id: 'al-2',
      category: 'CRITICAL',
      text: 'Division status is critical; Solar power reserve drawing backup voltage lines.',
      meta: 'Solar Power Inverter — Rooftop Solar',
      type: 'critical',
    },
    {
      id: 'al-3',
      category: 'OFFLINE',
      text: "Division status is offline; Vaishakh's Mobile beacon signal lost.",
      meta: "Vaishakh's Mobile — Home Office",
      type: 'offline',
    },
  ]);

  // Live clock
  const [currentTime, setCurrentTime] = useState('');

  // Set default operators or root admin profiles
  const checkAdminPrivilege = (actionName) => {
    if (currentUser?.role === 'admin') return true;
    setBlockedActionName(actionName);
    setShowAdminRequiredModal(true);
    return false;
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Telemetry real-time generator interval
  useEffect(() => {
    const streamInterval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      // Randomize parameter stream points
      const params = [
        { type: 'power', valRange: [1850, 1900], unit: 'W', node: 'DEV-021' },
        { type: 'motion', valRange: [0.1, 0.3], unit: 'events/s', node: 'DEV-005' },
        { type: 'co2', valRange: [1240, 1260], unit: 'ppm', node: 'DEV-002' },
        { type: 'humidity', valRange: [56.5, 58.0], unit: '%', node: 'DEV-001' },
        { type: 'temperature', valRange: [20.9, 21.6], unit: '°C', node: 'DEV-001' },
      ];

      const chosen = params[Math.floor(Math.random() * params.length)];
      const randomizedVal = (Math.random() * (chosen.valRange[1] - chosen.valRange[0]) + chosen.valRange[0]).toFixed(1);

      // Append log packet
      const newStreamPoint = {
        id: `str-${Date.now()}`,
        timestamp: timeStr,
        node: chosen.node,
        parameter: chosen.type,
        value: parseFloat(randomizedVal),
        unit: chosen.unit,
      };

      setLiveStream((prev) => [newStreamPoint, ...prev.slice(0, 9)]);

      // Push to spark buffer
      setSparkHistory((prev) => {
        const key = chosen.type === 'temperature' ? 'temp' : chosen.type;
        const currentArr = prev[key] || [];
        const nextArr = [...currentArr.slice(1), parseFloat(randomizedVal)];
        return {
          ...prev,
          [chosen.type === 'temperature' ? 'temp' : chosen.type]: nextArr,
        };
      });

      // Update current meter dials
      setSensorValues((prev) => ({
        ...prev,
        [chosen.type === 'temperature' ? 'temp' : chosen.type]: parseFloat(randomizedVal),
      }));

    }, 2500);

    return () => clearInterval(streamInterval);
  }, []);

  // Helper: Append simulation log
  const pushLog = (deviceName, msg, type = 'info', room = undefined) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp,
      deviceName,
      type,
      message: msg,
      room,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // Device Relay Closures
  const handleToggleDevice = (id) => {
    setCommandsCount((prev) => prev + 1);
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const nextState = !d.isOn;
          let load = 0;
          if (nextState) {
            if (d.type === 'light') load = Math.round(d.value * 0.35);
            else if (d.type === 'thermostat') load = 120;
            else if (d.type === 'smart-plug') load = 150;
            else if (d.type === 'lock') load = 1;
            else if (d.type === 'camera') load = 8;
            else if (d.type === 'speaker') load = 20;
            else if (d.type === 'vacuum') load = 15;
            else if (d.type === 'irrigation') load = 5;
          }
          pushLog(
            d.name,
            `Hardware relay status changed to ${nextState ? 'ON (CLOSED)' : 'OFF (OPEN)'}`,
            nextState ? 'success' : 'info',
            d.room
          );
          return { ...d, isOn: nextState, energyUsage: load };
        }
        return d;
      })
    );
  };

  const handleChangeDeviceValue = (id, val) => {
    setCommandsCount((prev) => prev + 1);
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          let load = d.energyUsage;
          if (d.type === 'light') {
            load = Math.round(val * 0.4);
          } else if (d.type === 'speaker') {
            load = Math.round(val * 0.25) + 5;
          } else if (d.type === 'thermostat') {
            load = val > 75 || val < 68 ? 240 : 80;
          }
          pushLog(
            d.name,
            `Parameter dispatched to ${val}${d.metricUnit || '%'}`,
            'control',
            d.room
          );
          return { ...d, value: val, energyUsage: d.isOn ? load : 0 };
        }
        return d;
      })
    );
  };

  const handleDeleteDevice = (id) => {
    if (!checkAdminPrivilege('Decommission Network Node')) return;
    const target = devices.find((d) => d.id === id);
    if (!target) return;
    setDevices((prev) => prev.filter((d) => d.id !== id));
    pushLog(target.name, `Device decommissioned and deleted from room registers`, 'warning', target.room);
  };

  const handleAddDevice = (newDevice) => {
    if (!checkAdminPrivilege('Register New Hardware Node')) return;
    const fullDevice = {
      ...newDevice,
      id: `dev-${Date.now()}`,
      lastSeen: 'Just registered',
    };
    setDevices((prev) => [...prev, fullDevice]);
    pushLog(fullDevice.name, `New ${fullDevice.type} registered successfully with full diagnostics`, 'success', fullDevice.room);
  };

  // Rule configuration managers
  const handleToggleRule = (id) => {
    if (!checkAdminPrivilege('Toggle Automation Rules')) return;
    setAutomations((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextState = !r.isEnabled;
          pushLog(
            'Automation Engine',
            `Rule [${r.name}] set to ${nextState ? 'ENABLED / ACTIVE' : 'SUSPENDED'}`,
            'info'
          );
          return { ...r, isEnabled: nextState };
        }
        return r;
      })
    );
  };

  const handleAddRule = (newRule) => {
    if (!checkAdminPrivilege('Assembling system automation rules')) return;
    const fullRule = {
      ...newRule,
      id: `rule-${Date.now()}`,
    };
    setAutomations((prev) => [fullRule, ...prev]);
    pushLog(
      'Automation Engine',
      `Assembled and deployed new automation macro: ${fullRule.name}`,
      'success'
    );
  };

  const handleDeleteRule = (id) => {
    if (!checkAdminPrivilege('Withdrawing automation rules')) return;
    const rule = automations.find((r) => r.id === id);
    if (!rule) return;
    setAutomations((prev) => prev.filter((r) => r.id !== id));
    pushLog('Automation Engine', `Withdrew scheduled rule macro [${rule.name}]`, 'warning');
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  // Macro overrides
  const triggerAllLightsOff = () => {
    setCommandsCount((prev) => prev + 1);
    setDevices((prev) =>
      prev.map((d) => {
        if (d.type === 'light' && d.isOn) {
          return { ...d, isOn: false, energyUsage: 0 };
        }
        return d;
      })
    );
    pushLog('System Hub', 'Global Command: ALL LIGHTS POWERED OFF', 'control');
  };

  const triggerAwaySecure = () => {
    setCommandsCount((prev) => prev + 1);
    setDevices((prev) =>
      prev.map((d) => {
        if (d.type === 'light') {
          return { ...d, isOn: false, energyUsage: 0 };
        }
        if (d.type === 'lock') {
          return { ...d, isOn: true, energyUsage: 1 };
        }
        if (d.type === 'speaker') {
          return { ...d, isOn: false, energyUsage: 0 };
        }
        if (d.type === 'thermostat') {
          return { ...d, value: 76, energyUsage: 45 };
        }
        return d;
      })
    );
    setSystemAlert('Away status engaged. All entry deadbolts verified locked.');
    pushLog('System Hub', 'Dispatched Secure Away status. Lock mechanisms locked. Lights and ventilation down.', 'success');
  };

  const triggerCozyChillNight = () => {
    setCommandsCount((prev) => prev + 1);
    setDevices((prev) =>
      prev.map((d) => {
        if (d.type === 'light' && d.room === 'Living Room') {
          return { ...d, isOn: true, value: 30, energyUsage: 12 };
        }
        if (d.type === 'speaker' && d.room === 'Living Room') {
          return { ...d, isOn: true, value: 40, energyUsage: 12 };
        }
        return d;
      })
    );
    pushLog('System Hub', 'Dispatched Cozy Chill Macro. Living room lights dimmed, audio streams activated.', 'success', 'Living Room');
  };

  // Live Scenario Simulators (feed diagnostics instantly!)
  const handleSimulateDrivewayIntrusion = () => {
    if (!checkAdminPrivilege('Trigger Motion Intrusion simulation')) return;
    setDevices((prev) =>
      prev.map((d) => {
        if (d.name.includes("Mobile") || d.id === 'dev-5') {
          return { ...d, isOn: true, value: 100, energyUsage: 50 };
        }
        return d;
      })
    );
    
    // Append active warning alerts
    const intruderAlert = {
      id: `al-${Date.now()}`,
      category: 'CRITICAL',
      text: 'ALERT: Captured motion near garage deadbolt path. Security cams broadcasting high frame rate.',
      meta: 'Garage Security Unit — Garage Hub',
      type: 'critical',
    };
    setActiveAlerts((prev) => [intruderAlert, ...prev]);

    setSystemAlert('Driveway Smart-Sensor Triggered: Intrusive motion detected!');
    pushLog(
      'Driveway Sensor Core',
      'ALERT: Motion captured near garage deadbolt gates. Armed floodlights immediately sparked to 100%.',
      'warning',
      'Garage'
    );
  };

  const handleSimulateEcoLockdown = () => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.type === 'light') {
          return { ...d, isOn: false, energyUsage: 0 };
        }
        if (d.type === 'lock') {
          return { ...d, isOn: true };
        }
        if (d.type === 'thermostat') {
          return { ...d, value: 68, energyUsage: 25 };
        }
        return d;
      })
    );
    
    const ecoLog = {
      id: `al-${Date.now()}`,
      category: 'INFO',
      text: 'Routine sweep: Eco Lockdown engaged. Standby load values reduced.',
      meta: 'Efficiency Coordinator — Mesh Service',
      type: 'info',
    };
    setActiveAlerts((prev) => [ecoLog, ...prev]);

    setSystemAlert('Efficiency Dispatch: ECO Lockdown Routine deployed successfully.');
    pushLog(
      'Efficiency Service',
      'Dispatched Eco Night Secured program. All doors locked, temperatures dropped to save energy.',
      'success'
    );
  };

  const handleSimulateHeatwave = () => {
    if (!checkAdminPrivilege('Simulate Climatic Heatwave compressor spike')) return;
    setDevices((prev) =>
      prev.map((d) => {
        if (d.type === 'thermostat') {
          return { ...d, value: 66, energyUsage: 450, alert: 'HVAC compressor load spike' };
        }
        return d;
      })
    );

    // Timeline bump
    setEnergyHistory((prev) =>
      prev.map((p) => {
        if (p.time === '12 PM' || p.time === '02 PM' || p.time === '04 PM') {
          return { ...p, heating: p.heating + 150, total: p.total + 150 };
        }
        return p;
      })
    );

    const heatwaveAlert = {
      id: `al-${Date.now()}`,
      category: 'WARNING',
      text: 'Grid Alert: HVAC coolant draw crossed maximum safety threshold during extreme summer temp sweep.',
      meta: 'Main HVAC Inverter — Living Room',
      type: 'warning',
    };
    setActiveAlerts((prev) => [heatwaveAlert, ...prev]);

    setSystemAlert('Atmospheric Warning: Summer heatwave spiked localized HVAC compression demand.');
    pushLog(
      'Climate control',
      'COMPRESSOR SPIKE: Outdoors index crossed 100°F. Thermostat compressor coolant drawing 450W output.',
      'warning',
      'Living Room'
    );
  };

  const handleSimulateWaterSpill = () => {
    if (!checkAdminPrivilege('Kitchen Water Leak safety simulation')) return;
    setDevices((prev) =>
      prev.map((d) => {
        if (d.type === 'irrigation') {
          return { ...d, isOn: false, energyUsage: 0, alert: 'Pressurization lock engaged' };
        }
        return d;
      })
    );

    const leakAlert = {
      id: `al-${Date.now()}`,
      category: 'CRITICAL',
      text: 'Safety Alert: Moisture sensor triggered warning in Kitchen cabinet under-sink base.',
      meta: 'Cabinet Wetness Detector — Kitchen Block',
      type: 'critical',
    };
    setActiveAlerts((prev) => [leakAlert, ...prev]);

    setSystemAlert('Cabinet Emergency: Under-sink cabinet leak sensor initiated supply water trigger.');
    pushLog(
      'Kitchen Valve Unit',
      'Cabinet moisture threshold exceeded. Automatic garden loops de-pressurized instantly for safety.',
      'warning',
      'Kitchen'
    );
  };

  const handleSimulateActiveCleaning = () => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.type === 'vacuum') {
          return { ...d, isOn: true, value: 92, energyUsage: 40 };
        }
        return d;
      })
    );
    
    pushLog(
      'Robot Vacuum',
      'LAUNCHED override command: Cleaner emerged from dock platform to execute primary foyer carpets sweep.',
      'info',
      'Living Room'
    );
  };

  // Sparkline coordinates calculator
  const getSparklinePath = (values, width = 120, height = 32) => {
    if (values.length === 0) return '';
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return values
      .map((val, idx) => {
        const x = (idx / (values.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 6) - 3;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  // Filter device listing
  const filteredDevices = devices.filter((d) => {
    const matchesRoom = selectedRoom === 'All Rooms' || d.room === selectedRoom;
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRoom && matchesSearch;
  });

  const activeAlertsCount = activeAlerts.length;
  const criticalAlertsCount = activeAlerts.filter(a => a.type === 'critical').length;

  if (!currentUser) {
    return <LoginPage onLogin={(email, role) => setCurrentUser({ email, role })} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex font-sans antialiased selection:bg-blue-100">
      
      {/* Dynamic Security/Crisis Banner Overlays */}
      <AnimatePresence>
        {systemAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-red-650 bg-rose-600 text-white px-4 py-3 rounded-lg shadow-xl z-50 flex items-start gap-3"
            id="emergency-alert-banner"
          >
            <AlertTriangle className="w-5 h-5 mt-0.5 text-white shrink-0 animate-bounce" />
            <div className="flex-1 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider block">Crisis Alert Intercepted</span>
              <p className="text-[11px] leading-relaxed opacity-95">{systemAlert}</p>
            </div>
            <button
              onClick={() => setSystemAlert(null)}
              className="p-1 text-white/80 hover:text-white rounded hover:bg-white/10 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 rotate-45" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR NAVIGATION PANEL */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#e2e8f0] shrink-0 sticky top-0 h-screen p-5 justify-between">
        <div className="space-y-6">
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-xs">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight leading-none uppercase">IoTMonitor</h2>
              <span className="text-[9px] font-bold text-slate-400 font-mono tracking-widest block mt-1 uppercase">IoT Node Platform</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 rounded-l-none'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Overview Matrix
            </button>
            <button
              onClick={() => setActiveTab('devices')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'devices'
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 rounded-l-none'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-4 h-4" />
              Relay Device Nodes
              <span className="ml-auto text-[9px] bg-slate-100 text-slate-500 font-mono px-1.5 py-0.5 rounded">
                {devices.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('schedules')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'schedules'
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 rounded-l-none'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4" />
              Rule Schedulers
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'alerts'
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 rounded-l-none'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Alert Diagnostics
              {activeAlertsCount > 0 && (
                <span className="ml-auto text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full">
                  {activeAlertsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 rounded-l-none'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Console & Simulation
            </button>
          </nav>
        </div>

        {/* User Session Profile & Role Elevation Switcher */}
        <div className="space-y-3 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-extrabold text-slate-800 truncate" title={currentUser.email}>
                {currentUser.email}
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Role Rights:</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                currentUser.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {currentUser.role === 'admin' ? 'Root Admin' : 'Mesh Operator'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setCurrentUser({ ...currentUser, role: currentUser.role === 'admin' ? 'user' : 'admin' })}
              className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer transition-colors text-center uppercase tracking-wider"
            >
              {currentUser.role === 'admin' ? 'Demote Rights' : 'Escalate Role'}
            </button>
            <button
              onClick={() => setCurrentUser(null)}
              className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold rounded-lg cursor-pointer transition-colors text-center uppercase tracking-wider flex items-center justify-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN APPLICATION VIEWSTAGE */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        
        {/* TOP STATUS CONTROL BAR */}
        <header className="bg-white border-b border-[#e2e8f0] px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {/* Hamburger on mobile fallback tabs */}
            <div className="lg:hidden p-2 bg-blue-50 border border-blue-100 text-blue-600 rounded">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 font-mono">
                <span>SYSTEM</span>
                <span>/</span>
                <span className="text-slate-800 font-sans font-extrabold uppercase">{activeTab}</span>
              </div>
              <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900 mt-0.5">
                {activeTab === 'dashboard' && 'System Overview'}
                {activeTab === 'devices' && 'Mesh Node Registers'}
                {activeTab === 'schedules' && 'Automation Macromap'}
                {activeTab === 'alerts' && 'Telemetry Alerts Hub'}
                {activeTab === 'admin' && 'Simulators & Credentials'}
              </h1>
            </div>
          </div>

          {/* Time & Quick Switch Link for smaller screens */}
          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="lg:hidden flex gap-1 items-center bg-slate-50 border p-1 rounded-lg">
              {['dashboard', 'devices', 'schedules'].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-2.5 py-1 rounded text-[10px] uppercase font-sans font-bold ${activeTab === t ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {currentTime && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-500 font-mono font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>{currentTime} UTC</span>
              </div>
            )}

            {/* Quick-action Header Theme SELECTOR */}
            <div className="relative flex items-center" id="theme-selector-container">
              <select
                value={activeTheme}
                onChange={(e) => setActiveTheme(e.target.value)}
                className="appearance-none pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-sans font-bold text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                id="theme-select"
                title="Select system dynamic aesthetic"
              >
                {THEMES.map((t) => (
                  <option key={t.id} value={t.id} className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                    {t.name}
                  </option>
                ))}
              </select>
              {/* Absolute layout icon prefix */}
              <div className="absolute left-2.5 pointer-events-none flex items-center text-slate-500 dark:text-slate-400">
                {activeTheme === 'light' && <Sun className="w-3.5 h-3.5 text-amber-500" />}
                {activeTheme === 'lightdark' && <Moon className="w-3.5 h-3.5 text-slate-400" />}
                {activeTheme === 'dark' && <Moon className="w-3.5 h-3.5 text-indigo-500" />}
                {activeTheme === 'dracula' && <Flame className="w-3.5 h-3.5 text-pink-500 animate-pulse" />}
                {activeTheme === 'nordic' && <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />}
                {activeTheme === 'forest' && <Leaf className="w-3.5 h-3.5 text-emerald-600" />}
                {activeTheme === 'cyberpunk' && <Terminal className="w-3.5 h-3.5 text-amber-500" />}
              </div>
              {/* Down arrow marker */}
              <div className="absolute right-2.5 pointer-events-none text-slate-400 flex items-center">
                <Sliders className="w-3 h-3 rotate-90" />
              </div>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Device
            </button>
          </div>
        </header>

        {/* WORKSPACE MAIN VIEWPORT */}
        <div className="flex-1 p-6 space-y-5 max-w-[1600px] w-full mx-auto">
          
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-5"
              >
                {/* 10 columns KPI Indicators */}
                <DashboardStats
                  devices={devices}
                  rules={automations}
                  commandsCount={commandsCount}
                  alertsCount={activeAlertsCount}
                  criticalAlertsCount={criticalAlertsCount}
                />

                {/* Local Network Address strip */}
                <div className="bg-white border border-[#e2e8f0] p-2.5 rounded-md flex items-center justify-between text-[11px] font-sans text-slate-500 font-bold hover:shadow-xs transition-shadow">
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    <span>LOCAL NETWORK ADDRESS:</span>
                    <span className="text-slate-400 font-normal">WAN:</span>
                    <span className="text-slate-650 font-mono text-[10px]">10.140.203.254</span>
                    <span className="text-slate-400 font-normal ml-2">GATEWAY MESH:</span>
                    <span className="text-slate-650 font-mono text-[10px]">10.140.203.1</span>
                  </span>
                  <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-mono text-slate-800 flex items-center gap-1 text-[10px]">
                    <Wifi className="w-3.5 h-3.5 text-blue-500" />
                    IP: 10.140.203.102
                  </span>
                </div>

                {/* Primary Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                  
                  {/* Left Column (LIVE DATA STREAM & Sparklines) */}
                  <div className="xl:col-span-2 space-y-5">
                    
                    {/* LIVE DATA STREAM table */}
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-xs">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-800 font-sans tracking-wide uppercase">
                          Live Telemetry packet Stream
                        </span>
                        <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 animate-pulse font-bold flex items-center gap-1">
                          <Activity className="w-3 h-3 text-blue-500" /> Array Listening
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs mt-2">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 font-semibold font-sans">
                              <th className="py-2 px-1">TIMESTAMP</th>
                              <th className="py-2 px-1">NODE ID</th>
                              <th className="py-2 px-1">PARAMETER</th>
                              <th className="py-2 px-1 text-right">VALUE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {liveStream.map((item, idx) => (
                              <tr
                                key={item.id}
                                className={`border-b border-slate-100/40 text-[11px] font-mono hover:bg-slate-50/50 transition-colors ${
                                  idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'
                                }`}
                              >
                                <td className="py-2 px-1 text-slate-400">{item.timestamp}</td>
                                <td className="py-2 px-1 text-blue-600 font-extrabold">{item.node}</td>
                                <td className="py-2 px-1 uppercase font-semibold font-sans text-slate-650">{item.parameter}</td>
                                <td className="py-2 px-1 text-right font-bold text-slate-900">
                                  {item.value.toFixed(1)} <span className="text-slate-400 font-normal font-sans ml-0.5">{item.unit}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* MICRO STREAM CHARTS row */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      
                      {/* Temp Card */}
                      <div className="bg-white border border-[#e2e8f0] rounded-xl p-3 shadow-xs flex flex-col justify-between">
                        <div>
                          <span className="text-[8px] font-mono font-extrabold text-slate-400 uppercase tracking-widest block leading-none">
                            Temp Stream
                          </span>
                          <div className="flex items-end justify-between mt-2">
                            <span className="text-base font-extrabold text-slate-800 leading-none">
                              {sensorValues.temp.toFixed(1)}°C
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 leading-none">
                              Peak 27°C
                            </span>
                          </div>
                        </div>
                        <div className="h-6 w-full mt-3">
                          <svg className="w-full h-full overflow-visible">
                            <defs>
                              <linearGradient id="grad-temp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <path
                              d={getSparklinePath(sparkHistory.temp)}
                              fill="none"
                              stroke="#f43f5e"
                              strokeWidth={1.5}
                              strokeLinecap="round"
                            />
                            <path
                              d={`${getSparklinePath(sparkHistory.temp)} L 120 32 L 0 32 Z`}
                              fill="url(#grad-temp)"
                              stroke="none"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Humidity Card */}
                      <div className="bg-white border border-[#e2e8f0] rounded-xl p-3 shadow-xs flex flex-col justify-between">
                        <div>
                          <span className="text-[8px] font-mono font-extrabold text-slate-400 uppercase tracking-widest block leading-none">
                            Humidity Sweep
                          </span>
                          <div className="flex items-end justify-between mt-2">
                            <span className="text-base font-extrabold text-slate-800 leading-none">
                              {sensorValues.humidity.toFixed(1)}%
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 leading-none">
                              Peak 82%
                            </span>
                          </div>
                        </div>
                        <div className="h-6 w-full mt-3">
                          <svg className="w-full h-full overflow-visible">
                            <defs>
                              <linearGradient id="grad-humid" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <path
                              d={getSparklinePath(sparkHistory.humidity)}
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth={1.5}
                              strokeLinecap="round"
                            />
                            <path
                              d={`${getSparklinePath(sparkHistory.humidity)} L 120 32 L 0 32 Z`}
                              fill="url(#grad-humid)"
                              stroke="none"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* CO2 Card */}
                      <div className="bg-white border border-[#e2e8f0] rounded-xl p-3 shadow-xs flex flex-col justify-between">
                        <div>
                          <span className="text-[8px] font-mono font-extrabold text-slate-400 uppercase tracking-widest block leading-none">
                            Carbon Dioxide
                          </span>
                          <div className="flex items-end justify-between mt-2">
                            <span className="text-base font-extrabold text-slate-800 leading-none truncate max-w-[70px]">
                              {sensorValues.co2.toFixed(1)}
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 leading-none shrink-0 ml-1">
                              Peak 1.8k
                            </span>
                          </div>
                        </div>
                        <div className="h-6 w-full mt-3">
                          <svg className="w-full h-full overflow-visible">
                            <defs>
                              <linearGradient id="grad-co2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#d97706" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="#d97706" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <path
                              d={getSparklinePath(sparkHistory.co2)}
                              fill="none"
                              stroke="#d97706"
                              strokeWidth={1.5}
                              strokeLinecap="round"
                            />
                            <path
                              d={`${getSparklinePath(sparkHistory.co2)} L 120 32 L 0 32 Z`}
                              fill="url(#grad-co2)"
                              stroke="none"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Motion Card */}
                      <div className="bg-white border border-[#e2e8f0] rounded-xl p-3 shadow-xs flex flex-col justify-between">
                        <div>
                          <span className="text-[8px] font-mono font-extrabold text-slate-400 uppercase tracking-widest block leading-none">
                            Sensor Motion
                          </span>
                          <div className="flex items-end justify-between mt-2">
                            <span className="text-base font-extrabold text-slate-800 leading-none">
                              {sensorValues.motion.toFixed(1)}
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 leading-none">
                              Peak 2.0
                            </span>
                          </div>
                        </div>
                        <div className="h-6 w-full mt-3">
                          <svg className="w-full h-full overflow-visible">
                            <defs>
                              <linearGradient id="grad-motion" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <path
                              d={getSparklinePath(sparkHistory.motion)}
                              fill="none"
                              stroke="#10b981"
                              strokeWidth={1.5}
                              strokeLinecap="round"
                            />
                            <path
                              d={`${getSparklinePath(sparkHistory.motion)} L 120 32 L 0 32 Z`}
                              fill="url(#grad-motion)"
                              stroke="none"
                            />
                          </svg>
                        </div>
                      </div>

                      {/* Power Card */}
                      <div className="bg-white border border-[#e2e8f0] rounded-xl p-3 shadow-xs flex flex-col justify-between">
                        <div>
                          <span className="text-[8px] font-mono font-extrabold text-slate-400 uppercase tracking-widest block leading-none">
                            Power Demand
                          </span>
                          <div className="flex items-end justify-between mt-2">
                            <span className="text-base font-extrabold text-slate-800 leading-none truncate max-w-[70px]">
                              {sensorValues.power.toFixed(1)} W
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 leading-none shrink-0 ml-1">
                              Peak 2.1k
                            </span>
                          </div>
                        </div>
                        <div className="h-6 w-full mt-3">
                          <svg className="w-full h-full overflow-visible">
                            <defs>
                              <linearGradient id="grad-power" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <path
                              d={getSparklinePath(sparkHistory.power)}
                              fill="none"
                              stroke="#6366f1"
                              strokeWidth={1.5}
                              strokeLinecap="round"
                            />
                            <path
                              d={`${getSparklinePath(sparkHistory.power)} L 120 32 L 0 32 Z`}
                              fill="url(#grad-power)"
                              stroke="none"
                            />
                          </svg>
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* Right Column (SENSOR DATA SCALES indicators) */}
                  <div className="xl:col-span-1">
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-xs h-full flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 font-sans tracking-wide uppercase pb-2.5 border-b border-slate-100">
                          Sensor Rate Scales
                        </h4>

                        <div className="mt-4 space-y-4">
                          {/* TEMP Indicator */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[11px] font-sans font-bold leading-none">
                              <span className="text-slate-400">TEMPERATURE</span>
                              <span className="text-slate-800 font-bold">{sensorValues.temp.toFixed(1)}°C</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, (sensorValues.temp / 50) * 100)}%` }} />
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-400 font-sans leading-none">
                              <span>0°C</span>
                              <span className="font-semibold">AVG: 22.0°C</span>
                              <span>50°C</span>
                            </div>
                          </div>

                          {/* HUMIDITY Indicator */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[11px] font-sans font-bold leading-none">
                              <span className="text-slate-400">HUMIDITY</span>
                              <span className="text-slate-800 font-bold">{sensorValues.humidity.toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${sensorValues.humidity}%` }} />
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-400 font-sans leading-none">
                              <span>0%</span>
                              <span className="font-semibold">AVG: 58.0%</span>
                              <span>100%</span>
                            </div>
                          </div>

                          {/* CO2 Indicator */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[11px] font-sans font-bold leading-none">
                              <span className="text-slate-400">CO2 CONCENTRATION</span>
                              <span className="text-slate-800 font-bold">{sensorValues.co2.toFixed(1)}ppm</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-600 rounded-full" style={{ width: `${Math.min(100, (sensorValues.co2 / 2000) * 100)}%` }} />
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-400 font-sans leading-none">
                              <span>200ppm</span>
                              <span className="font-semibold">AVG: 1250ppm</span>
                              <span>2000ppm</span>
                            </div>
                          </div>

                          {/* MOTION Indicator */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[11px] font-sans font-bold text-slate-500 leading-none">
                              <span className="text-slate-400">MOTION INCIDENTS</span>
                              <span className="text-slate-850 font-bold">{sensorValues.motion.toFixed(1)}events/s</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (sensorValues.motion / 5) * 100)}%` }} />
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-400 font-sans leading-none">
                              <span>0events</span>
                              <span className="font-semibold">AVG: 0.2events</span>
                              <span>20events</span>
                            </div>
                          </div>

                          {/* POWER Indicator */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[11px] font-sans font-bold text-slate-505 leading-none">
                              <span className="text-slate-400">POWER DRAW LOAD</span>
                              <span className="text-slate-800 font-bold">{sensorValues.power.toFixed(1)}W</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${Math.min(100, (sensorValues.power / 2500) * 100)}%` }} />
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-400 font-sans leading-none">
                              <span>0W</span>
                              <span className="font-semibold">AVG: 1800W</span>
                              <span>3000W</span>
                            </div>
                          </div>

                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[8px] font-mono font-bold text-slate-450 uppercase tracking-wider block">Grid Sync</span>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal font-sans">
                          Active endpoints sending localized environmental telemetry packets dynamically every 2.5s.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>

                {/* RECENT DEVICES list in Table format matching the screenshot */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-xs overflow-hidden pb-1">
                  <div className="px-4 py-3 border-b border-slate-100 bg-white flex justify-between items-center">
                    <span className="text-xs font-bold font-sans text-slate-800 uppercase tracking-wide">
                      Recent Connected Devices
                    </span>
                    <button
                      onClick={() => setActiveTab('devices')}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer font-sans"
                    >
                      View All
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold tracking-wider font-sans text-[10px] bg-slate-50/50">
                          <th className="py-2.5 px-4">DEVICE</th>
                          <th className="py-2.5 px-3">TYPE</th>
                          <th className="py-2.5 px-3">LOCATION</th>
                          <th className="py-2.5 px-3">STATUS</th>
                          <th className="py-2.5 px-3">CONTROL</th>
                          <th className="py-2.5 px-4 text-right">LAST SEEN</th>
                        </tr>
                      </thead>
                      <tbody>
                        {devices.slice(0, 6).map((dev) => (
                          <tr key={dev.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5 min-w-[200px]">
                                <div className="p-1.5 bg-slate-100 border border-slate-205 rounded-md text-slate-650">
                                  <Cpu className="w-4 h-4 text-slate-500" />
                                </div>
                                <div className="min-w-0">
                                  <span className="font-sans font-bold text-slate-800 text-[12px] block truncate">{dev.name}</span>
                                  <span className="text-[10px] font-mono text-slate-400 block leading-none mt-1">GFX-00{dev.id.substring(4)}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 uppercase font-mono font-bold text-[10px] text-slate-500">
                              {dev.type}
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-600">
                              {dev.room}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`inline-flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                                dev.status === 'warning' || dev.alert
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : dev.isOn
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}>
                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${dev.isOn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                {dev.status === 'warning' || dev.alert ? 'Warning' : dev.isOn ? 'Online' : 'Offline'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <button
                                onClick={() => handleToggleDevice(dev.id)}
                                className={`px-2.5 py-1 text-[10px] font-sans font-bold border rounded-md cursor-pointer transition-colors shadow-xs ${
                                  dev.isOn
                                    ? 'bg-slate-900 border-slate-905 border-slate-900 text-white hover:bg-slate-850'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                {dev.isOn ? 'Power OFF' : 'Power ON'}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right text-slate-500 font-mono">
                              {dev.lastSeen || '260s ago'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ALERTS stream view */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-xs overflow-hidden pb-1">
                  <div className="px-4 py-3 border-b border-slate-100 bg-white flex justify-between items-center">
                    <span className="text-xs font-bold font-sans text-slate-800 uppercase tracking-wide">
                      Active Warning Signals / Alerts
                    </span>
                    <button
                      onClick={() => setActiveTab('alerts')}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer font-sans"
                    >
                      Audit Center
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {activeAlerts.map((alert) => (
                      <div key={alert.id} className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white text-xs hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <span className={`px-2 py-0.5 text-[9px] uppercase font-bold rounded border shrink-0 tracking-wide mt-0.5 ${
                            alert.type === 'critical'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : alert.type === 'warning'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {alert.category}
                          </span>
                          <div className="space-y-1">
                            <p className="font-sans font-bold text-slate-850 text-slate-800">{alert.text}</p>
                            <span className="text-[10px] text-slate-400 font-mono block leading-none">{alert.meta}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setActiveAlerts((prev) => prev.filter((a) => a.id !== alert.id));
                            pushLog('Security Hub', `Alert [${alert.category}] acknowledged and archived`, 'success');
                          }}
                          className="text-[10px] font-sans font-bold px-2 py-1 bg-slate-50 border border-slate-200 text-slate-650 rounded-md hover:bg-slate-100 transition-colors shadow-xs shrink-0 cursor-pointer"
                        >
                          Dismiss Alert
                        </button>
                      </div>
                    ))}
                    {activeAlerts.length === 0 && (
                      <div className="p-8 text-center text-slate-450 italic font-sans">
                        No active warnings or incidents flagged on the local mesh grid array.
                      </div>
                    )}
                  </div>
                </div>

                {/* Macro Overrides Action triggers */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wide">Macro Scenario Triggers</h3>
                    <p className="text-[11px] text-slate-500 font-sans mt-0.5">Deploy whole-house standby configurations instantly.</p>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <button
                      onClick={triggerAwaySecure}
                      className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-sans font-semibold transition-colors cursor-pointer"
                    >
                      Away Lockdown
                    </button>
                    <button
                      onClick={triggerCozyChillNight}
                      className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-sans font-semibold transition-colors cursor-pointer"
                    >
                      Cozy Chill Loop
                    </button>
                    <button
                      onClick={triggerAllLightsOff}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-650 border border-slate-250 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer"
                    >
                      Kill All Lights
                    </button>
                  </div>
                </div>

              </motion.div>
            )}

            {activeTab === 'devices' && (
              <motion.div
                key="devices-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* Filters Row */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="font-sans font-bold text-slate-800 text-base">Node Register Console</h2>
                      <p className="text-[11px] text-slate-550 text-slate-500 font-sans">Toggle manual relays, custom parameters, and dimmer settings live.</p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <div className="relative flex-1 md:w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search node identifier, room, mac..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full text-xs font-sans pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-850 rounded-lg focus:outline-none placeholder-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Room select menu scrolling */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                    {ROOMS.map((room) => {
                      const isActive = selectedRoom === room;
                      const roomDeviceCount = devices.filter((d) => d.room === room).length;
                      const roomActiveCount = devices.filter((d) => d.room === room && d.isOn).length;

                      return (
                        <button
                          key={room}
                          onClick={() => setSelectedRoom(room)}
                          className={`px-3 py-1.5 text-[11px] uppercase tracking-wider font-extrabold border rounded-lg cursor-pointer transition-colors shrink-0 ${
                            isActive
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                          }`}
                        >
                          {room}
                          {room !== 'All Rooms' && roomDeviceCount > 0 && (
                            <span className={`ml-1.5 text-[9px] px-1 rounded-full ${
                              isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 font-mono'
                            }`}>
                              {roomActiveCount}/{roomDeviceCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Device cards list */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredDevices.map((device) => (
                    <DeviceCard
                      key={device.id}
                      device={device}
                      onToggle={handleToggleDevice}
                      onValueChange={handleChangeDeviceValue}
                      onDelete={handleDeleteDevice}
                    />
                  ))}
                  {filteredDevices.length === 0 && (
                    <div className="col-span-full py-16 text-center bg-white border border-[#e2e8f0] text-slate-450 italic text-xs font-sans rounded-xl shadow-xs">
                      No active node endpoints registered matching terms. Use &apos;Add Device&apos; above.
                    </div>
                  )}
                </div>

                {/* Telemetry charts row */}
                <TelemetryChart data={energyHistory} />
              </motion.div>
            )}

            {activeTab === 'schedules' && (
              <motion.div
                key="schedules-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SchedulePlan
                  rules={automations}
                  devices={devices}
                  onToggleRule={handleToggleRule}
                  onAddRule={handleAddRule}
                  onDeleteRule={handleDeleteRule}
                />
              </motion.div>
            )}

            {activeTab === 'alerts' && (
              <motion.div
                key="alerts-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <ActivityLogViewer logs={logs} onClearLogs={handleClearLogs} />

                {/* Warning lists block */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-xs">
                  <span className="text-xs font-bold text-slate-800 font-sans uppercase block tracking-wide border-b border-slate-105 pb-3">Active Warning Signals Buffer</span>
                  <div className="divide-y divide-slate-100 mt-2">
                    {activeAlerts.map((alert) => (
                      <div key={alert.id} className="py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold leading-none uppercase ${
                              alert.type === 'critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>{alert.category}</span>
                            {alert.text}
                          </p>
                          <span className="text-[10px] text-zinc-400 font-mono block">{alert.meta}</span>
                        </div>
                        <button
                          onClick={() => {
                            setActiveAlerts((prev) => prev.filter((a) => a.id !== alert.id));
                            pushLog('Safety Hub', 'Beacon warning resolved manually', 'success');
                          }}
                          className="px-2.5 py-1 text-[10px] bg-slate-50 border border-slate-200 text-slate-650 hover:bg-slate-100 font-sans font-bold shadow-xs rounded cursor-pointer self-end sm:self-center"
                        >
                          Resolve & Clear
                        </button>
                      </div>
                    ))}
                    {activeAlerts.length === 0 && (
                      <div className="py-8 text-center text-slate-450 italic">
                        0 mesh safety incidents flagged currently. Optimal grid configuration.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'admin' && (
              <motion.div
                key="admin-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 xl:grid-cols-2 gap-5"
              >
                {/* Left side: Role Credentials manager */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-sans font-bold text-slate-800 text-sm">Operator Security Hub</h3>
                    <p className="text-[11px] text-slate-500 font-sans">Role credentials allow or withhold destructive network overrides.</p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase">Credentials profile status</span>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Your session is currently authenticated under: <strong className="text-slate-800 font-bold">[{currentUser.role.toUpperCase()}] ({currentUser.email})</strong>.
                    </p>
                    <p className="text-[10px] text-slate-450 leading-relaxed font-sans">
                      Standard operators can query packet telemetry and toggle normal relays. Administrator privileges are required to dismantle / delete nodes or configure macromap schedulers.
                    </p>
                  </div>

                  <div className="flex gap-2 text-xs font-bold pt-2">
                    <button
                      onClick={() => {
                        setCurrentUser({ email: 'admin@synapse.io', role: 'admin' });
                        pushLog('Credentials manager', 'Session elevated to Root Administrator credentials', 'success');
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-[#4f46e5] hover:from-blue-700 hover:to-[#4338ca] text-white rounded-lg shadow-xs cursor-pointer text-[11px]"
                    >
                      Elevate Session to Root Admin
                    </button>
                    <button
                      onClick={() => {
                        setCurrentUser({ email: 'vaishakh884@gmail.com', role: 'user' });
                        pushLog('Credentials manager', 'Session restricted to Standard Operator', 'info');
                      }}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-lg cursor-pointer text-[11px] font-semibold"
                    >
                      Restrict to standard Operator
                    </button>
                  </div>
                </div>

                {/* Right side: Simulation suite */}
                <SimulationCenter
                  onSimulateDrivewayIntrusion={handleSimulateDrivewayIntrusion}
                  onSimulateEcoLockdown={handleSimulateEcoLockdown}
                  onSimulateHeatWave={handleSimulateHeatwave}
                  onSimulateKitchenWaterSpill={handleSimulateWaterSpill}
                  onSimulateActiveCleaning={handleSimulateActiveCleaning}
                />
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* FOOTER */}
        <footer className="border-t border-slate-200/80 bg-white py-5 text-center text-xs text-slate-450 mt-12 w-full">
          <p>© 2026 Synapse Mesh Solutions Co. Real-Time IoT infrastructure monitoring. Persistent client states.</p>
        </footer>

      </main>

      {/* Add Device Dialog Overlay */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddDeviceModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAddDevice={handleAddDevice}
          />
        )}
      </AnimatePresence>

      {/* Administrator Warning Gatekeeper Modal Backdrop */}
      <AnimatePresence>
        {showAdminRequiredModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdminRequiredModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#e2e8f0] w-full max-w-sm rounded-xl p-5 relative z-10 shadow-xl space-y-4 text-xs"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-red-50 border border-red-200 text-rose-600 rounded-lg shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-sans font-bold text-slate-800 text-sm">
                    Access Warning Intercepted
                  </h3>
                  <p className="text-slate-500 font-sans leading-normal">
                    Administrator authorization credentials are required to dispatch safety parameter: <strong className="text-slate-800">"{blockedActionName}"</strong>.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border p-3 rounded-lg space-y-1.5 text-slate-550 border-slate-200">
                <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Credential scope error</span>
                <p className="leading-normal text-slate-605 text-slate-500">
                  Your operator profile (<span className="text-emerald-600 font-mono font-bold">{currentUser?.email}</span>) does not possess root configuration overrides.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 font-sans">
                <button
                  type="button"
                  onClick={() => setShowAdminRequiredModal(false)}
                  className="py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg cursor-pointer text-center font-bold"
                >
                  Dismiss Warning
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentUser({ email: 'admin@synapse.io', role: 'admin' });
                    setShowAdminRequiredModal(false);
                  }}
                  className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-xs cursor-pointer text-center font-bold flex items-center justify-center gap-1"
                >
                  <Key className="w-3.5 h-3.5" />
                  Elevate to Admin
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
