import React from 'react';
import { Flame, Pause, Play } from 'lucide-react';
import { TrajectorySimulationState } from '../../types/traffic';

interface SimulatorControlsProps {
  simulation: TrajectorySimulationState;
  onStart: () => void;
  onPause: () => void;
  onSpeedChange: (speed: 1 | 2 | 4 | 8) => void;
  onToggleRushHour: () => void;
}

export const SimulatorControls: React.FC<SimulatorControlsProps> = ({ simulation, onStart, onPause, onSpeedChange, onToggleRushHour }) => (
  <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-2 shadow-lg backdrop-blur text-xs space-y-2">
    <div className="flex items-center justify-between gap-3"><span className="font-semibold text-white">Trajectory simulator</span><span className="font-mono text-[10px] text-cyan-300">SIMULATED</span></div>
    <div className="flex items-center gap-1.5 flex-wrap">
      <button onClick={simulation.isRunning ? onPause : onStart} className="p-1.5 rounded bg-cyan-700 hover:bg-cyan-600 text-white" title={simulation.isRunning ? 'Pause trajectory simulator' : 'Start trajectory simulator'}>{simulation.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}</button>
      {[1, 2, 4, 8].map((speed) => <button key={speed} onClick={() => onSpeedChange(speed as 1 | 2 | 4 | 8)} className={`px-2 py-1 rounded font-mono ${simulation.speedMultiplier === speed ? 'bg-slate-700 text-cyan-300' : 'text-slate-400 hover:text-white'}`}>{speed}x</button>)}
      <button onClick={onToggleRushHour} className={`flex items-center gap-1 px-2 py-1 rounded border ${simulation.rushHourActive ? 'bg-amber-950 border-amber-600 text-amber-200' : 'border-slate-700 text-slate-300 hover:bg-slate-800'}`}><Flame className="w-3 h-3" />Rush hour</button>
    </div>
    <div className="text-[10px] font-mono text-slate-400">{simulation.sightingCount} hashed sightings · {simulation.isRunning ? 'running' : 'paused'}</div>
  </div>
);
