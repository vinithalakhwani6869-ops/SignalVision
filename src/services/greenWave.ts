import { SegmentTravelMetric } from '../types/traffic';

/**
 * Feature 12 — Green wave (DEFERRED per scope decision).
 *
 * This module defines the pure computation contract only; it is intentionally
 * NOT wired into `useTrafficSimulation`. Once the FIND→FIX loop is validated,
 * the returned boosts can be clamped into the existing min/max green bounds and
 * applied at the next phase boundary of a target junction.
 *
 * Concept: if many vehicles leave junction A heading to B, extend B's green
 * shortly before they arrive. The trajectory segment metrics below are the
 * "prediction" of that arriving wave.
 */
export interface GreenWaveBoost {
  /** Target junction whose green should be extended. */
  junctionId: string;
  /** Estimated vehicles arriving into the junction within the window. */
  incomingVehicles: number;
  /** Average travel time (s) of the arriving wave along the inbound segments. */
  etaSec: number;
  /** Extra green seconds to grant on the arrival phase (≤ maxGreenSec bound). */
  advanceSec: number;
}

export interface GreenWaveEvaluationInput {
  /** Segment travel metrics filtered to corridors inbound toward target junctions. */
  inboundSegments: SegmentTravelMetric[];
  /** Only waves whose average ETA falls within this window (s) count. */
  arrivalWindowSec: number;
  /** Minimum incoming-vehicle estimate required to trigger a boost. */
  vehicleThreshold: number;
  /** Hard cap on the extra green seconds granted. */
  maxAdvanceSec: number;
}

/**
 * Pure green-wave evaluator (unit-testable, no side effects).
 *
 * @returns one boost candidate per target junction, sorted most-to-least urgent.
 */
export function evaluateGreenWave({
  inboundSegments,
  arrivalWindowSec,
  vehicleThreshold,
  maxAdvanceSec,
}: GreenWaveEvaluationInput): GreenWaveBoost[] {
  const byJunction = new Map<string, { vehicles: number; etaSec: number }[]>();

  inboundSegments.forEach((segment) => {
    const candidates = byJunction.get(segment.toJunctionId) || [];
    candidates.push({ vehicles: segment.sampleCount, etaSec: segment.averageTravelTimeSec });
    byJunction.set(segment.toJunctionId, candidates);
  });

  const boosts: GreenWaveBoost[] = [];
  byJunction.forEach((incoming, junctionId) => {
    const withinWindow = incoming.filter((item) => item.etaSec <= arrivalWindowSec);
    const incomingVehicles = withinWindow.reduce((sum, item) => sum + item.vehicles, 0);
    if (incomingVehicles < vehicleThreshold) return;
    const etaSec = withinWindow.length
      ? Math.round(withinWindow.reduce((sum, item) => sum + item.etaSec, 0) / withinWindow.length)
      : 0;
    // Simple linear wave-to-boost mapping; replace with a learned/predictive
    // model via this same signature in a real deployment.
    const advanceSec = Math.min(maxAdvanceSec, Math.round((incomingVehicles / vehicleThreshold) * 6));
    boosts.push({ junctionId, incomingVehicles, etaSec, advanceSec });
  });

  return boosts.sort((a, b) => b.advanceSec - a.advanceSec);
}