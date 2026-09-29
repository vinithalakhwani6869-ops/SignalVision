import React from 'react';
import { LaneData } from '../../types/traffic';
import { CountdownRing } from '../common/CountdownRing';
import { SignalLight } from '../common/SignalLight';
import { Car, Bus, Bike, Truck, Activity } from 'lucide-react';

interface LaneCardProps {
  lane: LaneData;
  isActiveGreen: boolean;
  onSurgeTraffic?: () => void;
}

export const LaneCard: React.FC<LaneCardProps> = ({
  lane,
  isActiveGreen,
  onSurgeTraffic,
}) => {
  const isGreen = lane.signalState === 'GREEN';
  const isAmber = lane.signalState === 'AMBER';
  const isRed = lane.signalState === 'RED';

  // Total timer for the current phase (either allocatedGreen or baseline)
  const currentTotalPhase = isGreen
    ? lane.allocatedGreenSec
    : isAmber
    ? 4
    : 45; // typical red wait

  const borderColor = isGreen
    ? 'border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-slate-900/95'
    : isAmber
    ? 'border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.15)] bg-slate-900/95'
    : 'border-slate-800 bg-slate-900/70';

  return (
    <div
      className={`rounded-lg border p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-200 relative overflow-hidden ${borderColor}`}
    >
      {/* Top Bar: Lane ID, Street Name, Physical Signal Head */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                isGreen
                  ? 'bg-emerald-500 text-slate-950 ring-1 ring-emerald-300'
                  : isAmber
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {lane.laneId}
            </span>
            <h3 className="font-semibold text-xs text-white truncate" title={lane.name}>
              {lane.name}
            </h3>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
            <span>Queue: <strong className="text-slate-200 font-mono">{Math.round(lane.queueLengthMeters)}m</strong></span>
            <span>·</span>
            <span>Speed: <strong className="text-slate-200 font-mono">{Math.round(lane.avgSpeedKmph)} km/h</strong></span>
          </div>
        </div>

        {/* Physical 3-Lens Signal Light */}
        <SignalLight state={lane.signalState} size="sm" orientation="vertical" />
      </div>

      {/* Middle Section: Vehicle Count & Live Countdown Ring */}
      <div className="my-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        {/* Left: Vehicle Count with Density Status */}
        <div className="min-w-0 flex-1 basis-40">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
            Detected Queue
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-white">
              {lane.vehicleCount}
            </span>
            <span className="text-xs text-slate-400 font-mono">vehicles</span>
          </div>

          {/* Vehicle type breakdown strip */}
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-1.5">
            <span title="Cars: 45%">{lane.vehicleBreakdown.cars}c</span>
            <span>·</span>
            <span title="Auto-Rickshaws">{lane.vehicleBreakdown.autos}a</span>
            <span>·</span>
            <span title="Buses">{lane.vehicleBreakdown.buses}b</span>
            <span>·</span>
            <span title="Two-Wheelers">{lane.vehicleBreakdown.bikes}m</span>
          </div>
        </div>

        {/* Right: Circular Countdown Ring */}
        <div className="shrink-0">
          <CountdownRing
            currentSec={lane.currentTimerSec}
            totalSec={currentTotalPhase}
            state={lane.signalState}
            size={76}
            strokeWidth={5}
          />
        </div>
      </div>

      {/* Bottom Bar: AI Green Allocation vs Fixed Baseline */}
      <div className="pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500">AI Green:</span>
          <span className="font-mono font-bold text-emerald-400">{lane.allocatedGreenSec}s</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-500">Fixed:</span>
          <span className="font-mono text-slate-400">{lane.fixedTimerBaselineSec}s</span>
        </div>

        {onSurgeTraffic && (
          <button
            onClick={onSurgeTraffic}
            className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline"
            title="Simulate +10 vehicles on this lane"
          >
            +10 veh
          </button>
        )}
      </div>
    </div>
  );
};
