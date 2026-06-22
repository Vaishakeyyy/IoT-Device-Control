import React, { useState, useEffect, useRef } from 'react';
import { ROOMS } from '../types';
import { 
  X, Plus, Wifi, Check, Laptop, Smartphone, AlertCircle, 
  ChevronRight, RefreshCw, Lock, Eye, EyeOff, Loader2,
  Lightbulb, Thermometer, Zap, LockKeyhole, Camera,
  Volume2, Compass, Droplet, ArrowLeft, Signal, Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Helper to get device icons
const getDeviceIcon = (type, className = "w-5 h-5") => {
  switch (type) {
    case 'light': return <Lightbulb className={className} />;
    case 'thermostat': return <Thermometer className={className} />;
    case 'smart-plug': return <Zap className={className} />;
    case 'lock': return <LockKeyhole className={className} />;
    case 'camera': return <Camera className={className} />;
    case 'speaker': return <Volume2 className={className} />;
    case 'vacuum': return <Compass className={className} />;
    case 'irrigation': return <Droplet className={className} />;
    default: return <Zap className={className} />;
  }
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

export const AddDeviceModal = ({
  isOpen,
  onClose,
  onAddDevice,
}) => {
  const [step, setStep] = useState(1);
  const [type, setType] = useState('light');
  const [name, setName] = useState('');
  const [room, setRoom] = useState(ROOMS[1]); // Default to first proper room 'Living Room'
  const [homeWifiPassword, setHomeWifiPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  // Real-time subnet states
  const [activeSsid, setActiveSsid] = useState('Detecting network...');
  const [discoveryMode, setDiscoveryMode] = useState('subnet'); // 'ap' or 'subnet'
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [scannedSubnets, setScannedSubnets] = useState([]);
  const [selectedSubnetBase, setSelectedSubnetBase] = useState('');
  const [selectedDiscoveredDevice, setSelectedDiscoveredDevice] = useState(null);

  // Simulated step states
  const [isScanning, setIsScanning] = useState(true);
  const [isConnectingAp, setIsConnectingAp] = useState(false);
  const [provisioningStep, setProvisioningStep] = useState(0);
  const [assignedIp, setAssignedIp] = useState('');
  const [signalStrength, setSignalStrength] = useState('');
  
  const timerRef = useRef(null);

  if (!isOpen) return null;

  // Auto-generate random IP and signal strength when provisioning starts
  const generateDeviceNetworkDetails = () => {
    const randomHost = Math.floor(Math.random() * 252) + 2; // avoid .1, .0, .255
    const subnet = Math.random() > 0.5 ? '10.150.251' : '192.168.1';
    const ip = `${subnet}.${randomHost}`;
    
    const dbms = Math.floor(Math.random() * -30) - 35; // -35 to -65 dBm
    let strengthLabel = 'Excellent';
    if (dbms < -60) strengthLabel = 'Good';
    else if (dbms < -50) strengthLabel = 'Very Good';
    
    setAssignedIp(ip);
    setSignalStrength(`${dbms} dBm (${strengthLabel})`);
  };

  // Fetch active Wi-Fi SSID on mount
  useEffect(() => {
    fetch('/api/wifi/status')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.ssid) {
          setActiveSsid(data.ssid);
        }
      })
      .catch(() => {});
  }, []);

  // Step 2: Scanning / Discovery trigger
  useEffect(() => {
    if (step === 2) {
      setIsScanning(true);
      if (discoveryMode === 'ap') {
        setSelectedDiscoveredDevice(null);
        timerRef.current = setTimeout(() => {
          setIsScanning(false);
        }, 1800);
      } else {
        fetch('/api/wifi/discover-devices')
          .then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Network discovery failed.');
            return data;
          })
          .then((data) => {
            const subnetsList = data.subnets || [];
            const devicesList = data.devices || [];
            setScannedSubnets(subnetsList);
            setDiscoveredDevices(devicesList);
            
            // Auto select mobile hotspot subnet first if present, otherwise default to first available subnet
            const hotspotSubnet = subnetsList.find(s => s.subnetBase === '192.168.137');
            if (hotspotSubnet) {
              setSelectedSubnetBase(hotspotSubnet.subnetBase);
            } else if (subnetsList.length > 0) {
              setSelectedSubnetBase(subnetsList[0].subnetBase);
            }
            
            setIsScanning(false);
          })
          .catch((err) => {
            console.error('Discovery error', err);
            setError(err.message || 'Unable to scan the current Wi-Fi network.');
            setScannedSubnets([]);
            setDiscoveredDevices([]);
            setSelectedSubnetBase('');
            setIsScanning(false);
          });
      }
    }
    return () => clearTimeout(timerRef.current);
  }, [step, discoveryMode]);

  // Step 4: Provisioning progress chain simulator
  useEffect(() => {
    if (step === 4) {
      setProvisioningStep(0);
      if (!selectedDiscoveredDevice) {
        generateDeviceNetworkDetails();
      }

      const runProvisioning = () => {
        timerRef.current = setInterval(() => {
          setProvisioningStep((prev) => {
            if (prev >= 4) {
              clearInterval(timerRef.current);
              setTimeout(() => {
                setStep(5);
              }, 600);
              return 5;
            }
            return prev + 1;
          });
        }, 800);
      };
      
      runProvisioning();
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  // Handle template helper defaults matching original logic
  const getDeviceDefaults = (selectedType) => {
    let energyUsage = 15;
    let initialValue = 50;
    let metricUnit = 'W';

    switch (selectedType) {
      case 'light':
        energyUsage = 12;
        initialValue = 80;
        metricUnit = '%';
        break;
      case 'thermostat':
        energyUsage = 110;
        initialValue = 72;
        metricUnit = '°F';
        break;
      case 'smart-plug':
        energyUsage = 400;
        initialValue = 100;
        metricUnit = 'W';
        break;
      case 'lock':
        energyUsage = 3;
        initialValue = 100;
        metricUnit = 'Locked';
        break;
      case 'camera':
        energyUsage = 8;
        initialValue = 30;
        metricUnit = 'W';
        break;
      case 'speaker':
        energyUsage = 25;
        initialValue = 45;
        metricUnit = '%';
        break;
      case 'vacuum':
        energyUsage = 20;
        initialValue = 100;
        metricUnit = '%';
        break;
      case 'irrigation':
        energyUsage = 0;
        initialValue = 0;
        metricUnit = 'L/min';
        break;
    }
    return { energyUsage, initialValue, metricUnit };
  };

  const handleConnectSetupAp = () => {
    setIsConnectingAp(true);
    timerRef.current = setTimeout(() => {
      setIsConnectingAp(false);
      setStep(3);
    }, 1500);
  };

  const handleSelectDiscoveredDevice = (device) => {
    setSelectedDiscoveredDevice(device);
    setType(device.type === 'network-device' ? 'smart-plug' : device.type);
    setName(device.label.replace(/ \(.+\)$/, '')); // clean up label suffix
    setAssignedIp(device.ip);
    
    const dbms = Math.floor(Math.random() * -30) - 35; // -35 to -65 dBm
    let strengthLabel = 'Excellent';
    if (dbms < -60) strengthLabel = 'Good';
    else if (dbms < -50) strengthLabel = 'Very Good';
    setSignalStrength(`${dbms} dBm (${strengthLabel})`);

    // Override active SSID with interface details for step 3 display
    const matchedSubnet = scannedSubnets.find(s => s.subnetBase === device.subnetBase);
    if (matchedSubnet) {
      setActiveSsid(matchedSubnet.interfaceName === 'WiFi' ? activeSsid : matchedSubnet.interfaceName);
    }

    setStep(3);
  };

  const handleStartProvisioning = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Friendly name is required.');
      return;
    }
    setError('');
    setStep(4);
  };

  const handleFinalSubmit = () => {
    const defaults = getDeviceDefaults(type);
    onAddDevice({
      name: name.trim(),
      type,
      room,
      isOn: true,
      value: defaults.initialValue,
      metricUnit: defaults.metricUnit,
      energyUsage: defaults.energyUsage,
      status: 'online',
      wifi_ip: assignedIp,
    });

    // Reset wizard
    setStep(1);
    setName('');
    setType('light');
    setRoom(ROOMS[1]);
    setHomeWifiPassword('');
    setSelectedDiscoveredDevice(null);
    setError('');
    onClose();
  };

  const selectedTemplate = DEVICE_SELECTIONS.find(item => item.type === type);

  // Filter discovered devices by selected subnet dropdown option
  const filteredDevices = discoveredDevices.filter(device => device.subnetBase === selectedSubnetBase);

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="add-device-modal-portal">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col md:flex-row h-auto max-h-[90vh] md:max-h-[640px]"
      >
        
        {/* LEFT COLUMN: GUIDANCE CORNER */}
        <div className="md:w-5/12 bg-slate-50 dark:bg-slate-950 p-6 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                <Wifi className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-sans font-bold text-slate-800 dark:text-white text-sm">Smart Node Pairing</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Robros Device Provisioner</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
                {discoveryMode === 'ap' ? (
                  <>To integrate a simulated node into the relational dashboard grid, we run a secure **AP Provisioning Protocol**.</>
                ) : (
                  <>Scanning active network cards to discover **physical hardware nodes** running on your local subnetworks in real-time.</>
                )}
              </p>

              {/* Steps Progress Checklist */}
              <div className="space-y-2 pt-2">
                <div className="text-[10px] font-bold text-slate-450 uppercase font-mono tracking-wider">Pairing Sequence</div>
                
                <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-600'}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] border ${step > 1 ? 'bg-blue-600 border-blue-600 text-white' : 'border-current'}`}>
                    {step > 1 ? <Check className="w-2.5 h-2.5" /> : '1'}
                  </span>
                  <span>Select Node Mode</span>
                </div>
                
                <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-600'}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] border ${step > 2 ? 'bg-blue-600 border-blue-600 text-white' : 'border-current'}`}>
                    {step > 2 ? <Check className="w-2.5 h-2.5" /> : '2'}
                  </span>
                  <span>{discoveryMode === 'ap' ? 'Connect setup AP' : 'Scan subnet devices'}</span>
                </div>

                <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-600'}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] border ${step > 3 ? 'bg-blue-600 border-blue-600 text-white' : 'border-current'}`}>
                    {step > 3 ? <Check className="w-2.5 h-2.5" /> : '3'}
                  </span>
                  <span>Configure details</span>
                </div>

                <div className={`flex items-center gap-2 ${step >= 4 ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400 dark:text-slate-600'}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] border ${step > 4 ? 'bg-blue-600 border-blue-600 text-white' : 'border-current'}`}>
                    {step > 4 ? <Check className="w-2.5 h-2.5" /> : '4'}
                  </span>
                  <span>Relational Sync</span>
                </div>
              </div>
            </div>
          </div>

          {/* Network specs details */}
          <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/80 text-[10px] font-sans text-slate-450 dark:text-slate-500 space-y-1.5">
            <div className="flex justify-between">
              <span>Home SSID:</span>
              <strong className="text-slate-700 dark:text-slate-300 font-semibold">{activeSsid}</strong>
            </div>
            <div className="flex justify-between">
              <span>Host Interfaces:</span>
              <strong className="text-slate-705 dark:text-slate-350 font-mono">10.x.x.x / 192.168.x.x</strong>
            </div>
            <div className="flex justify-between">
              <span>Discovery Type:</span>
              <strong className="text-slate-750 dark:text-slate-350 uppercase">{discoveryMode === 'ap' ? 'Simulated Access Point' : 'Live ICMP/ARP scan'}</strong>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SIMULATED MOBILE PHONE WIZARD */}
        <div className="flex-1 p-6 flex items-center justify-center bg-slate-100 dark:bg-slate-900/40 relative">
          
          {/* Close button for entire modal */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer z-10"
            id="close-add-device-modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* PHONE MOCK CONTAINER */}
          <div className="border-4 border-slate-800 dark:border-slate-950 rounded-[36px] p-3.5 bg-slate-900 dark:bg-black shadow-2xl relative w-full max-w-[320px] shrink-0">
            
            {/* Phone Notch/Speaker */}
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-900 dark:bg-black rounded-b-xl flex items-center justify-center z-20">
              <div className="w-10 h-1 bg-slate-800 rounded-full" />
            </div>

            {/* PHONE SCREEN CONTAINER */}
            <div className="bg-slate-950 text-white rounded-[26px] overflow-hidden h-[440px] flex flex-col font-sans relative select-none shadow-inner border border-slate-800/60 dark:border-slate-950">
              
              {/* Phone Status Bar */}
              <div className="h-6 px-4 pt-1 flex items-center justify-between text-[9px] text-slate-400 bg-slate-950 z-10 font-medium">
                <span>12:00 PM</span>
                <div className="flex items-center gap-1">
                  <Signal className="w-2.5 h-2.5" />
                  <span className="font-mono">5G</span>
                  <Wifi className="w-2.5 h-2.5" />
                  <div className="w-4 h-2 rounded-xs border border-current p-0.5 flex items-center">
                    <div className="bg-current h-full w-3/4 rounded-2xs" />
                  </div>
                </div>
              </div>

              {/* SCREEN CONTENT AREA */}
              <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col text-slate-100 relative">
                <AnimatePresence mode="wait">
                  
                  {/* STEP 1: CHOOSE TEMPLATE & PAIR */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-3 flex flex-col justify-between h-full pt-1"
                    >
                      <div>
                        <div className="text-center pb-1">
                          <h4 className="text-[13px] font-black text-white tracking-wide">Register Node</h4>
                          <p className="text-[9px] text-slate-450">Integrate smart hardware client</p>
                        </div>

                        {/* Discovery Mode Selector Toggle */}
                        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl mb-3">
                          <button
                            type="button"
                            onClick={() => setDiscoveryMode('ap')}
                            className={`py-1 text-[9.5px] rounded-lg cursor-pointer transition-all font-bold ${discoveryMode === 'ap' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-450 hover:text-white'}`}
                          >
                            New Setup AP
                          </button>
                          <button
                            type="button"
                            onClick={() => setDiscoveryMode('subnet')}
                            className={`py-1 text-[9.5px] rounded-lg cursor-pointer transition-all font-bold flex items-center justify-center gap-1 ${discoveryMode === 'subnet' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-450 hover:text-white'}`}
                          >
                            <Network className="w-3 h-3" /> Subnet Scan
                          </button>
                        </div>

                        {discoveryMode === 'ap' ? (
                          <>
                            {/* Visual Device Pulse Mock */}
                            <div className="py-2 flex flex-col items-center justify-center">
                              <div className="relative w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-blue-500 shadow-md">
                                {getDeviceIcon(type, "w-8 h-8")}
                                <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                </span>
                              </div>
                              <span className="text-[8px] font-mono text-blue-400 bg-blue-950/40 border border-blue-900/60 px-2 py-0.5 rounded-full mt-2 animate-pulse uppercase">
                                AP Beaconing Active
                              </span>
                            </div>

                            {/* Template Select Dropdown */}
                            <div className="space-y-1 text-xs">
                              <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                                Select Device Template
                              </label>
                              <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full text-[11px] font-sans px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                {DEVICE_SELECTIONS.map((item) => (
                                  <option key={item.type} value={item.type} className="bg-slate-950">
                                    {item.label}
                                  </option>
                                ))}
                              </select>
                              <p className="text-[9px] text-slate-450 leading-tight italic pt-0.5">
                                {selectedTemplate?.desc}
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="py-8 text-center space-y-3">
                            <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800 text-blue-400 mx-auto">
                              <Network className="w-6 h-6 animate-pulse" />
                            </div>
                            <div className="space-y-1">
                              <h5 className="text-[11.5px] font-bold text-white">Subnetwork Discovery Scan</h5>
                              <p className="text-[9px] text-slate-400 leading-normal max-w-[180px] mx-auto">
                                The system will search for active IP/MAC addresses connected to your current Wi-Fi subnetworks in real-time.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          {discoveryMode === 'ap' ? 'Find Setup Wi-Fi Network' : 'Scan Local Network'} <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: SCANNING & SELECT AP / DISCOVER DEVICES */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-3 flex flex-col justify-between h-full pt-1"
                    >
                      {isScanning ? (
                        /* Scanning indicator state */
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                          <div>
                            <h5 className="text-[12px] font-bold text-white">
                              {discoveryMode === 'ap' ? 'Scanning Hotspots...' : 'Pinging Subnet Hosts...'}
                            </h5>
                            <p className="text-[9px] text-slate-500 font-mono mt-1">
                              {discoveryMode === 'ap' ? 'Searching on 2.4/5GHz bands' : 'Scanning 254 subnet clients'}
                            </p>
                          </div>
                        </div>
                      ) : isConnectingAp ? (
                        /* Connecting loader state */
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                          <div>
                            <h5 className="text-[12px] font-bold text-white">Handshaking AP...</h5>
                            <p className="text-[9px] text-slate-500 font-mono mt-1">Connecting to SETUP_{selectedTemplate?.label.replaceAll(' ', '')}</p>
                          </div>
                        </div>
                      ) : (
                        /* Scanned AP network list / Discovered local host list */
                        <>
                          <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex items-center gap-1 pb-1 shrink-0">
                              <button onClick={() => setStep(1)} className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-white">
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>
                              <div>
                                <h4 className="text-[13px] font-black text-white">
                                  {discoveryMode === 'ap' ? 'Select Node Signal' : 'Discovered Subnet Nodes'}
                                </h4>
                                <p className="text-[9px] text-slate-450">
                                  {discoveryMode === 'ap' ? 'Join setup network' : 'Choose device to link'}
                                </p>
                              </div>
                            </div>

                            {/* Dropdown filter for Subnet Scan Mode */}
                            {discoveryMode === 'subnet' && scannedSubnets.length > 0 && (
                              <div className="space-y-1 py-1 shrink-0">
                                <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                                  Select Network Scan Target
                                </label>
                                <select
                                  value={selectedSubnetBase}
                                  onChange={(e) => setSelectedSubnetBase(e.target.value)}
                                  className="w-full text-[10px] font-sans px-2 py-1 bg-slate-900 border border-slate-800 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  {scannedSubnets.map((sub) => (
                                    <option key={sub.subnetBase} value={sub.subnetBase} className="bg-slate-950">
                                      {sub.interfaceName === 'WiFi' ? 'Mesh Wi-Fi Network' : sub.interfaceName} ({sub.subnetBase}.x)
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <div className="space-y-2 mt-2 overflow-y-auto pr-0.5 flex-1 min-h-[140px]">
                              {discoveryMode === 'ap' ? (
                                <>
                                  {/* Device Provisioning Network (Must Click) */}
                                  <button
                                    type="button"
                                    onClick={() => handleConnectSetupAp()}
                                    className="w-full p-2.5 bg-slate-900 hover:bg-slate-850 border border-blue-900/60 text-left rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                                  >
                                    <div className="space-y-0.5">
                                      <span className="text-[10px] font-bold text-blue-400 font-mono block">
                                        SETUP_{selectedTemplate?.label.replace(' ', '')}_NET
                                      </span>
                                      <span className="text-[8px] text-slate-450 bg-blue-950/40 px-1.5 py-0.2 rounded font-semibold uppercase">
                                        Ready to Provision
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[9px] text-blue-400 font-bold uppercase shrink-0">
                                      Connect <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                  </button>

                                  {/* Home mesh - read only */}
                                  <div className="p-2.5 bg-slate-900/40 border border-slate-900/60 rounded-xl flex items-center justify-between opacity-60">
                                    <div className="space-y-0.5">
                                      <span className="text-[10px] font-bold text-slate-300 block">{activeSsid}</span>
                                      <span className="text-[8px] text-slate-500">Connected (Home Subnet)</span>
                                    </div>
                                    <Lock className="w-3 h-3 text-slate-600 shrink-0" />
                                  </div>
                                </>
                              ) : (
                                <>
                                  {filteredDevices.length === 0 ? (
                                    <div className="py-8 text-center text-slate-500 text-[10.5px] italic">
                                      No dynamic devices found on this network target. Make sure they are active.
                                    </div>
                                  ) : (
                                    filteredDevices.map((device) => (
                                      <button
                                        key={device.ip}
                                        type="button"
                                        onClick={() => handleSelectDiscoveredDevice(device)}
                                        className="w-full p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-805 border-slate-800 text-left rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                                      >
                                        <div className="space-y-0.5 min-w-0 pr-2">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-mono font-bold text-blue-400 block truncate">
                                              {device.ip}
                                            </span>
                                            {device.isMdns && (
                                              <span className="text-[7px] bg-emerald-950/50 border border-emerald-900/60 text-emerald-400 px-1 py-0.2 rounded font-mono font-black uppercase tracking-wider shrink-0 animate-pulse">
                                                mDNS
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-[8.5px] text-slate-300 font-bold block truncate">
                                            {device.label}
                                          </span>
                                          <span className="text-[8px] font-mono text-slate-500 block truncate">
                                            MAC: {device.mac}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[8.5px] bg-blue-950/50 border border-blue-900/60 text-blue-400 font-bold px-2 py-0.5 rounded-md uppercase shrink-0">
                                          Link
                                        </div>
                                      </button>
                                    ))
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          <div className="pt-1 flex items-center justify-center shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setIsScanning(true);
                                if (discoveryMode === 'ap') {
                                  timerRef.current = setTimeout(() => setIsScanning(false), 1200);
                                } else {
                                  fetch('/api/wifi/discover-devices')
                                    .then((res) => res.json())
                                    .then((data) => {
                                      setScannedSubnets(data.subnets || []);
                                      setDiscoveredDevices(data.devices || []);
                                      setIsScanning(false);
                                    })
                                    .catch(() => setIsScanning(false));
                                }
                              }}
                              className="text-[9px] font-bold text-slate-400 hover:text-white flex items-center gap-1 uppercase transition-colors cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" /> Rescan Signals
                            </button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}

                  {/* STEP 3: CREDENTIALS & METRICS CONFIG */}
                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-3 flex flex-col justify-between h-full pt-1"
                    >
                      <form onSubmit={handleStartProvisioning} className="space-y-2.5 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1 pb-1">
                            <button type="button" onClick={() => setStep(2)} className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-white">
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                            <div>
                              <h4 className="text-[13px] font-black text-white">Configure Node</h4>
                              <p className="text-[9px] text-slate-450">Transmit details onto the local array</p>
                            </div>
                          </div>

                          {error && (
                            <div className="p-2 bg-rose-950/40 border border-rose-900/60 text-rose-300 text-[9px] rounded-lg flex items-center gap-1 leading-normal font-sans">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                              <span>{error}</span>
                            </div>
                          )}

                          {/* Friendly Device name input */}
                          <div className="space-y-1">
                            <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                              Device Name
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Living Room Lamp"
                              value={name}
                              onChange={(e) => {
                                setName(e.target.value);
                                if (error) setError('');
                              }}
                              className="w-full text-[11px] px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-600"
                              required
                              maxLength={40}
                            />
                          </div>

                          {/* Room Selection */}
                          <div className="space-y-1">
                            <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                              Assigned Room
                            </label>
                            <select
                              value={room}
                              onChange={(e) => setRoom(e.target.value)}
                              className="w-full text-[11px] font-sans px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {ROOMS.filter((r) => r !== 'All Rooms').map((r) => (
                                <option key={r} value={r} className="bg-slate-950">
                                  {r}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* WiFi Credentials verification */}
                          <div className="space-y-1">
                            <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                              Target SSID / Interface
                            </label>
                            <div className="w-full text-[11px] px-2.5 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-lg select-none font-mono">
                              {activeSsid}
                            </div>
                          </div>

                          <div className="space-y-1 relative">
                            <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                              {selectedDiscoveredDevice ? 'Enter Gateway Authorization Password' : 'WPA3 Security Password'}
                            </label>
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Credentials password"
                                value={homeWifiPassword}
                                onChange={(e) => setHomeWifiPassword(e.target.value)}
                                className="w-full text-[11px] pl-2.5 pr-8 py-1.5 bg-slate-900 border border-slate-800 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-600 font-mono"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 hover:text-white transition-colors cursor-pointer"
                              >
                                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 shrink-0">
                          <button
                            type="submit"
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            {selectedDiscoveredDevice ? 'Link Discovered Node' : 'Begin Provisioning'} <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* STEP 4: PROVISIONING PROCESS */}
                  {step === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4 flex flex-col justify-center h-full pt-1"
                    >
                      <div className="text-center space-y-1.5">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                        <h4 className="text-[12px] font-black text-white">
                          {selectedDiscoveredDevice ? 'Linking Node...' : 'Configuring Node...'}
                        </h4>
                        <p className="text-[9px] text-slate-450 font-mono">Do not shut down the transmitter</p>
                      </div>

                      {/* Checklist stages */}
                      <div className="bg-slate-900 border border-slate-850 rounded-xl p-3 space-y-2 text-[10px] font-mono">
                        <div className="flex items-center gap-2">
                          {provisioningStep > 0 ? (
                            <Check className="w-3.5 h-3.5 text-emerald-450 shrink-0" />
                          ) : (
                            <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                          )}
                          <span className={provisioningStep > 0 ? 'text-slate-400 line-through' : 'text-white'}>
                            {selectedDiscoveredDevice ? 'Establish connection peer link' : 'Transfer Wi-Fi profile'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {provisioningStep > 1 ? (
                            <Check className="w-3.5 h-3.5 text-emerald-450 shrink-0" />
                          ) : provisioningStep === 1 ? (
                            <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                          )}
                          <span className={provisioningStep > 1 ? 'text-slate-400 line-through' : provisioningStep === 1 ? 'text-white font-bold' : 'text-slate-600'}>
                            {selectedDiscoveredDevice ? 'Exchange authentication tokens' : 'Trigger node reboot'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {provisioningStep > 2 ? (
                            <Check className="w-3.5 h-3.5 text-emerald-450 shrink-0" />
                          ) : provisioningStep === 2 ? (
                            <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                          )}
                          <span className={provisioningStep > 2 ? 'text-slate-400 line-through' : provisioningStep === 2 ? 'text-white font-bold' : 'text-slate-600'}>
                            {selectedDiscoveredDevice ? 'Verify node hardware addresses' : 'Assign DHCP IPv4 Address'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {provisioningStep > 3 ? (
                            <Check className="w-3.5 h-3.5 text-emerald-450 shrink-0" />
                          ) : provisioningStep === 3 ? (
                            <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                          )}
                          <span className={provisioningStep > 3 ? 'text-slate-400 line-through' : provisioningStep === 3 ? 'text-white font-bold' : 'text-slate-600'}>
                            Grid gateway handshake
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {provisioningStep > 4 ? (
                            <Check className="w-3.5 h-3.5 text-emerald-450 shrink-0" />
                          ) : provisioningStep === 4 ? (
                            <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                          )}
                          <span className={provisioningStep > 4 ? 'text-slate-400 line-through' : provisioningStep === 4 ? 'text-white font-bold' : 'text-slate-600'}>
                            SQL database entry save
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 5: SUCCESS & ALLOCATION REPORT */}
                  {step === 5 && (
                    <motion.div
                      key="step5"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3 flex flex-col justify-between h-full pt-1"
                    >
                      <div className="space-y-2">
                        {/* Success Animated Indicator */}
                        <div className="py-2 flex flex-col items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
                            <Check className="w-6 h-6 animate-bounce" />
                          </div>
                          <h4 className="text-[13px] font-black text-white tracking-wide mt-2">Node Linked!</h4>
                          <p className="text-[8px] text-slate-400 uppercase font-mono">Database Record Saved</p>
                        </div>

                        {/* Allocated connection spec sheet */}
                        <div className="bg-slate-900 border border-slate-850 rounded-xl p-3 text-[10px] space-y-1.5 font-sans">
                          <div className="flex justify-between border-b border-slate-800 pb-1">
                            <span className="text-slate-500">Device Name:</span>
                            <span className="text-white font-bold">{name}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-1">
                            <span className="text-slate-500">Device Type:</span>
                            <span className="text-blue-400 font-bold uppercase text-[9px] flex items-center gap-1">
                              {getDeviceIcon(type, "w-3 h-3")} {type}
                            </span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-1">
                            <span className="text-slate-500">Zone / Room:</span>
                            <span className="text-white font-bold">{room}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-800 pb-1">
                            <span className="text-slate-500">Device IP:</span>
                            <span className="text-emerald-450 font-mono font-bold">{assignedIp}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Signal:</span>
                            <span className="text-white font-semibold font-mono">{signalStrength}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleFinalSubmit}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs animate-pulse"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add to Dashboard
                        </button>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Home bar simulator at bottom */}
              <div className="h-4 bg-slate-950 flex items-center justify-center shrink-0">
                <div className="w-20 h-1 bg-white/20 rounded-full" />
              </div>

            </div>
          </div>

        </div>

      </motion.div>
    </div>
  );
};
