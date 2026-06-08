import React, { useState, useEffect } from 'react';
import { ROOMS, IoTDevice, AutomationRule, ActivityLog, EnergyDataPoint } from './types';
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
import {
  LayoutDashboard,
  Search,
  Plus,
  Moon,
  Sun,
  Shield,
  Zap,
  Power,
  PowerOff,
  Sparkles,
  User,
  Clock,
  AlertTriangle,
  X,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Application Dynamic State
  const [devices, setDevices] = useState<IoTDevice[]>(initialDevices);
  const [automations, setAutomations] = useState<AutomationRule[]>(initialAutomations);
  const [logs, setLogs] = useState<ActivityLog[]>(initialLogs);
  const [energyHistory, setEnergyHistory] = useState<EnergyDataPoint[]>(energyMockHistory);

  // Filters and dialog UI states
  const [selectedRoom, setSelectedRoom] = useState<string>('All Rooms');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [systemAlert, setSystemAlert] = useState<string | null>(null);

  // Live Timer State
  const [currentTime, setCurrentTime] = useState<string>('');

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

  // Helper: Append simulation log
  const pushLog = (deviceName: string, msg: string, type: ActivityLog['type'] = 'info', room?: string) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp,
      deviceName,
      type,
      message: msg,
      room,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // Device CRUD Operations
  const handleToggleDevice = (id: string) => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const nextState = !d.isOn;
          // Approximate realistic load rate based on type
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

  const handleChangeDeviceValue = (id: string, val: number) => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          // Adjust power draw according to brightness or volume
          let load = d.energyUsage;
          if (d.type === 'light') {
            load = Math.round(val * 0.4);
          } else if (d.type === 'speaker') {
            load = Math.round(val * 0.25) + 5;
          } else if (d.type === 'thermostat') {
            // Hotter or colder target might trigger compressor draw
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

  const handleDeleteDevice = (id: string) => {
    const target = devices.find((d) => d.id === id);
    if (!target) return;
    setDevices((prev) => prev.filter((d) => d.id !== id));
    pushLog(target.name, `Device decommissioned and deleted from room registers`, 'warning', target.room);
  };

  const handleAddDevice = (newDevice: Omit<IoTDevice, 'id' | 'lastSeen'>) => {
    const fullDevice: IoTDevice = {
      ...newDevice,
      id: `dev-${Date.now()}`,
      lastSeen: 'Just registered',
    };
    setDevices((prev) => [...prev, fullDevice]);
    pushLog(fullDevice.name, `New ${fullDevice.type} registered successfully with full diagnostic compliance`, 'success', fullDevice.room);
  };

  // Rule Managers
  const handleToggleRule = (id: string) => {
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

  const handleAddRule = (newRule: Omit<AutomationRule, 'id'>) => {
    const fullRule: AutomationRule = {
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

  const handleDeleteRule = (id: string) => {
    const rule = automations.find((r) => r.id === id);
    if (!rule) return;
    setAutomations((prev) => prev.filter((r) => r.id !== id));
    pushLog('Automation Engine', `Withdrew scheduled rule macro [${rule.name}]`, 'warning');
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  // Multi-Device Macro Commands ("All Lights OFF", "Away Secure")
  const triggerAllLightsOff = () => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.type === 'light' && d.isOn) {
          return { ...d, isOn: false, energyUsage: 0 };
        }
        return d;
      })
    );
    pushLog('System Hub', 'Global Command dispatched: ALL LIGHTS POWER OFF', 'control');
  };

  const triggerAwaySecure = () => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.type === 'light') {
          return { ...d, isOn: false, energyUsage: 0 };
        }
        if (d.type === 'lock') {
          return { ...d, isOn: true, energyUsage: 1 }; // Locked
        }
        if (d.type === 'speaker') {
          return { ...d, isOn: false, energyUsage: 0 };
        }
        if (d.type === 'thermostat') {
          return { ...d, value: 76, energyUsage: 45 }; // High eco idle
        }
        return d;
      })
    );
    setSystemAlert('Away & Secured mode engaged. All doors deadbolted.');
    pushLog('System Hub', 'Dispatched Secure Away status. Lock mechanisms locked. Lights, ventilation down, security feeds armed.', 'success');
  };

  const triggerCozyChillNight = () => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.type === 'light' && d.room === 'Living Room') {
          return { ...d, isOn: true, value: 30, energyUsage: 12 }; // Low amber lighting
        }
        if (d.type === 'speaker' && d.room === 'Living Room') {
          return { ...d, isOn: true, value: 40, energyUsage: 12 }; // Low stereo
        }
        return d;
      })
    );
    pushLog('System Hub', 'Dispatched Cozy Chill Macro. Living room lights dimmed to 30%, music stream requested.', 'success', 'Living Room');
  };

  // Live Scenario Simulators
  const handleSimulateDrivewayIntrusion = () => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === 'dev-5') {
          return { ...d, isOn: true, value: 100, energyUsage: 80 }; // floodlight max
        }
        if (d.id === 'dev-6') {
          return { ...d, alert: 'Movement in driveway!', value: 60 }; // Camera high frequency
        }
        return d;
      })
    );
    setSystemAlert('Driveway Smart-Sensor Triggered: Human movement detected!');
    pushLog(
      'Driveway Sensor Core',
      'ALERT: Unscheduled motion captured near garage gateway. Driveway floodlights fired at 100% load.',
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
          return { ...d, isOn: true }; // locked
        }
        if (d.type === 'thermostat') {
          return { ...d, value: 68, energyUsage: 25 }; // temperature drop climate saver
        }
        return d;
      })
    );
    setSystemAlert('Lockdown Routine complete. Ambient temperatures dialed down.');
    pushLog(
      'Efficiency Service',
      'Dispatched Eco Night Secured program. All doors verified locked, thermal load reduced.',
      'success'
    );
  };

  const handleSimulateHeatwave = () => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.type === 'thermostat') {
          return { ...d, value: 70, energyUsage: 450, alert: 'High compressor drawing!' }; // High compressor W drawing
        }
        return d;
      })
    );
    // Append energy data timeline bump
    setEnergyHistory((prev) =>
      prev.map((p) => {
        if (p.time === '12 PM' || p.time === '02 PM' || p.time === '04 PM') {
          return { ...p, heating: p.heating + 150, total: p.total + 150 };
        }
        return p;
      })
    );
    setSystemAlert('Grid warning: HVAC drawing peak power rate due to high outdoors heat index.');
    pushLog(
      'Nest Climate HVAC',
      'COMPRESSOR WARNING: Outdoor atmospheric temperature crossed 98°F. Thermostat coolant load spiked to 450W.',
      'warning',
      'Living Room'
    );
  };

  const handleSimulateWaterSpill = () => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === 'dev-9') {
          // sprinkler off
          return { ...d, isOn: false, energyUsage: 0, alert: 'Supply system disabled' };
        }
        return d;
      })
    );
    setSystemAlert('Safety Intercept: Kitchen Under-Sink Leak Sensor triggered humidity spike!');
    pushLog(
      'Kitchen Flood Valve',
      'MALFUNCTION TRIGGER: Moisture threshold exceeded in Kitchen cabinet base. Yard watering loops secured for system pressure safety.',
      'warning',
      'Kitchen'
    );
  };

  const handleSimulateActiveCleaning = () => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === 'dev-8') {
          return { ...d, isOn: true, value: 92, energyUsage: 45 }; // vacuum operating
        }
        return d;
      })
    );
    pushLog(
      'RoboVac Clean sweep',
      'LAUNCH: Deploy command received. RoboVac departed docking hub to sweep primary Living Room zone.',
      'info',
      'Living Room'
    );
  };

  // Filter device listing based on Room and Search Filter
  const filteredDevices = devices.filter((d) => {
    const matchesRoom = selectedRoom === 'All Rooms' || d.room === selectedRoom;
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRoom && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#e1e1e6] selection:bg-zinc-800">
      {/* Dynamic Alerts HUD */}
      <AnimatePresence>
        {systemAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-amber-600 text-white px-4 py-3.5 flex items-center justify-between shadow-lg relative z-50 font-sans"
            id="system-hud-alert-banner"
          >
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4 text-xs font-medium">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-white shrink-0 animate-bounce" />
                <span>{systemAlert}</span>
              </span>
              <button
                onClick={() => setSystemAlert(null)}
                className="p-1 text-white/80 hover:text-white rounded-lg transition-colors hover:bg-white/10 cursor-pointer"
                title="Dismiss warning"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Modern Header Section */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between bg-[#151518] border border-[#222227] rounded-2xl p-6 shadow-md gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#0c0c0e] border border-[#222227] text-white rounded-2xl">
              <Compass className="w-8 h-8 animate-spin-slow text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-sans font-bold text-2xl tracking-tight text-white">
                  Synapse IoT
                </h1>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase">
                  Local-Mesh Live
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                Central control panel for smart nodes, macro schedules, and analytics diagnostics.
              </p>
            </div>
          </div>

          {/* Clock & Active Profile metadata details */}
          <div className="flex flex-wrap items-center gap-4 font-sans self-end md:self-center">
            {currentTime && (
              <div className="flex items-center gap-2 bg-[#0c0c0e] border border-[#222227] rounded-xl px-3 py-2 text-xs text-zinc-350 font-mono font-medium">
                <Clock className="w-4 h-4 text-zinc-400" />
                <span>{currentTime}</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-[#0c0c0e] text-white rounded-xl px-3 py-2 text-xs border border-[#222227] shadow-sm">
              <User className="w-4 h-4 text-emerald-400" />
              <span className="font-medium max-w-[140px] truncate">
                vaishakh884@gmail.com
              </span>
            </div>
          </div>
        </header>

        {/* Dashboard Live Statistics */}
        <section id="system-statistics">
          <DashboardStats devices={devices} rules={automations} />
        </section>

        {/* Direct Action Control Hub Buttons */}
        <section
          className="bg-[#151518] border border-[#222227] rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          id="macro-action-bar"
        >
          <div className="flex items-center gap-2 leading-none shrink-0">
            <span className="font-sans font-bold text-zinc-400 text-xs uppercase tracking-wider block">
              Macro Scenarios:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={triggerAwaySecure}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0c0c0e] hover:bg-red-500/10 text-red-700 hover:text-red-400 border border-[#222227] hover:border-red-500/20 rounded-xl text-xs font-sans font-semibold transition-all cursor-pointer"
              id="macro-away-secure"
            >
              <Shield className="w-3.5 h-3.5 text-red-500" />
              Away Lockdown
            </button>
            <button
              onClick={triggerCozyChillNight}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0c0c0e] hover:bg-amber-500/10 text-amber-700 hover:text-amber-400 border border-[#222227] hover:border-amber-500/20 rounded-xl text-xs font-sans font-semibold transition-all cursor-pointer"
              id="macro-cozy-chill"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Cozy Chill Loop
            </button>
            <button
              onClick={triggerAllLightsOff}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0c0c0e] hover:bg-[#222227] text-zinc-350 border border-[#222227] rounded-xl text-xs font-sans font-medium transition-all cursor-pointer"
              id="macro-all-lights-off"
            >
              <PowerOff className="w-3.5 h-3.5 text-zinc-455" />
              Kill Lights
            </button>
          </div>
        </section>

        {/* Dynamic Split Screen Structure */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="primary-matrix-grid">
          {/* Left Column (2/3 width) - Room Filters & Device Cards Grid */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filter controls panel */}
            <div className="bg-[#151518] border border-[#222227] rounded-2xl p-6 shadow-md space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h2 className="font-sans font-bold text-white text-lg">
                    Hardware Registers
                  </h2>
                  <p className="text-xs text-zinc-400 font-sans">
                    Toggle relays, dim state factors, and control individual devices live.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  {/* Search Input */}
                  <div className="relative flex-1 md:w-64">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search name, room or type..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs font-sans pl-9 pr-3.5 py-2 bg-[#0c0c0e] border border-[#222227] text-zinc-150 rounded-xl focus:ring-1 focus:ring-zinc-650 focus:outline-none"
                    />
                  </div>
                  {/* Trigger Add Device Modal */}
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-[#3f3f46] text-xs font-sans font-bold rounded-xl transition-all cursor-pointer shrink-0 shadow-sm"
                    id="btn-register-device-trigger"
                  >
                    <Plus className="w-4 h-4" /> Add Node
                  </button>
                </div>
              </div>

              {/* Room tabs scroll */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                {ROOMS.map((room) => {
                  const isActive = selectedRoom === room;
                  const roomDeviceCount = devices.filter((d) => d.room === room).length;
                  const roomActiveCount = devices.filter((d) => d.room === room && d.isOn).length;

                  return (
                    <button
                      key={room}
                      onClick={() => setSelectedRoom(room)}
                      className={`px-3.5 py-2 text-xs font-sans font-semibold border rounded-xl cursor-pointer transition-all shrink-0 uppercase tracking-wider text-[11px] ${
                        isActive
                          ? 'bg-white text-black border-white shadow-sm scale-[1.02] font-bold'
                          : 'bg-[#0c0c0e] text-zinc-400 border-[#222227] hover:bg-[#151518] hover:text-white'
                      }`}
                    >
                      {room}
                      {room !== 'All Rooms' && roomDeviceCount > 0 && (
                        <span className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-black/20 text-black font-bold'
                            : roomActiveCount > 0
                            ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20'
                            : 'bg-zinc-850 text-zinc-500 border border-[#222227]'
                        }`}>
                          {roomActiveCount}/{roomDeviceCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Devices grid layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredDevices.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="col-span-full bg-[#151518] border border-[#222227] rounded-2xl p-12 text-center text-zinc-500 text-xs font-sans italic"
                  >
                    No IoT devices registered matching the active selection. Add a device or clear filters to reset view.
                  </motion.div>
                ) : (
                  filteredDevices.map((device) => (
                    <DeviceCard
                      key={device.id}
                      device={device}
                      onToggle={handleToggleDevice}
                      onValueChange={handleChangeDeviceValue}
                      onDelete={handleDeleteDevice}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Telemetry charts row */}
            <div>
              <TelemetryChart data={energyHistory} />
            </div>
          </div>

          {/* Right Column (1/3 width) - Schedulers, Activity Logs & Event Simulations */}
          <div className="space-y-6">
            {/* Automation Timetable scheduler */}
            <SchedulePlan
              rules={automations}
              devices={devices}
              onToggleRule={handleToggleRule}
              onAddRule={handleAddRule}
              onDeleteRule={handleDeleteRule}
            />

            {/* Event trigger simulation zone */}
            <SimulationCenter
              onSimulateDrivewayIntrusion={handleSimulateDrivewayIntrusion}
              onSimulateEcoLockdown={handleSimulateEcoLockdown}
              onSimulateHeatWave={handleSimulateHeatwave}
              onSimulateKitchenWaterSpill={handleSimulateWaterSpill}
              onSimulateActiveCleaning={handleSimulateActiveCleaning}
            />

            {/* Log view details */}
            <ActivityLogViewer logs={logs} onClearLogs={handleClearLogs} />
          </div>
        </main>
      </div>

      {/* Slide dialog register overlay modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddDeviceModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAddDevice={handleAddDevice}
          />
        )}
      </AnimatePresence>

      {/* Clean elegant footer */}
      <footer className="border-t border-[#222227] bg-[#151518]/30 mt-12 py-6 text-center text-xs text-zinc-500 font-sans tracking-wide">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Synapse Mesh Solutions Co. Built completely offline-first with React and Recharts.</p>
        </div>
      </footer>
    </div>
  );
}
