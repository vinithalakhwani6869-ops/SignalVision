import { Junction, EmergencyType } from '../../types/traffic';

export type SceneAngle = 'North Approach' | 'South Approach' | 'East Approach' | 'West Approach';

export const SCENE_ANGLES: SceneAngle[] = [
  'North Approach',
  'East Approach',
  'South Approach',
  'West Approach',
];

export type LaneId = 'A' | 'B' | 'C' | 'D';
export type VehicleKind =
  | 'car'
  | 'auto'
  | 'bus'
  | 'motorcycle'
  | 'truck'
  | 'ambulance'
  | 'fire truck'
  | 'police';
export type VehicleOrientation = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type CrosswalkId = 'N' | 'E' | 'S' | 'W';

export type LaneFlows = Record<LaneId, number>;
export type CrosswalkFlows = Record<CrosswalkId, number>;

export interface LaneGeometry {
  lane: LaneId;
  major: 'x' | 'y';
  from: number;
  to: number;
  subs: number[];
  orient: VehicleOrientation;
}

/**
 * Schematic approach arms around the central junction.
 * Coordinates are viewport percentages (y grows downward).
 *  - A (North) runs top -> center (DOWN), two sub-lanes at x 46/54
 *  - B (East) runs right -> center (LEFT), two sub-lanes at y 46/52
 *  - C (South) runs bottom -> center (UP), two sub-lanes at x 46/54
 *  - D (West) runs left -> center (RIGHT), two sub-lanes at y 46/52
 */
const LANE_GEOMETRY: Record<LaneId, LaneGeometry> = {
  A: { lane: 'A', major: 'y', from: 15, to: 44, subs: [46, 54], orient: 'DOWN' },
  B: { lane: 'B', major: 'x', from: 88, to: 64, subs: [46, 52], orient: 'LEFT' },
  C: { lane: 'C', major: 'y', from: 88, to: 56, subs: [46, 54], orient: 'UP' },
  D: { lane: 'D', major: 'x', from: 12, to: 38, subs: [46, 52], orient: 'RIGHT' },
};

const MAX_VEHICLES_PER_LANE: Record<LaneId, number> = { A: 12, B: 14, C: 10, D: 8 };

export interface Crosswalk {
  id: CrosswalkId;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  walkAxis: 'x' | 'y';
  // Lanes whose GREEN clears this crossing, so it is safe to walk in parallel.
  parallelLanes: LaneId[];
}

/**
 * Four crosswalk bands at the junction mouth. Standard concurrent (parallel)
 * pedestrian phasing: pedestrians on the N/S crosswalks (walking E-W) are
 * cleared by the E-W traffic phases (lanes B/D); pedestrians on the E/W
 * crosswalks (walking N-S) are cleared by the N-S phases (lanes A/C).
 */
export const CROSSWALKS: Crosswalk[] = [
  { id: 'N', label: 'North', x: 41, y: 45, width: 18, height: 2, walkAxis: 'x', parallelLanes: ['B', 'D'] },
  { id: 'E', label: 'East', x: 56, y: 41, width: 2, height: 18, walkAxis: 'y', parallelLanes: ['A', 'C'] },
  { id: 'S', label: 'South', x: 41, y: 53, width: 18, height: 2, walkAxis: 'x', parallelLanes: ['B', 'D'] },
  { id: 'W', label: 'West', x: 42, y: 41, width: 2, height: 18, walkAxis: 'y', parallelLanes: ['A', 'C'] },
];

// Which approach a selected camera angle is centered on.
export function getFocusLane(angle: SceneAngle): LaneId {
  switch (angle) {
    case 'North Approach':
      return 'A';
    case 'East Approach':
      return 'B';
    case 'South Approach':
      return 'C';
    case 'West Approach':
      return 'D';
  }
}

const VEHICLE_SIZE: Record<VehicleKind, { width: number; height: number }> = {
  car: { width: 7, height: 5.5 },
  auto: { width: 6.5, height: 5.5 },
  bus: { width: 10, height: 7 },
  motorcycle: { width: 5, height: 4.5 },
  truck: { width: 10.5, height: 7 },
  ambulance: { width: 8.5, height: 6 },
  'fire truck': { width: 10.5, height: 7 },
  police: { width: 8.5, height: 6 },
};

const EMERGENCY_KIND: Record<EmergencyType, VehicleKind> = {
  AMBULANCE: 'ambulance',
  FIRE: 'fire truck',
  OTHER: 'police',
};

export interface SceneVehicle {
  id: string;
  kind: VehicleKind;
  lane: LaneId;
  x: number;
  y: number;
  width: number;
  height: number;
  orientation: VehicleOrientation;
  confidence: number;
  isEmergency: boolean;
  emergencyType?: EmergencyType;
}

// These detections are anchored to vehicles already visible in each CCTV
// source frame. They are deliberately independent of the dashboard's
// simulated queue totals: an overlay must never invent a vehicle, or assign a
// detection label to a different vehicle in the photograph.
const CAMERA_DETECTIONS: Record<SceneAngle, SceneVehicle[]> = {
  'North Approach': [
    { id: 'TRK-N1', kind: 'bus', lane: 'A', x: 41.2, y: 28.2, width: 4.9, height: 8.2, orientation: 'DOWN', confidence: 0.97, isEmergency: false },
    { id: 'TRK-N2', kind: 'car', lane: 'A', x: 64.3, y: 41.4, width: 4.4, height: 5.7, orientation: 'DOWN', confidence: 0.96, isEmergency: false },
    { id: 'TRK-N3', kind: 'car', lane: 'A', x: 85.2, y: 65.2, width: 5.8, height: 8.7, orientation: 'DOWN', confidence: 0.95, isEmergency: false },
    { id: 'TRK-N4', kind: 'car', lane: 'A', x: 45.1, y: 89.8, width: 4.4, height: 8.1, orientation: 'DOWN', confidence: 0.96, isEmergency: false },
  ],
  'East Approach': [
    { id: 'TRK-E1', kind: 'bus', lane: 'B', x: 74.4, y: 11.7, width: 5.1, height: 7.2, orientation: 'LEFT', confidence: 0.98, isEmergency: false },
    { id: 'TRK-E2', kind: 'truck', lane: 'B', x: 61.4, y: 19.1, width: 6.2, height: 10.7, orientation: 'LEFT', confidence: 0.98, isEmergency: false },
    { id: 'TRK-E3', kind: 'car', lane: 'B', x: 25.6, y: 25.7, width: 4.2, height: 5.3, orientation: 'LEFT', confidence: 0.96, isEmergency: false },
    { id: 'TRK-E4', kind: 'car', lane: 'B', x: 86.2, y: 63.6, width: 6.4, height: 7.4, orientation: 'LEFT', confidence: 0.95, isEmergency: false },
    { id: 'TRK-E5', kind: 'motorcycle', lane: 'B', x: 29.4, y: 68.3, width: 3.8, height: 5.8, orientation: 'LEFT', confidence: 0.93, isEmergency: false },
  ],
  'South Approach': [
    { id: 'TRK-S1', kind: 'auto', lane: 'C', x: 23.5, y: 65.8, width: 5.0, height: 8.7, orientation: 'UP', confidence: 0.97, isEmergency: false },
    { id: 'TRK-S2', kind: 'car', lane: 'C', x: 34.1, y: 74.9, width: 5.7, height: 9.7, orientation: 'UP', confidence: 0.96, isEmergency: false },
    { id: 'TRK-S3', kind: 'car', lane: 'C', x: 56.2, y: 68.6, width: 5.5, height: 8.7, orientation: 'UP', confidence: 0.96, isEmergency: false },
    { id: 'TRK-S4', kind: 'bus', lane: 'C', x: 67.1, y: 42.0, width: 9.4, height: 29.2, orientation: 'UP', confidence: 0.98, isEmergency: false },
    { id: 'TRK-S5', kind: 'motorcycle', lane: 'C', x: 54.8, y: 50.3, width: 2.8, height: 7.2, orientation: 'UP', confidence: 0.93, isEmergency: false },
  ],
  'West Approach': [
    { id: 'TRK-W1', kind: 'bus', lane: 'D', x: 41.2, y: 28.2, width: 4.9, height: 8.2, orientation: 'RIGHT', confidence: 0.97, isEmergency: false },
    { id: 'TRK-W2', kind: 'car', lane: 'D', x: 64.3, y: 41.4, width: 4.4, height: 5.7, orientation: 'RIGHT', confidence: 0.96, isEmergency: false },
    { id: 'TRK-W3', kind: 'car', lane: 'D', x: 85.2, y: 65.2, width: 5.8, height: 8.7, orientation: 'RIGHT', confidence: 0.95, isEmergency: false },
    { id: 'TRK-W4', kind: 'car', lane: 'D', x: 45.1, y: 89.8, width: 4.4, height: 8.1, orientation: 'RIGHT', confidence: 0.96, isEmergency: false },
  ],
};

export function getCameraDetections(angle: SceneAngle): SceneVehicle[] {
  return CAMERA_DETECTIONS[angle];
}

// Distribute vehicle kinds proportionally to the lane's breakdown so labels
// always match the "real" mix the dashboard reports for that lane.
// Uses largest-remainder allocation to guarantee deterministic whole-count
// assignments with no floating-point boundary drift.
function kindsForLane(
  breakdown: { cars: number; autos: number; buses: number; bikes: number; trucks: number },
  count: number
): VehicleKind[] {
  const buckets: { kind: VehicleKind; wt: number }[] = [
    { kind: 'car', wt: breakdown.cars },
    { kind: 'auto', wt: breakdown.autos },
    { kind: 'bus', wt: breakdown.buses },
    { kind: 'motorcycle', wt: breakdown.bikes },
    { kind: 'truck', wt: breakdown.trucks },
  ];
  const total = Math.max(1, buckets.reduce((sum, b) => sum + b.wt, 0));

  // Step 1: Compute exact fractional share and floor counts
  const shares = buckets.map((b) => {
    const exact = (b.wt / total) * count;
    return { kind: b.kind, floor: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });

  // Step 2: Distribute remaining slots by largest fractional remainder
  const remaining = count - shares.reduce((s, e) => s + e.floor, 0);
  const sortedByRemainder = shares
    .map((s, i) => ({ idx: i, remainder: s.remainder }))
    .sort((a, b) => b.remainder - a.remainder);
  for (let r = 0; r < remaining; r++) {
    shares[sortedByRemainder[r % sortedByRemainder.length].idx].floor += 1;
  }

  // Step 3: Build the array in bucket order
  const kinds: VehicleKind[] = [];
  for (const s of shares) {
    for (let n = 0; n < s.floor; n++) {
      kinds.push(s.kind);
    }
  }
  return kinds;
}

/**
 * Build the ground-truth vehicle list for the current junction. These entities
 * drive BOTH the on-screen sprites and the detection bounding boxes, so a box
 * can only ever appear on a real rendered vehicle and always carries that
 * vehicle's real kind.
 */
export function buildSceneVehicles(
  junction: Junction,
  emergencyTypes: EmergencyType[] = [],
  flows: LaneFlows
): SceneVehicle[] {
  const vehicles: SceneVehicle[] = [];
  const emergencyCount = Math.min(emergencyTypes.length, 3);

  junction.lanes.forEach((lane) => {
    const geo = LANE_GEOMETRY[lane.laneId];
    const count = Math.min(
      MAX_VEHICLES_PER_LANE[lane.laneId],
      Math.max(lane.vehicleCount, lane.laneId === 'B' ? emergencyCount : 0)
    );
    if (count <= 0) return;

    const kinds = kindsForLane(lane.vehicleBreakdown, count);
    if (lane.laneId === 'B') {
      for (let k = 0; k < emergencyCount; k++) {
        kinds[k] = EMERGENCY_KIND[emergencyTypes[k]];
      }
    }

    for (let i = 0; i < count; i++) {
      const kind = kinds[i];
      const isEmergency = lane.laneId === 'B' && i < emergencyCount;
      const size = VEHICLE_SIZE[kind];
      const p = (flows[lane.laneId] + i / count) % 1;
      const subIndex = i % geo.subs.length;

      const centerX = geo.major === 'x' ? geo.from + (geo.to - geo.from) * p : geo.subs[subIndex];
      const centerY = geo.major === 'y' ? geo.from + (geo.to - geo.from) * p : geo.subs[subIndex];

      const confidence = isEmergency ? 0.99 : 0.86 + ((i * 13 + kind.length) % 9) * 0.015;

      vehicles.push({
        id: `TRK-${lane.laneId}${i + 1}`,
        kind,
        lane: lane.laneId,
        x: centerX - size.width / 2,
        y: centerY - size.height / 2,
        width: size.width,
        height: size.height,
        orientation: geo.orient,
        confidence: Math.min(0.98, confidence),
        isEmergency,
        emergencyType: isEmergency ? emergencyTypes[i] : undefined,
      });
    }
  });

  return vehicles;
}

export function initialLaneFlows(): LaneFlows {
  return { A: 0, B: 0, C: 0, D: 0 };
}

export function initialCrosswalkFlows(): CrosswalkFlows {
  return { N: 0, E: 0, S: 0, W: 0 };
}

// A crosswalk is in WALK state only while a walk phase is being served on a
// non-conflicting (parallel) lane's green.
export function isCrosswalkActive(
  crosswalk: Crosswalk,
  junction: Junction,
  greenLaneId: LaneId | null
): boolean {
  return (
    junction.pedestrian.walkActive &&
    greenLaneId !== null &&
    crosswalk.parallelLanes.includes(greenLaneId)
  );
}
