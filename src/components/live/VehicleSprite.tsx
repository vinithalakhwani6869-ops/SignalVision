import React from 'react';
import { EmergencyType } from '../../types/traffic';

export type VehicleOrientation = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const rotateClass: Record<VehicleOrientation, string> = {
  RIGHT: 'rotate-0',
  DOWN: 'rotate-90',
  LEFT: 'rotate-180',
  UP: '-rotate-90',
};

type VehicleKind = 'car' | 'auto' | 'bus' | 'motorcycle' | 'truck' | 'ambulance' | 'fire truck' | 'police';

interface VehicleSpriteProps {
  label: VehicleKind;
  emergencyType?: EmergencyType;
  orientation: VehicleOrientation;
}

const Wheel: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => (
  <g>
    <circle cx={cx} cy={cy} r={5.5} fill="#0f172a" />
    <circle cx={cx} cy={cy} r={2.2} fill="#475569" />
  </g>
);

const Car: React.FC = () => (
  <g>
    <ellipse cx={40} cy={56} rx={27} ry={4} fill="rgba(0,0,0,0.28)" />
    <rect x={10} y={28} width={52} height={18} rx={4} fill="#94a3b8" />
    <rect x={30} y={20} width={20} height={12} rx={4} fill="#64748b" />
    <rect x={32.5} y={23} width={6} height={7} rx={1} fill="#334155" />
    <rect x={41} y={23} width={6} height={7} rx={1} fill="#334155" />
    <rect x={60} y={31} width={4} height={4} fill="#fde047" />
    <Wheel cx={24} cy={48} />
    <Wheel cx={50} cy={48} />
  </g>
);

const Auto: React.FC = () => (
  <g>
    <ellipse cx={40} cy={56} rx={28} ry={4} fill="rgba(0,0,0,0.28)" />
    <rect x={9} y={28} width={46} height={20} rx={6} fill="#fbbf24" />
    <path d="M14 26 Q14 18 24 18 L36 18 Q46 18 46 26 Z" fill="#fde047" />
    <rect x={16} y={32} width={10} height={8} rx={2} fill="#b45309" />
    <rect x={60} y={33} width={4} height={3} fill="#fef08a" />
    <Wheel cx={22} cy={50} />
    <Wheel cx={44} cy={50} />
  </g>
);

const Bus: React.FC = () => (
  <g>
    <ellipse cx={40} cy={55} rx={30} ry={4} fill="rgba(0,0,0,0.28)" />
    <rect x={8} y={26} width={58} height={20} rx={5} fill="#38bdf8" />
    <rect x={10} y={19} width={54} height={10} rx={3} fill="#0ea5e9" />
    {[14, 24, 34, 44].map((x) => (
      <rect key={x} x={x} y={21} width={7} height={6.5} rx={1} fill="#0c4a6e" />
    ))}
    <rect x={58} y={28} width={5} height={5} fill="#fef9c3" />
    <Wheel cx={22} cy={48} />
    <Wheel cx={52} cy={48} />
  </g>
);

const Truck: React.FC = () => (
  <g>
    <ellipse cx={38} cy={56} rx={30} ry={4} fill="rgba(0,0,0,0.3)" />
    <rect x={6} y={24} width={30} height={22} rx={3} fill="#94a3b8" />
    <rect x={7} y={26} width={28} height={4} fill="#cbd5e1" />
    <rect x={36} y={30} width={22} height={16} rx={3} fill="#3b82f6" />
    <rect x={50} y={33} width={6} height={7} rx={1} fill="#bfdbfe" />
    <rect x={58} y={33} width={3} height={3} fill="#fde68a" />
    <Wheel cx={18} cy={50} />
    <Wheel cx={34} cy={50} />
    <Wheel cx={50} cy={50} />
  </g>
);

const Motorcycle: React.FC = () => (
  <g>
    <ellipse cx={40} cy={55} rx={26} ry={3} fill="rgba(0,0,0,0.3)" />
    <circle cx={24} cy={50} r={7} fill="#0f172a" />
    <circle cx={56} cy={50} r={7} fill="#0f172a" />
    <circle cx={24} cy={50} r={2.5} fill="#64748b" />
    <circle cx={56} cy={50} r={2.5} fill="#64748b" />
    <rect x={22} y={34} width={36} height={5} rx={2} fill="#334155" />
    <rect x={44} y={22} width={6} height={16} rx={2} fill="#1e293b" />
    <rect x={48} y={43} width={3} height={8} fill="#334155" />
  </g>
);

const Ambulance: React.FC = () => (
  <g>
    <ellipse cx={40} cy={54} rx={27} ry={4} fill="rgba(0,0,0,0.3)" />
    <rect x={10} y={24} width={50} height={22} rx={4} fill="#f8fafc" />
    <rect x={28} y={16} width={24} height={12} rx={3} fill="#f1f5f9" />
    <rect x={34} y={10} width={12} height={5} rx={2} fill="#3b82f6" />
    <rect x={14} y={30} width={42} height={4} fill="#e11d48" />
    <rect x={40} y={28} width={10} height={8} rx={1.5} fill="#f8fafc" />
    <rect x={43} y={29} width={4} height={6} fill="#e11d48" />
    <rect x={41.5} y={30.5} width={7} height={3} fill="#e11d48" />
    <Wheel cx={22} cy={48} />
    <Wheel cx={50} cy={48} />
  </g>
);

const FireTruck: React.FC = () => (
  <g>
    <ellipse cx={38} cy={54} rx={30} ry={4} fill="rgba(0,0,0,0.3)" />
    <rect x={6} y={22} width={52} height={24} rx={4} fill="#dc2626" />
    <rect x={36} y={14} width={16} height={7} rx={2} fill="#991b1b" />
    <rect x={38} y={18} width={4} height={5} fill="#e2e8f0" />
    <rect x={33} y={8} width={12} height={5} rx={2} fill="#f59e0b" />
    <line x1={6} y1={30} x2={56} y2={30} stroke="#fef3c7" strokeWidth={3} />
    <rect x={8} y={24} width={30} height={3} fill="#fecaca" />
    <Wheel cx={18} cy={48} />
    <Wheel cx={34} cy={48} />
    <Wheel cx={52} cy={48} />
  </g>
);

const Police: React.FC = () => (
  <g>
    <ellipse cx={40} cy={54} rx={27} ry={4} fill="rgba(0,0,0,0.32)" />
    <rect x={10} y={24} width={50} height={22} rx={4} fill="#1e3a8a" />
    <rect x={28} y={16} width={24} height={12} rx={3} fill="#172554" />
    <rect x={33} y={9} width={14} height={6} rx={2} fill="#475569" />
    <circle cx={36.5} cy={12} r={2} fill="#ef4444" />
    <circle cx={43.5} cy={12} r={2} fill="#3b82f6" />
    <rect x={14} y={30} width={42} height={3} fill="#f8fafc" />
    <rect x={14} y={36} width={42} height={3} fill="#93c5fd" />
    <rect x={12} y={33} width={12} height={5} rx={1} fill="#f8fafc" />
    <rect x={21} y={31} width={8} height={7} rx={1} fill="#f8fafc" />
    <Wheel cx={22} cy={48} />
    <Wheel cx={50} cy={48} />
  </g>
);

const renderBody = (label: VehicleKind) => {
  switch (label) {
    case 'auto':
      return <Auto />;
    case 'bus':
      return <Bus />;
    case 'truck':
      return <Truck />;
    case 'motorcycle':
      return <Motorcycle />;
    case 'ambulance':
      return <Ambulance />;
    case 'fire truck':
      return <FireTruck />;
    case 'police':
      return <Police />;
    default:
      return <Car />;
  }
};

export const VehicleSprite: React.FC<VehicleSpriteProps> = ({ label, orientation }) => (
  <div className={`absolute inset-0 transition-transform duration-700 ${rotateClass[orientation]}`}>
    <svg viewBox="0 0 80 80" className="w-full h-full drop-shadow" aria-hidden="true">
      {renderBody(label)}
    </svg>
  </div>
);