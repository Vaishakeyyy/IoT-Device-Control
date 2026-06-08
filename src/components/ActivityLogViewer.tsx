import React from 'react';
import { ActivityLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Bell, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface ActivityLogViewerProps {
  logs: ActivityLog[];
  onClearLogs: () => void;
}

export const ActivityLogViewer: React.FC<ActivityLogViewerProps> = ({ logs, onClearLogs }) => {
  const getLogIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'info':
        return <Info className="w-4 h-4 text-zinc-400" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />;
      case 'control':
        return <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin-slow" />;
    }
  };

  const getLogBg = (type: ActivityLog['type']) => {
    switch (type) {
      case 'info':
        return 'bg-[#0c0c0e] border-[#222227] text-zinc-305';
      case 'success':
        return 'bg-[#0c0c0e]/85 border-emerald-500/20 text-zinc-200';
      case 'warning':
        return 'bg-[#0c0c0e]/85 border-amber-500/20 text-zinc-200';
      case 'control':
        return 'bg-[#0c0c0e]/85 border-indigo-500/20 text-zinc-200';
    }
  };

  return (
    <div className="bg-[#151518] border border-[#222227] rounded-2xl p-6 shadow-md flex flex-col justify-between h-full" id="activity-log-viewer">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#222227]">
          <div>
            <h3 className="font-sans font-bold text-white text-lg flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Event Log Diagnostics
            </h3>
            <p className="text-xs text-zinc-400 font-sans mt-0.5 font-sans">Simulated real-time state metrics stream.</p>
          </div>
          <button
            onClick={onClearLogs}
            className="text-[10px] font-sans font-semibold text-zinc-400 hover:text-white border border-[#222227] hover:border-[#3f3f46] px-2.5 py-1.5 rounded-lg bg-[#0c0c0e] hover:bg-[#151518] transition-all cursor-pointer"
          >
            Flush Diagnostics
          </button>
        </div>

        {/* Logs stack */}
        <div className="mt-4 space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {logs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10 text-zinc-500 text-xs font-sans italic"
              >
                No active event triggers. Diagnostic logs cleared.
              </motion.div>
            ) : (
              logs.map((log) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={log.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-xs font-sans ${getLogBg(
                    log.type
                  )}`}
                  id={`diagnostic-log-${log.id}`}
                >
                  <div className="p-1 rounded-lg bg-[#151518] border border-[#222227] shadow-sm flex items-center justify-center shrink-0">
                    {getLogIcon(log.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="font-semibold text-white truncate">
                        {log.deviceName || 'System Hub'}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                        {log.timestamp}
                      </span>
                    </div>
                    <p className="text-zinc-400 mt-0.5 leading-relaxed">{log.message}</p>
                    {log.room && (
                      <span className="inline-block mt-1 text-[9px] font-medium bg-[#151518] border border-[#222227] text-zinc-400 px-1.5 py-0.5 rounded-sm uppercase tracking-wide font-mono">
                        {log.room}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="text-[10px] text-zinc-550 font-sans flex items-center justify-between pt-4 border-t border-[#222227] mt-4 font-mono text-zinc-500">
        <span>Transmitter Rate: 60Hz</span>
        <span>Local IP: 192.168.1.1</span>
      </div>
    </div>
  );
};
