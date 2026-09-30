import React from 'react';
import { SimulationComparison } from '../../types/traffic';
import { Zap } from 'lucide-react';

interface BeforeAfterComparisonProps {
  comparison: SimulationComparison;
  signalVisionEnabled?: boolean;
  onToggleSignalVision?: () => void;
}

export const BeforeAfterComparison: React.FC<BeforeAfterComparisonProps> = ({
  comparison,
  signalVisionEnabled,
  onToggleSignalVision,
}) => {
  const hasToggle = typeof signalVisionEnabled === 'boolean' && typeof onToggleSignalVision === 'function';

  return (
    <section className="bg-cyan-950/30 border border-cyan-900 rounded-lg p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">FIND → FIX impact comparison</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Toggle drives the live engine: SignalVision ON = only flagged junctions run adaptive. Simulated metrics.
          </p>
        </div>
        <span className="text-[10px] font-mono text-cyan-300">SIMULATED</span>
      </div>

      {hasToggle && (
        /* Fixed timers / SignalVision ON toggle */
        <div className="mt-3 flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800 text-xs w-full sm:w-auto">
          <button
            onClick={() => signalVisionEnabled && onToggleSignalVision()}
            className={`flex-1 px-3 py-1.5 rounded font-medium transition-colors ${!signalVisionEnabled ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Fixed timers
          </button>
          <button
            onClick={() => !signalVisionEnabled && onToggleSignalVision()}
            className={`flex-1 px-3 py-1.5 rounded font-medium transition-colors flex items-center justify-center gap-1.5 ${signalVisionEnabled ? 'bg-cyan-700 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Zap className="w-3 h-3" />
            SignalVision ON
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
        <div className="bg-slate-950/70 p-3 rounded">
          <span className="text-slate-400">Average waiting time</span>
          <div className="mt-1 font-mono text-white">
            Fixed {comparison.fixedAverageWaitSec}s <span className="text-emerald-300">→ {comparison.signalVisionAverageWaitSec}s</span>
            <div className="text-emerald-400 font-bold mt-0.5">-{comparison.waitImprovementPercent}%</div>
          </div>
        </div>
        <div className="bg-slate-950/70 p-3 rounded">
          <span className="text-slate-400">Average journey time</span>
          <div className="mt-1 font-mono text-white">
            Fixed {comparison.fixedAverageJourneySec}s <span className="text-emerald-300">→ {comparison.signalVisionAverageJourneySec}s</span>
            <div className="text-emerald-400 font-bold mt-0.5">-{comparison.journeyImprovementPercent}%</div>
          </div>
        </div>
      </div>
    </section>
  );
};