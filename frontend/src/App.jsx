import React, { useState, useEffect, useRef } from 'react';
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
import { WifiDiscoveryPanel } from './components/WifiDiscoveryPanel';
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
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  Trash2,
  PlusCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
const SESSION_STORAGE_KEY = 'app-current-user';
const LAST_ACTIVITY_KEY = 'app-last-activity';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

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
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem(SESSION_STORAGE_KEY);
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      return parsedUser?.email && parsedUser?.role ? parsedUser : null;
    } catch {
      return null;
    }
  });
  const [showAdminRequiredModal, setShowAdminRequiredModal] = useState(false);
  const [blockedActionName, setBlockedActionName] = useState('');
  const sessionTimerRef = useRef(null);

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

  // Application state (Linked directly to SQLite Relational Database)
  const [devices, setDevices] = useState([]);
  const [dbUsers, setDbUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [proposalStatus, setProposalStatus] = useState(null);
  const logoutUser = () => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    setCurrentUser(null);
  };

  const markSessionActivity = () => {
    if (!currentUser) return;
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  };

  useEffect(() => {
    if (!currentUser) {
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      return;
    }

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentUser));

    const scheduleAutoLogout = () => {
      const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || Date.now());
      const elapsed = Date.now() - lastActivity;
      const remaining = Math.max(0, SESSION_TIMEOUT_MS - elapsed);

      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
      }

      if (remaining === 0) {
        logoutUser();
        return;
      }

      sessionTimerRef.current = setTimeout(() => {
        logoutUser();
      }, remaining);
    };

    const handleActivity = () => {
      markSessionActivity();
      scheduleAutoLogout();
    };

    if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
      markSessionActivity();
    }

    scheduleAutoLogout();

    const activityEvents = ['click', 'keydown', 'mousemove', 'mousedown', 'scroll', 'touchstart'];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, handleActivity, { passive: true }));
    window.addEventListener('focus', handleActivity);

    return () => {
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, handleActivity));
      window.removeEventListener('focus', handleActivity);
    };
  }, [currentUser]);

  // Load from SQL backend
  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/devices');
      const data = await res.json();
      if (Array.isArray(data)) {
        setDevices(data);
      }
    } catch (err) {
      console.error('Failed to load devices from SQL', err);
    }
  };

  const fetchDbUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (Array.isArray(data)) {
        setDbUsers(data);
      }
    } catch (err) {
      console.error('Failed to load users from SQL', err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/requests');
      const data = await res.json();
      if (Array.isArray(data)) {
        setRequests(data);
      }
    } catch (err) {
      console.error('Failed to load requests from SQL', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
       fetchDevices();
       fetchDbUsers();
       fetchRequests();
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const syncWorkspaceState = () => {
      fetchDevices();
      fetchRequests();
    };

    syncWorkspaceState();
    const intervalId = setInterval(syncWorkspaceState, 3000);

    return () => clearInterval(intervalId);
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin' && (activeTab === 'users' || activeTab === 'admin')) {
      setActiveTab('dashboard');
    }
  }, [currentUser, activeTab]);

  const [automations, setAutomations] = useState(initialAutomations);
  const [logs, setLogs] = useState(initialLogs);
  const [energyHistory, setEnergyHistory] = useState(energyMockHistory);

  // Commands count incrementor
  const [commandsCount, setCommandsCount] = useState(1);

  // Filters and dialog UI states
  const [selectedRoom, setSelectedRoom] = useState('All Rooms');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [systemAlert, setSystemAlert] = useState(null);

  // Profile Mock Terminal State
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState([
    { type: 'system', text: 'ROBROS Node Terminal v4.8 [Online]' },
    { type: 'system', text: 'Host: 192.168.10.125 (Subnet Relay)' },
    { type: 'input', text: 'Type /help to display available terminal subgrid utilities.' }
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

  // TIME & DATE RANGE DASHBOARD FILTERS state
  const [selectedMonth, setSelectedMonth] = useState('June');
  const [selectedDay, setSelectedDay] = useState('08');
  const [selectedTimeRange, setSelectedTimeRange] = useState('Full Day');

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  const TIME_RANGES = [
    { name: 'Full Day (24hr)', value: 'Full Day' },
    { name: 'Morning (06:00 - 12:00)', value: 'Morning' },
    { name: 'Afternoon (12:00 - 18:00)', value: 'Afternoon' },
    { name: 'Evening (18:00 - 24:00)', value: 'Evening' },
    { name: 'Night (00:00 - 06:00)', value: 'Night' }
  ];

  const getMonthIndexVal = (m) => {
    const idx = MONTHS.indexOf(m);
    return idx === -1 ? 6 : idx + 1;
  };

  const generateTrendForFilter = (param, month, day, rangeStr) => {
    const points = [];
    let baseVal = 21.2;
    let variation = 1.5;

    if (param === 'temp') {
      const monthTemps = {
        'January': 12.5, 'February': 13.8, 'March': 15.4, 'April': 18.2, 'May': 21.8, 'June': 24.5,
        'July': 26.8, 'August': 26.0, 'September': 22.4, 'October': 18.5, 'November': 14.2, 'December': 11.5
      };
      baseVal = monthTemps[month] || 21.2;
      variation = 2.0;
    } else if (param === 'humidity') {
      const monthHumids = {
        'January': 76.0, 'February': 72.0, 'March': 68.0, 'April': 62.0, 'May': 56.0, 'June': 52.0,
        'July': 55.0, 'August': 58.0, 'September': 64.0, 'October': 70.0, 'November': 74.0, 'December': 78.0
      };
      baseVal = monthHumids[month] || 57.2;
      variation = 6.0;
    } else if (param === 'co2') {
      baseVal = 850 + (parseInt(day) || 8) * 12;
      variation = 85.0;
    } else if (param === 'motion') {
      baseVal = 0.4;
      variation = 0.35;
    } else if (param === 'power') {
      baseVal = 1450 + (parseInt(day) || 8) * 15;
      variation = 320.0;
    }

    let filterMult = 1.0;
    if (rangeStr === 'Morning') filterMult = 0.85;
    else if (rangeStr === 'Afternoon') filterMult = 1.25;
    else if (rangeStr === 'Evening') filterMult = 1.15;
    else if (rangeStr === 'Night') filterMult = 0.65;

    for (let i = 0; i < 12; i++) {
      const seedVal = Math.sin((i + getMonthIndexVal(month) + parseInt(day)) * 14.5);
      let pointVal = baseVal * filterMult + seedVal * variation;

      if (param === 'temp') {
        pointVal = Math.max(8.0, Math.min(45.0, pointVal));
      } else if (param === 'humidity') {
        pointVal = Math.max(10.0, Math.min(100.0, pointVal));
      } else if (param === 'co2') {
        pointVal = Math.max(380, Math.min(2500, pointVal));
      } else if (param === 'motion') {
        pointVal = Math.max(0.01, Math.min(4.5, pointVal));
      } else if (param === 'power') {
        pointVal = Math.max(100, Math.min(4500, pointVal));
      }

      points.push(parseFloat(pointVal.toFixed(1)));
    }
    return points;
  };

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

  // Refs for tracking active Dynamic Island auto-minimise and auto-hide timers
  const islandTimerMinRef = useRef(null);
  const islandTimerHideRef = useRef(null);
  const islandRef = useRef(null);

  // Dynamic Island notification system state
  const [dynamicIslandAlert, setDynamicIslandAlert] = useState(null);
  const [isDynamicIslandExpanded, setIsDynamicIslandExpanded] = useState(false);
  const [hasMountedAlerts, setHasMountedAlerts] = useState(false);

  // Notification Centre state
  const [notifications, setNotifications] = useState([
    {
      id: 'n-1',
      category: 'WARNING',
      text: 'Division status is warning; Server Room temperature elevated slightly.',
      meta: 'Server Team CO2 — Server Room',
      type: 'warning',
      timestamp: '04:00:15 AM',
      read: false
    },
    {
      id: 'n-2',
      category: 'CRITICAL',
      text: 'Division status is critical; Solar power reserve drawing backup voltage lines.',
      meta: 'Solar Power Inverter — Rooftop Solar',
      type: 'critical',
      timestamp: '03:45:10 AM',
      read: false
    },
    {
      id: 'n-3',
      category: 'SYSTEM',
      text: 'Robros IoT Mesh Gateway Online.',
      type: 'success',
      meta: 'Binds successful on port 3000',
      timestamp: '03:15:00 AM',
      read: true
    }
  ]);
  const [isNotificationCentreOpen, setIsNotificationCentreOpen] = useState(false);

  // Trigger a new system notification and show in Dynamic Island!
  const triggerNotification = (category, text, type = 'info', meta = '') => {
    const now = new Date();
    const timestampStr = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      category: category.toUpperCase(),
      text,
      type,
      meta,
      timestamp: timestampStr,
      read: false
    };

    setNotifications(prev => [newNotif, ...prev]);
    setDynamicIslandAlert(newNotif);
    setIsDynamicIslandExpanded(true); // Automatically expand the dynamic island for premium feedback!
    
    // Clear any previous active timers to avoid flickering overlaps
    if (islandTimerMinRef.current) clearTimeout(islandTimerMinRef.current);
    if (islandTimerHideRef.current) clearTimeout(islandTimerHideRef.current);

    // Auto-minimize after 4 seconds
    islandTimerMinRef.current = setTimeout(() => {
      setIsDynamicIslandExpanded(false);
    }, 4000);

    // Completely slide away / hide after 7 seconds
    islandTimerHideRef.current = setTimeout(() => {
      setDynamicIslandAlert(null);
    }, 7000);
  };

  // Close dynamic island on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (islandRef.current && !islandRef.current.contains(event.target)) {
        // Clear active timers to avoid conflicting state changes later
        if (islandTimerMinRef.current) clearTimeout(islandTimerMinRef.current);
        if (islandTimerHideRef.current) clearTimeout(islandTimerHideRef.current);
        setDynamicIslandAlert(null);
        setIsDynamicIslandExpanded(false);
      }
    }
    if (dynamicIslandAlert) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dynamicIslandAlert]);

  useEffect(() => {
    if (!hasMountedAlerts) {
      setHasMountedAlerts(true);
      return;
    }
    if (activeAlerts.length > 0) {
      const newest = activeAlerts[0];
      // Bridge into notification centre and dynamic island!
      triggerNotification(
        newest.category || 'ALERT',
        newest.text,
        newest.type || 'warning',
        newest.meta || 'System Diagnostic'
      );
    }
  }, [activeAlerts.length]);

  useEffect(() => {
    const temps = generateTrendForFilter('temp', selectedMonth, selectedDay, selectedTimeRange);
    const hums = generateTrendForFilter('humidity', selectedMonth, selectedDay, selectedTimeRange);
    const co2s = generateTrendForFilter('co2', selectedMonth, selectedDay, selectedTimeRange);
    const mots = generateTrendForFilter('motion', selectedMonth, selectedDay, selectedTimeRange);
    const pows = generateTrendForFilter('power', selectedMonth, selectedDay, selectedTimeRange);

    setSparkHistory({
      temp: temps,
      humidity: hums,
      co2: co2s,
      motion: mots,
      power: pows
    });

    setSensorValues({
      temp: temps[temps.length - 1],
      humidity: hums[hums.length - 1],
      co2: co2s[co2s.length - 1],
      motion: mots[mots.length - 1],
      power: pows[pows.length - 1]
    });

    const monthIndex = getMonthIndexVal(selectedMonth);
    const multiplier = 0.8 + (monthIndex % 4) * 0.15;
    const dayFactor = 0.95 + (parseInt(selectedDay) % 10) * 0.01;

    let targetBase = [...energyMockHistory];
    if (selectedTimeRange === 'Morning') {
      targetBase = energyMockHistory.filter(h => h.time.includes('AM') && (h.time === '06 AM' || h.time === '08 AM' || h.time === '10 AM'));
    } else if (selectedTimeRange === 'Afternoon') {
      targetBase = energyMockHistory.filter(h => h.time.includes('PM') && (h.time === '12 PM' || h.time === '02 PM' || h.time === '04 PM'));
    } else if (selectedTimeRange === 'Evening') {
      targetBase = energyMockHistory.filter(h => h.time.includes('PM') && (h.time === '06 PM' || h.time === '08 PM' || h.time === '10 PM'));
    } else if (selectedTimeRange === 'Night') {
      targetBase = energyMockHistory.filter(h => h.time.includes('AM') && (h.time === '12 AM' || h.time === '02 AM' || h.time === '04 AM'));
    }

    const nextHist = targetBase.map((h) => {
      const scaleVal = multiplier * dayFactor;
      const lighting = Math.round(h.lighting * scaleVal);
      const heating = Math.round(h.heating * scaleVal);
      const appliances = Math.round(h.appliances * scaleVal);
      return {
        ...h,
        lighting,
        heating,
        appliances,
        total: lighting + heating + appliances
      };
    });
    setEnergyHistory(nextHist);
  }, [selectedMonth, selectedDay, selectedTimeRange]);

  // Gentle pulse simulation interval for real organic micro variations
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setSensorValues(prev => {
        const deltaTemp = (Math.random() - 0.5) * 0.2;
        const deltaHum = (Math.random() - 0.5) * 0.4;
        const deltaCo2 = (Math.random() - 0.5) * 5;
        const deltaMot = (Math.random() - 0.5) * 0.05;
        const deltaPow = (Math.random() - 0.5) * 15;

        return {
          temp: parseFloat((prev.temp + deltaTemp).toFixed(1)),
          humidity: parseFloat((prev.humidity + deltaHum).toFixed(1)),
          co2: parseFloat((prev.co2 + deltaCo2).toFixed(1)),
          motion: parseFloat(Math.max(0.01, prev.motion + deltaMot).toFixed(2)),
          power: parseFloat((prev.power + deltaPow).toFixed(1))
        };
      });
    }, 4000);
    return () => clearInterval(pulseInterval);
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
  const handleToggleDevice = async (id) => {
    setCommandsCount((prev) => prev + 1);
    const target = devices.find((d) => d.id === id);
    if (!target) return;
    const nextState = !target.isOn;

    // Optimistically update locally only if current session is Admin
    if (currentUser?.role === 'admin') {
      setDevices((prev) =>
        prev.map((d) => {
          if (d.id === id) {
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
            return { ...d, isOn: nextState, energyUsage: load };
          }
          return d;
        })
      );
    }

    try {
      const res = await fetch('/api/devices/toggle', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': currentUser.email
        },
        body: JSON.stringify({ id, isOn: nextState }),
      });
      const data = await res.json();
      
      if (data.pending) {
        pushLog(
          target.name,
          `PROPOSAL SUBMITTED: relay status of ${nextState ? 'ON (CLOSED)' : 'OFF (OPEN)'} queued for root approval`,
          'info',
          target.room
        );
        setProposalStatus({
          type: 'success',
          message: `Action proposed! Your command to turn ${nextState ? 'ON' : 'OFF'} "${target.name}" is pending Root Administrator approval.`
        });
        setTimeout(() => setProposalStatus(null), 6000);
        fetchRequests();
        triggerNotification(
          'PROPOSAL',
          `Proposed Turn ${nextState ? 'ON' : 'OFF'} for "${target.name}"`,
          'info',
          `Waiting for Root operator approval`
        );
      } else {
        pushLog(
          target.name,
          `SQL Database updated: relay status programmed to ${nextState ? 'ON' : 'OFF'}`,
          nextState ? 'success' : 'info',
          target.room
        );
        triggerNotification(
          'DEVICE',
          `Turned "${target.name}" ${nextState ? 'ON' : 'OFF'}`,
          nextState ? 'success' : 'info',
          `Directly updated registry to ${nextState ? 'ON' : 'OFF'}`
        );
      }
      fetchDevices();
    } catch (e) {
      console.error('Failed toggling device database:', e);
    }
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

  const handleDeleteDevice = async (id) => {
    const target = devices.find((d) => d.id === id);
    if (!target) return;
    
    try {
      const res = await fetch(`/api/devices/${id}`, {
        method: 'DELETE',
        headers: { 
          'x-user-email': currentUser.email
        }
      });
      const data = await res.json();

      if (data.pending) {
        pushLog(target.name, `PROPOSAL SUBMITTED: decommission request queued for admin review`, 'info', target.room);
        setProposalStatus({
          type: 'success',
          message: `Decommission proposed! Your request to delete "${target.name}" is pending Root Administrator sign-off.`
        });
        setTimeout(() => setProposalStatus(null), 6000);
        fetchRequests();
        triggerNotification(
          'PROPOSAL',
          `Proposed Decommission for "${target.name}"`,
          'info',
          `Decommission Pending Root Approval`
        );
      } else {
        setDevices((prev) => prev.filter((d) => d.id !== id));
        pushLog(target.name, `Device decommissioned and deleted from room registers`, 'warning', target.room);
        triggerNotification(
          'ENDPOINT',
          `Decommissioned Node "${target.name}"`,
          'warning',
          `Removed from registry in ${target.room}`
        );
      }
      fetchDevices();
    } catch (err) {
      console.error('Failed deleting from SQL database:', err);
    }
  };

  const handleAddDevice = async (newDevice) => {
    const fullDevice = {
      ...newDevice,
      id: `dev-${Date.now()}`,
      lastSeen: 'Just registered',
    };

    try {
      const res = await fetch('/api/devices/add', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': currentUser.email
        },
        body: JSON.stringify(fullDevice),
      });
      const data = await res.json();

      if (data.pending) {
        pushLog(fullDevice.name, `PROPOSAL SUBMITTED: node registration queued for admin review`, 'info', fullDevice.room);
        setProposalStatus({
          type: 'success',
          message: `Registration proposed! Action to add device "${fullDevice.name}" is pending Root Administrator approval.`
        });
        setTimeout(() => setProposalStatus(null), 6000);
        fetchRequests();
        triggerNotification(
          'PROPOSAL',
          `Proposed Addition of "${fullDevice.name}"`,
          'info',
          `Addition Pending Root Approval`
        );
      } else {
        setDevices((prev) => [...prev, fullDevice]);
        pushLog(fullDevice.name, `New ${fullDevice.type} registered successfully with full diagnostics`, 'success', fullDevice.room);
        triggerNotification(
          'ENDPOINT',
          `Registered New Node "${fullDevice.name}"`,
          'success',
          `Added ${fullDevice.type} in ${fullDevice.room}`
        );
      }
      fetchDevices();
    } catch (err) {
      console.error('Failed adding node to SQL database:', err);
    }
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
    return <LoginPage onLogin={(email, role) => {
      const nextUser = { email, role };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextUser));
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
      setCurrentUser(nextUser);
    }} />;
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

        {/* INTERACTIVE DYNAMIC ISLAND NOTIFICATION FOR NEW MESH ALERTS & LIVE PROCESSES */}
        {dynamicIslandAlert && (
          <motion.div
            key="dynamic-island-wrapper"
            initial={{ y: -30, x: "-50%", scale: 0.85, opacity: 0 }}
            animate={{ y: 0, x: "-50%", scale: 1, opacity: 1 }}
            exit={{ y: -30, x: "-50%", scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="fixed top-5 left-1/2 z-[100] flex flex-col items-center select-none"
            id="dynamic-island-wrapper-node"
          >
            {!isDynamicIslandExpanded ? (
              /* Compact Pill Mode */
              <div 
                onClick={() => setIsDynamicIslandExpanded(true)}
                className="bg-slate-950 dark:bg-black border border-slate-800 text-white rounded-full h-11 px-4 flex items-center justify-between gap-4 cursor-pointer hover:border-blue-500 shadow-2xl transition-all duration-300 w-[240px] sm:w-[340px] md:w-[380px]"
                id="dynamic-island-pill"
              >
                <div className="flex items-center gap-2 overflow-hidden w-full">
                  <span className="flex h-2.5 w-2.5 relative shrink-0">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      dynamicIslandAlert.type === 'critical' ? 'bg-red-500' :
                      dynamicIslandAlert.type === 'success' ? 'bg-emerald-500' :
                      dynamicIslandAlert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      dynamicIslandAlert.type === 'critical' ? 'bg-red-600' :
                      dynamicIslandAlert.type === 'success' ? 'bg-emerald-600' :
                      dynamicIslandAlert.type === 'warning' ? 'bg-amber-600' : 'bg-blue-600'
                    }`} />
                  </span>
                  <span className="text-[9px] uppercase font-mono font-black tracking-wider text-blue-500 dark:text-blue-400 shrink-0">
                    {dynamicIslandAlert.category || 'SYSTEM'}:
                  </span>
                  <span className="text-[10px] font-semibold text-slate-100 truncate flex-1 block">
                    {dynamicIslandAlert.text}
                  </span>
                </div>

                {/* Animated wave form */}
                <div className="flex items-center gap-0.5 shrink-0 h-3">
                  <span className="w-0.5 h-2 bg-blue-500 rounded-full animate-bounce" />
                  <span className="w-0.5 h-3.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-0.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            ) : (
              /* Expanded Dynamic Island Mode */
              <div
                className="bg-slate-950 dark:bg-black border border-slate-800 text-white rounded-[24px] p-5 shadow-2xl w-[320px] sm:w-[420px] space-y-4"
                id="dynamic-island-expanded-box"
              >
                {/* Header block with animated badge and minimize */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${
                      dynamicIslandAlert.type === 'critical' ? 'bg-rose-950/60 border border-rose-800 text-rose-500' :
                      dynamicIslandAlert.type === 'success' ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-500' :
                      dynamicIslandAlert.type === 'warning' ? 'bg-amber-950/60 border border-amber-800 text-amber-500' :
                      'bg-blue-950/60 border border-blue-800 text-blue-500'
                    }`}>
                      {dynamicIslandAlert.type === 'success' ? (
                        <CheckCircle className="w-4 h-4 animate-pulse text-emerald-500" />
                      ) : dynamicIslandAlert.type === 'info' ? (
                        <Cpu className="w-4 h-4 text-blue-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 animate-bounce text-amber-500" />
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Subgrid Live Broadcast</span>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black font-mono tracking-tight uppercase">
                          {dynamicIslandAlert.category || 'SYSTEM'} OVERRIDE
                        </h4>
                        <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-ping" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Minimize Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDynamicIslandExpanded(false);
                    }}
                    className="p-1 hover:bg-slate-900 border border-transparent hover:border-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer transition-colors"
                    title="Minimize Island"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Main Alert Info Text */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-105 leading-normal font-sans">
                    {dynamicIslandAlert.text}
                  </p>
                  <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-900 px-2.5 py-2 rounded-lg">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0 animate-ping" />
                    <span className="text-[10px] text-slate-300 font-mono truncate" title={dynamicIslandAlert.meta}>
                      {dynamicIslandAlert.meta}
                    </span>
                  </div>
                </div>

                {/* Quick Diagnostics Action Controls */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900">
                  {dynamicIslandAlert.id && dynamicIslandAlert.id.startsWith('al-') ? (
                    <>
                      <button
                        onClick={() => {
                          // Dismiss Alert (Removes from activeAlerts state)
                          setActiveAlerts((prev) => prev.filter((a) => a.id !== dynamicIslandAlert.id));
                          pushLog('Dynamic Island', `Acknowledged alert [${dynamicIslandAlert.category}] via island controller`, 'success');
                          setDynamicIslandAlert(null);
                          setIsDynamicIslandExpanded(false);
                        }}
                        className="w-full py-2 bg-slate-900 hover:bg-red-950/60 hover:text-rose-450 border border-slate-800 hover:border-rose-900 text-[11px] font-bold rounded-xl cursor-pointer transition-colors text-slate-305 font-sans"
                      >
                        Dismiss & Close
                      </button>

                      <button
                        onClick={() => {
                          // Navigate directly to Diagnostic Alerts tab!
                          setActiveTab('alerts');
                          setIsDynamicIslandExpanded(false);
                        }}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-[11px] font-bold rounded-xl cursor-pointer transition-all hover:shadow-lg text-white font-sans flex items-center justify-center gap-1.5"
                      >
                        <Activity className="w-3.5 h-3.5 animate-pulse" />
                        Run Diagnostics
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setDynamicIslandAlert(null);
                          setIsDynamicIslandExpanded(false);
                        }}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-850 hover:text-slate-200 border border-slate-800 text-[11px] font-bold rounded-xl cursor-pointer transition-colors text-slate-305 font-sans"
                      >
                        Close
                      </button>

                      <button
                        onClick={() => {
                          setIsNotificationCentreOpen(true);
                          setDynamicIslandAlert(null);
                          setIsDynamicIslandExpanded(false);
                        }}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-[11px] font-bold rounded-xl cursor-pointer transition-all hover:shadow-lg text-white font-sans flex items-center justify-center gap-1.5"
                      >
                        <Bell className="w-3.5 h-3.5 animate-bounce" />
                        Open Feed
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {isMobileMenuOpen && (
          <motion.div
            key="mobile-drawer-wrapper"
            className="fixed inset-0 z-50 lg:hidden"
          >
            {/* Dark Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
              id="mobile-drawer-backdrop"
            />

            {/* Slide-in drawer container */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-slate-950 border-r border-[#e2e8f0] dark:border-slate-800 p-5 shadow-2xl flex flex-col justify-between overflow-y-auto"
              id="mobile-drawer-container"
            >
              <div className="space-y-6">
                {/* Logo and close button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
                      <Cpu className="w-4 h-4 animate-pulse text-blue-100" />
                    </div>
                    <div>
                      <h2 className="text-xs font-black text-slate-950 dark:text-white tracking-tight leading-none uppercase">IoTMonitor</h2>
                      <span className="text-[9px] font-bold text-slate-400 font-mono tracking-widest block mt-0.5 uppercase">SYSTEM MESH</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Main Navigation links */}
                <nav className="space-y-1 relative" id="mobile-drawer-navigation">
                  {[
                    { id: 'dashboard', label: 'Overview Matrix', icon: LayoutDashboard },
                    { id: 'devices', label: 'Relay Device Nodes', icon: Cpu, badge: devices.length, badgeStyle: 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400 font-mono' },
                    { id: 'schedules', label: 'Rule Schedulers', icon: Clock },
                    { id: 'alerts', label: 'Alert Diagnostics', icon: AlertTriangle, badge: activeAlertsCount, badgeStyle: 'bg-amber-100 text-amber-800 font-bold rounded-full dark:bg-amber-950/40 dark:text-amber-400' },
                    ...(currentUser?.role === 'admin' ? [
                      { id: 'users', label: 'SQL Users Register', icon: User, badge: dbUsers.length, badgeStyle: 'bg-indigo-100 text-indigo-700 font-mono font-bold dark:bg-indigo-950/40 dark:text-indigo-400' },
                      { id: 'admin', label: 'System Simulations', icon: Sliders }
                    ] : [])
                  ].map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    return (
                      <motion.button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        whileHover={{ scale: 1.015, x: 2, zIndex: 20 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "tween", duration: 0.2 }}
                        className={`w-full relative flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 duration-150 cursor-pointer group bg-transparent ${isActive ? 'z-10' : 'z-0'}`}
                        id={`mobile-nav-btn-${item.id}`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="mobileDrawerActiveBg"
                            className="absolute inset-0 bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-blue-600 z-0"
                            transition={{ type: "tween", duration: 0.2 }}
                          />
                        )}
                        
                        <Icon className={`w-4 h-4 relative z-10 transition-transform duration-200 group-hover:scale-110 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`} />
                        
                        <span className={`relative z-10 transition-colors duration-200 font-sans tracking-wide ${isActive ? 'text-blue-600 font-extrabold' : 'text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white font-medium'}`}>
                          {item.label}
                        </span>
                        
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className={`ml-auto relative z-10 text-[9px] px-1.5 py-0.5 rounded transition-transform duration-200 group-hover:scale-105 ${item.badgeStyle}`}>
                            {item.badge}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </nav>
              </div>

              {/* User Session Profile, Role Switcher and Logout */}
              <div className="space-y-4 pt-5 border-t border-slate-200 dark:border-slate-800">
                <div 
                  onClick={() => {
                    setActiveTab('profile');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border text-xs hover:border-blue-400 dark:hover:border-blue-600 cursor-pointer active:scale-[0.98] transition-all select-none group/profile font-sans ${activeTab === 'profile' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-800'}`}
                  title="Click to view full user profile details"
                  id="mobile-profile-card-click"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="w-3.5 h-3.5 text-slate-400 group-hover/profile:text-blue-500 dark:group-hover/profile:text-blue-400 transition-colors shrink-0" />
                      <span className="font-extrabold text-slate-805 dark:text-slate-200 truncate group-hover/profile:text-blue-600 dark:group-hover/profile:text-blue-400 transition-colors" title={currentUser.email}>
                        {currentUser.email}
                      </span>
                    </div>
                    <Sliders className="w-3 h-3 text-slate-350 dark:text-slate-600 group-hover/profile:text-blue-500 group-hover/profile:rotate-180 transition-all duration-300" />
                  </div>
                  <div className="mt-2 text-slate-450 dark:text-slate-400 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Role Rights:</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                      currentUser?.role === 'admin' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}>
                      {currentUser?.role === 'admin' ? 'Root Admin' : 'Mesh Operator'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setCurrentUser({ ...currentUser, role: currentUser.role === 'admin' ? 'user' : 'admin' });
                    }}
                    className="py-2 px-2 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-lg cursor-pointer transition-colors text-center uppercase tracking-wider"
                  >
                    {currentUser?.role === 'admin' ? 'Demote' : 'Escalate'}
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                        logoutUser();
                    }}
                    className="py-2 px-2 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[10px] font-bold rounded-lg cursor-pointer transition-colors text-center uppercase tracking-wider flex items-center justify-center gap-1"
                  >
                    <LogOut className="w-3 h-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR NAVIGATION PANEL */}
      <aside className={`hidden lg:flex flex-col ${isSidebarCollapsed ? 'w-20 px-3' : 'w-64 p-5'} bg-white dark:bg-slate-950 border-r border-[#e2e8f0] dark:border-slate-800 shrink-0 sticky top-0 h-screen py-5 justify-between transition-all duration-300 relative`} id="main-sidebar-navigation-panel">
        
        {/* Collapse Toggle floating on the right border */}
        <button
          onClick={() => {
            const newValue = !isSidebarCollapsed;
            setIsSidebarCollapsed(newValue);
            localStorage.setItem('sidebar_collapsed', String(newValue));
          }}
          className="absolute top-6 -right-3 w-6 h-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:scale-105 active:scale-95 transition-all shadow-xs hover:shadow-md cursor-pointer z-50"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          id="sidebar-collapse-toggle-btn"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        <div className="space-y-6">
          {/* Logo Brand */}
          <div className="flex items-center justify-center relative w-full overflow-hidden" style={{ minHeight: '40px' }} id="sidebar-logo-brand">
            <div className={`flex items-center transition-all duration-300 ${isSidebarCollapsed ? 'justify-center w-full' : 'gap-2.5 w-full'}`}>
              <div className="p-2 bg-blue-600 text-white rounded-lg shadow-xs shrink-0 flex items-center justify-center">
                <Cpu className="w-5 h-5 animate-pulse text-blue-100" />
              </div>
              {!isSidebarCollapsed && (
                <div className="whitespace-nowrap overflow-hidden">
                  <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase">IoTMonitor</h2>
                  <span className="text-[9px] font-bold text-slate-400 font-mono tracking-widest block mt-1 uppercase">IoT Node Platform</span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 relative" id="sidebar-navigation">
            {[
              { id: 'dashboard', label: 'Overview Matrix', icon: LayoutDashboard },
              { id: 'devices', label: 'Relay Device Nodes', icon: Cpu, badge: devices.length, badgeStyle: 'bg-slate-100 text-slate-500 font-mono dark:bg-slate-900 dark:text-slate-450' },
              { id: 'schedules', label: 'Rule Schedulers', icon: Clock },
              { id: 'alerts', label: 'Alert Diagnostics', icon: AlertTriangle, badge: activeAlertsCount, badgeStyle: 'bg-amber-100 text-amber-800 font-bold rounded-full dark:bg-amber-950/45 dark:text-amber-450' },
              ...(currentUser?.role === 'admin' ? [
                { id: 'users', label: 'SQL Users Register', icon: User, badge: dbUsers.length, badgeStyle: 'bg-indigo-100 text-indigo-700 font-mono font-bold dark:bg-indigo-950/45 dark:text-indigo-400' },
                { id: 'admin', label: 'System Simulations', icon: Sliders }
              ] : [])
            ].map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full relative flex items-center ${isSidebarCollapsed ? 'justify-center px-2 py-3' : 'justify-start px-3.5 py-2.5'} text-xs font-bold rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 duration-150 cursor-pointer group bg-transparent ${isActive ? 'z-10 text-blue-600 dark:text-blue-400' : 'z-0 text-slate-600 dark:text-slate-350 hover:text-slate-900'}`}
                  id={`nav-btn-${item.id}`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  {/* Sliding Active Indicator underlay */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActiveBg"
                      className="absolute inset-0 bg-blue-50/80 dark:bg-blue-950/30 border-l-4 border-blue-600 z-0"
                      transition={{ type: "tween", duration: 0.25 }}
                    />
                  )}
                  
                  <Icon className={`w-4 h-4 relative z-10 transition-transform duration-200 group-hover:scale-110 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-100'}`} />
                  
                  {!isSidebarCollapsed && (
                    <span className="ml-3 relative z-10 transition-colors duration-200 font-sans tracking-wide">
                      {item.label}
                    </span>
                  )}
                  
                  {item.badge !== undefined && item.badge > 0 && (
                    isSidebarCollapsed ? (
                      <span className="absolute top-2 right-2 bg-rose-500 text-white rounded-full w-2 h-2" />
                    ) : (
                      <span className={`ml-auto relative z-10 text-[9px] px-1.5 py-0.5 rounded transition-transform duration-200 group-hover:scale-105 ${item.badgeStyle}`}>
                        {item.badge}
                      </span>
                    )
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Session Profile & Role Elevation Switcher */}
        <div className="space-y-3 pt-5 border-t border-slate-100 dark:border-slate-800">
          {!isSidebarCollapsed ? (
            <>
              <div 
                onClick={() => setActiveTab('profile')}
                className={`bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border text-xs hover:border-blue-400 dark:hover:border-blue-600 cursor-pointer active:scale-[0.98] transition-all select-none group/profile font-sans ${activeTab === 'profile' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-800'}`}
                title="Click to view full user profile details"
                id="desktop-profile-card-click"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="w-3.5 h-3.5 text-slate-400 group-hover/profile:text-blue-500 dark:group-hover/profile:text-blue-400 transition-colors shrink-0" />
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate group-hover/profile:text-blue-600 dark:group-hover/profile:text-blue-400 transition-colors" title={currentUser.email}>
                      {currentUser.email}
                    </span>
                  </div>
                  <Sliders className="w-3 h-3 text-slate-350 dark:text-slate-600 group-hover/profile:text-blue-500 group-hover/profile:rotate-180 transition-all duration-300 shrink-0" />
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase text-[9px]">Role Rights:</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                    currentUser.role === 'admin' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                  }`}>
                    {currentUser.role === 'admin' ? 'Root Admin' : 'Mesh Operator'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setCurrentUser({ ...currentUser, role: currentUser.role === 'admin' ? 'user' : 'admin' })}
                  className="py-1.5 px-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-205 dark:hover:bg-slate-850 text-slate-705 dark:text-slate-300 text-[10px] font-bold rounded-lg cursor-pointer transition-colors text-center uppercase tracking-wider font-sans"
                >
                  {currentUser.role === 'admin' ? 'Demote' : 'Escalate'}
                </button>
                <button
                  onClick={() => logoutUser()}
                  className="py-1.5 px-2 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold rounded-lg cursor-pointer transition-colors text-center uppercase tracking-wider flex items-center justify-center gap-1 font-sans"
                >
                  <LogOut className="w-3 h-3" />
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`p-2.5 rounded-lg cursor-pointer transition-colors ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                title="View Operator Profile"
              >
                <User className="w-4 h-4" />
              </button>
              <button
                onClick={() => logoutUser()}
                className="p-2 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/45 rounded-lg text-rose-650 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN APPLICATION VIEWSTAGE */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto">
        
        {/* TOP STATUS CONTROL BAR */}
        <header className="bg-white border-b border-[#e2e8f0] px-4 sm:px-6 py-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 sticky top-0 z-40">
          <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto">
            <div className="flex items-center gap-3">
              {/* Hamburger on mobile fallback tabs */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2.5 bg-blue-50 border border-blue-100 hover:bg-blue-100/60 active:scale-95 text-blue-600 rounded-lg transition-all cursor-pointer relative"
                aria-label="Open system administration controller"
                id="mobile-drawer-toggle-btn"
              >
                <Menu className="w-5 h-5" />
                {activeAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                )}
              </button>
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
                  {activeTab === 'users' && 'Relational Users Database'}
                  {activeTab === 'admin' && 'Simulators & Credentials'}
                  {activeTab === 'profile' && 'Operator Session Profile'}
                </h1>
              </div>
            </div>
          </div>
          {/* Time & Quick Switch Link for smaller screens */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 sm:gap-4 text-xs font-bold w-full md:w-auto relative">
            {currentTime && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-slate-500 font-mono font-bold shrink-0">
                <Clock className="w-3.5 h-3.5" />
                <span>{currentTime} UTC</span>
              </div>
            )}

            <div className="flex items-center gap-2 sm:gap-3.5 shrink-0" id="header-actions-group">
              {/* Notification Centre Toggle Button & Popover */}
              <div className="sm:relative shrink-0" id="notification-centre-container">
              <button
                onClick={() => {
                  setIsNotificationCentreOpen(prev => !prev);
                  // Mark all notifications as read when opening
                  setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 cursor-pointer text-slate-600 dark:text-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs relative"
                title="Open notification centre feed"
                id="notification-bell-btn"
              >
                <Bell className="w-4 h-4" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationCentreOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setIsNotificationCentreOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 right-0 sm:left-auto sm:right-0 mx-auto sm:mx-0 mt-2 w-auto sm:w-96 max-w-sm sm:max-w-none bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl shadow-2xl py-2.5 z-50 overflow-hidden"
                      id="notification-centre-dropdown"
                    >
                      {/* Header block */}
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-2 w-2 relative shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                          </span>
                          <span className="text-xs font-black tracking-wider uppercase text-slate-900 dark:text-white font-mono">
                            Mesh Activity Feed
                          </span>
                        </div>
                        {notifications.length > 0 && (
                          <button
                            onClick={() => setNotifications([])}
                            className="text-[10px] text-rose-500 hover:text-rose-700 font-bold uppercase cursor-pointer flex items-center gap-1 hover:underline font-mono"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Clear All
                          </button>
                        )}
                      </div>

                      {/* Notifications List */}
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-55 dark:divide-slate-900/40">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                            <PlusCircle className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2 animate-pulse" />
                            <p className="text-xs font-bold font-sans">No live activity broadcasts found</p>
                            <p className="text-[10px] font-mono leading-relaxed mt-1">Ready to sync live IoT relays & approvals.</p>
                          </div>
                        ) : (
                          notifications.map((notif) => {
                            let iconColor = "text-blue-500 bg-blue-55 dark:bg-blue-950/45";
                            let NotifIcon = Activity;
                            
                            if (notif.category === 'APPROVAL') {
                              iconColor = "text-emerald-500 bg-emerald-55 dark:bg-emerald-950/45";
                              NotifIcon = CheckCircle;
                            } else if (notif.category === 'REJECTION') {
                              iconColor = "text-rose-500 bg-rose-55 dark:bg-rose-950/45";
                              NotifIcon = X;
                            } else if (notif.category === 'PROPOSAL') {
                              iconColor = "text-amber-500 bg-amber-55 dark:bg-amber-950/45";
                              NotifIcon = Clock;
                            } else if (notif.category === 'ENDPOINT') {
                              iconColor = "text-purple-500 bg-purple-50 dark:bg-purple-950/40";
                              NotifIcon = Cpu;
                            } else if (notif.category === 'WARNING' || notif.category === 'CRITICAL') {
                              iconColor = "text-rose-500 bg-rose-55 dark:bg-rose-950/45";
                              NotifIcon = AlertTriangle;
                            }

                            return (
                              <div 
                                key={notif.id} 
                                className={`px-4 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors flex items-start gap-3 text-xs ${!notif.read ? 'bg-blue-55/15' : ''}`}
                              >
                                <div className={`p-1.5 rounded-lg shrink-0 ${iconColor}`}>
                                  <NotifIcon className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex-1 space-y-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1.5">
                                    <span className="text-[9px] font-mono font-black tracking-wider uppercase text-slate-400 dark:text-slate-500">
                                      {notif.category}
                                    </span>
                                    <span className="text-[9px] font-mono text-slate-400">
                                      {notif.timestamp}
                                    </span>
                                  </div>
                                  <p className="font-semibold text-slate-705 dark:text-slate-350 leading-snug">
                                    {notif.text}
                                  </p>
                                  {notif.meta && (
                                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate" title={notif.meta}>
                                      ↳ {notif.meta}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Footer block */}
                      <div className="px-4 py-1.5 border-t border-slate-100 dark:border-slate-900 text-center">
                        <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">
                          Active loopback link port: 3000
                        </span>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Quick-action Header Theme SELECTOR */}
            <div className="relative shrink-0" id="theme-selector-container">
              <button
                onClick={() => setIsThemeMenuOpen(prev => !prev)}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 cursor-pointer text-slate-600 dark:text-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs relative"
                title="Select system dynamic dynamic aesthetic"
                id="theme-circle-btn"
              >
                {activeTheme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
                {activeTheme === 'lightdark' && <Moon className="w-4 h-4 text-slate-400" />}
                {activeTheme === 'dark' && <Moon className="w-4 h-4 text-indigo-400" />}
                {activeTheme === 'dracula' && <Flame className="w-4 h-4 text-pink-550 animate-pulse" />}
                {activeTheme === 'nordic' && <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />}
                {activeTheme === 'forest' && <Leaf className="w-4 h-4 text-emerald-500" />}
                {activeTheme === 'cyberpunk' && <Terminal className="w-4 h-4 text-amber-500" />}
              </button>

              <AnimatePresence>
                {isThemeMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setIsThemeMenuOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg py-1.5 z-50 overflow-hidden"
                      id="theme-dropdown-popover"
                    >
                      <div className="px-2.5 py-1 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black tracking-wider uppercase text-slate-400 font-mono">
                        System Theme Mode
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {THEMES.map((t) => {
                          const isSelected = activeTheme === t.id;
                          return (
                            <button
                              key={t.id}
                              onClick={() => {
                                setActiveTheme(t.id);
                                setIsThemeMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              <span className="shrink-0">
                                {t.id === 'light' && <Sun className="w-3.5 h-3.5 text-amber-500" />}
                                {t.id === 'lightdark' && <Moon className="w-3.5 h-3.5 text-slate-400" />}
                                {t.id === 'dark' && <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                                {t.id === 'dracula' && <Flame className="w-3.5 h-3.5 text-pink-500" />}
                                {t.id === 'nordic' && <Sparkles className="w-3.5 h-3.5 text-sky-400" />}
                                {t.id === 'forest' && <Leaf className="w-3.5 h-3.5 text-emerald-500" />}
                                {t.id === 'cyberpunk' && <Terminal className="w-3.5 h-3.5 text-amber-500" />}
                              </span>
                              <span className="truncate text-[11px] font-bold">{t.name}</span>
                              {isSelected && <span className="ml-auto w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add Device
              </button>
            </div>
          </div>
        </header>

        {/* WORKSPACE MAIN VIEWPORT */}
        <div className="flex-1 p-4 sm:p-6 space-y-5 max-w-[1600px] w-full mx-auto">
          
          {proposalStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-400 rounded-xl flex items-start gap-3 text-xs shadow-xs"
            >
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-500 mt-0.5 animate-bounce" />
              <div>
                <span className="font-bold uppercase tracking-wider block mb-0.5">TRANSMISSION PROPOSAL COMMITTED</span>
                <p className="leading-relaxed font-sans">{proposalStatus.message}</p>
              </div>
            </motion.div>
          )}

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

                <WifiDiscoveryPanel />

                {/* Primary Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                  
                  {/* Left Column (LIVE DATA STREAM & Sparklines) */}
                  <div className="xl:col-span-2 space-y-5">
                    
                    {/* TELEMETRY RANGE QUERY FILTER CARD */}
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-xs animate-fade-in">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                        <div>
                          <span className="text-xs font-bold text-slate-800 font-sans tracking-wide uppercase block">
                            Telemetry Range Query Filters
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans mt-0.5 block">
                            Adjust date, day, month and hour slices to query specific micro stream buffers and demand charts.
                          </span>
                        </div>
                        <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold flex items-center gap-1 shrink-0">
                          <Activity className="w-3 h-3 text-blue-500 animate-pulse" /> Range Filters Selected
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Month Selector */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 font-sans">
                            Select Month Range
                          </label>
                          <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium font-sans cursor-pointer"
                          >
                            {MONTHS.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Day Selector */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 font-sans">
                            Select Day
                          </label>
                          <select
                            value={selectedDay}
                            onChange={(e) => setSelectedDay(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-semibold font-mono cursor-pointer"
                          >
                            {DAYS.map((d) => (
                              <option key={d} value={d}>
                                Day {d}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Hour Range Selector */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 font-sans">
                            Time Segment / Slot
                          </label>
                          <select
                            value={selectedTimeRange}
                            onChange={(e) => setSelectedTimeRange(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-semibold font-sans cursor-pointer"
                          >
                            {TIME_RANGES.map((tr) => (
                              <option key={tr.value} value={tr.value}>
                                {tr.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Shortcut presets buttons class with active press effects */}
                      <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                        <span className="text-[10px] font-bold font-sans text-slate-400 uppercase">
                          Interval Presets:
                        </span>
                        <div className="flex flex-wrap gap-1.5" id="interval-presets-container">
                          {TIME_RANGES.map((tr) => {
                            const isActive = selectedTimeRange === tr.value;
                            return (
                              <motion.button
                                key={tr.value}
                                onClick={() => setSelectedTimeRange(tr.value)}
                                whileHover={{ scale: 1.04, y: -0.5, zIndex: 20 }}
                                whileTap={{ scale: 0.95 }}
                                className={`relative isolate text-[11px] px-3.5 py-2 rounded-lg font-bold font-sans border cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                                  isActive
                                    ? 'text-white border-transparent font-black bg-transparent shadow-md'
                                    : 'bg-white text-slate-700 border-slate-200 hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-300'
                                }`}
                              >
                                {isActive && (
                                  <motion.div
                                    layoutId="presetActiveBg"
                                    className="absolute -inset-[1px] bg-blue-600 border border-blue-500 rounded-lg -z-10"
                                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                  />
                                )}
                                <span className="relative z-10 block whitespace-nowrap">
                                  {tr.value === 'Full Day' ? 'Full Day (24hr)' : tr.value}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* MICRO STREAM CHARTS row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      
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
                              <span className="text-slate-800 font-bold">{sensorValues.motion.toFixed(1)}events/s</span>
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
                            <div className="flex justify-between text-[11px] font-sans font-bold text-slate-500 leading-none">
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
                        <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Grid Sync</span>
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
                                <div className="p-1.5 bg-slate-100 border border-slate-200 rounded-md text-slate-600">
                                  <Cpu className="w-4 h-4 text-slate-500" />
                                </div>
                                <div className="min-w-0">
                                  <span className="font-sans font-bold text-slate-800 text-[12px] block truncate">{dev.name}</span>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-[10px] font-mono text-slate-400 block leading-none">GFX-00{dev.id.substring(4)}</span>
                                    {dev.wifi_ip && (
                                      <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded px-1 leading-none py-0.5">
                                        {dev.wifi_ip}
                                      </span>
                                    )}
                                  </div>
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
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
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
                                    ? 'bg-slate-900 border-slate-900 text-white hover:bg-slate-850'
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
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg text-xs font-sans font-medium transition-colors cursor-pointer"
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
                      <p className="text-[11px] text-slate-600 font-sans">Toggle manual relays, custom parameters, and dimmer settings live.</p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <div className="relative flex-1 md:w-64">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search node identifier, room, mac..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full text-xs font-sans pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg focus:outline-none placeholder-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Room select menu scrolling block with sliding layoutId */}
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none" id="room-selection-scroll">
                    {ROOMS.map((room) => {
                      const isActive = selectedRoom === room;
                      const roomDeviceCount = devices.filter((d) => d.room === room).length;
                      const roomActiveCount = devices.filter((d) => d.room === room && d.isOn).length;

                      return (
                        <motion.button
                          key={room}
                          onClick={() => setSelectedRoom(room)}
                          whileHover={{ scale: 1.03, y: -1, zIndex: 20 }}
                          whileTap={{ scale: 0.94 }}
                          transition={{ type: "tween", duration: 0.25 }}
                          className={`relative isolate px-3.5 py-1.5 text-[11px] uppercase tracking-wider font-extrabold rounded-lg cursor-pointer shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 border ${
                            isActive
                              ? 'text-white border-transparent font-extrabold bg-transparent z-10'
                              : 'bg-white text-slate-705 border-slate-200 hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-300 z-0'
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="roomActiveBg"
                              className="absolute -inset-[1px] bg-slate-900 border border-slate-900 rounded-lg -z-10"
                              transition={{ type: "tween", duration: 0.25 }}
                            />
                          )}

                          <span className="relative z-10 flex items-center gap-1.5 font-sans">
                            {room}
                            {room !== 'All Rooms' && roomDeviceCount > 0 && (
                              <span className={`text-[9px] px-1 rounded-full relative z-15 transition-colors ${
                                isActive ? 'bg-white/20 text-white font-mono' : 'bg-slate-100 text-slate-600 font-mono'
                              }`}>
                                {roomActiveCount}/{roomDeviceCount}
                              </span>
                            )}
                          </span>
                        </motion.button>
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
                    <div className="col-span-full py-16 text-center bg-white border border-[#e2e8f0] text-slate-400 italic text-xs font-sans rounded-xl shadow-xs">
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
                {/* Warning lists block */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-xs">
                  <span className="text-xs font-bold text-slate-800 font-sans uppercase block tracking-wide border-b border-slate-100 pb-3">Active Warning Signals Buffer</span>
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

            {activeTab === 'users' && (
              <motion.div
                key="users-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-6 text-slate-800 dark:text-slate-100 font-sans"
              >
                {/* ADMIN PRIVILEGES VIEW */}
                {currentUser?.role === 'admin' ? (
                  <>
                    {/* Top: Administrative security approvals section */}
                    <div className="bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                            Pending Security Approvals Queue
                          </h3>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                            Relational operations proposed by standard operators. Approve or reject to apply instantly.
                          </p>
                        </div>
                        <span className="text-[10px] font-mono bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 px-2.5 py-0.5 rounded font-bold uppercase">
                          {requests.filter(r => r.status === 'pending').length} pending overrides
                        </span>
                      </div>

                      {requests.filter(r => r.status === 'pending').length === 0 ? (
                        <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center text-xs text-slate-400 focus-within:ring-1">
                          No pending change proposals in the telemetry queue. Grid is currently in sync.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {requests.filter(r => r.status === 'pending').map((reqItem) => {
                            let details = {};
                            try {
                              details = JSON.parse(reqItem.details);
                            } catch (_) {}
                            return (
                              <div key={reqItem.id} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col justify-between gap-3 text-xs">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[9px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase">
                                      {reqItem.action_type.replaceAll('_', ' ')}
                                    </span>
                                    <span className="text-slate-400 text-[10px] font-mono">Request #{reqItem.id}</span>
                                  </div>
                                  <div className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                                    Proposed by: <span className="font-bold text-slate-900 dark:text-white">{reqItem.user_email}</span>
                                  </div>
                                  <div className="text-slate-500 text-[10px] space-y-0.5 pt-1">
                                    {reqItem.action_type === 'toggle_device' && (
                                      <div>Toggle dev-id: <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">{reqItem.target_id}</span> to <span className="font-extrabold uppercase text-blue-600 dark:text-blue-400">{details.isOn ? 'ON (CLOSED)' : 'OFF (OPEN)'}</span></div>
                                    )}
                                    {reqItem.action_type === 'add_device' && (
                                      <div>Add device: <span className="font-bold text-slate-705 dark:text-slate-200 font-sans">{details.name}</span> ({details.type}) in {details.room}</div>
                                    )}
                                    {reqItem.action_type === 'delete_device' && (
                                      <div>Decommission device ID: <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">{reqItem.target_id}</span></div>
                                    )}
                                    <div className="italic text-[9px] text-slate-400 font-mono">Timestamp: {reqItem.timestamp}</div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-900 justify-end">
                                  <button
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`/api/requests/${reqItem.id}/approve`, {
                                          method: 'POST',
                                          headers: { 'x-user-email': currentUser.email }
                                        });
                                        const data = await res.json();
                                        if (!res.ok) throw new Error(data.error);
                                        
                                        pushLog(
                                          'Approvals Core',
                                          `APPROVED: Proposed action #${reqItem.id} applied to live SQL structures`,
                                          'success'
                                        );
                                        triggerNotification(
                                          'APPROVAL',
                                          `Approved Proposed Action #${reqItem.id}`,
                                          'success',
                                          `Verified type: ${reqItem.action_type.replaceAll('_', ' ')}`
                                        );
                                        fetchRequests();
                                        fetchDevices();
                                      } catch (e) {
                                        alert(e.message);
                                      }
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase rounded transition-colors cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(`/api/requests/${reqItem.id}/reject`, {
                                          method: 'POST',
                                          headers: { 'x-user-email': currentUser.email }
                                        });
                                        const data = await res.json();
                                        if (!res.ok) throw new Error(data.error);

                                        pushLog(
                                          'Approvals Core',
                                          `REJECTED: Proposed action #${reqItem.id} declined by root administrator`,
                                          'warning'
                                        );
                                        triggerNotification(
                                          'REJECTION',
                                          `Declined Request #${reqItem.id}`,
                                          'warning',
                                          `Rejected action proposal: ${reqItem.action_type.replaceAll('_', ' ')}`
                                        );
                                        fetchRequests();
                                      } catch (e) {
                                        alert(e.message);
                                      }
                                    }}
                                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase rounded transition-colors cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                      {/* Left section: SQL Register simplified form */}
                      <div className="bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 h-fit">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                            Add Operator Account
                          </h3>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                            Saves credentials directly into the SQL relational table. Newly created profiles default to Standard Operators.
                          </p>
                        </div>

                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.target;
                            const uEmail = form.email.value;
                            const uPass = form.password.value;

                            if (!uEmail || !uPass) {
                              alert('Please fill in both Operator ID and password access code.');
                              return;
                            }

                            try {
                              const res = await fetch('/api/users/add', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: uEmail, password: uPass }),
                              });
                              const data = await res.json();
                              if (!res.ok) {
                                throw new Error(data.error || 'Failed adding user');
                              }
                              
                              pushLog(
                                'SQL Database',
                                `Executed SQL table insertion: INSERT INTO users (email, password, role) VALUES ('${uEmail}', '***', 'user')`,
                                'success'
                              );
                              
                              form.reset();
                              fetchDbUsers();
                            } catch (err) {
                              alert(err.message);
                            }
                          }}
                          className="space-y-3 text-xs"
                        >
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">
                              Operator ID / username
                            </label>
                            <input
                              name="email"
                              type="text"
                              required
                              placeholder="e.g. vaishakh884"
                              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">
                              Password Access Code
                            </label>
                            <input
                              name="password"
                              type="text"
                              required
                              placeholder="Password access code"
                              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full mt-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg uppercase tracking-wider text-[10px] transition-colors cursor-pointer"
                          >
                            Provision Operator Account
                          </button>
                        </form>
                      </div>

                      {/* Right section: Relational Table */}
                      <div className="bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 rounded-xl p-5 shadow-sm xl:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                              Wired Users & Credentials Registry
                            </h3>
                            <p className="text-[10px] text-slate-400 dark:text-slate-550 leading-normal">
                              Active Database Query: `SELECT id, email, role FROM users ORDER BY id DESC;`
                            </p>
                          </div>
                          <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900 px-2.5 py-0.5 rounded font-bold">
                            sqlite3 active engine
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs mt-2 font-sans text-slate-800 dark:text-slate-200">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px] font-mono">
                                <th className="py-2 px-2">ID</th>
                                <th className="py-2 px-2">OPERATOR ID</th>
                                <th className="py-2 px-2">ROLE LEVEL</th>
                                <th className="py-2 px-2 text-right">MAPPED STATEMENTS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dbUsers.map((u) => (
                                <tr key={u.id} className="border-b border-slate-100/40 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors">
                                  <td className="py-2.5 px-2 text-slate-400 font-mono font-bold">#{u.id}</td>
                                  <td className="py-2.5 px-2 text-slate-900 dark:text-slate-100 font-bold font-sans">{u.email}</td>
                                  <td className="py-2.5 px-2">
                                    <span className={`text-[9.5px] px-2 py-0.5 rounded font-extrabold uppercase ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-805 dark:bg-indigo-950/50 dark:text-indigo-400' : 'bg-emerald-105 text-emerald-805 dark:bg-emerald-950/50 dark:text-emerald-400'}`}>
                                      {u.role === 'admin' ? 'Root Admin' : 'Mesh Operator'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-2 text-right">
                                    {currentUser.email.toLowerCase() === u.email.toLowerCase() ? (
                                      <span className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium">Active logged session</span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          if (!checkAdminPrivilege('Decommission user credentials')) return;
                                          try {
                                            const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
                                            const data = await res.json();
                                            if (!res.ok) {
                                              throw new Error(data.error || 'Failed deleting user profile.');
                                            }
                                            
                                            pushLog(
                                              'SQL Database',
                                              `Executed SQL statement: DELETE FROM users WHERE id = ${u.id};`,
                                              'warning'
                                            );
                                            
                                            fetchDbUsers();
                                          } catch (err) {
                                            alert(err.message);
                                          }
                                        }}
                                        className="text-[10px] bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-450 hover:bg-rose-100 dark:hover:bg-rose-900 font-sans font-bold px-2 py-0.5 rounded transition-colors cursor-pointer"
                                      >
                                        Decommission
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* OPERATOR (STANDARD USER) VIEW */
                  <div className="space-y-6 max-w-4xl mx-auto">
                    {/* Standard User's own action proposal queue list */}
                    <div className="bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                          Your Active Operational Proposals
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                          Live query tracking your submitted action proposals from SQL registry:
                        </p>
                      </div>

                      {requests.filter(r => r.user_email.toLowerCase() === currentUser.email.toLowerCase()).length === 0 ? (
                        <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-center text-xs text-slate-400">
                          You have not submitted any operational proposals yet. Use any toggle on the Dashboard to start.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans text-slate-800 dark:text-slate-250">
                          {requests.filter(r => r.user_email.toLowerCase() === currentUser.email.toLowerCase()).map((reqItem) => {
                            let details = {};
                            try {
                              details = JSON.parse(reqItem.details);
                            } catch (_) {}
                            return (
                              <div key={reqItem.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-705 dark:text-slate-300 px-1.5 py-0.5 rounded font-bold uppercase">
                                      {reqItem.action_type.replaceAll('_', ' ')}
                                    </span>
                                    <span className="text-slate-400 text-[10px] font-mono">Proposal #{reqItem.id}</span>
                                  </div>
                                  <div className="text-slate-500 text-[10px] space-y-0.5 pt-0.5">
                                    {reqItem.action_type === 'toggle_device' && (
                                      <div>Toggle node <span className="font-bold text-slate-700 dark:text-slate-200">{reqItem.target_id}</span> status to {details.isOn ? 'ON (CLOSED)' : 'OFF (OPEN)'}</div>
                                    )}
                                    {reqItem.action_type === 'add_device' && (
                                      <div>Register new hardware endpoint: <span className="font-bold text-slate-700 dark:text-slate-205">{details.name}</span> ({details.type}) in room {details.room}</div>
                                    )}
                                    {reqItem.action_type === 'delete_device' && (
                                      <div>Decommission hardware node: ID <span className="font-bold text-rose-650">{reqItem.target_id}</span></div>
                                    )}
                                    <div className="italic text-[9px] text-slate-400 font-mono">Submitted: {reqItem.timestamp}</div>
                                  </div>
                                </div>

                                <div className="shrink-0 flex items-center">
                                  <span className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded ${
                                    reqItem.status === 'pending' ? 'bg-amber-55 text-amber-805 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400' :
                                    reqItem.status === 'approved' ? 'bg-emerald-55 text-emerald-805 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                    'bg-rose-55 text-rose-805 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                                  }`}>
                                    {reqItem.status}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                        const nextUser = { email: 'admin@robros.io', role: 'admin' };
                        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextUser));
                        localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
                        setCurrentUser(nextUser);
                        pushLog('Credentials manager', 'Session elevated to Root Administrator credentials', 'success');
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-[#4f46e5] hover:from-blue-700 hover:to-[#4338ca] text-white rounded-lg shadow-xs cursor-pointer text-[11px]"
                    >
                      Elevate Session to Root Admin
                    </button>
                    <button
                      onClick={() => {
                        const nextUser = { email: 'vaishakh884@gmail.com', role: 'user' };
                        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextUser));
                        localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
                        setCurrentUser(nextUser);
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

            {activeTab === 'profile' && (
              <motion.div
                key="profile-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="max-w-4xl mx-auto space-y-6"
              >
                {/* Profile Card Header Banner */}
                <div className="relative bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-850 rounded-2xl p-6 md:p-8 text-white shadow-xl overflow-hidden border border-blue-600">
                  {/* Subtle decorative mesh network lines background */}
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                  <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-3xl font-black shadow-inner select-none animate-pulse">
                        {currentUser?.email ? currentUser.email[0].toUpperCase() : 'O'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl md:text-2xl font-black tracking-tight font-sans text-white">
                            {currentUser?.email?.split('@')[0]}
                          </h2>
                          <span className={`text-[10px] uppercase font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                            currentUser?.role === 'admin' ? 'bg-amber-400 text-amber-950 shadow-sm' : 'bg-blue-300 text-blue-950'
                          }`}>
                            {currentUser?.role === 'admin' ? 'Root Admin' : 'Mesh Operator'}
                          </span>
                        </div>
                        <p className="text-slate-200 text-xs mt-1.5 font-mono opacity-90">{currentUser?.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] font-mono bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-white/90 flex items-center gap-1.5">
                        <span className="h-2 w-2 bg-green-400 rounded-full animate-ping" />
                        Node Auth: <strong className="text-white font-mono font-bold">Active Relay</strong>
                      </span>
                      <span className="text-[9px] text-slate-350 font-mono mt-1">ID: ROB-NET-9483A</span>
                    </div>
                  </div>
                </div>

                {/* Info sections */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  
                  {/* Left Column: Account Details */}
                  <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-sans">Profile Integrity Ledger</h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">Authenticated credentials & console interface.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3.5 bg-slate-50 dark:bg-[#0b0c16] border border-slate-100 dark:border-slate-805 rounded-lg space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 font-mono block uppercase">Email Address</span>
                        <span className="text-xs font-semibold text-slate-850 dark:text-slate-200 font-mono truncate block" title={currentUser?.email}>
                          {currentUser?.email}
                        </span>
                      </div>

                      <div className="p-3.5 bg-slate-50 dark:bg-[#0b0c16] border border-slate-100 dark:border-slate-805 rounded-lg space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 font-mono block uppercase">Client Session Role</span>
                        <span className="text-xs font-bold text-slate-850 dark:text-slate-200 font-sans">
                          {currentUser?.role === 'admin' ? 'Root Administrator' : 'Standard Mesh Operator'}
                        </span>
                      </div>

                      <div className="p-3.5 bg-slate-50 dark:bg-[#0b0c16] border border-slate-100 dark:border-slate-805 rounded-lg space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 font-mono block uppercase">Node License Tier</span>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-sans">
                          Robros Enterprise Client v4.8
                        </span>
                      </div>

                      <div className="p-3.5 bg-slate-50 dark:bg-[#0b0c16] border border-slate-100 dark:border-slate-805 rounded-lg space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 font-mono block uppercase">Gateway Location IP</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-350 font-mono">
                          192.168.10.125 (Relay Loopback)
                        </span>
                      </div>
                    </div>

                    {/* INTERACTIVE MOCK TERMINAL FOR DIRECT CONSOLE CONTROLS */}
                    <div className="pt-5 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 font-sans flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
                            Direct Subnetwork Operator Console
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">
                            Submit raw terminal commands directly to the loopback controller interface.
                          </p>
                        </div>
                        <span className="text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-850 text-slate-505 dark:text-slate-450 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-800 shrink-0">
                          TTYSO ACTIVE
                        </span>
                      </div>

                      {/* Terminal Viewbox */}
                      <div className="bg-slate-950 dark:bg-black border border-slate-850 dark:border-slate-800 rounded-xl p-4 font-mono text-xs text-blue-450 dark:text-blue-300 h-44 overflow-y-auto space-y-2 relative select-text" id="terminal-viewbox">
                        <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[8px] bg-slate-900/40 border border-slate-800/40 px-2 py-0.5 rounded text-slate-500 font-sans uppercase">
                          <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-ping" />
                          Live Socket
                        </div>
                        
                        <div className="space-y-1.5">
                          {terminalLogs.map((log, idx) => (
                            <div key={idx} className={
                              log.type === 'error' ? 'text-rose-500 font-bold' :
                              log.type === 'user' ? 'text-white font-bold' :
                              log.type === 'response' ? 'text-slate-300 dark:text-slate-400 pl-4' :
                              'text-blue-400 dark:text-blue-450 opacity-90'
                            }>
                              {log.text}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Terminal Input Box */}
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const cmd = terminalInput.trim().toLowerCase();
                        if (!cmd) return;

                        const newLogs = [...terminalLogs, { type: 'user', text: `operator@mesh:~$ ${terminalInput}` }];

                        if (cmd === '/help') {
                          newLogs.push(
                            { type: 'response', text: 'Available loopback terminal utilities:' },
                            { type: 'response', text: '  /info       - Read full subgrid node specifications' },
                            { type: 'response', text: '  /ping       - Fetch subnetwork transmission signal latency' },
                            { type: 'response', text: '  /devices    - Count registered subgrid nodes and relays' },
                            { type: 'response', text: '  /reboot     - Fire warm gateway soft reboot command' },
                            { type: 'response', text: '  /clear      - Flush local console buffer logs' }
                          );
                        } else if (cmd === '/info') {
                          newLogs.push(
                            { type: 'response', text: `Node Authority Token: ROB-AUTH-${Math.random().toString(36).substr(2, 6).toUpperCase()}` },
                            { type: 'response', text: `Active Client Account: ${currentUser?.email}` },
                            { type: 'response', text: `Clearance: ${currentUser?.role === 'admin' ? 'Root Admin Override Authority' : 'Standard Operator Access'}` },
                            { type: 'response', text: 'Enclosure Environment: production-cloud-run' },
                            { type: 'response', text: 'Node Engine Version: v4.8.1-sqlite-express' }
                          );
                        } else if (cmd === '/ping') {
                          const lat = Math.floor(Math.random() * 45) + 5;
                          newLogs.push(
                            { type: 'response', text: `PING 192.168.10.125 (192.168.10.125): 56 data bytes` },
                            { type: 'response', text: `64 bytes from 10.125: icmp_seq=0 ttl=64 time=${lat} ms` },
                            { type: 'response', text: `--- 192.168.10.125 ping statistics ---` },
                            { type: 'response', text: '1 packets transmitted, 1 received, 0.0% packet losses' },
                            { type: 'response', text: `RTT average = ${lat}ms (Connection Perfect)` }
                          );
                        } else if (cmd === '/devices') {
                          newLogs.push(
                            { type: 'response', text: `Grid Register Stats:` },
                            { type: 'response', text: `  Total connected transmitters: ${devices.length}` },
                            { type: 'response', text: `  Online active relays: ${devices.filter(d => d.isOn).length}` },
                            { type: 'response', text: `  Passive node listeners: ${devices.filter(d => !d.isOn).length}` },
                            { type: 'response', text: `  Active Critical Alarms: ${criticalAlertsCount}` }
                          );
                        } else if (cmd === '/reboot') {
                          newLogs.push(
                            { type: 'response', text: 'Initiating soft warm gateway reboot cycle...' },
                            { type: 'response', text: 'Flushing transient cache databases... [DONE]' },
                            { type: 'response', text: 'Soft restarting node transmission array... [DONE]' },
                            { type: 'response', text: 'Robros IoT Subsystem fully operational.' }
                          );
                          pushLog('Secure Console', 'Successfully triggered warm reboot via terminal override API', 'success');
                        } else if (cmd === '/clear') {
                          setTerminalLogs([]);
                          setTerminalInput('');
                          return;
                        } else {
                          newLogs.push({ type: 'error', text: `bash: command not found: "${cmd}". Type /help for assistance.` });
                        }

                        setTerminalLogs(newLogs);
                        setTerminalInput('');
                      }} className="flex gap-2">
                        <input
                          type="text"
                          value={terminalInput}
                          onChange={(e) => setTerminalInput(e.target.value)}
                          placeholder="Type console command (e.g., /help, /ping, /devices, /info)..."
                          className="flex-1 bg-slate-950 dark:bg-black border border-slate-850 dark:border-slate-800 text-slate-100 rounded-lg px-3.5 py-2 font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-slate-600 dark:placeholder-slate-700"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-850 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-800 text-slate-355 hover:text-white rounded-lg font-mono text-xs cursor-pointer transition-colors"
                        >
                          Execute
                        </button>
                      </form>
                    </div>

                    {/* Interactive state change controls */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans">Quick Access Status Modifier</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                        Conveniently toggle your clearance level from user profile controls. This updates privileges in real-time.
                      </p>
                      
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          onClick={() => {
                            setCurrentUser(prev => ({ ...prev, role: prev.role === 'admin' ? 'user' : 'admin' }));
                            pushLog('Security Module', `Operator credentials updated to ${currentUser?.role === 'admin' ? 'Standard Operator' : 'Root Administrator'}`, 'info');
                          }}
                          className={`px-3.5 py-2 rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                            currentUser?.role === 'admin'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/50 dark:border-amber-900/60 dark:text-amber-305 hover:bg-amber-200/50'
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-950/50 dark:border-indigo-900/60 dark:text-indigo-305 hover:bg-indigo-200/50'
                          }`}
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          Toggle Credentials to {currentUser?.role === 'admin' ? 'Standard Operator' : 'Root Admin'}
                        </button>

                        <button
                          onClick={() => logoutUser()}
                          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-105 border border-rose-100 dark:bg-rose-955/30 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/50 text-rose-750 rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1.5 font-sans"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Abandon Mesh Session (Sign Out)
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Statistics Card / System Node Metrics (very technical style) */}
                  <div className="bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-sans">Node Connectivity</h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">Active socket connection signatures.</p>
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {[
                          { label: 'Relational Database', val: 'SQLite Active', st: 'normal' },
                          { label: 'Active Devices Tracked', val: `${devices.length} Nodes`, st: 'normal' },
                          { label: 'Unresolved Alerts', val: `${criticalAlertsCount} Critical`, st: criticalAlertsCount > 0 ? 'alert' : 'normal' },
                          { label: 'Signal Encryption', val: 'TLSv1.3 AES-256', st: 'normal' },
                          { label: 'Local Server Bind', val: '0.0.0.0:3000', st: 'normal' }
                        ].map((stat, idx) => (
                          <div key={idx} className="py-2.5 flex items-center justify-between text-xs font-sans">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">{stat.label}</span>
                            <span className={`font-mono text-[11px] font-bold ${
                              stat.st === 'alert' ? 'text-rose-600 dark:text-rose-455' : 'text-slate-800 dark:text-slate-200'
                            }`}>{stat.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg text-[11px] text-blue-800/90 leading-normal flex items-start gap-2 font-sans dark:bg-blue-95/20 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-300">
                      <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0 animate-pulse" />
                      <div>
                        <strong>Connection Secure:</strong> Operating as authenticated loopback terminal client on Robros mesh subnetwork node.
                      </div>
                    </div>

                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* FOOTER */}
        <footer className="border-t border-slate-200/80 bg-white py-5 text-center text-xs text-slate-450 mt-12 w-full">
          <p>© 2026 Robros Mesh Solutions Co. Real-Time IoT infrastructure monitoring. Persistent client states.</p>
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
                    setCurrentUser({ email: 'admin@robros.io', role: 'admin' });
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
