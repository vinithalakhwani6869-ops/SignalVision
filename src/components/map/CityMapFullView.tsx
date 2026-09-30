import React, { useState } from 'react';
import { Junction, JunctionZone, CongestionLevel, JunctionHotspot, TrackedVehicleRoute } from '../../types/traffic';
import { SignalLight } from '../common/SignalLight';
import { TrackedRouteOverlay } from './TrackedRouteOverlay';
import { VehicleTracker } from '../trajectory/VehicleTracker';
import { TRAJECTORY_JUNCTION_IDS } from '../../data/cityNetwork';
import {
  Search,
  Filter,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Camera,
  Compass,
  AlertTriangle,
  ArrowRight,
  Shield,
  Radio,
  Sliders,
  Zap,
  Route,
  X,
} from 'lucide-react';

interface CityMapFullViewProps {
  junctions: Junction[];
  selectedJunctionId: string;
  onSelectJunction: (id: string) => void;
  onNavigateToLive: (id: string) => void;
  onNavigateToSettings: () => void;
  hotspots?: JunctionHotspot[];
  trackedRoute?: TrackedVehicleRoute | null;
  onTrack?: (plate: string) => Promise<TrackedVehicleRoute | null>;
  onTrackedRouteChange?: (route: TrackedVehicleRoute | null) => void;
}

export const CityMapFullView: React.FC<CityMapFullViewProps> = ({
  junctions,
  selectedJunctionId,
  onSelectJunction,
  onNavigateToLive,
  onNavigateToSettings,
  hotspots = [],
  trackedRoute = null,
  onTrack,
  onTrackedRouteChange,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const activeJunction = junctions.find((j) => j.id === selectedJunctionId) || junctions[0];

  const hotspotById = new Map(hotspots.map((h) => [h.junctionId, h]));
  const flaggedActive = hotspotById.get(activeJunction.id)?.isFlagged ?? false;
  const inNetworkScope = (TRAJECTORY_JUNCTION_IDS as readonly string[]).includes(activeJunction.id);

  const zones: (JunctionZone | 'ALL')[] = [
    'ALL',
    'CBD Central',
    'Tech Corridor',
    'North Ring',
    'Airport Link',
    'West Hub',
  ];

  const filteredJunctions = junctions.filter((j) => {
    const matchesSearch =
      j.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = selectedZone === 'ALL' || j.zone === selectedZone;
    const matchesSeverity = selectedSeverity === 'ALL' || j.congestionLevel === selectedSeverity;
    return matchesSearch && matchesZone && matchesSeverity;
  });

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
    <div className="flex-1 flex flex-col lg:flex-row h-app-header-offset overflow-hidden bg-slate-950">
      {/* Main Map Canvas Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden min-h-[300px] lg:min-h-0">
        {/* Top Floating Control Bar */}
        <div className="absolute top-3 left-3 right-3 lg:top-4 lg:left-4 lg:right-4 z-20 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-3 pointer-events-none">
          {/* Search Box */}
          <div className="relative pointer-events-auto w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search junction name, ID or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 backdrop-blur shadow-lg"
            />
          </div>

          {/* FIND layer: vehicle tracker + active route chip live inside the
              control bar (solid backgrounds) so they never float over the
              map's junction markers / road labels at any screen size. */}
          {(onTrack || trackedRoute) && (
            <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
              {onTrack && onTrackedRouteChange && (
                <VehicleTracker onTrack={onTrack} route={trackedRoute} onRouteChange={onTrackedRouteChange} />
              )}
              {trackedRoute && (
                <div className="flex items-center gap-2 bg-slate-900 border border-cyan-700 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-cyan-300 shadow-lg">
                  <Route className="w-3 h-3" />
                  <span>
                    Tracking {trackedRoute.plateHash.slice(0, 10)}… · {trackedRoute.stops.length} cameras ·{' '}
                    {trackedRoute.segmentTimes.length} segments
                  </span>
                  {onTrackedRouteChange && (
                    <button onClick={() => onTrackedRouteChange(null)} className="text-slate-400 hover:text-white" title="Clear route">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Filter Chips & Zoom Tools */}
          <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
            {/* Zone Filter Dropdown */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg px-2.5 py-1.5 backdrop-blur text-xs flex items-center gap-2 shadow-lg">
              <span className="text-slate-400">Zone:</span>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs max-w-[120px]"
              >
                {zones.map((z) => (
                  <option key={z} value={z} className="bg-slate-900 text-white">
                    {z}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity Filter */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-1 backdrop-blur text-[11px] flex items-center gap-1 shadow-lg">
              {(['ALL', 'critical', 'moderate', 'normal'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-2 py-1 rounded uppercase font-mono font-medium transition-colors ${
                    selectedSeverity === sev
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            {/* Zoom Buttons */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-lg p-1 backdrop-blur flex items-center gap-1 shadow-lg ml-auto sm:ml-0">
              <button
                onClick={() => setZoomScale((z) => Math.min(2, z + 0.15))}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomScale((z) => Math.max(0.7, z - 0.15))}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setZoomScale(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
                title="Reset View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Map Canvas */}
        <div className="relative flex-1 bg-[#070b14] overflow-hidden select-none">
          {/* Subtle Grid Lines */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }}
          />

          {/* SVG Arterial Corridors & Road Network */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none transition-transform duration-200"
            style={{
              transform: `scale(${zoomScale}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              transformOrigin: 'center center',
            }}
          >
            {corridors.map((c, idx) => {
              const jA = junctions.find((j) => j.id === c.from);
              const jB = junctions.find((j) => j.id === c.to);
              if (!jA || !jB) return null;

              const isHigh =
                jA.congestionLevel === 'critical' || jB.congestionLevel === 'critical';
              const isMod =
                jA.congestionLevel === 'moderate' || jB.congestionLevel === 'moderate';

              const stroke = isHigh ? '#f43f5e' : isMod ? '#f59e0b' : '#334155';

              return (
                <g key={idx}>
                  {/* Glow layer */}
                  <line
                    x1={`${jA.coordinates.mapX}%`}
                    y1={`${jA.coordinates.mapY}%`}
                    x2={`${jB.coordinates.mapX}%`}
                    y2={`${jB.coordinates.mapY}%`}
                    stroke={stroke}
                    strokeWidth={isHigh ? 8 : 5}
                    strokeOpacity={isHigh ? 0.35 : 0.2}
                    strokeLinecap="round"
                  />
                  {/* Highway core */}
                  <line
                    x1={`${jA.coordinates.mapX}%`}
                    y1={`${jA.coordinates.mapY}%`}
                    x2={`${jB.coordinates.mapX}%`}
                    y2={`${jB.coordinates.mapY}%`}
                    stroke={stroke}
                    strokeWidth={isHigh ? 3 : 2}
                    strokeDasharray={isHigh ? '6 3' : 'none'}
                    strokeLinecap="round"
                  />
                </g>
              );
            })}
            {trackedRoute && <TrackedRouteOverlay stops={trackedRoute.stops} junctions={junctions} />}
          </svg>

          {/* Interactive Junction Pins */}
          <div
            className="absolute inset-0 pointer-events-auto transition-transform duration-200"
            style={{
              transform: `scale(${zoomScale}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              transformOrigin: 'center center',
            }}
          >
            {filteredJunctions.map((j) => {
              const isSelected = j.id === activeJunction.id;
              const isCritical = j.congestionLevel === 'critical';
              const isModerate = j.congestionLevel === 'moderate';
              const flagged = hotspotById.get(j.id)?.isFlagged ?? false;
              const flagStatus = hotspotById.get(j.id)?.status;

              // FIND→FIX: hotspot-flagged junctions override the pin colour
              // (amber = moderate, rose = critical) regardless of local queue level.
              const pinColor =
                flagStatus === 'critical'
                  ? 'bg-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.95)]'
                  : flagStatus === 'moderate'
                  ? 'bg-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.9)]'
                  : isCritical
                  ? 'bg-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.95)]'
                  : isModerate
                  ? 'bg-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.9)]'
                  : 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]';

              return (
                <div
                  key={j.id}
                  onClick={() => onSelectJunction(j.id)}
                  className="absolute cursor-pointer -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-125 z-20 group"
                  style={{ left: `${j.coordinates.mapX}%`, top: `${j.coordinates.mapY}%` }}
                >
                  {isCritical && (
                    <span className="absolute -inset-2 rounded-full bg-rose-500/40 animate-ping pointer-events-none" />
                  )}

                  {/* Marker Pin Head */}
                  <div
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-mono font-bold text-xs text-slate-950 ${pinColor} ${
                      isSelected ? 'ring-4 ring-white/90 border-slate-950 scale-110' : 'border-slate-900'
                    }`}
                  >
                    {j.code.split('-')[0].slice(0, 2)}
                  </div>

                  {/* Micro label */}
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/95 border border-slate-700 text-slate-200 shadow-xl pointer-events-none flex items-center gap-1.5">
                    <span>{j.name.split('/')[0].trim()}</span>
                    <span className="text-cyan-400 font-bold">{j.congestionScore}%</span>
                    {flagged && (
                      <span className="flex items-center gap-0.5 text-cyan-300 font-bold bg-cyan-950/90 border border-cyan-700/80 rounded px-1">
                        <Zap className="w-2.5 h-2.5" />
                        SignalVision active
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Map Compass & Coordinates */}
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono text-slate-400 backdrop-blur z-20 flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex items-center gap-1.5 text-cyan-400">
              <Compass className="w-4 h-4 shrink-0" />
              <span>Bengaluru Urban Grid</span>
            </div>
            <span className="hidden sm:inline">·</span>
            <span>Scale: 1:25,000</span>
            <span>·</span>
            <span>{filteredJunctions.length} Nodes Displayed</span>
          </div>
        </div>
      </div>

      {/* Side Inspector Panel (On pin click) */}
      <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col shrink-0 overflow-y-auto z-20 max-h-[45vh] sm:max-h-[50vh] lg:max-h-full">
        {/* Panel Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 sticky top-0 backdrop-blur z-10 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
                {activeJunction.id}
              </span>
              <span className="text-[11px] text-slate-400">{activeJunction.zone}</span>
            </div>
            <h2 className="text-sm font-bold text-white mt-1 leading-tight">
              {activeJunction.name}
            </h2>
          </div>

          <span
            className={`font-mono text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider shrink-0 ${
              activeJunction.congestionLevel === 'critical'
                ? 'bg-rose-950 text-rose-300 border border-rose-700'
                : activeJunction.congestionLevel === 'moderate'
                ? 'bg-amber-950 text-amber-300 border border-amber-700'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
            }`}
          >
            {activeJunction.congestionLevel} ({activeJunction.congestionScore}%)
          </span>
        </div>

        {/* Panel Body */}
        <div className="p-4 space-y-4 text-xs">
          {/* FIND→FIX status for this junction */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-400">FIND→FIX status</span>
            {flaggedActive ? (
              <span className="flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 uppercase font-bold">
                <Zap className="w-3 h-3" /> SignalVision active
              </span>
            ) : inNetworkScope ? (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase font-bold">
                Fixed 30s timer
              </span>
            ) : (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-800 uppercase font-bold">
                Outside FIND scope
              </span>
            )}
          </div>

          {/* Camera Preview Thumbnail */}
          <div className="relative rounded-lg overflow-hidden border border-slate-800 group">
            <img
              src={activeJunction.camera.bgImage}
              alt={activeJunction.camera.name}
              className="w-full h-36 object-cover filter brightness-90 group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-2 left-2 bg-slate-950/85 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 flex items-center gap-1 border border-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE RTSP STREAM
            </div>
            <div className="absolute bottom-2 right-2 bg-slate-950/85 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 border border-slate-800">
              {activeJunction.camera.modelLatencyMs}ms Latency
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Wait Reduction</span>
              <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                -{activeJunction.waitReductionPercent}%
              </div>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Total Queue</span>
              <div className="text-lg font-bold font-mono text-white tabular-nums">
                {activeJunction.totalVehicleCount} <span className="text-xs text-slate-500">veh</span>
              </div>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Throughput</span>
              <div className="text-sm font-semibold font-mono text-slate-200 tabular-nums">
                {activeJunction.hourlyThroughput} veh/hr
              </div>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Active Phase</span>
              <div className="text-sm font-semibold font-mono text-emerald-400">
                Lane {activeJunction.lanes[activeJunction.activeLaneIndex].laneId} ({activeJunction.currentPhaseTimer}s)
              </div>
            </div>
          </div>

          {/* Lane Queue Breakdown Table */}
          <div>
            <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Lane Approach Queue Status
            </h4>
            <div className="divide-y divide-slate-800/80 rounded bg-slate-950 border border-slate-800 overflow-hidden font-mono text-[11px]">
              {activeJunction.lanes.map((l) => (
                <div key={l.laneId} className="px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center ${
                        l.signalState === 'GREEN'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {l.laneId}
                    </span>
                    <span className="text-slate-300 font-sans truncate max-w-[120px]">
                      {l.name.split('(')[0]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-200">{l.vehicleCount} veh</span>
                    <span className="text-slate-400">({Math.round(l.queueLengthMeters)}m)</span>
                    <span
                      className={`text-[10px] font-bold ${
                        l.signalState === 'GREEN'
                          ? 'text-emerald-400'
                          : l.signalState === 'AMBER'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {l.signalState}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => onNavigateToLive(activeJunction.id)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors shadow-lg shadow-cyan-950/50"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Open in Live Junction View</span>
            </button>

            <button
              onClick={onNavigateToSettings}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <span>Configure Signal Cycle Bounds</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
