import React from 'react';
import { IoTDevice, AutomationRule } from '../types';
import { Zap, Cpu, Calendar, Grid3X3, Eye } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardStatsProps {
  devices: IoTDevice[];
  rules: AutomationRule[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ devices, rules }) => {
  // Calculations
  const totalCount = devices.length;
  const activeCount = devices.filter((d) => d.isOn).length;
  const activeWattage = devices.reduce((acc, curr) => acc + (curr.isOn ? curr.energyUsage : 0), 0);
  const activeSchedCount = rules.filter((r) => r.isEnabled).length;

  const uniqueRooms = Array.from(new Set(devices.map((d) => d.room))).length;

  const stats = [
    {
      id: 'stat-power',
      label: 'Live Power Demand',
      value: `${activeWattage} W`,
      sub: `${(activeWattage / 1000).toFixed(2)} kW immediate rate`,
      icon: <Zap className="w-5 h-5 text-amber-400 font-bold" />,
      bg: 'bg-amber-500/10 border-amber-500/20',
      textAccent: 'text-amber-400',
    },
    {
      id: 'stat-active',
      label: 'Active Transmitters',
      value: `${activeCount} / ${totalCount}`,
      sub: `${totalCount - activeCount} devices in sleep/standby`,
      icon: <Cpu className="w-5 h-5 text-indigo-400" />,
      bg: 'bg-indigo-500/10 border-indigo-500/20',
      textAccent: 'text-indigo-400',
    },
    {
      id: 'stat-rooms',
      label: 'Wired Zones',
      value: `${uniqueRooms} Rooms`,
      sub: 'Integrated automated zones',
      icon: <Grid3X3 className="w-5 h-5 text-emerald-400" />,
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      textAccent: 'text-emerald-400',
    },
    {
      id: 'stat-sched',
      label: 'Active Automations',
      value: `${activeSchedCount} Rules`,
      sub: `${rules.length} macro timetables configured`,
      icon: <Calendar className="w-5 h-5 text-fuchsia-400" />,
      bg: 'bg-fuchsia-500/10 border-fuchsia-500/20',
      textAccent: 'text-fuchsia-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-stats-grid">
      {stats.map((stat, idx) => (
         <motion.div
           key={stat.id}
           initial={{ opacity: 0, y: 15 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.3, delay: idx * 0.05 }}
           className="flex items-start justify-between p-5 bg-[#151518] border border-[#222227] rounded-2xl shadow-md hover:border-zinc-800 transition-all duration-300"
         >
           <div className="space-y-1">
             <span className="text-xs text-zinc-400 font-sans font-medium">{stat.label}</span>
             <h4 className="text-2xl font-sans font-bold text-white tracking-tight">
               {stat.value}
             </h4>
             <p className="text-[11px] font-sans text-zinc-500 mt-1">{stat.sub}</p>
           </div>
           <div className={`p-2.5 rounded-xl border flex items-center justify-center ${stat.bg}`}>
             {stat.icon}
           </div>
         </motion.div>
      ))}
    </div>
  );
};
