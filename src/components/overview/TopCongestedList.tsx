import React from 'react';
import { Junction, JunctionHotspot } from '../../types/traffic';
import { Eye, ArrowUpRight, ChevronRight, Zap } from 'lucide-react';

interface TopCongestedListProps {
  junctions: Junction[];
  onViewLive: (junctionId: string) => void;
  hotspots?: JunctionHotspot[];
}

export const TopCongestedList: React.FC<TopCongestedListProps> = ({ junctions, onViewLive, hotspots = [] }) => {
  // Sort by congestion score descending
  const sortedJunctions = [...junctions].sort((a, b) => b.congestionScore - a.congestionScore);
  const hotspotById = new Map(hotspots.map((h) => [h.junctionId, h]));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* Table Header */}
      <div className="px-3 sm:px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Top Congested Junctions</h2>
          <p className="text-xs text-slate-400">Ranked by real-time queue density & spillback index</p>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {junctions.length} Monitored Nodes
        </span>
      </div>

      {/* Rows Container */}
      <div className="divide-y divide-slate-800/80 overflow-y-auto max-h-[360px]">
        {sortedJunctions.map((j, idx) => {
          const isCritical = j.congestionLevel === 'critical';
          const isModerate = j.congestionLevel === 'moderate';
          const flagged = hotspotById.get(j.id)?.isFlagged ?? false;

          return (
            <div
              key={j.id}
              className="px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-slate-850 transition-colors group"
            >
              {/* Left: Rank + Info */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
                <span className="font-mono text-xs font-bold text-slate-500 w-4 text-center shrink-0">
                  #{idx + 1}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-white truncate max-w-[42vw] sm:max-w-[210px] group-hover:text-cyan-300 transition-colors">
                      {j.name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">{j.id}</span>
                    {flagged && (
                      <span className="flex items-center gap-0.5 text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 whitespace-nowrap">
                        <Zap className="w-2.5 h-2.5" />
                        SignalVision active
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-400 mt-0.5">
                    <span>{j.zone}</span>
                    <span>·</span>
                    <span className="font-mono text-slate-300">{j.totalVehicleCount} queued</span>
                    <span>·</span>
                    <span className="font-mono text-emerald-400">-{j.waitReductionPercent}% wait</span>
                  </div>
                </div>
              </div>

              {/* Center: Sparkline Trend */}
              <div className="hidden sm:flex items-center gap-2 shrink-0 px-2">
                <div className="w-16 h-6 flex items-end gap-0.5">
                  {j.trendSparkline.map((val, sIdx) => {
                    const heightPercent = Math.min(100, Math.max(15, (val / 100) * 100));
                    const barColor = isCritical
                      ? 'bg-rose-500'
                      : isModerate
                      ? 'bg-amber-400'
                      : 'bg-emerald-400';
                    return (
                      <div
                        key={sIdx}
                        className={`w-2 rounded-t-sm ${barColor} opacity-70 transition-all`}
                        style={{ height: `${heightPercent}%` }}
                        title={`${val}% congestion`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Right: Congestion badge & View Live CTA */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="font-mono font-bold text-xs text-slate-200 tabular-nums">
                    {j.congestionScore}%
                  </div>
                  <div
                    className={`text-[10px] uppercase font-mono font-semibold ${
                      isCritical ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {j.congestionLevel}
                  </div>
                </div>

                <button
                  onClick={() => onViewLive(j.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-cyan-950/80 border border-slate-700 hover:border-cyan-500/80 text-cyan-300 text-xs font-medium transition-all"
                  title={`Open Live CCTV & Lane telemetry for ${j.name}`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">View Live</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
