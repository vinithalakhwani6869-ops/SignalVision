import React from 'react';
import { EmergencyType } from '../../types/traffic';

export type VehicleOrientation = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// Inline rotation degrees for each orientation. The SVG sprites are drawn
// facing RIGHT, so 0° = RIGHT, 90° = DOWN, 180° = LEFT, 270° = UP.
const rotateDeg: Record<VehicleOrientation, number> = {
  RIGHT: 0,
  DOWN: 90,
  LEFT: 180,
  UP: 270,
};

type VehicleKind = 'car' | 'auto' | 'bus' | 'motorcycle' | 'truck' | 'ambulance' | 'fire truck' | 'police';

interface VehicleSpriteProps {
  label: VehicleKind;
  emergencyType?: EmergencyType;
  orientation: VehicleOrientation;
}

const Wheel: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => (
  <g>
    <circle cx={cx} cy={cy} r={5} fill="#0a0f1a" />
    <circle cx={cx} cy={cy} r={2} fill="#334155" />
  </g>
);

const Car: React.FC = () => (
  <g>
    <rect x={10} y={28} width={52} height={18} rx={4} fill="#475569" />
    <rect x={30} y={21} width={20} height={11} rx={3} fill="#334155" />
    <rect x={33} y={24} width={6} height={6} rx={1} fill="#1e293b" />
    <rect x={41} y={24} width={6} height={6} rx={1} fill="#1e293b" />
    <rect x={60} y={32} width={3} height={3} rx={1} fill="#a3a37a" />
    <Wheel cx={24} cy={47} />
    <Wheel cx={50} cy={47} />
  </g>
);

const Auto: React.FC = () => (
  <g>
    <rect x={10} y={29} width={44} height={18} rx={5} fill="#78713c" />
    <path d="M15 27 Q15 20 24 20 L36 20 Q45 20 45 27 Z" fill="#8a8340" />
    <rect x={17} y={33} width={9} height={7} rx={2} fill="#5c5420" />
    <rect x={52} y={34} width={3} height={3} fill="#9a9460" />
    <Wheel cx={22} cy={49} />
    <Wheel cx={42} cy={49} />
  </g>
);

const Bus: React.FC = () => (
  <g>
    <rect x={8} y={27} width={58} height={19} rx={4} fill="#2563a0" />
    <rect x={10} y={20} width={54} height={10} rx={3} fill="#1d4f80" />
    {[14, 24, 34, 44].map((x) => (
      <rect key={x} x={x} y={22} width={7} height={6} rx={1} fill="#0c2d4e" />
    ))}
    <rect x={58} y={29} width={4} height={4} rx={1} fill="#c9c49a" />
    <Wheel cx={22} cy={48} />
    <Wheel cx={52} cy={48} />
  </g>
);

const Truck: React.FC = () => (
  <g>
    <rect x={6} y={25} width={34} height={20} rx={3} fill="#5a6475" />
    <rect x={7} y={27} width={32} height={4} fill="#6b7a8c" />
    <rect x={40} y={31} width={22} height={14} rx={3} fill="#2a5090" />
    <rect x={56} y={34} width={5} height={6} rx={1} fill="#7ea8cc" />
    <rect x={62} y={34} width={3} height={3} fill="#c9c49a" />
    <Wheel cx={18} cy={48} />
    <Wheel cx={34} cy={48} />
    <Wheel cx={52} cy={48} />
  </g>
);

const Motorcycle: React.FC = () => (
  <g>
    <circle cx={24} cy={48} r={6} fill="#0a0f1a" />
    <circle cx={52} cy={48} r={6} fill="#0a0f1a" />
    <circle cx={24} cy={48} r={2.2} fill="#475569" />
    <circle cx={52} cy={48} r={2.2} fill="#475569" />
    <rect x={23} y={35} width={30} height={4.5} rx={2} fill="#1e293b" />
    <rect x={42} y={24} width={5} height={14} rx={2} fill="#0f172a" />
    <rect x={46} y={42} width={2.5} height={7} fill="#1e293b" />
  </g>
);

const Ambulance: React.FC = () => (
  <g>
    <rect x={10} y={25} width={50} height={20} rx={4} fill="#c8cdd4" />
    <rect x={36} y={17} width={24} height={12} rx={3} fill="#b8bec6" />
    <rect x={60} y={29} width={3} height={4} fill="#a3a37a" />
    <rect x={14} y={31} width={42} height={3.5} fill="#b33040" />
    <rect x={40} y={29} width={10} height={8} rx={1.5} fill="#d0d4da" />
    <rect x={43} y={30} width={4} height={6} fill="#b33040" />
    <rect x={41.5} y={31.5} width={7} height={3} fill="#b33040" />
    <Wheel cx={22} cy={47} />
    <Wheel cx={50} cy={47} />
  </g>
);

const FireTruck: React.FC = () => (
  <g>
    <rect x={6} y={23} width={52} height={22} rx={4} fill="#a52020" />
    <rect x={36} y={15} width={16} height={7} rx={2} fill="#7a1515" />
    <rect x={38} y={19} width={4} height={5} fill="#9aa3b0" />
    <rect x={33} y={9} width={12} height={5} rx={2} fill="#c48a10" />
    <rect x={58} y={25} width={4} height={4} rx={1} fill="#ccc8a0" />
    <line x1={6} y1={31} x2={56} y2={31} stroke="#ccc8a0" strokeWidth={2.5} />
    <rect x={8} y={25} width={30} height={3} fill="#d4a0a0" />
    <Wheel cx={18} cy={47} />
    <Wheel cx={34} cy={47} />
    <Wheel cx={52} cy={47} />
  </g>
);

const Police: React.FC = () => (
  <g>
    <rect x={10} y={25} width={50} height={20} rx={4} fill="#1a2e6a" />
    <rect x={28} y={17} width={24} height={12} rx={3} fill="#132050" />
    <rect x={33} y={10} width={14} height={6} rx={2} fill="#3a4560" />
    <circle cx={36.5} cy={13} r={2} fill="#c03030" />
    <circle cx={43.5} cy={13} r={2} fill="#2060c0" />
    <rect x={58} y={26} width={3} height={4} fill="#c9c49a" />
    <rect x={14} y={31} width={42} height={2.5} fill="#c8cdd4" />
    <rect x={14} y={36} width={42} height={2.5} fill="#6088c0" />
    <rect x={12} y={33.5} width={12} height={4.5} rx={1} fill="#c8cdd4" />
    <rect x={21} y={32} width={8} height={6.5} rx={1} fill="#c8cdd4" />
    <Wheel cx={22} cy={47} />
    <Wheel cx={50} cy={47} />
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
  <div
    className="absolute inset-0 transition-transform duration-700"
    style={{ transform: `rotate(${rotateDeg[orientation]}deg)` }}
  >
    <svg viewBox="0 0 80 80" className="w-full h-full drop-shadow" aria-hidden="true">
      {renderBody(label)}
    </svg>
  </div>
);