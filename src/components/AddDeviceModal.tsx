import React, { useState } from 'react';
import { DeviceType, IoTDevice, ROOMS } from '../types';
import { X, Plus, Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDevice: (device: Omit<IoTDevice, 'id' | 'lastSeen'>) => void;
}

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  isOpen,
  onClose,
  onAddDevice,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<DeviceType>('light');
  const [room, setRoom] = useState(ROOMS[1]); // Default to first proper room 'Living Room'
  const [initialValue, setInitialValue] = useState(50);
  const [energyUsage, setEnergyUsage] = useState(15);

  if (!isOpen) return null;

  // Auto handle standard energy estimates by type to simplify user inputs
  const handleTypeChange = (selectedType: DeviceType) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

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
    });

    // Reset fields
    setName('');
    setType('light');
    setRoom(ROOMS[1]);
    setEnergyUsage(12);
    setInitialValue(80);
    onClose();
  };

  const DEVICE_SELECTIONS: { type: DeviceType; label: string; desc: string }[] = [
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="add-device-modal-portal">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#151518] rounded-2xl max-w-lg w-full overflow-hidden border border-[#222227] shadow-2xl"
      >
        <div className="flex items-center justify-between p-5 border-b border-[#222227]">
          <div>
            <h3 className="font-sans font-bold text-white text-lg">Add New Smart Node</h3>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">Integrate and register a new simulation device with the local array.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#222227] rounded-xl transition-all text-zinc-400 hover:text-white cursor-pointer"
            id="close-add-device-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4" id="form-device-create">
          {/* Device name */}
          <div>
            <label className="block text-xs font-semibold font-sans text-zinc-450 mb-1.5">
              Friendly Device Name
            </label>
            <input
              type="text"
              placeholder="e.g. Master Bedroom Chandelier"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs font-sans px-3.5 py-3 bg-[#0c0c0e] border border-[#222227] text-zinc-100 rounded-xl focus:ring-1 focus:ring-zinc-650 focus:outline-none placeholder-zinc-550"
              required
              maxLength={40}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Room choice */}
            <div>
              <label className="block text-xs font-semibold font-sans text-zinc-450 mb-1.5">
                Assigned Zone / Room
              </label>
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full text-xs font-sans px-3 py-2.5 bg-[#0c0c0e] border border-[#222227] text-zinc-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-650"
              >
                {ROOMS.filter((r) => r !== 'All Rooms').map((r) => (
                  <option key={r} value={r} className="bg-[#151518] text-white">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Power Estimate */}
            <div>
              <label className="block text-xs font-semibold font-sans text-zinc-450 mb-1.5">
                Idle Wattage (W)
              </label>
              <input
                type="number"
                min="0"
                max="3000"
                value={energyUsage}
                onChange={(e) => setEnergyUsage(parseInt(e.target.value) || 0)}
                className="w-full text-xs font-sans px-3 py-2 bg-[#0c0c0e] border border-[#222227] text-zinc-100 rounded-xl focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Type Select grid */}
          <div>
            <label className="block text-xs font-semibold font-sans text-zinc-450 mb-2">
              Device Template Type
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
              {DEVICE_SELECTIONS.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleTypeChange(item.type)}
                  className={`flex flex-col items-start p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    type === item.type
                      ? 'bg-white border-white text-black shadow-sm'
                      : 'bg-[#0c0c0e] border-[#222227] text-zinc-300 hover:bg-[#151518]'
                  }`}
                >
                  <span className="text-xs font-bold font-sans">{item.label}</span>
                  <span className={`text-[9px] mt-0.5 leading-tight ${type === item.type ? 'text-zinc-700' : 'text-zinc-500'}`}>
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#222227] text-xs">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#222227] hover:bg-[#222227] font-semibold text-zinc-300 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-white text-zinc-950 font-bold rounded-xl hover:bg-zinc-100 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Assemble Node
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
