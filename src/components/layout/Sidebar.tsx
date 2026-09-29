import React from 'react';
import {
  LayoutDashboard,
  Video,
  Map,
  BarChart3,
  Sliders,
  ShieldAlert,
  Flame,
  Ambulance,
  Zap,
  Activity,
  Layers,
  ScrollText,
  ShieldCheck,
} from 'lucide-react';

export type ScreenId = 'overview' | 'live' | 'map' | 'analytics' | 'settings' | 'privacy' | 'terms';

interface SidebarProps {
  currentScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  globalFailSafe: boolean;
  onToggleFailSafe: () => void;
  onTriggerSurge: () => void;
  onTriggerEmergency: () => void;
  emergencyActive: boolean;
  activeJunctionName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onSelectScreen,
  globalFailSafe,
  onToggleFailSafe,
  onTriggerSurge,
  onTriggerEmergency,
  emergencyActive,
  activeJunctionName,
  isOpen,
  onClose,
}) => {
  const navItems: { id: ScreenId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'live', label: 'Live Junction View', icon: Video },
    { id: 'map', label: 'City Congestion Map', icon: Map },
    { id: 'analytics', label: 'Analytics & Impact', icon: BarChart3 },
    { id: 'settings', label: 'System & Fail-Safe', icon: Sliders },
  ];

  const handleSelectScreen = (screen: ScreenId) => {
    onSelectScreen(screen);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <aside
        className={`w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none h-full overflow-y-auto overscroll-contain pb-safe
          fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-cyan-900/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white leading-tight">SignalVision</h1>
              <p className="text-[11px] text-slate-400 font-mono">SIH 2026</p>
            </div>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="p-3 space-y-1 flex-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Control Center
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectScreen(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 lg:py-2 rounded-md text-xs font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-cyan-950/70 text-cyan-300 border-l-2 border-cyan-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
                {item.id === 'live' && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            );
          })}

          {/* Operational Quick Actions */}
          <div className="pt-5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            TOC Scenario Tools
          </div>

          <div className="space-y-1.5 px-1">
            {/* Emergency Vehicle Override */}
            <button
              onClick={onTriggerEmergency}
              className={`w-full flex items-center justify-between px-3 py-2 rounded border text-xs font-medium transition-all ${
                emergencyActive
                  ? 'bg-rose-950/80 border-rose-500 text-rose-200 animate-pulse'
                  : 'bg-slate-800/70 border-slate-700/80 text-rose-300 hover:bg-rose-950/40 hover:border-rose-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Ambulance className="w-3.5 h-3.5 text-rose-400" />
                <span>{emergencyActive ? 'Ambulance Active' : 'Trigger Ambulance'}</span>
              </div>
              <span className="text-[10px] font-mono text-rose-400">Green-Wave</span>
            </button>

            {/* Traffic Rush Surge */}
            <button
              onClick={onTriggerSurge}
              className="w-full flex items-center justify-between px-3 py-2 rounded border border-slate-700/80 bg-slate-800/70 text-amber-300 hover:bg-amber-950/40 hover:border-amber-700 text-xs font-medium transition-all"
            >
              <div className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulate Surge (+30)</span>
              </div>
              <span className="text-[10px] font-mono text-amber-400">YOLO</span>
            </button>

            {/* Fail-Safe Toggle */}
            <button
              onClick={onToggleFailSafe}
              title="Operator override: switch all controllers between adaptive AI and fixed 45s timers. This manual interlock is the only thing that changes the engine status."
              className={`w-full flex items-center justify-between px-3 py-2 rounded border text-xs font-medium transition-all ${
                globalFailSafe
                  ? 'bg-amber-950/80 border-amber-500 text-amber-200'
                  : 'bg-slate-800/70 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className={`w-3.5 h-3.5 ${globalFailSafe ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>Fail-Safe Mode</span>
              </div>
              <span className={`text-[10px] font-mono uppercase ${globalFailSafe ? 'text-amber-400' : 'text-slate-400'}`}>
                {globalFailSafe ? 'FIXED' : 'AI'}
              </span>
            </button>
          </div>
        </nav>

        {/* Network Engine Telemetry Status */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Controller Engine</span>
            <span
              className="font-mono text-slate-200 flex items-center gap-1.5 cursor-help"
              title={
                globalFailSafe
                  ? 'Fixed 45s timers active — engaged by operator override (manual fail-safe toggle below or Settings › Safety & Watchdog).'
                  : 'YOLOv8 detection + adaptive phase allocation active on all controllers.'
              }
            >
              <span className={`w-1.5 h-1.5 rounded-full ${globalFailSafe ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
              {globalFailSafe ? 'Fixed 45s Fallback' : 'YOLOv8 Adaptive'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Current Node</span>
            <span className="font-mono text-slate-300 truncate max-w-[110px]" title={activeJunctionName}>
              {activeJunctionName.split(' ')[0]}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Hardware Fleet</span>
            <span className="font-mono text-emerald-400">24/24 Online</span>
          </div>
        </div>

        {/* Legal Footer Links */}
        <div className="p-3 border-t border-slate-800 flex items-center gap-1">
          <button
            onClick={() => handleSelectScreen('privacy')}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <ShieldCheck className="w-3 h-3" />
            Privacy
          </button>
          <span className="text-slate-700">·</span>
          <button
            onClick={() => handleSelectScreen('terms')}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <ScrollText className="w-3 h-3" />
            Terms
          </button>
        </div>
      </aside>
    </>
  );
};
