import React from 'react';
import { Shield, Sparkles, Moon, Droplets, Thermometer, Wind } from 'lucide-react';
import { motion } from 'motion/react';

interface SimulationCenterProps {
  onSimulateDrivewayIntrusion: () => void;
  onSimulateEcoLockdown: () => void;
  onSimulateHeatWave: () => void;
  onSimulateKitchenWaterSpill: () => void;
  onSimulateActiveCleaning: () => void;
}

export const SimulationCenter: React.FC<SimulationCenterProps> = ({
  onSimulateDrivewayIntrusion,
  onSimulateEcoLockdown,
  onSimulateHeatWave,
  onSimulateKitchenWaterSpill,
  onSimulateActiveCleaning,
}) => {
  return (
    <div className="bg-[#151518] border border-[#222227] text-white/90 rounded-2xl p-6 shadow-md" id="simulation-hub-portal">
      <div>
        <h3 className="font-sans font-bold text-white text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
          Interactive Event Simulators
        </h3>
        <p className="text-xs text-zinc-400 font-sans mt-0.5">
          Fire custom hardware triggers to test rules, reactive telemetry, and alerts.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
        {/* Intrusion Simulation */}
        <button
          onClick={onSimulateDrivewayIntrusion}
          className="flex items-start gap-3 p-3.5 bg-[#0c0c0e] hover:bg-red-500/10 border border-[#222227] hover:border-red-500/20 text-left rounded-xl transition-all duration-200 cursor-pointer group"
          id="sim-intrusion-btn"
        >
          <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-450 rounded-lg group-hover:scale-105 transition-transform shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-sans text-red-400">
              Trigger Motion Intrusion
            </h4>
            <p className="text-[10px] text-zinc-400 font-sans mt-0.5 leading-tight">
              Simulates detection of backyard movement. Arm camera, lock entryways, power floodlights.
            </p>
          </div>
        </button>

        {/* Eco Midnight Lockdown */}
        <button
          onClick={onSimulateEcoLockdown}
          className="flex items-start gap-3 p-3.5 bg-[#0c0c0e] hover:bg-indigo-500/10 border border-[#222227] hover:border-indigo-500/20 text-left rounded-xl transition-all duration-200 cursor-pointer group"
          id="sim-eco-btn"
        >
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg group-hover:scale-105 transition-transform shrink-0">
            <Moon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-sans text-indigo-400">
              Trigger Eco Night Secured
            </h4>
            <p className="text-[10px] text-zinc-400 font-sans mt-0.5 leading-tight">
              Engages front deadbolt, shuts off all light sources, shifts thermostat ceiling, and activates night security mode.
            </p>
          </div>
        </button>

        {/* Severe heat wave simulation */}
        <button
          onClick={onSimulateHeatWave}
          className="flex items-start gap-3 p-3.5 bg-[#0c0c0e] hover:bg-[#f97316]/10 border border-[#222227] hover:border-[#f97316]/20 text-left rounded-xl transition-all duration-200 cursor-pointer group"
          id="sim-heatwave-btn"
        >
          <div className="p-2 bg-[#f97316]/10 border border-[#f97316]/20 text-orange-400 rounded-lg group-hover:scale-105 transition-transform shrink-0">
            <Thermometer className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-sans text-orange-400">
              Simulate Climatic Heatwave
            </h4>
            <p className="text-[10px] text-zinc-400 font-sans mt-0.5 leading-tight">
              Increases external ambient temperature, launching thermostat cooling compressor and raising power usage stats.
            </p>
          </div>
        </button>

        {/* Under sink moisture trigger */}
        <button
          onClick={onSimulateKitchenWaterSpill}
          className="flex items-start gap-3 p-3.5 bg-[#0c0c0e] hover:bg-cyan-500/10 border border-[#222227] hover:border-cyan-500/20 text-left rounded-xl transition-all duration-200 cursor-pointer group"
          id="sim-water-btn"
        >
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg group-hover:scale-105 transition-transform shrink-0">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-sans text-cyan-400">
              Kitchen Water Spill Alert
            </h4>
            <p className="text-[10px] text-zinc-400 font-sans mt-0.5 leading-tight">
              Fires water leakage sensor alarm in Kitchen. Triggers automatic backyard sprinkler shutoff to save grid pressure.
            </p>
          </div>
        </button>

        {/* Active vacuum sweeper cycle */}
        <button
          onClick={onSimulateActiveCleaning}
          className="flex items-start gap-3 p-3.5 bg-[#0c0c0e] hover:bg-teal-500/10 border border-[#222227] hover:border-teal-500/20 text-left rounded-xl transition-all duration-200 cursor-pointer group"
          id="sim-clean-btn"
        >
          <div className="p-2 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-lg group-hover:scale-105 transition-transform shrink-0">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-sans text-teal-400">
              Deploy Robot Room Sweep
            </h4>
            <p className="text-[10px] text-zinc-400 font-sans mt-0.5 leading-tight">
              Deploys docked vacuum. Starts active cleaning run across Living Room and hallway carpets.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
