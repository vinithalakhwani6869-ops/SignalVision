import React from 'react';
import { SignalColor } from '../../types/traffic';

interface CountdownRingProps {
  currentSec: number;
  totalSec: number;
  state: SignalColor;
  size?: number;
  strokeWidth?: number;
}

export const CountdownRing: React.FC<CountdownRingProps> = ({
  currentSec,
  totalSec,
  state,
  size = 80,
  strokeWidth = 6,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = Math.max(1, totalSec);
  const progress = Math.max(0, Math.min(1, currentSec / safeTotal));
  const strokeDashoffset = circumference - progress * circumference;

  const colorConfig = {
    GREEN: {
      stroke: '#10b981', // emerald-500
      glow: 'rgba(16, 185, 129, 0.45)',
      text: 'text-emerald-400',
      label: 'GREEN',
    },
    AMBER: {
      stroke: '#f59e0b', // amber-500
      glow: 'rgba(245, 158, 11, 0.5)',
      text: 'text-amber-400',
      label: 'AMBER',
    },
    RED: {
      stroke: '#ef4444', // red-500
      glow: 'rgba(239, 68, 68, 0.4)',
      text: 'text-rose-400',
      label: 'RED',
    },
  }[state];

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-800"
        />
        {/* Animated Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colorConfig.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.3s ease',
            filter: `drop-shadow(0 0 6px ${colorConfig.glow})`,
          }}
        />
      </svg>
      {/* Centered Number Counter */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-xl font-bold font-mono tabular-nums leading-none tracking-tight ${colorConfig.text}`}>
          {Math.max(0, Math.round(currentSec))}s
        </span>
        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium mt-0.5">
          {state}
        </span>
      </div>
    </div>
  );
};
