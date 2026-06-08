import React from 'react';
import {
  Lightbulb,
  Thermometer,
  Plug,
  Lock,
  Unlock,
  Video,
  Volume2,
  Cpu,
  Droplets,
  Power,
  Trash2,
  Settings,
  AlertTriangle,
  Play,
  Pause,
  Home
} from 'lucide-react';
import { IoTDevice } from '../types';
import { motion } from 'motion/react';

interface DeviceCardProps {
  device: IoTDevice;
  onToggle: (id: string) => void;
  onValueChange: (id: string, val: number) => void;
  onDelete: (id: string) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  onToggle,
  onValueChange,
  onDelete,
}) => {
  // Map Type to Icon
  const getIcon = () => {
    const iconClass = `w-6 h-6 transition-all duration-300 ${
      device.isOn ? 'text-amber-500 scale-110' : 'text-gray-400'
    }`;
    switch (device.type) {
      case 'light':
        return <Lightbulb className={iconClass} />;
      case 'thermostat':
        return <Thermometer className={`w-6 h-6 ${device.isOn ? 'text-orange-500 scale-110' : 'text-gray-400'}`} />;
      case 'smart-plug':
        return <Plug className={`w-6 h-6 ${device.isOn ? 'text-indigo-500 scale-110' : 'text-gray-400'}`} />;
      case 'lock':
        return device.isOn ? (
          <Lock className="w-6 h-6 text-emerald-600 scale-115" />
        ) : (
          <Unlock className="w-6 h-6 text-red-500" />
        );
      case 'camera':
        return <Video className={`w-6 h-6 ${device.isOn ? 'text-blue-500 scale-110' : 'text-gray-400'}`} />;
      case 'speaker':
        return <Volume2 className={`w-6 h-6 ${device.isOn ? 'text-fuchsia-500 scale-110' : 'text-gray-400'}`} />;
      case 'vacuum':
        return <Cpu className={`w-6 h-6 ${device.isOn ? 'text-teal-500 scale-110' : 'text-gray-400'}`} />;
      case 'irrigation':
        return <Droplets className={`w-6 h-6 ${device.isOn ? 'text-cyan-500 scale-110' : 'text-gray-400'}`} />;
      default:
        return <Lightbulb className={iconClass} />;
    }
  };

  // Get visual state accents
  const getBadgeColors = () => {
    if (!device.isOn) {
      return 'bg-zinc-100 text-zinc-500 border-zinc-200';
    }
    switch (device.type) {
      case 'light':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'thermostat':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'smart-plug':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'lock':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'camera':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'speaker':
        return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
      case 'vacuum':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'irrigation':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  // Helper text/units
  const getDisplayValue = () => {
    if (device.type === 'lock') {
      return device.isOn ? 'Locked' : 'Unlocked';
    }
    if (device.type === 'smart-plug') {
      return device.isOn ? 'Active' : 'Standby';
    }
    if (device.type === 'camera') {
      return device.isOn ? 'Armed & Streaming' : 'Resting';
    }
    return `${device.value}${device.metricUnit || '%'}`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`relative flex flex-col justify-between bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow duration-300 ${
        device.isOn ? 'border-zinc-300' : 'border-zinc-200 bg-zinc-50/50'
      }`}
      id={`device-card-${device.id}`}
    >
      {/* Header section */}
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-center transition-all duration-300 ${
                device.isOn
                  ? 'bg-zinc-50 border-zinc-200 shadow-xs'
                  : 'bg-zinc-100 border-zinc-200 opacity-70'
              }`}
            >
              {getIcon()}
            </div>
            <div>
              <h3 className="font-sans font-semibold text-zinc-900 leading-tight">
                {device.name}
              </h3>
              <p className="text-xs text-zinc-500 font-sans mt-0.5 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                {device.room}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggle(device.id)}
              className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                device.isOn
                  ? 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
              }`}
              title={device.isOn ? 'Turn Off' : 'Turn On'}
              id={`toggle-btn-${device.id}`}
            >
              <Power className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(device.id)}
              className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-all duration-200 cursor-pointer"
              title="Delete Device"
              id={`delete-btn-${device.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Status Badges */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-sans font-medium border ${getBadgeColors()}`}
          >
            {getDisplayValue()}
          </span>
          {device.isOn && device.energyUsage > 0 && (
            <span className="text-[10px] uppercase tracking-wider font-mono bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md border border-zinc-200">
              ⚡ {device.energyUsage}W Load
            </span>
          )}
          {device.alert && (
            <span className="text-[10px] flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              {device.alert}
            </span>
          )}
        </div>
      </div>

      {/* Interactive controls */}
      <div className="mt-6 border-t border-zinc-100 pt-4">
        {device.isOn ? (
          <div>
            {device.type === 'light' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-zinc-500 font-sans">
                  <span>Brightness</span>
                  <span className="font-mono font-medium">{device.value}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={device.value}
                  onChange={(e) => onValueChange(device.id, parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                {/* Micro presets */}
                <div className="flex gap-1.5 mt-2">
                  {[20, 50, 100].map((level) => (
                    <button
                      key={level}
                      onClick={() => onValueChange(device.id, level)}
                      className={`text-[10px] px-2 py-1 rounded-md font-sans transition-all border cursor-pointer ${
                        device.value === level
                          ? 'bg-amber-50 text-amber-700 border-amber-200 font-semibold'
                          : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      {level === 20 ? 'Dim' : level === 50 ? 'Eco' : 'Max'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {device.type === 'thermostat' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-zinc-500 font-sans">
                  <span>Target Climate</span>
                  <span className="font-mono font-semibold text-orange-600">{device.value}°F</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="85"
                  step="1"
                  value={device.value}
                  onChange={(e) => onValueChange(device.id, parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex gap-1.5 mt-2">
                  {[68, 72, 78].map((temp) => (
                    <button
                      key={temp}
                      onClick={() => onValueChange(device.id, temp)}
                      className={`text-[10px] px-2 py-1 rounded-md font-sans transition-all border cursor-pointer ${
                        device.value === temp
                          ? 'bg-orange-50 text-orange-700 border-orange-200 font-semibold'
                          : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                      }`}
                    >
                      {temp}°F {temp === 68 ? 'Cool' : temp === 72 ? 'Comfort' : 'Warm'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {device.type === 'speaker' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-zinc-500 font-sans">
                  <span>Volume level</span>
                  <span className="font-mono font-medium">{device.value}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={device.value}
                  onChange={(e) => onValueChange(device.id, parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                />
                <p className="text-[10px] text-fuchsia-600 font-mono animate-pulse truncate">
                  📻 Stream: Sunset High-Fi Jazz Cafe ...
                </p>
              </div>
            )}

            {device.type === 'vacuum' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-zinc-500 font-sans">
                  <span>Cleaner Battery</span>
                  <span className="font-mono text-emerald-600 font-medium">🔋 {device.value}%</span>
                </div>
                {/* Vacuum action buttons */}
                <span className="text-[11px] text-zinc-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
                  Currently: Navigated and cleaning Living Room rug
                </span>
              </div>
            )}

            {device.type === 'irrigation' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-zinc-500 font-sans">
                  <span>Irrigation Flow</span>
                  <span className="font-mono text-cyan-600 font-semibold">12.5 L/min</span>
                </div>
                <div className="h-1 bg-cyan-100 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 animate-pulse" style={{ width: '65%' }}></div>
                </div>
                <p className="text-[10px] text-zinc-400 font-sans mt-1">
                  Scheduled cycle ends in 8 minutes.
                </p>
              </div>
            )}

            {device.type === 'smart-plug' && (
              <div className="text-xs text-zinc-500 space-y-1">
                <div className="flex justify-between">
                  <span>Power Draw</span>
                  <span className="font-mono text-indigo-600 font-semibold">{device.energyUsage} Watts</span>
                </div>
                <p className="text-[10px] text-zinc-400 font-sans">
                  Relay status is closed (ON). Drawing active current.
                </p>
              </div>
            )}

            {device.type === 'camera' && (
              <div className="text-xs text-zinc-500 space-y-1">
                <div className="flex justify-between items-center">
                  <span>Network Signal</span>
                  <span className="text-emerald-600 font-medium font-sans">Strong (98%)</span>
                </div>
                <div className="bg-zinc-100 rounded-lg p-2 flex items-center justify-center border border-zinc-200 mt-1 relative overflow-hidden group">
                  <div className="absolute top-2 left-2 bg-red-600 text-[8px] text-white font-mono px-1.5 py-0.5 rounded-sm animate-pulse flex items-center gap-1 uppercase font-bold">
                    <span className="w-1 h-1 rounded-full bg-white inline-block"></span>
                    Live
                  </div>
                  <Video className="w-8 h-8 text-zinc-300 py-1" />
                </div>
              </div>
            )}

            {device.type === 'lock' && (
              <div className="flex items-center justify-between bg-zinc-50 rounded-xl p-2.5 border border-zinc-200">
                <span className="text-xs font-sans text-zinc-600">Secure Deadbolt</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100">
                  Armed & Locked
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-2">
            <span className="text-xs text-zinc-400 font-sans italic">
              Device is currently offline or powered off
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
