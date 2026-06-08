import React from 'react';
import { Terminal, HardDrive, HelpCircle } from 'lucide-react';

export const ActivityLogViewer = ({ logs, onClearLogs }) => {
  const getLogColors = (type) => {
    switch (type) {
      case 'success':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'warning':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'control':
        return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      case 'info':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-slate-600 bg-slate-100 border-slate-250';
    }
  };

  const getLogTypeLabel = (type) => {
    switch (type) {
      case 'success':
        return 'Relay Activity';
      case 'warning':
        return 'Grid Event';
      case 'control':
        return 'Parameter Send';
      case 'info':
        return 'System Info';
      default:
        return 'Diagnostic';
    }
  };

  return (
    <div className="bg-white border border-[#e2e8f0] text-slate-805 rounded-xl p-5 shadow-xs h-full animate-fade-in" id="log-viewer-pane">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-indigo-500 animate-pulse" />
            Event Log Diagnostics
          </h3>
          <p className="text-[11px] text-slate-500 font-sans">
            Real-time local mesh packet network telemetry.
          </p>
        </div>
        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="text-[11px] font-sans font-bold text-slate-450 hover:text-red-650 hover:text-red-600 cursor-pointer transition-colors"
          >
            Clear Log Terminal
          </button>
        )}
      </div>

      <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto pr-1" id="log-stage-terminal">
        {logs.length === 0 ? (
          <div className="text-center py-10 font-mono text-[11px] italic text-slate-400">
            No active mesh telemetry packets captured. Use interactive toggles to dispatch packets.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="p-3 bg-slate-50 border border-slate-205 border-slate-205 border-slate-200 rounded-lg font-mono text-[11px] flex flex-col sm:flex-row items-start justify-between gap-2 hover:border-slate-350 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5 leading-none">
                  <span className="text-slate-400">[{log.timestamp}]</span>
                  <span className="text-slate-800 font-bold">{log.deviceName}</span>
                  {log.room && (
                    <span className="text-slate-450 text-[9px] uppercase font-sans font-semibold">
                      ({log.room})
                    </span>
                  )}
                </div>
                <p className="text-slate-650 leading-normal font-sans">
                  {log.message}
                </p>
              </div>

              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border shrink-0 ${getLogColors(log.type)}`}>
                {getLogTypeLabel(log.type)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Hardware statistics summary */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-150" id="log-summary-hud">
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-208 border-slate-200 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-slate-400 shrink-0" />
          <div>
            <span className="text-[9px] text-slate-400 font-sans block leading-none uppercase font-bold">
              Captured Events
            </span>
            <span className="text-[11px] font-sans font-extrabold text-slate-800 leading-normal mt-1 block">
              {logs.length} Packets
            </span>
          </div>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-208 border-slate-200 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <div>
            <span className="text-[9px] text-slate-400 font-sans block leading-none uppercase font-bold">
              Grid Health
            </span>
            <span className="text-[11px] font-sans font-extrabold text-emerald-600 leading-normal mt-1 block">
              Optimal (0.00% loss)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
