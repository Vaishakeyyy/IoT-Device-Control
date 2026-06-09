import React, { useState } from 'react';
import { ROOMS } from '../types';
import { X, Plus } from 'lucide-react';
import { motion } from 'motion/react';

export const AddDeviceModal = ({
  isOpen,
  onClose,
  onAddDevice,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('light');
  const [room, setRoom] = useState(ROOMS[1]); // Default to first proper room 'Living Room'
  const [initialValue, setInitialValue] = useState(50);
  const [energyUsage, setEnergyUsage] = useState(15);
  const [wifiIp, setWifiIp] = useState('10.150.251.145');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Auto handle standard energy estimates by type to simplify user inputs
  const handleTypeChange = (selectedType) => {
    setType(selectedType);
    switch (selectedType) {
      case 'light':
        setEnergyUsage(12);
        setInitialValue(80);
        break;
      case 'thermostat':
        setEnergyUsage(110);
        setInitialValue(72);
        break;
      case 'smart-plug':
        setEnergyUsage(400);
        setInitialValue(100);
        break;
      case 'lock':
        setEnergyUsage(3);
        setInitialValue(100); // 100 for locked
        break;
      case 'camera':
        setEnergyUsage(8);
        setInitialValue(30); // 30 FPS
        break;
      case 'speaker':
        setEnergyUsage(25);
        setInitialValue(45); // 45% volume
        break;
      case 'vacuum':
        setEnergyUsage(20);
        setInitialValue(100); // battery
        break;
      case 'irrigation':
        setEnergyUsage(0); // water valve draw has min electricity
        setInitialValue(0);
        break;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Validate that the device is on the same WiFi / private subnet as the Console (10.150.251.x or 192.168.1.x)
    const cleanedIp = wifiIp.trim();
    const isLocalSubnet = cleanedIp.startsWith('10.150.251.') || cleanedIp.startsWith('192.168.1.');
    if (!isLocalSubnet) {
      setError("Network Connection Denied: Device must be connected to the same WiFi network (on subnet 10.150.251.x or 192.168.1.x) as this Web Dashboard console.");
      return;
    }

    // Ensure it is not a gateway/reserved IP (ending in .1, .0, or .255)
    if (cleanedIp.endsWith('.1') || cleanedIp.endsWith('.0') || cleanedIp.endsWith('.255')) {
      setError("Network Error: Reserved IP address. Please assign a valid device client IP (e.g. ending in .2 to .254).");
      return;
    }

    setError('');

    onAddDevice({
      name,
      type,
      room,
      isOn: true,
      value: initialValue,
      metricUnit:
        type === 'light' || type === 'speaker'
          ? '%'
          : type === 'thermostat'
          ? '°F'
          : type === 'vacuum'
          ? '%'
          : type === 'irrigation'
          ? 'L/min'
          : type === 'lock'
          ? 'Locked'
          : 'W',
      energyUsage,
      status: 'online',
      wifi_ip: cleanedIp,
    });

    // Reset fields
    setName('');
    setType('light');
    setRoom(ROOMS[1]);
    setEnergyUsage(12);
    setInitialValue(80);
    setWifiIp('10.150.251.145');
    setError('');
    onClose();
  };

  const DEVICE_SELECTIONS = [
    { type: 'light', label: 'Smart Lightbulb', desc: 'LED light with dimming states' },
    { type: 'thermostat', label: 'Climate Controller', desc: 'Thermostat HVAC regulator' },
    { type: 'smart-plug', label: 'Appliance Plug', desc: 'Power sensor relay socket' },
    { type: 'lock', label: 'Digital Deadbolt', desc: 'Secure doorway locking trigger' },
    { type: 'camera', label: 'Security Camera Feed', desc: 'Real-time AI optics and recording' },
    { type: 'speaker', label: 'Audio Speaker', desc: 'Whole-house stereo transducer' },
    { type: 'vacuum', label: 'Robot Cleaner', desc: 'Dynamic navigation dust sweeper' },
    { type: 'irrigation', label: 'Garden Valve', desc: 'Irrigation solenoid faucet' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="add-device-modal-portal">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl max-w-lg w-full overflow-hidden border border-[#e2e8f0] shadow-2xl"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h3 className="font-sans font-bold text-slate-800 text-sm">Add New Smart Node</h3>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">Integrate and register a new simulation device with the local array.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
            id="close-add-device-modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4" id="form-device-create text-xs">
          {/* Error Alert Display */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg font-sans font-medium flex flex-col gap-1">
              <span className="font-extrabold text-[10px] uppercase tracking-wider text-rose-850">Network Validation Denied:</span>
              <p>{error}</p>
            </div>
          )}

          {/* Web Console network indicator block */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-lg p-2.5 flex items-center justify-between text-xs font-sans">
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider leading-none mb-1">
                Active Console Network (This Page)
              </span>
              <span className="font-semibold text-slate-700 block">
                SSID: <span className="font-bold text-blue-600">Mesh_Gateway_Home</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider leading-none mb-1">
                Required Subnet
              </span>
              <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-200/60 px-1.5 py-0.5 rounded leading-none">
                10.150.251.x / 192.168.1.x
              </span>
            </div>
          </div>

          {/* Device name */}
          <div>
            <label className="block text-[10px] font-bold font-sans text-slate-600 mb-1.5 uppercase tracking-wider">
              Friendly Device Name
            </label>
            <input
              type="text"
              placeholder="e.g. Living Room Chandelier"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs font-sans px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-slate-400"
              required
              maxLength={40}
            />
          </div>

          {/* WiFi IP Address */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold font-sans text-slate-600 uppercase tracking-wider">
                Network WiFi IP Address
              </label>
              <span className="text-[8px] font-mono text-slate-400">Must start with 10.150.251. or 192.168.1.</span>
            </div>
            <input
              type="text"
              placeholder="e.g. 10.150.251.145"
              value={wifiIp}
              onChange={(e) => {
                setWifiIp(e.target.value);
                if (error) setError('');
              }}
              className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-slate-400"
              required
              pattern="^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
              title="Please enter a valid IPv4 address (e.g. 10.150.251.145)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Room choice */}
            <div>
              <label className="block text-[10px] font-bold font-sans text-slate-600 mb-1.5 uppercase tracking-wider">
                Assigned Zone / Room
              </label>
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full text-xs font-sans px-3 py-2 bg-slate-50 border border-slate-100 text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {ROOMS.filter((r) => r !== 'All Rooms').map((r) => (
                  <option key={r} value={r} className="text-slate-800">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Power Estimate */}
            <div>
              <label className="block text-[10px] font-bold font-sans text-slate-600 mb-1.5 uppercase tracking-wider">
                Idle Wattage (W)
              </label>
              <input
                type="number"
                min="0"
                max="3000"
                value={energyUsage}
                onChange={(e) => setEnergyUsage(parseInt(e.target.value) || 0)}
                className="w-full text-xs font-sans px-3 py-2 bg-slate-50 border border-slate-100 text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Type Select grid */}
          <div>
            <label className="block text-[10px] font-bold font-sans text-slate-600 mb-2 uppercase tracking-wider">
              Device Template Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
              {DEVICE_SELECTIONS.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleTypeChange(item.type)}
                  className={`flex flex-col items-start p-2 rounded-lg border text-left cursor-pointer transition-all ${
                    type === item.type
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-202 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <span className="text-[11px] font-bold font-sans">{item.label}</span>
                  <span className={`text-[9px] leading-tight ${type === item.type ? 'text-slate-350' : 'text-slate-400'}`}>
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 text-xs">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-slate-500 hover:text-slate-800 font-bold rounded-lg cursor-pointer font-sans"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Assemble Node
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
