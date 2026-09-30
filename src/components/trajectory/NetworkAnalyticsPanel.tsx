import React from 'react';
import { TrajectoryAnalytics } from '../../types/traffic';

interface NetworkAnalyticsPanelProps {
  analytics: TrajectoryAnalytics;
}

export const NetworkAnalyticsPanel: React.FC<NetworkAnalyticsPanelProps> = ({ analytics }) => {
  const peak = Math.max(1, ...analytics.peakHourSeries.map((item) => item.journeys));
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white">Trajectory FIND Analytics</h3>
        <p className="text-xs text-slate-400 mt-0.5">Simulated multi-camera travel-time evidence from anonymized sightings.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 bg-slate-950 border border-slate-800 rounded"><span className="text-slate-400">Average journey</span><strong className="block mt-1 text-xl font-mono text-cyan-300">{analytics.averageJourneyTimeSec || '--'}s</strong></div>
        <div className="p-3 bg-slate-950 border border-slate-800 rounded"><span className="text-slate-400">Bottlenecks found</span><strong className="block mt-1 text-xl font-mono text-amber-300">{analytics.bottlenecks.length}</strong></div>
        <div className="p-3 bg-slate-950 border border-slate-800 rounded"><span className="text-slate-400">Tracked OD pairs</span><strong className="block mt-1 text-xl font-mono text-emerald-300">{analytics.topOriginDestinationPairs.length}</strong></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
        <div className="space-y-2"><h4 className="text-slate-300 font-semibold">Busiest roads</h4>{analytics.busiestRoads.map((road) => <div key={road.id} className="flex justify-between gap-2 text-slate-400"><span className="truncate">{road.name}</span><span className="font-mono text-white shrink-0">{road.sampleCount} trips</span></div>)}</div>
        <div className="space-y-2"><h4 className="text-slate-300 font-semibold">Bottleneck list</h4>{analytics.bottlenecks.length ? analytics.bottlenecks.map((road) => <div key={road.id} className="flex justify-between gap-2 text-slate-400"><span className="truncate">{road.name}</span><span className="font-mono text-amber-300 shrink-0">{road.averageTravelTimeSec}s</span></div>) : <p className="text-slate-500">No flagged segments yet.</p>}</div>
        <div className="space-y-2"><h4 className="text-slate-300 font-semibold">Top origin-destination pairs</h4>{analytics.topOriginDestinationPairs.length ? analytics.topOriginDestinationPairs.map((pair) => <div key={`${pair.originJunctionId}-${pair.destinationJunctionId}`} className="flex justify-between gap-2 text-slate-400"><span>{pair.originJunctionId} → {pair.destinationJunctionId}</span><span className="font-mono text-white shrink-0">{pair.vehicleCount} veh</span></div>) : <p className="text-slate-500">Awaiting completed routes.</p>}</div>
      </div>
      <div><h4 className="text-slate-300 font-semibold text-xs mb-2">Peak-hour journey volume</h4><div className="h-20 flex items-end gap-px">{analytics.peakHourSeries.map((point) => <div key={point.hour} title={`${point.hour}: ${point.journeys} journeys`} className="bg-cyan-500/70 min-w-[2px] flex-1" style={{ height: `${Math.max(3, (point.journeys / peak) * 100)}%` }} />)}</div><div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1"><span>00:00</span><span>12:00</span><span>23:00</span></div></div>
    </section>
  );
};
