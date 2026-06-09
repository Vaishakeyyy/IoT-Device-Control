import React from 'react';
import { Shield, Sparkles, Moon, Droplets, Thermometer, Wind } from 'lucide-react';

export const SimulationCenter = ({
  onSimulateDrivewayIntrusion,
  onSimulateEcoLockdown,
  onSimulateHeatWave,
  onSimulateKitchenWaterSpill,
  onSimulateActiveCleaning,
}) => {
  return (
    <div className="bg-white border border-[#e2e8f0] text-slate-800 rounded-xl p-5 shadow-xs" id="simulation-hub-portal">
      <div>
        <h3 className="font-sans font-bold text-slate-800 text-sm flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          Interactive Event Simulators
        </h3>
        <p className="text-[11px] text-slate-500 font-sans mt-0.5">
          Fire simulated mesh events to test physical device triggers, alarms, and responsive flows.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5">
        {/* Intrusion Simulation */}
        <button
          onClick={onSimulateDrivewayIntrusion}
          className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-left rounded-lg transition-colors cursor-pointer group"
          id="sim-intrusion-btn"
        >
          <div className="p-2 bg-rose-100 border border-rose-200 text-rose-700 rounded-md shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold font-sans text-rose-700 uppercase tracking-wide">
              Trigger Motion Intrusion
            </h4>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5 leading-tight">
              Simulates entryways motion detection: locks deadbolt doors, activates floodlights, frames live camera feeds.
            </p>
          </div>
        </button>

        {/* Eco Midnight Lockdown */}
        <button
          onClick={onSimulateEcoLockdown}
          className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-left rounded-lg transition-colors cursor-pointer group"
          id="sim-eco-btn"
        >
          <div className="p-2 bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-md shrink-0">
            <Moon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold font-sans text-indigo-700 uppercase tracking-wide">
              Eco Night Safety Lockdown
            </h4>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5 leading-tight">
              Secures locks, turns off all illuminating light channels, and drops thermostat load targets to cool save point.
            </p>
          </div>
        </button>

        {/* Severe heat wave simulation */}
        <button
          onClick={onSimulateHeatWave}
          className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 text-left rounded-lg transition-colors cursor-pointer group"
          id="sim-heatwave-btn"
        >
          <div className="p-2 bg-orange-100 border border-orange-200 text-orange-700 rounded-md shrink-0">
            <Thermometer className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold font-sans text-orange-700 uppercase tracking-wide">
              Climatic Heatwave Sweep
            </h4>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5 leading-tight">
              Spikes outdoor summer thermals, triggering localized HVAC refrigerant drawing cycle and power demand load heights.
            </p>
          </div>
        </button>

        {/* Under sink moisture trigger */}
        <button
          onClick={onSimulateKitchenWaterSpill}
          className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-200 text-left rounded-lg transition-colors cursor-pointer group"
          id="sim-water-btn"
        >
          <div className="p-2 bg-sky-100 border border-sky-200 text-sky-700 rounded-md shrink-0">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold font-sans text-sky-700 uppercase tracking-wide">
              Cabinet Leak Detection
            </h4>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5 leading-tight">
              Fires moisture warning alert in Kitchen, triggering garden water valve de-pressurization to mitigate flood damage.
            </p>
          </div>
        </button>

        {/* Active vacuum sweeper cycle */}
        <button
          onClick={onSimulateActiveCleaning}
          className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-200 text-left rounded-lg transition-colors cursor-pointer group"
          id="sim-clean-btn"
        >
          <div className="p-2 bg-teal-100 border border-teal-200 text-teal-700 rounded-md shrink-0">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[11px] font-bold font-sans text-teal-700 uppercase tracking-wide">
              Deploy Vac Clean Routine
            </h4>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5 leading-tight">
              Commands sweeper unit to emerge from station to clear dust from main foyer carpets. Updates live activity.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
