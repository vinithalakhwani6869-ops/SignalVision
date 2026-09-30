import React from 'react';
import { Junction, JunctionHotspot, SegmentTravelMetric, SimulationComparison, TrajectoryAnalytics, TrajectorySimulationState, VehicleSighting } from '../../types/traffic';
import { TRAJECTORY_JUNCTION_IDS } from '../../data/cityNetwork';
import { SimulatorControls } from './SimulatorControls';
import { BeforeAfterComparison } from './BeforeAfterComparison';
import { NetworkAnalyticsPanel } from './NetworkAnalyticsPanel';
import { PrivacyPanel } from './PrivacyPanel';
import { Radar, Activity, ShieldCheck, Map } from 'lucide-react';

interface TrajectoryNetworkViewProps {
  junctions: Junction[];
  simulation: TrajectorySimulationState;
  onStart: () => void;
  onPause: () => void;
  onSpeedChange: (speed: 1 | 2 | 4 | 8) => void;
  onToggleRushHour: () => void;
  analytics: TrajectoryAnalytics;
  hotspots: JunctionHotspot[];
  sightings: VehicleSighting[];
  comparison: SimulationComparison;
  signalVisionEnabled: boolean;
  onToggleSignalVision: () => void;
  onNavigateToMap: () => void;
}

const clockOf = (timestamp: number) => new Date(timestamp).toTimeString().slice(0, 8);
const hashLabel = (hash: string) => `${hash.slice(0, 12)}…`;

export const TrajectoryNetworkView: React.FC<TrajectoryNetworkViewProps> = ({
  junctions,
  simulation,
  onStart,
  onPause,
  onSpeedChange,
  onToggleRushHour,
  analytics,
  hotspots,
  sightings,
  comparison,
  signalVisionEnabled,
  onToggleSignalVision,
  onNavigateToMap,
}) => {
  const junctionName = (id: string) => junctions.find((j) => j.id === id)?.name.split('/')[0].trim() ?? id;
  const flaggedCount = hotspots.filter((h) => h.isFlagged).length;

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* FIND → FIX narrative strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-2.5">
          <Radar className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 sm:mt-0" />
          <span className="text-slate-300 leading-relaxed">
            <strong className="text-white">FIND → FIX loop:</strong>{' '}
            ANPR-style trajectory tracking <strong>finds</strong> congested segments (city-wide visibility), and the
            signal engine only runs its adaptive logic on junctions it <strong>FIX</strong>-flags. Everything else stays on a
            fixed 30s timer.
          </span>
        </div>
        <span className="font-mono text-[10px] text-cyan-300 shrink-0">SIH26127 · CITY-WIDE ANPR + TRAJECTORY ANALYTICS</span>
      </div>

      {/* Controls + before/after comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <SimulatorControls
          simulation={simulation}
          onStart={onStart}
          onPause={onPause}
          onSpeedChange={onSpeedChange}
          onToggleRushHour={onToggleRushHour}
        />
        <div className="lg:col-span-2">
          <BeforeAfterComparison
            comparison={comparison}
            signalVisionEnabled={signalVisionEnabled}
            onToggleSignalVision={onToggleSignalVision}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">
        {/* Analytics */}
        <div className="lg:col-span-3 space-y-4">
          <NetworkAnalyticsPanel analytics={analytics} />

          {/* FIND hotspot flags → FIX activation */}
          <section className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-300" />
                <h3 className="text-sm font-semibold text-white">FIND → FIX activation map</h3>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-950/80 border border-amber-700 text-amber-300">
                {flaggedCount} flagged
              </span>
            </div>
            <div className="divide-y divide-slate-800/80 rounded bg-slate-950 border border-slate-800 overflow-hidden">
              {hotspots.map((hotspot) => {
                const flagged = hotspot.isFlagged;
                return (
                  <div key={hotspot.junctionId} className="px-3 py-2.5 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-400">{hotspot.junctionId}</span>
                        <span className="text-slate-200 truncate">{junctionName(hotspot.junctionId)}</span>
                        {flagged && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 whitespace-nowrap">
                            SIGNALVISION ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {flagged
                          ? 'Adaptive FIX enabled — green split driven by live density'
                          : 'Unflagged — fixed 30s timer (normal ops)'}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-mono font-bold text-xs ${flagged ? 'text-amber-300' : 'text-emerald-300'}`}>
                        {hotspot.averageIncomingTravelTimeSec}s
                      </div>
                      <div className={`text-[10px] uppercase font-mono font-semibold ${flagged ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {hotspot.status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={onNavigateToMap}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded bg-slate-800 hover:bg-cyan-950/60 border border-slate-700 hover:border-cyan-700 text-cyan-300 text-xs font-medium transition-colors"
            >
              <Map className="w-3.5 h-3.5" />
              <span>View flagged junctions on the city map</span>
            </button>
          </section>
        </div>

        {/* Privacy + sightings log */}
        <div className="lg:col-span-2 space-y-4">
          <PrivacyPanel />
          <section className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Hashed sightings log</h3>
              </div>
              <span className="font-mono text-[10px] text-slate-400">24h retention</span>
            </div>
            <div className="divide-y divide-slate-800/80 rounded bg-slate-950 border border-slate-800 overflow-hidden font-mono text-[11px]">
              {sightings.length === 0 ? (
                <div className="px-3 py-6 text-center text-slate-500">
                  Start the simulator to populate the sightings log. Only plate hashes are stored — raw plates are never retained.
                </div>
              ) : (
                [...sightings]
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .slice(0, 10)
                  .map((sighting) => (
                    <div key={`${sighting.plateHash}-${sighting.cameraId}-${sighting.timestamp}`} className="px-3 py-1.5 flex items-center justify-between gap-2">
                      <span className="text-cyan-300 truncate">{hashLabel(sighting.plateHash)}</span>
                      <div className="flex items-center gap-2 text-slate-400 shrink-0">
                        <span>{sighting.cameraId}</span>
                        <span>·</span>
                        <span className="text-slate-300">{sighting.lane}</span>
                        <span>·</span>
                        <span className="text-slate-500">{clockOf(sighting.timestamp)}</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Every entry is {TRAJECTORY_JUNCTION_IDS.length}-junction network traffic: <strong className="text-slate-300">plate hash</strong>, camera, lane, timestamp.
              Raw plates and faces never reach the sightings store.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};