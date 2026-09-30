import React, { useState } from 'react';
import { Junction, JunctionConfig } from '../../types/traffic';
import {
  ShieldAlert,
  Sliders,
  Camera,
  Server,
  Save,
  CheckCircle2,
  RefreshCw,
  Power,
  Cpu,
  Wifi,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface SettingsViewProps {
  junctions: Junction[];
  selectedJunctionId: string;
  onSelectJunction: (id: string) => void;
  onUpdateConfig: (junctionId: string, config: Partial<JunctionConfig>) => void;
  globalFailSafe: boolean;
  onToggleFailSafe: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  junctions,
  selectedJunctionId,
  onSelectJunction,
  onUpdateConfig,
  globalFailSafe,
  onToggleFailSafe,
}) => {
  const [activeTab, setActiveTab] = useState<'bounds' | 'fleet' | 'safety'>('bounds');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const currentJunction = junctions.find((j) => j.id === selectedJunctionId) || junctions[0];

  // Local state for interactive slider adjustments
  const [minGreen, setMinGreen] = useState<number>(currentJunction.config.minGreenSec);
  const [maxGreen, setMaxGreen] = useState<number>(currentJunction.config.maxGreenSec);
  const [amberDuration, setAmberDuration] = useState<number>(currentJunction.config.amberDurationSec);
  const [pedestrianWalk, setPedestrianWalk] = useState<number>(currentJunction.config.pedestrianWalkSec);
  const [antiStarvation, setAntiStarvation] = useState<number>(currentJunction.config.antiStarvationSec);

  // Sync local sliders when junction changes
  React.useEffect(() => {
    setMinGreen(currentJunction.config.minGreenSec);
    setMaxGreen(currentJunction.config.maxGreenSec);
    setAmberDuration(currentJunction.config.amberDurationSec);
    setPedestrianWalk(currentJunction.config.pedestrianWalkSec);
    setAntiStarvation(currentJunction.config.antiStarvationSec);
  }, [currentJunction.id]);

  const handleSaveParameters = () => {
    onUpdateConfig(currentJunction.id, {
      minGreenSec: minGreen,
      maxGreenSec: maxGreen,
      amberDurationSec: amberDuration,
      pedestrianWalkSec: pedestrianWalk,
      antiStarvationSec: antiStarvation,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Settings Navigation & Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-lg p-3 sm:p-4">
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
            System Configuration & Fail-Safe Architecture
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            PLC hardware interlocks, camera fleet diagnostics, and adaptive cycle parameter tuning
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded border border-slate-800 text-xs overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('bounds')}
            className={`px-2.5 sm:px-3 py-1.5 rounded transition-colors font-medium whitespace-nowrap ${
              activeTab === 'bounds'
                ? 'bg-slate-800 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Algorithm Bounds
          </button>
          <button
            onClick={() => setActiveTab('fleet')}
            className={`px-2.5 sm:px-3 py-1.5 rounded transition-colors font-medium whitespace-nowrap ${
              activeTab === 'fleet'
                ? 'bg-slate-800 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Camera Fleet ({junctions.length})
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`px-2.5 sm:px-3 py-1.5 rounded transition-colors font-medium whitespace-nowrap ${
              activeTab === 'safety'
                ? 'bg-slate-800 text-cyan-300 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Safety & Watchdog
          </button>
        </div>
      </div>

      {/* Tab 1: Algorithm Parameter Bounds */}
      {activeTab === 'bounds' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left: Junction Selector & Info (4 cols) */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-200 block mb-1.5">
                Target Monitored Node
              </label>
              <select
                value={selectedJunctionId}
                onChange={(e) => onSelectJunction(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
              >
                {junctions.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.id} — {j.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3.5 bg-slate-950 rounded border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Node Code:</span>
                <span className="font-mono text-cyan-400 font-bold">{currentJunction.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Zone Corridor:</span>
                <span className="text-slate-200">{currentJunction.zone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Mode:</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  {globalFailSafe ? 'Fixed 60s Fallback' : currentJunction.config.mode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Camera Feed ID:</span>
                <span className="font-mono text-slate-300">{currentJunction.camera.id}</span>
              </div>
            </div>

            <div className="p-3.5 bg-cyan-950/40 border border-cyan-800/60 rounded text-xs text-slate-300 leading-relaxed">
              <span className="text-cyan-300 font-bold">Safe Bounds Guarantee:</span> AI
              optimization dynamically calculates phase length between strict minimum safety
              floors and maximum anti-starvation ceilings. Pedestrians and cross-lanes are never
              starved.
            </div>
          </div>

          {/* Right: Sliders Configuration Form (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-5 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white">
                  Adaptive Cycle Parameter Limits ({currentJunction.name})
                </h3>
                <p className="text-xs text-slate-400">
                  Configure timing boundaries enforced by the density allocation engine
                </p>
              </div>

              <button
                onClick={handleSaveParameters}
                className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition-colors shadow-md shadow-cyan-950"
              >
                {saveSuccess ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{saveSuccess ? 'Parameters Saved' : 'Apply Parameters'}</span>
              </button>
            </div>

            <div className="space-y-5">
              {/* Slider 1: Min Green Time */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-start justify-between gap-2 text-xs">
                  <div>
                    <span className="font-medium text-slate-200">Minimum Green Time Floor</span>
                    <span className="text-slate-400 block text-[11px]">
                      Ensures minimum queue discharge time even under zero detected traffic
                    </span>
                  </div>
                  <span className="font-mono font-bold text-cyan-400 text-sm">{minGreen}s</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="30"
                  value={minGreen}
                  onChange={(e) => setMinGreen(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex flex-wrap justify-between gap-x-2 text-[10px] font-mono text-slate-400">
                  <span>10s (Fast clear)</span>
                  <span>Safety standard (15s)</span>
                  <span>30s (Heavy truck lane)</span>
                </div>
              </div>

              {/* Slider 2: Max Green Time */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-start justify-between gap-2 text-xs">
                  <div>
                    <span className="font-medium text-slate-200">Maximum Green Time Ceiling</span>
                    <span className="text-slate-400 block text-[11px]">
                      Anti-starvation cap preventing continuous green even if queue remains dense
                    </span>
                  </div>
                  <span className="font-mono font-bold text-cyan-400 text-sm">{maxGreen}s</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="120"
                  value={maxGreen}
                  onChange={(e) => setMaxGreen(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex flex-wrap justify-between gap-x-2 text-[10px] font-mono text-slate-400">
                  <span>50s (Tight rotation)</span>
                  <span>Nominal cap (85s)</span>
                  <span>120s (Major Expressway)</span>
                </div>
              </div>

              {/* Slider 3: Amber Clearance Duration */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-start justify-between gap-2 text-xs">
                  <div>
                    <span className="font-medium text-slate-200">Amber Clearance Phase</span>
                    <span className="text-slate-400 block text-[11px]">
                      Safety yellow interval based on junction intersection width
                    </span>
                  </div>
                  <span className="font-mono font-bold text-amber-400 text-sm">{amberDuration}s</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="6"
                  value={amberDuration}
                  onChange={(e) => setAmberDuration(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex flex-wrap justify-between gap-x-2 text-[10px] font-mono text-slate-400">
                  <span>3s (Compact junction)</span>
                  <span>4s (Standard)</span>
                  <span>6s (Wide multi-lane)</span>
                </div>
              </div>

              {/* Slider 4: Pedestrian Walk Allowance */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-start justify-between gap-2 text-xs">
                  <div>
                    <span className="font-medium text-slate-200">Pedestrian Walk Interval</span>
                    <span className="text-slate-400 block text-[11px]">
                      Guaranteed walk duration upon push-button or optical pedestrian demand
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{pedestrianWalk}s</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="25"
                  value={pedestrianWalk}
                  onChange={(e) => setPedestrianWalk(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex flex-wrap justify-between gap-x-2 text-[10px] font-mono text-slate-400">
                  <span>10s (Narrow crossing)</span>
                  <span>15s (Standard crosswalk)</span>
                  <span>25s (School/Transit hub)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Camera & Junction Management Fleet */}
      {activeTab === 'fleet' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white">
                Camera Fleet & Edge Inference Hardware
              </h3>
              <p className="text-xs text-slate-400">
                24 Monitored Junctions · Zero external cloud dependency for signal loop
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              All 24 Nodes Online (0 degraded)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-xs font-mono">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Node</th>
                  <th className="py-2.5 px-4 font-semibold font-sans">Junction Name</th>
                  <th className="py-2.5 px-4 font-semibold">RTSP Stream Feed</th>
                  <th className="py-2.5 px-4 font-semibold">Resolution</th>
                  <th className="py-2.5 px-4 font-semibold">YOLOv8 Latency</th>
                  <th className="py-2.5 px-4 font-semibold">Model Status</th>
                  <th className="py-2.5 px-4 font-semibold text-center font-sans">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {junctions.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-850 transition-colors">
                    <td className="py-3 px-4 font-bold text-cyan-400">{j.id}</td>
                    <td className="py-3 px-4 font-sans font-medium text-white">{j.name}</td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] truncate max-w-[180px]" title={j.camera.rtspUrl}>
                      {j.camera.rtspUrl}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{j.camera.resolution}</td>
                    <td className="py-3 px-4 text-cyan-400 font-semibold">{j.camera.modelLatencyMs}ms</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {j.camera.streamStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <button
                        onClick={() => onSelectJunction(j.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Safety & Fail-Safe Architecture */}
      {activeTab === 'safety' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Master Fail-Safe Switch */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-white">
                Master Safety Interlock (Manual Override)
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              In accordance with municipal traffic safety standards, operators can instantly
              command all local controllers to fall back to hardcoded, static 60-second fixed
              timing cycles, isolating the signal heads from AI inference.
            </p>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-xs font-semibold text-white block">
                  Fail-Safe Fallback State
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {globalFailSafe ? 'ACTIVE (Fixed Timers Enforced)' : 'STANDBY (Adaptive AI Active)'}
                </span>
              </div>

              <button
                onClick={onToggleFailSafe}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                  globalFailSafe
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-950/60 ring-2 ring-amber-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <Power className="w-4 h-4" />
                <span>{globalFailSafe ? 'Disengage Fail-Safe' : 'Revert to Fixed Timers'}</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Zero signal dark-time during mode transitions</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Hardware relay interlock prevents conflicting greens</span>
              </div>
            </div>
          </div>

          {/* Hardware Watchdog Simulator */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2.5 text-cyan-400">
              <Cpu className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-white">Hardware Watchdog & Heartbeat</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              If an edge computer stops transmitting heartbeats for &gt;3 consecutive seconds, the
              physical roadside controller PLC automatically trips into flashing amber / fixed
              fail-safe without human intervention.
            </p>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Watchdog Heartbeat:</span>
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  1,000ms OK
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Relay Conflict Interlock:</span>
                <span className="text-emerald-400">PASS (No Green Conflict)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Edge Device Architecture:</span>
                <span className="text-slate-300">NVIDIA Jetson / x86 Edge</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Firmware Build:</span>
                <span className="text-slate-300">KYZEN-OS v2.4-SIH26</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
