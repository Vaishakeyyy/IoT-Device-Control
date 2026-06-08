import React from 'react';
import { motion } from 'motion/react';

export const DashboardStats = ({ devices, rules, commandsCount = 0, alertsCount = 0, criticalAlertsCount = 0 }) => {
  const totalCount = devices.length;
  const onlineCount = devices.filter((d) => d.isOn).length;
  const offlineCount = devices.filter((d) => !d.isOn).length;
  const controlledCount = devices.filter((d) => d.isOn && (d.type === 'smart-plug' || d.type === 'light' || d.type === 'speaker')).length;

  const stats = [
    {
      id: 'stat-total',
      label: 'TOTAL DEVICES',
      value: totalCount,
      sub: 'Registered endpoints',
      borderColor: 'border-t-2 border-t-cyan-500',
    },
    {
      id: 'stat-online',
      label: 'ONLINE',
      value: onlineCount,
      sub: 'Transmitters reachable',
      borderColor: 'border-t-2 border-t-emerald-500',
    },
    {
      id: 'stat-offline',
      label: 'OFFLINE',
      value: offlineCount,
      sub: 'Unreachable',
      borderColor: 'border-t-2 border-t-amber-500',
    },
    {
      id: 'stat-controlled',
      label: 'CONTROLLED',
      value: controlledCount > 0 ? controlledCount : '—',
      sub: 'Devices powered ON',
      borderColor: 'border-t-2 border-t-zinc-400',
    },
    {
      id: 'stat-alerts',
      label: 'ALERTS',
      value: alertsCount,
      sub: 'Unacknowledged',
      borderColor: 'border-t-2 border-t-red-400',
    },
    {
      id: 'stat-commands',
      label: 'COMMANDS TODAY',
      value: commandsCount > 0 ? commandsCount : '—',
      sub: 'Current actions run',
      borderColor: 'border-t-2 border-t-indigo-400',
    },
    {
      id: 'stat-limits',
      label: 'SYSTEM LIMITS',
      value: rules.length || '0',
      sub: 'Configured thresholds',
      borderColor: 'border-t-2 border-t-blue-400',
    },
    {
      id: 'stat-disk',
      label: 'DISK LIMIT',
      value: '0',
      sub: 'Warning threshold reserve',
      borderColor: 'border-t-2 border-t-orange-400',
    },
    {
      id: 'stat-rebooting',
      label: 'REBOOTING',
      value: '0',
      sub: 'Console runtime resets',
      borderColor: 'border-t-2 border-t-teal-400',
    },
    {
      id: 'stat-critical',
      label: 'CRITICAL ALERTS',
      value: criticalAlertsCount,
      sub: 'Active locked device alarms',
      borderColor: 'border-t-2 border-t-red-600',
    },
  ];

  return (
    <div className="flex xl:grid xl:grid-cols-10 gap-2 overflow-x-auto pb-2 scrollbar-none" id="dashboard-stats-grid">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: idx * 0.02 }}
          className={`flex-1 min-w-[120px] xl:min-w-0 bg-white border border-[#e2e8f0] rounded-md p-2.5 shadow-xs hover:shadow-sm hover:border-slate-350 transition-all duration-200 flex flex-col justify-between ${stat.borderColor}`}
        >
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold font-mono tracking-wider text-slate-400 block whitespace-nowrap">
              {stat.label}
            </span>
            <h4 className="text-xl font-extrabold text-slate-800 font-sans leading-none tracking-tight py-1">
              {stat.value}
            </h4>
          </div>
          <p className="text-[8px] font-medium font-sans text-slate-400 truncate leading-none mt-1">
            {stat.sub}
          </p>
        </motion.div>
      ))}
    </div>
  );
};
