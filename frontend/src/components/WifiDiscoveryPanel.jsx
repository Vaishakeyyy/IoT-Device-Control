import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Link, Radio, RefreshCw, Router, Wifi, X } from 'lucide-react';

const REFRESH_INTERVAL_MS = 15000;

export const WifiDiscoveryPanel = () => {
  const [network, setNetwork] = useState({ connected: false, ssid: null, signal: null });
  const [devices, setDevices] = useState([]);
  const [subnets, setSubnets] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [manualIp, setManualIp] = useState('100.93.224.4');
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const scanInProgress = useRef(false);
  const [accessInfo, setAccessInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/wifi/access-info')
      .then((res) => res.json())
      .then((data) => setAccessInfo(data))
      .catch(() => {});
  }, []);

  const scanNetwork = useCallback(async () => {
    if (scanInProgress.current) return;
    scanInProgress.current = true;
    setIsScanning(true);

    try {
      const [statusResponse, discoveryResponse, targetsResponse] = await Promise.all([
        fetch('/api/wifi/status'),
        fetch('/api/wifi/discover-devices'),
        fetch('/api/wifi/targets'),
      ]);
      const [statusData, discoveryData, targetsData] = await Promise.all([
        statusResponse.json(),
        discoveryResponse.json(),
        targetsResponse.json(),
      ]);

      if (!discoveryResponse.ok && !targetsResponse.ok) {
        throw new Error(discoveryData.error || targetsData.error || 'Network discovery failed.');
      }

      const localDevices = discoveryResponse.ok && Array.isArray(discoveryData.devices) ? discoveryData.devices : [];
      const directDevices = targetsResponse.ok && Array.isArray(targetsData) ? targetsData : [];
      const mergedDevices = new Map(localDevices.map((device) => [device.ip, device]));
      directDevices.forEach((device) => mergedDevices.set(device.ip, device));

      setNetwork(statusData);
      setDevices(Array.from(mergedDevices.values()));
      setSubnets(discoveryResponse.ok && Array.isArray(discoveryData.subnets) ? discoveryData.subnets : []);
      setLastUpdated(new Date());
      setError(discoveryResponse.ok ? '' : discoveryData.error || 'Local subnet scan failed; direct targets are still monitored.');
    } catch (err) {
      setDevices([]);
      setSubnets([]);
      setError(err.message || 'Unable to scan this network.');
    } finally {
      scanInProgress.current = false;
      setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    scanNetwork();
    const intervalId = window.setInterval(scanNetwork, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [scanNetwork]);

  const connectDirectTarget = async (event) => {
    event.preventDefault();
    setIsConnecting(true);
    setError('');
    try {
      const response = await fetch('/api/wifi/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: manualIp, name: 'My phone' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to connect this IP address.');
      await scanNetwork();
    } catch (err) {
      setError(err.message || 'Unable to connect this IP address.');
    } finally {
      setIsConnecting(false);
    }
  };

  const removeDirectTarget = async (id) => {
    await fetch(`/api/wifi/targets/${id}`, { method: 'DELETE' });
    await scanNetwork();
  };

  return (
    <section className="bg-white border border-[#e2e8f0] rounded-xl shadow-xs overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Wifi className={`w-4 h-4 ${network.connected ? 'text-emerald-500' : 'text-slate-400'}`} />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Live Wi-Fi Devices</h3>
            <span className="text-[9px] font-bold rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 px-2 py-0.5">
              {devices.length} detected
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {network.connected && network.ssid ? `${network.ssid}${network.signal ? ` - ${network.signal}` : ''}` : 'No active Wi-Fi connection detected'}
            {subnets.length > 0 ? ` - ${subnets.map((subnet) => `${subnet.subnetBase}.0/24`).join(', ')}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={scanNetwork}
          disabled={isScanning}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-60 cursor-pointer disabled:cursor-wait"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
          {isScanning ? 'Scanning network' : 'Scan now'}
        </button>
      </div>

      <form onSubmit={connectDirectTarget} className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-end gap-2">
        <label className="flex-1 min-w-[220px]">
          <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-500 mb-1">Connect a reachable phone or device by IPv4</span>
          <input
            value={manualIp}
            onChange={(event) => setManualIp(event.target.value)}
            inputMode="decimal"
            placeholder="192.168.1.50"
            className="w-full px-3 py-2 text-xs font-mono text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </label>
        <button
          type="submit"
          disabled={isConnecting || !manualIp.trim()}
          className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 cursor-pointer disabled:cursor-wait"
        >
          <Link className="w-3.5 h-3.5" />
          {isConnecting ? 'Connecting...' : 'Connect device'}
        </button>
      </form>

      {accessInfo && (
        <div className="mx-4 mt-3 mb-2 p-3 bg-gradient-to-br from-blue-50 to-indigo-50/60 dark:from-slate-800/40 dark:to-slate-900/20 border border-blue-100 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row items-center gap-3.5 shadow-2xs">
          <div className="w-20 h-20 bg-white dark:bg-slate-950 p-1 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-center shrink-0">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(accessInfo.appUrl)}`}
              alt="Pairing QR Code"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 text-left">
            <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span className="inline-flex w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Mobile Pairing Helper
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
              Scan the QR code or visit the link with your phone. Once opened, it generates an HTTP heartbeat, registering your phone (IP <code className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{manualIp}</code>) as <span className="text-emerald-600 dark:text-emerald-400 font-bold">Online</span>.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <code className="text-[9px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-md max-w-[180px] block truncate select-all">
                {accessInfo.appUrl}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(accessInfo.appUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error ? (
        <div className="m-4 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : devices.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <Radio className={`w-6 h-6 mx-auto mb-2 text-slate-300 ${isScanning ? 'animate-pulse' : ''}`} />
          <p className="text-xs font-semibold text-slate-600">{isScanning ? 'Searching the current subnet...' : 'No other active devices responded.'}</p>
          <p className="text-[10px] text-slate-400 mt-1">Some phones and IoT devices block ping or client-to-client discovery.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] text-slate-400 bg-slate-50/60">
                <th className="py-2.5 px-4">DEVICE</th>
                <th className="py-2.5 px-3">IP ADDRESS</th>
                <th className="py-2.5 px-3">MAC ADDRESS</th>
                <th className="py-2.5 px-3">SOURCE</th>
                <th className="py-2.5 px-4 text-right">STATE</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={`${device.ip}-${device.mac}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td className="py-3 px-4 min-w-[220px]">
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 rounded-md bg-blue-50 border border-blue-100 text-blue-600">
                        {device.isGateway ? <Router className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
                      </span>
                      <div>
                        <span className="block text-[11px] font-bold text-slate-800">{device.label}</span>
                        <span className="block text-[9px] uppercase text-slate-400 mt-0.5">{device.type}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[10px] text-blue-700">{device.ip}</td>
                  <td className="py-3 px-3 font-mono text-[10px] text-slate-500">{device.mac}</td>
                  <td className="py-3 px-3 text-[10px] text-slate-500">{device.isDirect ? 'Direct target' : device.isMdns ? 'mDNS + LAN' : 'Ping / ARP'}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 text-[9px] uppercase font-bold rounded-full border px-2 py-0.5 ${device.online === false ? 'text-slate-500 bg-slate-100 border-slate-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${device.online === false ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'}`} />
                        {device.online === false ? 'Offline' : 'Online'}
                      </span>
                      {device.isDirect && (
                        <button type="button" onClick={() => removeDirectTarget(device.id)} className="p-1 text-slate-400 hover:text-rose-600" title="Remove direct target">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 text-[9px] text-slate-400 text-right">
        Auto-refresh: 15 seconds{lastUpdated ? ` - Updated ${lastUpdated.toLocaleTimeString()}` : ''}
      </div>
    </section>
  );
};
