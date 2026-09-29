import React, { useState } from 'react';
import { Junction, EmergencyType } from '../../types/traffic';
import { CctvVideoPlayer } from './CctvVideoPlayer';
import { LaneCard } from './LaneCard';
import { CycleComparisonBar } from './CycleComparisonBar';
import {
  ChevronDown,
  Sparkles,
  Ambulance,
  Flame,
  FireExtinguisher,
  Siren,
  PersonStanding,
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
  onTriggerEmergency: (laneId?: 'A' | 'B' | 'C' | 'D', type?: EmergencyType) => void;
  onTriggerPedestrian: () => void;
  emergencyTypes: EmergencyType[];
  emergencyActive: boolean;
  globalFailSafe: boolean;
}

export const LiveJunctionView: React.FC<LiveJunctionViewProps> = ({
  junctions,
  selectedJunction,
  onSelectJunction,
  onTriggerSurge,
  onTriggerEmergency,
  onTriggerPedestrian,
  emergencyTypes,
  emergencyActive,
  globalFailSafe,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const activeLane = selectedJunction.lanes[selectedJunction.activeLaneIndex];

  const emergencyTypeLabels: Record<EmergencyType, string> = {
    AMBULANCE: 'AMBULANCE',
    FIRE: 'FIRE ENGINE',
    OTHER: 'POLICE / EMERGENCY SERVICE',
  };
  const activeEmergencyLabels =
    emergencyTypes.length > 0
      ? emergencyTypes.map((t) => emergencyTypeLabels[t]).join(' + ')
      : 'EMERGENCY VEHICLE';

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Junction Selector & Status Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg">
        {/* Row 1: Context + Custom Junction Selector */}
        <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex items-center gap-2 text-xs min-w-0">
            <span className="text-slate-400 hidden sm:inline shrink-0">Node:</span>
            <span className="text-xs font-semibold text-slate-200 truncate">
              {selectedJunction.name}
            </span>
          </div>

          {/* Custom Junction Dropdown (no native popup overlap) */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsDropdownOpen((o) => !o)}
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
              className="flex items-center gap-2 bg-slate-950 border border-slate-700 hover:border-slate-500 rounded-md px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              <span className="font-mono text-cyan-300">{selectedJunction.id}</span>
              <span className="text-slate-200 truncate max-w-[180px] sm:max-w-[240px]">
                {selectedJunction.name.split('/')[0].trim()}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsDropdownOpen(false)}
                  aria-hidden="true"
                />
                <div
                  role="listbox"
                  className="absolute z-30 left-0 top-full mt-1 w-72 max-h-72 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 shadow-2xl py-1"
                >
                  {junctions.map((j) => (
                    <button
                      key={j.id}
                      role="option"
                      aria-selected={j.id === selectedJunction.id}
                      onClick={() => {
                        onSelectJunction(j.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 transition-colors ${
                        j.id === selectedJunction.id
                          ? 'bg-cyan-950/60 text-cyan-300'
                          : 'text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-mono font-semibold shrink-0">{j.id}</span>
                      <span className="truncate text-slate-400">
                        {j.name.split('/')[0].trim()} · {j.zone}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <span className="text-slate-500 text-xs shrink-0">·</span>

          <div className="flex items-center gap-1.5 text-xs shrink-0">
            <span className="text-slate-400">Zone:</span>
            <span className="font-medium text-slate-200">{selectedJunction.zone}</span>
          </div>

          <span className="text-slate-500 text-xs hidden lg:inline shrink-0">·</span>

          <div className="hidden lg:flex items-center gap-1.5 text-xs shrink-0">
            <span className="text-slate-400">Throughput:</span>
            <span className="font-mono text-emerald-400 font-semibold">
              {selectedJunction.hourlyThroughput} veh/hr
            </span>
          </div>
        </div>

        {/* Row 2: Compact Operational Action Toolbar */}
        <div className="px-3 sm:px-4 py-2.5 border-t border-slate-800/70 flex flex-wrap items-center gap-2">
          {/* Emergency Priority Trigger */}
          <button
            onClick={() => onTriggerEmergency('B')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-all ${
              emergencyActive
                ? 'bg-rose-950 border-rose-500 text-rose-200 animate-pulse'
                : 'bg-slate-800 hover:bg-rose-950/40 border-slate-700 hover:border-rose-600 text-rose-300'
            }`}
            title="Green-wave Lane B for an ambulance — 45s GREEN, cross-traffic all-red hold, auto-clears after 30s"
          >
            <Ambulance className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">
              {emergencyActive ? 'Corridor Cleared' : 'Test Emergency'}
            </span>
          </button>

          {/* Fire Vehicle Priority Trigger */}
          <button
            onClick={() => onTriggerEmergency('B', 'FIRE')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-all ${
              emergencyTypes.includes('FIRE')
                ? 'bg-orange-950 border-orange-500 text-orange-200 animate-pulse'
                : 'bg-slate-800 hover:bg-orange-950/40 border-slate-700 hover:border-orange-600 text-orange-300'
            }`}
            title="Green-wave Lane B for a fire engine — 45s GREEN, cross-traffic all-red hold, auto-clears after 30s"
          >
            <FireExtinguisher className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span className="truncate">Fire Priority</span>
          </button>

          {/* Other Emergency Service (Police) Priority Trigger */}
          <button
            onClick={() => onTriggerEmergency('B', 'OTHER')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium border transition-all ${
              emergencyTypes.includes('OTHER')
                ? 'bg-sky-950 border-sky-500 text-sky-200 animate-pulse'
                : 'bg-slate-800 hover:bg-sky-950/40 border-slate-700 hover:border-sky-600 text-sky-300'
            }`}
            title="Green-wave Lane B for police / emergency service — 45s GREEN, cross-traffic all-red hold, auto-clears after 30s"
          >
            <Siren className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate">Other Priority</span>
          </button>

          {/* Pedestrian Crossing Demand Trigger */}
          <button
            onClick={onTriggerPedestrian}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium border border-slate-700 bg-slate-800 hover:bg-emerald-950/40 hover:border-emerald-600 text-emerald-300 transition-all"
            title="Simulate pedestrian push-button demand — all approaches held RED for the walk phase at the next signal boundary"
          >
            <PersonStanding className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Pedestrian Call</span>
          </button>

          {/* Rush Surge on Lane B */}
          <button
            onClick={() => onTriggerSurge('B', 25)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium bg-slate-800 hover:bg-amber-950/40 border border-slate-700 hover:border-amber-600 text-amber-300 transition-all"
            title="Inject +25 vehicles on Lane B to watch the AI recalculate green splits live"
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
              <strong>EMERGENCY GREEN-WAVE PRIORITY ACTIVE:</strong> Optical AI detected rapid {activeEmergencyLabels} approach on Lane B. Cross-traffic lanes placed in all-red hold. Priority window active for 30s.
            </span>
          </div>
          <span className="font-mono text-rose-400 font-bold shrink-0">ALL-RED CONFLICT HOLD</span>
        </div>
      )}

      {/* Pedestrian Wait Phase Strip */}
      {selectedJunction.pedestrian.walkActive && (
        <div className="bg-emerald-950/80 border border-emerald-500 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-emerald-200 text-xs animate-pulse">
          <div className="flex items-start sm:items-center gap-2">
            <PersonStanding className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong>PEDESTRIAN WALK PHASE ACTIVE:</strong> Push-button demand served. All vehicle approaches held at RED. Crossing window {selectedJunction.pedestrian.walkTimerSec}s.
            </span>
          </div>
          <span className="font-mono text-emerald-400 font-bold shrink-0">ALL APPROACHES HELD</span>
        </div>
      )}
      {selectedJunction.pedestrian.waiting && !selectedJunction.pedestrian.walkActive && (
        <div className="bg-emerald-950/40 border border-emerald-700/80 rounded-lg p-2.5 flex items-center gap-2 text-emerald-300 text-xs">
          <PersonStanding className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            <strong>PEDESTRIANS WAITING:</strong> guaranteed {selectedJunction.config.pedestrianWalkSec}s walk phase will start at the next signal phase boundary.
          </span>
        </div>
      )}

      {/* Core Split Layout: Left Simulated CCTV + Right 4 Lane Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* Left Column: Simulated CCTV Panel (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <CctvVideoPlayer
            junction={selectedJunction}
            emergencyTypes={emergencyTypes}
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
