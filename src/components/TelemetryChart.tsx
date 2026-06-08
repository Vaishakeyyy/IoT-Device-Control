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
import { EnergyDataPoint } from '../types';
import { energyMockHistory } from '../mockData';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, Info } from 'lucide-react';

interface TelemetryChartProps {
  data?: EnergyDataPoint[];
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({ data = energyMockHistory }) => {
  const [viewMode, setViewMode] = useState<'stack' | 'total'>('stack');

  // Compute stats
  const averageHourlyConsumption = Math.round(
    data.reduce((acc, curr) => acc + curr.total, 0) / data.length
  );
  const peakDraw = Math.max(...data.map((d) => d.total));
  const peakTime = data.find((d) => d.total === peakDraw)?.time || 'N/A';

  // Calculate generic carbon offsets
  const dailyCarbonEst = ((averageHourlyConsumption * 24) / 1000) * 0.85; // lbs of CO2

  return (
    <div className="bg-[#151518] border border-[#222227] rounded-2xl p-6 shadow-md flex flex-col justify-between h-full" id="telemetry-chart-container">
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-sans font-bold text-white text-lg">
              Telemetry Analytics
            </h3>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Comparative analysis of active grid draws and energy distribution.
            </p>
          </div>

          {/* Toggle buttons */}
          <div className="flex items-center space-x-1 bg-[#0c0c0e] p-1 rounded-xl border border-[#222227]">
            <button
              onClick={() => setViewMode('stack')}
              className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all cursor-pointer ${
                viewMode === 'stack'
                  ? 'bg-[#151518] text-white border border-[#222227] shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Category Breakdown
            </button>
            <button
              onClick={() => setViewMode('total')}
              className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all cursor-pointer ${
                viewMode === 'total'
                  ? 'bg-[#151518] text-white border border-[#222227] shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Combined demand
            </button>
          </div>
        </div>

        {/* Highlight insights */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 my-5">
          <div className="bg-[#0c0c0e] p-3 rounded-xl border border-[#222227]">
            <span className="text-[10px] text-zinc-500 font-sans block uppercase font-semibold">
              Peak System Load
            </span>
            <span className="text-sm font-sans font-bold text-white">
              {peakDraw} W
            </span>
            <span className="text-[10px] text-zinc-400 font-sans block">
              Registered at {peakTime}
            </span>
          </div>
          <div className="bg-[#0c0c0e] p-3 rounded-xl border border-[#222227]">
            <span className="text-[10px] text-zinc-500 font-sans block uppercase font-semibold">
              Average load rate
            </span>
            <span className="text-sm font-sans font-bold text-white">
              {averageHourlyConsumption} W
            </span>
            <span className="text-[10px] text-emerald-400 font-sans block flex items-center gap-1">
              <Leaf className="w-3 h-3" /> Eco Mode: -15% optimal
            </span>
          </div>
          <div className="bg-[#0c0c0e] p-3 rounded-xl border border-[#222227] col-span-2 lg:col-span-1">
            <span className="text-[10px] text-zinc-500 font-sans block uppercase font-semibold">
              Carbon Footprint est.
            </span>
            <span className="text-sm font-sans font-bold text-white">
              ~{dailyCarbonEst.toFixed(1)} lbs
            </span>
            <span className="text-[10px] text-zinc-400 font-sans block">
              CO₂ eq per 24 hour cycle
            </span>
          </div>
        </div>

        {/* Render Chart */}
        <div className="h-72 w-full mt-4 font-mono text-[10px]">
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222227" />
                <XAxis dataKey="time" stroke="#52525b" tickLine={false} />
                <YAxis stroke="#52525b" tickLine={false} unit="W" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#151518',
                    borderRadius: '12px',
                    border: '1px solid #222227',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)',
                    color: '#e1e1e6',
                  }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222227" />
                <XAxis dataKey="time" stroke="#52525b" tickLine={false} />
                <YAxis stroke="#52525b" tickLine={false} unit="W" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#151518',
                    borderRadius: '12px',
                    border: '1px solid #222227',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)',
                    color: '#e1e1e6',
                  }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
                <Bar dataKey="total" name="Total combined load" fill="#27272a" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.total > 700 ? '#ef4444' : '#27272a'} // Highlight peak load rates red
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 border-t border-[#222227] pt-3 flex items-start gap-2.5 bg-indigo-950/25 p-3 rounded-xl border border-indigo-500/20">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-[11px] font-sans text-zinc-405 leading-relaxed text-zinc-400">
          <strong>Grid Advice:</strong> Peak drawing occurs between <strong>6 PM – 9 PM</strong>. Enabling eco-timers or staggering automated sweeps during this time could reduce weekly energy costs by up to <strong>22%</strong>.
        </p>
      </div>
    </div>
  );
};
