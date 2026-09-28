import React, { useState } from 'react';
import { Junction } from '../../types/traffic';
import { Maximize2, ZoomIn, ZoomOut, Layers, Eye } from 'lucide-react';

interface CongestionMapMiniProps {
  junctions: Junction[];
  selectedJunctionId: string;
  onSelectJunction: (id: string) => void;
  onExpandMap: () => void;
  onViewLive: (id: string) => void;
}

export const CongestionMapMini: React.FC<CongestionMapMiniProps> = ({
  junctions,
  selectedJunctionId,
  onSelectJunction,
  onExpandMap,
  onViewLive,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredJunction, setHoveredJunction] = useState<Junction | null>(null);

  // Cartographic road arterial network lines connecting realistic junctions
  const corridors = [
    { from: 'J-02', to: 'J-01', name: 'Bellary Corridor' },
    { from: 'J-01', to: 'J-09', name: 'Old Madras Link' },
    { from: 'J-01', to: 'J-14', name: 'Hosur Inbound Arterial' },
    { from: 'J-14', to: 'J-04', name: 'Koramangala-Silkboard 100ft' },
    { from: 'J-04', to: 'J-12', name: 'Electronic City Flyover' },
    { from: 'J-04', to: 'J-07', name: 'Outer Ring Road (ORR East)' },
    { from: 'J-02', to: 'J-18', name: 'Airport Expressway NH-44' },
    { from: 'J-02', to: 'J-21', name: 'Outer Ring West NH-48' },
  ];

  return (
    <div className="relative bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col h-[340px] sm:h-[400px] lg:h-[420px]">
      {/* Map Bar Header */}
      <div className="px-3 sm:px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-slate-200 truncate">City Network Congestion Radar</span>
          <span className="text-slate-500 hidden sm:inline">·</span>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">Real-time Density Heat</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
            className="p-1.5 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.1))}
            className="p-1.5 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onExpandMap}
            className="flex items-center gap-1 px-2 py-1.5 rounded bg-slate-800/90 hover:bg-slate-700 text-cyan-300 text-xs transition-colors"
            title="Open Dedicated Full Map"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="text-[11px]">Full Map</span>
          </button>
        </div>
      </div>

      {/* Interactive Cartographic Canvas */}
      <div className="relative flex-1 bg-[#0b0f19] overflow-hidden select-none">
        {/* Subtle Map Grid lines */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Vector SVG Arterial Corridors & Road Network */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
        >
          <defs>
            <linearGradient id="roadGlowRed" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="roadGlowAmber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="roadGlowGreen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Render connecting road corridors */}
          {corridors.map((c, idx) => {
            const jA = junctions.find((j) => j.id === c.from);
            const jB = junctions.find((j) => j.id === c.to);
            if (!jA || !jB) return null;

            const isHighCongestion =
              jA.congestionLevel === 'critical' || jB.congestionLevel === 'critical';
            const isModerate =
              jA.congestionLevel === 'moderate' || jB.congestionLevel === 'moderate';

            const strokeColor = isHighCongestion
              ? '#f43f5e'
              : isModerate
              ? '#f59e0b'
              : '#334155';

            return (
              <g key={idx}>
                {/* Outer halo */}
                <line
                  x1={`${jA.coordinates.mapX}%`}
                  y1={`${jA.coordinates.mapY}%`}
                  x2={`${jB.coordinates.mapX}%`}
                  y2={`${jB.coordinates.mapY}%`}
                  stroke={strokeColor}
                  strokeWidth={isHighCongestion ? 6 : 4}
                  strokeOpacity={isHighCongestion ? 0.35 : 0.2}
                  strokeLinecap="round"
                />
                {/* Core road line */}
                <line
                  x1={`${jA.coordinates.mapX}%`}
                  y1={`${jA.coordinates.mapY}%`}
                  x2={`${jB.coordinates.mapX}%`}
                  y2={`${jB.coordinates.mapY}%`}
                  stroke={strokeColor}
                  strokeWidth={isHighCongestion ? 2.5 : 1.5}
                  strokeDasharray={isHighCongestion ? '4 2' : 'none'}
                  strokeLinecap="round"
                />
              </g>
            );
          })}
        </svg>

        {/* Junction Markers */}
        <div
          className="absolute inset-0 pointer-events-auto"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
        >
          {junctions.map((j) => {
            const isSelected = j.id === selectedJunctionId;
            const isCritical = j.congestionLevel === 'critical';
            const isModerate = j.congestionLevel === 'moderate';

            const pinBg = isCritical
              ? 'bg-rose-500 shadow-[0_0_14px_rgba(244,63,94,0.9)]'
              : isModerate
              ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
              : 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.7)]';

            const activeLane = j.lanes[j.activeLaneIndex];

            return (
              <div
                key={j.id}
                onClick={() => onSelectJunction(j.id)}
                onMouseEnter={() => setHoveredJunction(j)}
                onMouseLeave={() => setHoveredJunction(null)}
                className="absolute cursor-pointer -translate-x-1/2 -translate-y-1/2 transition-transform duration-150 hover:scale-125 z-20 group"
                style={{ left: `${j.coordinates.mapX}%`, top: `${j.coordinates.mapY}%` }}
              >
                {/* Animated pulse halo for critical junctions */}
                {isCritical && (
                  <span className="absolute -inset-1.5 rounded-full bg-rose-500/40 animate-ping pointer-events-none" />
                )}

                {/* Node Pill */}
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-mono font-bold text-slate-950 ${pinBg} ${
                    isSelected ? 'ring-2 ring-white border-slate-950' : 'border-slate-900'
                  }`}
                >
                  {j.code.split('-')[0].slice(0, 2)}
                </div>

                {/* Node Label underneath */}
                <div className="absolute top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-slate-300 pointer-events-none">
                  {j.id} · {j.congestionScore}%
                </div>
              </div>
            );
          })}
        </div>

        {/* Hover / Inspection Card Popover */}
        {hoveredJunction && (
          <div className="absolute bottom-14 sm:bottom-3 left-3 right-3 sm:right-auto sm:w-72 bg-slate-900/95 border border-slate-700/90 rounded-lg p-3 text-xs shadow-2xl backdrop-blur max-w-xs z-30 pointer-events-none animate-in fade-in">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-2">
              <span className="font-semibold text-white truncate">{hoveredJunction.name}</span>
              <span
                className={`font-mono text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                  hoveredJunction.congestionLevel === 'critical'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                    : hoveredJunction.congestionLevel === 'moderate'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                }`}
              >
                {hoveredJunction.congestionLevel} ({hoveredJunction.congestionScore}%)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 mb-2">
              <div>
                <span className="text-slate-500">Wait Reduction: </span>
                <span className="font-mono text-emerald-400 font-semibold">
                  -{hoveredJunction.waitReductionPercent}%
                </span>
              </div>
              <div>
                <span className="text-slate-500">Queue Total: </span>
                <span className="font-mono text-slate-200">{hoveredJunction.totalVehicleCount} veh</span>
              </div>
              <div>
                <span className="text-slate-500">Current Phase: </span>
                <span className="font-mono text-emerald-400 font-semibold">
                  Lane {hoveredJunction.lanes[hoveredJunction.activeLaneIndex].laneId} ({hoveredJunction.currentPhaseTimer}s)
                </span>
              </div>
              <div>
                <span className="text-slate-500">YOLO Latency: </span>
                <span className="font-mono text-cyan-400">{hoveredJunction.camera.modelLatencyMs}ms</span>
              </div>
            </div>
            <p className="text-[10px] text-cyan-400 font-mono">Click node to inspect in Live View</p>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 right-3 sm:left-auto bg-slate-900/90 border border-slate-800 rounded px-2.5 py-1.5 text-[10px] font-mono flex flex-wrap items-center justify-center sm:justify-end gap-x-3 gap-y-1 backdrop-blur z-20">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-400">&lt;40% Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-400">40-75% Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-slate-400">&gt;75% Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
};
