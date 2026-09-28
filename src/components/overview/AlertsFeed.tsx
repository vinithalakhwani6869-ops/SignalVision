import React, { useState } from 'react';
import { TrafficAlert } from '../../types/traffic';
import { AlertTriangle, AlertCircle, Info, Check, CheckCheck, ExternalLink, X } from 'lucide-react';

interface AlertsFeedProps {
  alerts: TrafficAlert[];
  onAcknowledge: (id: string) => void;
  onDismiss: (id: string) => void;
  onViewJunction: (junctionId: string) => void;
}

export const AlertsFeed: React.FC<AlertsFeedProps> = ({
  alerts,
  onAcknowledge,
  onDismiss,
  onViewJunction,
}) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'all') return true;
    return a.severity === filter;
  });

  const unackCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* Header with segmented filter buttons */}
      <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-100">Live Incident & Alert Feed</h2>
          {unackCount > 0 && (
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 font-bold">
              {unackCount} pending
            </span>
          )}
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded border border-slate-800 text-[11px] overflow-x-auto max-w-full">
          {(['all', 'critical', 'warning', 'info'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilter(sev)}
              className={`px-2 py-1 sm:py-0.5 rounded transition-colors uppercase font-mono font-medium whitespace-nowrap ${
                filter === sev
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts list */}
      <div className="divide-y divide-slate-800/80 overflow-y-auto max-h-[360px]">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No active incidents matching current filter. All traffic corridors operating within bounds.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'critical';
            const isWarning = alert.severity === 'warning';

            const Icon = isCritical ? AlertCircle : isWarning ? AlertTriangle : Info;
            const iconColor = isCritical
              ? 'text-rose-400 bg-rose-950/50 border-rose-800/80'
              : isWarning
              ? 'text-amber-400 bg-amber-950/50 border-amber-800/80'
              : 'text-cyan-400 bg-cyan-950/50 border-cyan-800/80';

            return (
            <div
              key={alert.id}
              className={`p-3 sm:p-3.5 flex items-start justify-between gap-2 sm:gap-3 transition-colors ${
                !alert.acknowledged ? 'bg-slate-900/90' : 'bg-slate-950/30 opacity-75'
              } hover:bg-slate-850`}
            >
              {/* Left: Icon & Description */}
              <div className="flex items-start gap-2 sm:gap-3 min-w-0">

                  <div className={`p-1.5 rounded border shrink-0 mt-0.5 ${iconColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-200">{alert.title}</span>
                      <span className="font-mono text-[10px] text-slate-400">{alert.timestamp}</span>
                      {alert.acknowledged && (
                        <span className="text-[10px] font-mono text-emerald-400/90 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Ack
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {alert.description}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-[11px]">
                      <button
                        onClick={() => onViewJunction(alert.junctionId)}
                        className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 hover:underline"
                      >
                        <span>{alert.junctionName}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>

                      {alert.laneId && (
                        <span className="text-slate-500 font-mono">
                          Target: Lane {alert.laneId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {!alert.acknowledged && (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-950/70 border border-slate-700 hover:border-emerald-700 text-slate-300 hover:text-emerald-300 text-[11px] font-medium transition-colors"
                      title="Acknowledge alert"
                    >
                      Ack
                    </button>
                  )}
                  <button
                    onClick={() => onDismiss(alert.id)}
                    className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                    title="Dismiss alert"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
