import React, { useState, useEffect } from 'react';
import { Play, Pause, Bell, RefreshCw, Cpu, Activity, Menu } from 'lucide-react';
import { ScreenId } from './Sidebar';

interface HeaderProps {
  currentScreen: ScreenId;
  activeJunctionName?: string;
  isPaused: boolean;
  onTogglePause: () => void;
  unreadAlertsCount: number;
  onOpenAlerts?: () => void;
  globalFailSafe: boolean;
  onToggleMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  activeJunctionName,
  isPaused,
  onTogglePause,
  unreadAlertsCount,
  onOpenAlerts,
  globalFailSafe,
  onToggleMenu,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const screenBreadcrumbs: Record<ScreenId, string> = {
    overview: 'Operations Control Center · Citywide Overview',
    live: `Live Junction Node · ${activeJunctionName || 'Koramangala 80ft'}`,
    map: 'City Network GIS · Dynamic Congestion Topography',
    analytics: 'Impact Analytics · 2026 Diurnal Wait-Time Benchmarks',
    settings: 'Hardware Node Infrastructure · Fail-Safe Interlocks',
    privacy: 'SignalVision · Privacy Policy',
    terms: 'SignalVision · Terms & Conditions',
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2 shrink-0">
      {/* Zone 1: Mobile Menu Toggle + Single text element Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {/* Mobile Navigation Drawer Toggle */}
        <button
          onClick={onToggleMenu}
          aria-label="Toggle navigation menu"
          className="lg:hidden p-2 -ml-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/80 transition-colors shrink-0"
        >
          <Menu className="w-4 h-4" />
        </button>

        <span className="text-xs sm:text-sm font-semibold text-slate-200 tracking-tight truncate">
          {screenBreadcrumbs[currentScreen]}
        </span>
        <span className="text-slate-600 hidden lg:inline">|</span>
        <span className="text-xs font-mono text-cyan-400/90 hidden xl:flex items-center gap-1.5 shrink-0">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          YOLOv8n @ 24.2ms
        </span>
      </div>

      {/* Zone 2: Digital Telemetry Clock & Mode Status */}
      <div className="hidden lg:flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <span>Engine:</span>
          <span
            className={`font-mono font-medium cursor-help ${
              globalFailSafe ? 'text-amber-400' : 'text-emerald-400'
            }`}
            title={
              globalFailSafe
                ? 'Fail-safe engaged by OPERATOR OVERRIDE (Sidebar › Fail-Safe Mode / Settings › Safety & Watchdog). All local controllers running fixed 45s timers; YOLOv8 adaptive allocation suspended. No automatic condition triggers this state.'
                : 'Adaptive density control active — no fail-safe engaged. Fallback to fixed timers only occurs via the manual operator override.'
            }
          >
            {globalFailSafe ? 'FIXED FALLBACK' : 'ADAPTIVE DENSITY'}
          </span>
        </div>

        <span className="text-slate-700">·</span>

        <div className="font-mono text-slate-300 tabular-nums font-semibold tracking-wider bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800">
          {currentTime || '12:00:00 IST'}
        </div>
      </div>

      {/* Zone 3: Primary Operational Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Pause/Resume Simulation */}
        <button
          onClick={onTogglePause}
          title={isPaused ? 'Resume live simulation loop' : 'Pause live simulation loop'}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
            isPaused
              ? 'bg-amber-950/60 border-amber-600 text-amber-200 hover:bg-amber-900/60'
              : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700/80'
          }`}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 text-amber-400 shrink-0" /> : <Pause className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          <span className="hidden sm:inline">{isPaused ? 'Simulation Paused' : 'Live Ticking'}</span>
        </button>

        {/* Alerts Badge */}
        <button
          onClick={onOpenAlerts}
          className="relative p-2 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-750 transition-colors"
          title="Active Alerts"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-[10px] font-mono font-bold text-white flex items-center justify-center ring-2 ring-slate-900">
              {unreadAlertsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
