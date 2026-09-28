import React from 'react';
import { SignalColor } from '../../types/traffic';

interface SignalLightProps {
  state: SignalColor;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'vertical' | 'horizontal';
}

export const SignalLight: React.FC<SignalLightProps> = ({
  state,
  size = 'md',
  orientation = 'vertical',
}) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const dotSize = isSm ? 'w-2.5 h-2.5' : isLg ? 'w-5 h-5' : 'w-3.5 h-3.5';
  const containerPadding = isSm ? 'p-1 gap-1' : isLg ? 'p-2 gap-2' : 'p-1.5 gap-1.5';

  return (
    <div
      className={`inline-flex items-center justify-center bg-slate-900 border border-slate-700/80 rounded-md shadow-inner ${containerPadding} ${
        orientation === 'vertical' ? 'flex-col' : 'flex-row'
      }`}
      title={`Signal Status: ${state}`}
    >
      {/* RED LIGHT */}
      <div
        className={`${dotSize} rounded-full transition-all duration-200 ${
          state === 'RED'
            ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.9)] ring-1 ring-rose-400'
            : 'bg-rose-950/60 opacity-30'
        }`}
      />
      {/* AMBER LIGHT */}
      <div
        className={`${dotSize} rounded-full transition-all duration-200 ${
          state === 'AMBER'
            ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)] ring-1 ring-amber-300'
            : 'bg-amber-950/60 opacity-30'
        }`}
      />
      {/* GREEN LIGHT */}
      <div
        className={`${dotSize} rounded-full transition-all duration-200 ${
          state === 'GREEN'
            ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] ring-1 ring-emerald-300'
            : 'bg-emerald-950/60 opacity-30'
        }`}
      />
    </div>
  );
};
