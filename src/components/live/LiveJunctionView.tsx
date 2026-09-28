import React from 'react';
import { Junction } from '../../types/traffic';
import { CctvVideoPlayer } from './CctvVideoPlayer';
import { LaneCard } from './LaneCard';
import { CycleComparisonBar } from './CycleComparisonBar';
import {
  ChevronDown,
  Sparkles,
  Ambulance,
  Flame,
  AlertTriangle,
  RotateCcw,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

interface LiveJunctionViewProps {
  junctions: Junction[];
  selectedJunction: Junction;
  onSelectJunction: (junctionId: string) => void;
  onTriggerSurge: (laneId: 'A' | 'B' | 'C' | 'D', count?: number) => void;
  onTriggerEmergency: (laneId?: 'A' | 'B' | 'C' | 'D') => void;
  emergencyActive: boolean;
  globalFailSafe: boolean;
}

export const LiveJunctionView: React.FC<LiveJunctionViewProps> = ({
  junctions,
  selectedJunction,
  onSelectJunction,
  onTriggerSurge,
  onTriggerEmergency,
  emergencyActive,
  globalFailSafe,
}) => {
  const activeLane = selectedJunction.lanes[selectedJunction.activeLaneIndex];

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Junction Selector & Status Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-lg p-3 sm:p-4">
        {/* Left: Breadcrumbs + Dropdown Selector */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative min-w-0 flex-1 sm:flex-none">
            <select
              value={selectedJunction.id}
              onChange={(e) => onSelectJunction(e.target.value)}
              className="w-full sm:w-auto max-w-full appearance-none bg-slate-950 border border-slate-750 hover:border-slate-600 rounded px-3 py-1.5 pr-8 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              {junctions.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.id} — {j.name} ({j.zone})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <span className="text-slate-500 text-xs hidden sm:inline">·</span>

          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="text-slate-400">Zone:</span>
            <span className="font-medium text-slate-200">{selectedJunction.zone}</span>
          </div>

          <span className="text-slate-500 text-xs hidden md:inline">·</span>

          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="text-slate-400">Throughput:</span>
            <span className="font-mono text-emerald-400 font-semibold">
              {selectedJunction.hourlyThroughput} veh/hr
            </span>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Emergency Priority Trigger */}
          <button
            onClick={() => onTriggerEmergency('B')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded text-xs font-medium border transition-all ${
              emergencyActive
                ? 'bg-rose-950 border-rose-500 text-rose-200 animate-pulse'
                : 'bg-slate-800 hover:bg-rose-950/40 border-slate-700 hover:border-rose-600 text-rose-300'
            }`}
            title="Simulate 108 Emergency Ambulance optical detection on Lane B"
          >
            <Ambulance className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">{emergencyActive ? 'Corridor Cleared' : 'Test Emergency Priority'}</span>
          </button>

          {/* Rush Surge on Lane B */}
          <button
            onClick={() => onTriggerSurge('B', 25)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded bg-slate-800 hover:bg-amber-950/40 border border-slate-700 hover:border-amber-600 text-amber-300 text-xs font-medium transition-all"
            title="Inject +25 vehicles on Lane B to see AI recalculate green split live"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Inject Surge (+25)</span>
          </button>
        </div>
      </div>

      {/* Emergency Mode Alert Strip */}
      {emergencyActive && (
        <div className="bg-rose-950/80 border border-rose-500 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-rose-200 text-xs animate-pulse">
          <div className="flex items-start sm:items-center gap-2">
            <Ambulance className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong>EMERGENCY GREEN-WAVE PRIORITY ACTIVE:</strong> Optical AI detected rapid emergency vehicle approach on Lane B. Cross-traffic lanes placed in all-red hold. Priority window active for 30s.
            </span>
          </div>
          <span className="font-mono text-rose-400 font-bold shrink-0">ALL-RED CONFLICT HOLD</span>
        </div>
      )}

      {/* Core Split Layout: Left Simulated CCTV + Right 4 Lane Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* Left Column: Simulated CCTV Panel (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <CctvVideoPlayer
            junction={selectedJunction}
            emergencyActive={emergencyActive}
          />
        </div>

        {/* Right Column: 4 Lane Cards (5 cols) */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
          {selectedJunction.lanes.map((lane) => (
            <LaneCard
              key={lane.laneId}
              lane={lane}
              isActiveGreen={lane.signalState === 'GREEN'}
              onSurgeTraffic={() => onTriggerSurge(lane.laneId, 10)}
            />
          ))}
        </div>
      </div>

      {/* Below: Cycle Split Comparison Bar */}
      <div>
        <CycleComparisonBar junction={selectedJunction} />
      </div>
    </div>
  );
};
