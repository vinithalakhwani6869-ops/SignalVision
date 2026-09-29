import React, { useState } from 'react';
import { Sidebar, ScreenId } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewView } from './components/overview/OverviewView';
import { LiveJunctionView } from './components/live/LiveJunctionView';
import { CityMapFullView } from './components/map/CityMapFullView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SettingsView } from './components/settings/SettingsView';
import { LegalPage } from './components/legal/LegalPage';
import { useTrafficSimulation } from './hooks/useTrafficSimulation';
import { X, Check, Bell, AlertTriangle } from 'lucide-react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('overview');
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const {
    junctions,
    selectedJunction,
    selectedJunctionId,
    setSelectedJunctionId,
    alerts,
    globalFailSafe,
    isPaused,
    setIsPaused,
    emergencyActive,
    activeEmergencyTypes,
    triggerTrafficSurge,
    triggerEmergencyPreemption,
    triggerPedestrianCall,
    toggleFailSafe,
    updateJunctionConfig,
    acknowledgeAlert,
    dismissAlert,
  } = useTrafficSimulation();

  const unreadAlertsCount = alerts.filter((a) => !a.acknowledged).length;

  const handleNavigateToLive = (junctionId: string) => {
    setSelectedJunctionId(junctionId);
    setCurrentScreen('live');
    setIsSidebarOpen(false);
  };

  const handleNavigateToMap = () => {
    setCurrentScreen('map');
    setIsSidebarOpen(false);
  };

  const handleNavigateToSettings = () => {
    setCurrentScreen('settings');
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-app w-full overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Persistent Left Sidebar (off-canvas drawer on mobile) */}
      <Sidebar
        currentScreen={currentScreen}
        onSelectScreen={setCurrentScreen}
        globalFailSafe={globalFailSafe}
        onToggleFailSafe={toggleFailSafe}
        onTriggerSurge={() => triggerTrafficSurge('B', 30)}
        onTriggerEmergency={() => triggerEmergencyPreemption('B')}
        emergencyActive={emergencyActive}
        activeJunctionName={selectedJunction.name}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          currentScreen={currentScreen}
          activeJunctionName={selectedJunction.name}
          isPaused={isPaused}
          onTogglePause={() => setIsPaused(!isPaused)}
          unreadAlertsCount={unreadAlertsCount}
          onOpenAlerts={() => setIsAlertsDrawerOpen(true)}
          globalFailSafe={globalFailSafe}
          onToggleMenu={() => setIsSidebarOpen((open) => !open)}
        />

        {/* Dynamic Viewport */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-950 overscroll-contain">
          {currentScreen === 'overview' && (
            <OverviewView
              junctions={junctions}
              selectedJunctionId={selectedJunctionId}
              onSelectJunction={setSelectedJunctionId}
              onNavigateToLive={handleNavigateToLive}
              onNavigateToMap={handleNavigateToMap}
              alerts={alerts}
              onAcknowledgeAlert={acknowledgeAlert}
              onDismissAlert={dismissAlert}
              globalFailSafe={globalFailSafe}
            />
          )}

          {currentScreen === 'live' && (
            <LiveJunctionView
              junctions={junctions}
              selectedJunction={selectedJunction}
              onSelectJunction={setSelectedJunctionId}
              onTriggerSurge={triggerTrafficSurge}
              onTriggerEmergency={triggerEmergencyPreemption}
              onTriggerPedestrian={triggerPedestrianCall}
              emergencyTypes={activeEmergencyTypes}
              emergencyActive={emergencyActive}
              globalFailSafe={globalFailSafe}
            />
          )}

          {currentScreen === 'map' && (
            <CityMapFullView
              junctions={junctions}
              selectedJunctionId={selectedJunctionId}
              onSelectJunction={setSelectedJunctionId}
              onNavigateToLive={handleNavigateToLive}
              onNavigateToSettings={handleNavigateToSettings}
            />
          )}

          {currentScreen === 'analytics' && (
            <AnalyticsView
              junctions={junctions}
              onNavigateToLive={handleNavigateToLive}
            />
          )}

          {currentScreen === 'settings' && (
            <SettingsView
              junctions={junctions}
              selectedJunctionId={selectedJunctionId}
              onSelectJunction={setSelectedJunctionId}
              onUpdateConfig={updateJunctionConfig}
              globalFailSafe={globalFailSafe}
              onToggleFailSafe={toggleFailSafe}
            />
          )}

          {currentScreen === 'privacy' && (
            <LegalPage kind="privacy" onBack={() => setCurrentScreen('overview')} />
          )}

          {currentScreen === 'terms' && (
            <LegalPage kind="terms" onBack={() => setCurrentScreen('overview')} />
          )}
        </main>
      </div>

      {/* Quick Alerts Modal / Drawer */}
      {isAlertsDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full sm:max-w-md h-full sm:h-auto sm:max-h-full bg-slate-900 border-t sm:border-t-0 sm:border-l border-slate-800 p-4 sm:p-5 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Bell className="w-4 h-4 text-cyan-400 shrink-0" />
                <h3 className="text-sm font-semibold text-white truncate">Active Traffic Alerts</h3>
                <span className="font-mono text-xs text-rose-400 font-bold shrink-0">
                  ({unreadAlertsCount} unacknowledged)
                </span>
              </div>
              <button
                onClick={() => setIsAlertsDrawerOpen(false)}
                aria-label="Close alerts drawer"
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 my-3 space-y-2">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No active traffic incidents.
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="pt-3 pb-2 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{alert.title}</span>
                      <span className="font-mono text-[10px] text-slate-400">{alert.timestamp}</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed text-[11px]">{alert.description}</p>
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => {
                          handleNavigateToLive(alert.junctionId);
                          setIsAlertsDrawerOpen(false);
                        }}
                        className="text-cyan-400 hover:underline text-[11px]"
                      >
                        Inspect {alert.junctionName.split(' ')[0]}
                      </button>
                      {!alert.acknowledged && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 text-[10px] border border-slate-700 font-medium"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsAlertsDrawerOpen(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs text-slate-200 font-medium"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
