import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { energyMockHistory } from '../mockData';
import { Leaf, Info } from 'lucide-react';

export const TelemetryChart = ({ data = energyMockHistory }) => {
  const [viewMode, setViewMode] = useState('stack');

  // Compute stats
  const averageHourlyConsumption = Math.round(
    data.reduce((acc, curr) => acc + curr.total, 0) / data.length
  );
  const peakDraw = Math.max(...data.map((d) => d.total));
  const peakTime = data.find((d) => d.total === peakDraw)?.time || 'N/A';

  // Calculate generic carbon offsets
  const dailyCarbonEst = ((averageHourlyConsumption * 24) / 1000) * 0.85; // lbs of CO2

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-xs flex flex-col justify-between h-full animate-fade-in" id="telemetry-chart-container">
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-sans font-bold text-slate-800 text-sm">
              Telemetry Analytics
            </h3>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              Comparative analysis of active grid draws and energy distribution.
            </p>
          </div>

          {/* Toggle buttons */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('stack')}
              className={`px-2.5 py-1 rounded text-[11px] font-sans font-bold transition-colors cursor-pointer ${
                viewMode === 'stack'
                  ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
               }`}
            >
              Category Breakdown
            </button>
            <button
              onClick={() => setViewMode('total')}
              className={`px-2.5 py-1 rounded text-[11px] font-sans font-bold transition-colors cursor-pointer ${
                viewMode === 'total'
                  ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Combined demand
            </button>
          </div>
        </div>

        {/* Highlight insights */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 my-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[9px] text-slate-400 font-sans block uppercase font-bold tracking-wide">
              Peak System Load
            </span>
            <span className="text-sm font-sans font-extrabold text-slate-800 leading-none block mt-1">
              {peakDraw} W
            </span>
            <span className="text-[9px] text-slate-500 font-sans block mt-1 leading-none">
              Registered at {peakTime}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[9px] text-slate-400 font-sans block uppercase font-bold tracking-wide">
              Average load rate
            </span>
            <span className="text-sm font-sans font-extrabold text-slate-800 leading-none block mt-1">
              {averageHourlyConsumption} W
            </span>
            <span className="text-[9px] text-emerald-600 font-sans font-bold block mt-1 flex items-center gap-0.5 leading-none">
              <Leaf className="w-2.5 h-2.5" /> Eco Mode: -15% optimal
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 col-span-2 lg:col-span-1">
            <span className="text-[9px] text-slate-400 font-sans block uppercase font-bold tracking-wide">
              Carbon Footprint est.
            </span>
            <span className="text-sm font-sans font-extrabold text-slate-800 leading-none block mt-1">
              ~{dailyCarbonEst.toFixed(1)} lbs
            </span>
            <span className="text-[9px] text-slate-500 font-sans block mt-1 leading-none">
              CO₂ eq per 24 hr cycles
            </span>
          </div>
        </div>

        {/* Render Chart */}
        <div className="h-64 w-full mt-3 font-mono text-[10px]">
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'stack' ? (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLighting" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHeating" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAppliances" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" tickLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} unit="W" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    color: '#1e293b',
                    fontSize: '11px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 10, fontSize: '11px' }} />
                <Area
                  type="monotone"
                  dataKey="lighting"
                  name="Smart Lighting"
                  stackId="1"
                  stroke="#f59e0b"
                  fillOpacity={1}
                  fill="url(#colorLighting)"
                />
                <Area
                  type="monotone"
                  dataKey="heating"
                  name="Climate/Heating"
                  stackId="1"
                  stroke="#f97316"
                  fillOpacity={1}
                  fill="url(#colorHeating)"
                />
                <Area
                  type="monotone"
                  dataKey="appliances"
                  name="Smart Appliances"
                  stackId="1"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#colorAppliances)"
                />
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" tickLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} unit="W" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    color: '#1e293b',
                    fontSize: '11px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 10, fontSize: '11px' }} />
                <Bar dataKey="total" name="Total combined load" fill="#94a3b8" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.total > 700 ? '#ef4444' : '#64748b'}
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
        <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-[11px] font-sans text-slate-500 leading-normal">
          <strong>Grid Advice:</strong> Peak drawing occurs between <strong>6 PM – 9 PM</strong>. Enabling eco-timers or staggering automated sweeps during this time could reduce weekly energy costs by up to <strong>22%</strong>.
        </p>
      </div>
    </div>
  );
};
