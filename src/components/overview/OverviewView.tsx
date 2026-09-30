import React from 'react';
import { Junction, TrafficAlert, JunctionHotspot } from '../../types/traffic';
import { CongestionMapMini } from './CongestionMapMini';
import { TopCongestedList } from './TopCongestedList';
import { AlertsFeed } from './AlertsFeed';
import {
  Network,
  Clock,
  AlertTriangle,
  Server,
  TrendingDown,
  Car,
  Activity,
  ArrowRight,
  ShieldCheck,
  Radar,
} from 'lucide-react';

interface OverviewViewProps {
  junctions: Junction[];
  selectedJunctionId: string;
  onSelectJunction: (id: string) => void;
  onNavigateToLive: (junctionId: string) => void;
  onNavigateToMap: () => void;
  alerts: TrafficAlert[];
  onAcknowledgeAlert: (id: string) => void;
  onDismissAlert: (id: string) => void;
  globalFailSafe: boolean;
  hotspots?: JunctionHotspot[];
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  junctions,
  selectedJunctionId,
  onSelectJunction,
  onNavigateToLive,
  onNavigateToMap,
  alerts,
  onAcknowledgeAlert,
  onDismissAlert,
  globalFailSafe,
  hotspots = [],
}) => {
  // Aggregate KPI computations
  const totalMonitored = junctions.length;
  const avgReduction = (
    junctions.reduce((sum, j) => sum + j.waitReductionPercent, 0) / totalMonitored
  ).toFixed(1);
  const activeAlertsCount = alerts.filter((a) => !a.acknowledged).length;
  const criticalCount = junctions.filter((j) => j.congestionLevel === 'critical').length;
  const totalVehicles = junctions.reduce((sum, j) => sum + j.totalVehicleCount, 0);
  const flaggedCount = hotspots.filter((h) => h.isFlagged).length;

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Fail-Safe Banner if active */}
      {globalFailSafe && (
        <div className="bg-amber-950/60 border border-amber-500/80 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-amber-200 text-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong>FAIL-SAFE ACTIVE:</strong> Citywide traffic controllers have reverted to fixed 60s cycle timers. Real-time YOLOv8 dynamic allocation is suspended.
            </span>
          </div>
          <span className="font-mono text-amber-300 font-bold uppercase tracking-wider shrink-0">
            FIXED TABLE OVERRIDE
          </span>
        </div>
      )}

      {/* FIND→FIX status banner */}
      {flaggedCount > 0 && (
        <div className="bg-cyan-950/40 border border-cyan-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-cyan-200 text-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <Radar className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong>FIND → FIX ACTIVE:</strong> Trajectory tracking flagged <strong className="text-white">{flaggedCount} junction(s)</strong>.{' '}
              SignalVision adaptive control is engaged there; all other junctions run fixed 30s timers.
            </span>
          </div>
          <span className="font-mono text-cyan-300 font-bold uppercase tracking-wider shrink-0">
            SIGNALVISION ACTIVE
          </span>
        </div>
      )}

      {/* Top KPI Strip (4 High-Density Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Monitored Junctions */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Junctions Monitored</span>
            <Network className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-white">
              {totalMonitored}
            </span>
            <span className="text-xs font-mono text-emerald-400">100% Online</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>24 RTSP CCTV feeds processing</span>
          </div>
        </div>

        {/* KPI 2: Avg. Wait Time Reduction */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Avg. Wait Time Reduction</span>
            <TrendingDown className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
              {globalFailSafe ? '0.0%' : `-${avgReduction}%`}
            </span>
            <span className="text-xs text-slate-400">vs Fixed Timing</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>38.6 hrs green time saved daily</span>
          </div>
        </div>

        {/* KPI 3: Active Incident Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Active Alerts</span>
            <AlertTriangle className={`w-4 h-4 ${activeAlertsCount > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-white">
              {activeAlertsCount}
            </span>
            <span className="text-xs font-mono text-rose-400">
              {criticalCount} Critical Nodes
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-rose-400" />
            <span>{totalVehicles} vehicles actively tracked</span>
          </div>
        </div>

        {/* KPI 4: Edge System Uptime */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Edge System Uptime</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-white">
              99.98%
            </span>
            <span className="text-xs font-mono text-slate-400">142h continuous</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Zero hardware sensor failure</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Live City Congestion Radar */}
      <div>
        <CongestionMapMini
          junctions={junctions}
          selectedJunctionId={selectedJunctionId}
          onSelectJunction={(id) => {
            onSelectJunction(id);
            onNavigateToLive(id);
          }}
          onExpandMap={onNavigateToMap}
          onViewLive={onNavigateToLive}
        />
      </div>

      {/* Bottom Split Section: Top Congested Junctions & Live Incidents Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <TopCongestedList junctions={junctions} onViewLive={onNavigateToLive} hotspots={hotspots} />
        <AlertsFeed
          alerts={alerts}
          onAcknowledge={onAcknowledgeAlert}
          onDismiss={onDismissAlert}
          onViewJunction={onNavigateToLive}
        />
      </div>
    </div>
  );
};
