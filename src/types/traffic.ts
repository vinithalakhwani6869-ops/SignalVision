export type SignalColor = 'RED' | 'AMBER' | 'GREEN';

export type JunctionZone = 'CBD Central' | 'Tech Corridor' | 'North Ring' | 'Airport Link' | 'West Hub';

export type CongestionLevel = 'normal' | 'moderate' | 'critical';

export type SystemMode = 'ADAPTIVE_AI' | 'FIXED_FALLBACK' | 'MANUAL_OVERRIDE' | 'EMERGENCY_PRIORITY';

export interface VehicleBreakdown {
  cars: number;
  autos: number;
  buses: number;
  bikes: number;
  trucks: number;
}

export interface LaneData {
  laneId: 'A' | 'B' | 'C' | 'D';
  name: string;
  vehicleCount: number;
  vehicleBreakdown: VehicleBreakdown;
  queueLengthMeters: number;
  signalState: SignalColor;
  currentTimerSec: number;
  allocatedGreenSec: number;
  fixedTimerBaselineSec: number;
  timeSavedSec: number;
  avgSpeedKmph: number;
}

export interface BoundingBox {
  id: string;
  label: 'car' | 'auto' | 'bus' | 'motorcycle' | 'truck' | 'ambulance';
  confidence: number;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number;
  height: number;
  lane: 'A' | 'B' | 'C' | 'D';
  speedKmph: number;
  isEmergency?: boolean;
}

export interface CameraFeedConfig {
  id: string;
  name: string;
  angle: 'North Approach' | 'South Approach' | 'East Approach' | 'West Approach';
  fps: number;
  resolution: string;
  modelLatencyMs: number;
  streamStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  bgImage: string;
  rtspUrl: string;
  codec: string;
}

export interface JunctionConfig {
  minGreenSec: number;
  maxGreenSec: number;
  amberDurationSec: number;
  allRedClearanceSec: number;
  antiStarvationSec: number;
  pedestrianWalkSec: number;
  mode: SystemMode;
  failSafeActive: boolean;
  emergencyPreemptionActive: boolean;
}

export interface TrafficAlert {
  id: string;
  junctionId: string;
  junctionName: string;
  laneId?: 'A' | 'B' | 'C' | 'D';
  timestamp: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  acknowledged: boolean;
}

export interface Junction {
  id: string;
  code: string;
  name: string;
  zone: JunctionZone;
  coordinates: {
    lat: number;
    lng: number;
    mapX: number; // 0-100 for custom vector carto map
    mapY: number;
  };
  congestionLevel: CongestionLevel;
  congestionScore: number; // 0 - 100
  avgWaitTimeSec: number;
  fixedWaitBaselineSec: number;
  waitReductionPercent: number;
  totalVehicleCount: number;
  hourlyThroughput: number;
  activeLaneIndex: number; // 0 = A, 1 = B, 2 = C, 3 = D
  currentPhaseTimer: number;
  lanes: LaneData[];
  camera: CameraFeedConfig;
  config: JunctionConfig;
  trendSparkline: number[];
  lastUpdated: string;
}
