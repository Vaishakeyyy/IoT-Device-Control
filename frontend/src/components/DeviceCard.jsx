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
  AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';

export const DeviceCard = ({
  device,
  onToggle,
  onValueChange,
  onDelete,
}) => {
  // Map Type to Icon with precise aesthetic color glows
  const getIcon = () => {
    const iconClass = `w-5 h-5 transition-all duration-300 ${
      device.isOn ? 'scale-110' : 'text-slate-400'
    }`;
    switch (device.type) {
      case 'light':
        return <Lightbulb className={`${iconClass} ${device.isOn ? 'text-amber-500' : ''}`} />;
      case 'thermostat':
        return <Thermometer className={`${iconClass} ${device.isOn ? 'text-orange-500' : ''}`} />;
      case 'smart-plug':
        return <Plug className={`${iconClass} ${device.isOn ? 'text-indigo-500' : ''}`} />;
      case 'lock':
        return device.isOn ? (
          <Lock className="w-5 h-5 text-emerald-600 scale-110" />
        ) : (
          <Unlock className="w-5 h-5 text-rose-500 scale-110" />
        );
      case 'camera':
        return <Video className={`${iconClass} ${device.isOn ? 'text-sky-500' : ''}`} />;
      case 'speaker':
        return <Volume2 className={`${iconClass} ${device.isOn ? 'text-fuchsia-500' : ''}`} />;
      case 'vacuum':
        return <Cpu className={`${iconClass} ${device.isOn ? 'text-teal-500' : ''}`} />;
      case 'irrigation':
        return <Droplets className={`${iconClass} ${device.isOn ? 'text-blue-500' : ''}`} />;
      default:
        return <Lightbulb className={`${iconClass} ${device.isOn ? 'text-amber-500' : ''}`} />;
    }
  };

  // Get visual status state badges
  const getBadgeColors = () => {
    if (!device.isOn) {
      return 'bg-slate-50 text-slate-450 border-slate-200';
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
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'speaker':
        return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
      case 'vacuum':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'irrigation':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const getDisplayValue = () => {
    if (device.type === 'lock') {
      return device.isOn ? 'Locked' : 'Unlocked';
    }
    if (device.type === 'smart-plug') {
      return device.isOn ? 'Active (Relay Closed)' : 'Standby (Relay Open)';
    }
    if (device.type === 'camera') {
      return device.isOn ? 'Armed & Streaming' : 'In Standby';
    }
    return `${device.value}${device.metricUnit || '%'}`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, scale: 1.01, zIndex: 20, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02)" }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "tween", duration: 0.25 }}
      className={`relative isolate flex flex-col justify-between bg-white border rounded-xl p-4 shadow-xs transition-all duration-200 ${
        device.isOn ? 'border-slate-200' : 'bg-slate-50/70 border-slate-200/80 opacity-90'
      }`}
      id={`device-card-${device.id}`}
    >
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`p-2 rounded-lg border flex items-center justify-center transition-all duration-200 shrink-0 ${
                device.isOn
                  ? 'bg-slate-50 border-slate-200 text-slate-800'
                  : 'bg-slate-100/50 border-slate-200/50 opacity-60'
              }`}
            >
              {getIcon()}
            </div>
            <div className="min-w-0">
              <h3 className="font-sans font-bold text-slate-800 leading-tight truncate text-sm">
                {device.name}
              </h3>
              <div className="text-[11px] text-slate-500 font-sans mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="flex items-center gap-1">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${device.isOn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                  {device.room}
                </span>
                {device.wifi_ip && (
                  <span className="text-[10px] font-mono text-blue-600 bg-blue-50/70 border border-blue-100 rounded px-1 py-0.2 leading-normal shrink-0">
                    {device.wifi_ip}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onToggle(device.id)}
              className={`p-1.5 rounded-lg border transition-all duration-150 active:scale-90 cursor-pointer ${
                device.isOn
                  ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title={device.isOn ? 'Turn Off' : 'Turn On'}
              id={`toggle-btn-${device.id}`}
            >
              <Power className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(device.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent rounded-lg transition-all active:scale-90 cursor-pointer"
              title="Delete Device"
              id={`delete-btn-${device.id}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Status Badges with aesthetic visual spacing */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-sans font-semibold border uppercase ${getBadgeColors()}`}
          >
            {getDisplayValue()}
          </span>
          {device.isOn && device.energyUsage > 0 && (
            <span className="text-[9px] uppercase tracking-wider font-mono bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">
              ⚡ {device.energyUsage}W Load
            </span>
          )}
          {device.alert && (
            <span className="text-[9px] flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
              {device.alert}
            </span>
          )}
        </div>
      </div>

      {/* Interactive controls aligned correctly */}
      <div className="mt-4 border-t border-slate-100 pt-3">
        {device.isOn ? (
          <div>
            {device.type === 'light' && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-500 font-sans">
                  <span>Brightness Factor</span>
                  <span className="font-mono font-bold text-amber-650">{device.value}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={device.value}
                  onChange={(e) => onValueChange(device.id, parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500 border border-slate-200"
                />
                <div className="flex gap-1 mt-1.5">
                  {[20, 50, 100].map((level) => (
                    <button
                      key={level}
                      onClick={() => onValueChange(device.id, level)}
                      className={`text-[9px] px-1.5 py-0.5 rounded font-sans transition-all active:scale-[0.95] border cursor-pointer ${
                        device.value === level
                          ? 'bg-amber-100 text-amber-800 border-amber-200 font-bold'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {level === 20 ? 'Dim' : level === 50 ? 'Eco Ambient' : 'Bright Max'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {device.type === 'thermostat' && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-500 font-sans">
                  <span>Target Climate</span>
                  <span className="font-mono font-bold text-orange-600">{device.value}°F</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="85"
                  step="1"
                  value={device.value}
                  onChange={(e) => onValueChange(device.id, parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-500 border border-slate-200"
                />
                <div className="flex gap-1 mt-1.5">
                  {[68, 72, 78].map((temp) => (
                    <button
                      key={temp}
                      onClick={() => onValueChange(device.id, temp)}
                      className={`text-[9px] px-1.5 py-0.5 rounded font-sans transition-all active:scale-[0.95] border cursor-pointer ${
                        device.value === temp
                          ? 'bg-orange-100 text-orange-800 border-orange-200 font-bold'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {temp}°F {temp === 68 ? '(Cool)' : temp === 72 ? '(Ideal)' : '(Warm)'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {device.type === 'speaker' && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-500 font-sans">
                  <span>Audio Volume</span>
                  <span className="font-mono font-bold text-fuchsia-600">{device.value}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={device.value}
                  onChange={(e) => onValueChange(device.id, parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-fuchsia-500 border border-slate-200"
                />
                <p className="text-[9px] text-fuchsia-500 font-mono animate-pulse truncate mt-1">
                  📻 chill_lounge.ogg stream_active...
                </p>
              </div>
            )}

            {device.type === 'vacuum' && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] text-slate-500 font-sans">
                  <span>Battery Reserve</span>
                  <span className="font-mono text-emerald-600 font-bold">🔋 {device.value}%</span>
                </div>
                <span className="text-[10px] text-slate-600 flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1.5 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping shrink-0"></span>
                  <span className="font-sans leading-tight">Actively sweeping carpets</span>
                </span>
              </div>
            )}

            {device.type === 'irrigation' && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-500 font-sans">
                  <span>Volumetric Flow</span>
                  <span className="font-mono text-blue-600 font-bold">12.5 L/min</span>
                </div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div className="h-full bg-blue-500 animate-pulse" style={{ width: '65%' }}></div>
                </div>
                <p className="text-[9px] text-slate-400 font-sans">
                  Watering ends in ~8 minutes.
                </p>
              </div>
            )}

            {device.type === 'smart-plug' && (
              <div className="text-[11px] text-slate-500 space-y-1.5">
                <div className="flex justify-between bg-slate-50 border border-slate-200 p-1.5 rounded-lg items-center">
                  <span>Current Wattage:</span>
                  <span className="font-mono text-indigo-600 font-bold">{device.energyUsage} W</span>
                </div>
              </div>
            )}

            {device.type === 'camera' && (
              <div className="text-[11px] text-slate-500 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span>Signal Quality</span>
                  <span className="text-emerald-600 font-bold font-sans">Strong (98%)</span>
                </div>
                <div className="bg-slate-100 rounded-lg p-2.5 flex items-center justify-center border border-slate-200 mt-1 relative overflow-hidden group">
                  <div className="absolute top-1.5 left-1.5 bg-rose-50 text-[8px] text-rose-600 border border-rose-200 font-mono px-1 rounded-sm animate-pulse flex items-center gap-0.5 font-bold uppercase">
                    <span className="w-1 h-1 rounded-full bg-rose-600 inline-block"></span>
                    Live Feed
                  </div>
                  <Video className="w-7 h-7 text-slate-400 group-hover:text-slate-500 transition-colors py-0.5" />
                </div>
              </div>
            )}

            {device.type === 'lock' && (
              <div className="flex items-center justify-between bg-slate-50 rounded-lg p-2 border border-slate-200">
                <span className="text-[11px] font-sans text-slate-500">Lock Mechanism</span>
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Armed & Locked
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-1.5 bg-slate-50 rounded-lg border border-dashed border-slate-200/80">
            <span className="text-xs text-slate-500 font-sans italic">
              Node is currently offline / suspended
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
