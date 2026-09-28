import React from 'react';
import { Junction } from '../../types/traffic';
import { Zap, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

interface CycleComparisonBarProps {
  junction: Junction;
}

export const CycleComparisonBar: React.FC<CycleComparisonBarProps> = ({ junction }) => {
  const lanes = junction.lanes;

  // Calculate totals
  const totalFixedSec = lanes.reduce((sum, l) => sum + l.fixedTimerBaselineSec, 0); // e.g. 180s
  const totalAdaptiveSec = lanes.reduce((sum, l) => sum + l.allocatedGreenSec, 0); // dynamic pool e.g. 140-160s

  const colors = [
    { bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-400' },
    { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-400' },
    { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-400' },
    { bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-400' },
  ];

  // Wasted green time saved (sum of baseline green given to empty lanes that was recovered)
  const savedSec = Math.max(
    0,
    lanes.reduce((acc, l) => acc + (l.fixedTimerBaselineSec > l.allocatedGreenSec ? l.fixedTimerBaselineSec - l.allocatedGreenSec : 0), 0)
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 sm:p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-slate-100">
              Cycle Split Comparison: Fixed Timer vs. Adaptive AI Engine
            </h3>
            <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/70 border border-cyan-800 px-1.5 py-0.5 rounded">
              Cycle #{Math.floor(Date.now() / 120000) % 999}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Real-time green light seconds apportioned according to YOLOv8 queue density
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Zap className="w-3.5 h-3.5" />
            <span className="font-bold">{savedSec}s</span>
            <span className="text-slate-400">wasted green recovered</span>
          </div>
        </div>
      </div>

      {/* Comparison Bars */}
      <div className="space-y-3 font-mono text-xs">
        {/* 1. Traditional Fixed Timer Allocation (Equal static 45s splits) */}
        <div>
          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 mb-1">
            <span>Traditional Fixed-Time Program (Static 180s cycle)</span>
            <span className="text-slate-500 hidden sm:inline">45s / 45s / 45s / 45s equal</span>
          </div>

          <div className="h-7 w-full bg-slate-950 rounded border border-slate-800 flex overflow-hidden">
            {lanes.map((l, idx) => {
              const widthPct = (l.fixedTimerBaselineSec / totalFixedSec) * 100;
              return (
                <div
                  key={l.laneId}
                  className="h-full border-r border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-slate-300 font-medium px-1 transition-all"
                  style={{ width: `${widthPct}%` }}
                  title={`Fixed: Lane ${l.laneId} gets static ${l.fixedTimerBaselineSec}s regardless of density`}
                >
                  <span className="truncate">
                    <span className="sm:hidden">{l.laneId}:{l.fixedTimerBaselineSec}s</span>
                    <span className="hidden sm:inline">Lane {l.laneId}: {l.fixedTimerBaselineSec}s</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Adaptive AI Dynamic Allocation */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="text-cyan-300 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              SignalVision Adaptive AI Allocation (Dynamic Density Split)
            </span>
            <span className="font-bold text-emerald-400 tabular-nums">
              Total {totalAdaptiveSec}s Cycle
            </span>
          </div>

          <div className="h-8 w-full bg-slate-950 rounded border border-cyan-800/60 flex overflow-hidden p-0.5 shadow-inner">
            {lanes.map((l, idx) => {
              const widthPct = (l.allocatedGreenSec / totalAdaptiveSec) * 100;
              const col = colors[idx % colors.length];
              const isGreen = l.signalState === 'GREEN';

              return (
                <div
                  key={l.laneId}
                  className={`h-full border-r border-slate-900/60 ${col.bg} flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-slate-950 px-1 sm:px-2 transition-all duration-500 relative group ${
                    isGreen ? 'ring-2 ring-white z-10' : 'opacity-85 hover:opacity-100'
                  }`}
                  style={{ width: `${widthPct}%` }}
                >
                  <span className="truncate">L-{l.laneId}</span>
                  <span className="tabular-nums font-mono">{l.allocatedGreenSec}s</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend / Key */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          {lanes.map((l, idx) => (
            <div key={l.laneId} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-sm ${colors[idx].bg}`} />
              <span>Lane {l.laneId} ({l.vehicleCount} veh)</span>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          Bounds: Min {junction.config.minGreenSec}s · Max {junction.config.maxGreenSec}s · Clearance {junction.config.amberDurationSec}s
        </div>
      </div>
    </div>
  );
};
