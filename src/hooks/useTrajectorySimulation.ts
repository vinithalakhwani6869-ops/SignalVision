import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  JunctionHotspot,
  SegmentTravelMetric,
  SimulationComparison,
  TrackedVehicleRoute,
  TrajectoryAnalytics,
  TrajectorySimulationState,
  VehicleSighting,
} from '../types/traffic';
import { CITY_SEGMENTS, SIMULATOR_ROUTES } from '../data/cityNetwork';
import { generateSimulatedPlateHash, hashPlate } from '../services/anprPrivacy';
import { getHotspots, getSegmentMetrics, getTrackedVehicleRoute, getTrajectoryAnalytics, pruneExpiredSightings } from '../services/trajectoryEngine';

interface ActiveVehicle {
  plateHash: string;
  route: readonly string[];
  routeIndex: number;
  nextSightingAt: number;
}

const cameraForJunction = (junctionId: string) => `CAM-${junctionId.replace('J-', '')}-TRAJ`;
const laneForVehicle = (): 'A' | 'B' | 'C' | 'D' => ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)] as 'A' | 'B' | 'C' | 'D';

export function useTrajectorySimulation() {
  const [isRunning, setIsRunning] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<TrajectorySimulationState['speedMultiplier']>(1);
  const [rushHourActive, setRushHourActive] = useState(false);
  const [simulatedClock, setSimulatedClock] = useState(() => Date.now());
  const [sightings, setSightings] = useState<VehicleSighting[]>([]);
  const [activeVehicles, setActiveVehicles] = useState<ActiveVehicle[]>([]);
  const clockRef = useRef(simulatedClock);
  const activeVehiclesRef = useRef(activeVehicles);

  useEffect(() => { clockRef.current = simulatedClock; }, [simulatedClock]);
  useEffect(() => { activeVehiclesRef.current = activeVehicles; }, [activeVehicles]);

  const spawnVehicle = useCallback(async () => {
    const plateHash = await generateSimulatedPlateHash();
    const route = SIMULATOR_ROUTES[Math.floor(Math.random() * SIMULATOR_ROUTES.length)];
    const startedAt = clockRef.current;
    const firstJunctionId = route[0];
    setSightings((previous) => pruneExpiredSightings([...previous, {
      plateHash,
      cameraId: cameraForJunction(firstJunctionId),
      junctionId: firstJunctionId,
      lane: laneForVehicle(),
      timestamp: startedAt,
    }], startedAt));
    setActiveVehicles((previous) => [...previous, { plateHash, route, routeIndex: 0, nextSightingAt: startedAt + 45000 }]);
  }, []);

  const processTick = useCallback(() => {
    const nextClock = clockRef.current + 30000 * speedMultiplier;
    clockRef.current = nextClock;
    setSimulatedClock(nextClock);

    const nextVehicles: ActiveVehicle[] = [];
    const newSightings: VehicleSighting[] = [];
    activeVehiclesRef.current.forEach((vehicle) => {
      if (vehicle.nextSightingAt > nextClock) {
        nextVehicles.push(vehicle);
        return;
      }
      const nextIndex = vehicle.routeIndex + 1;
      if (nextIndex >= vehicle.route.length) return;
      const fromJunctionId = vehicle.route[vehicle.routeIndex];
      const junctionId = vehicle.route[nextIndex];
      const segment = CITY_SEGMENTS.find((item) => item.fromJunctionId === fromJunctionId && item.toJunctionId === junctionId);
      const isRushBottleneck = rushHourActive && ['J14-J04', 'J04-J12', 'J04-J07'].includes(segment?.id || '');
      const multiplier = isRushBottleneck ? 1.45 + Math.random() * 0.45 : 0.9 + Math.random() * 0.3;
      const durationMs = (segment?.baselineTravelTimeSec || 90) * multiplier * 1000;
      newSightings.push({ plateHash: vehicle.plateHash, cameraId: cameraForJunction(junctionId), junctionId, lane: laneForVehicle(), timestamp: nextClock });
      nextVehicles.push({ ...vehicle, routeIndex: nextIndex, nextSightingAt: nextClock + durationMs });
    });
    activeVehiclesRef.current = nextVehicles;
    setActiveVehicles(nextVehicles);
    if (newSightings.length) setSightings((previous) => pruneExpiredSightings([...previous, ...newSightings], nextClock));

    const targetVehicleCount = rushHourActive ? 18 : 9;
    if (nextVehicles.length < targetVehicleCount) {
      const spawnCount = rushHourActive ? 3 : 1;
      for (let index = 0; index < spawnCount; index += 1) void spawnVehicle();
    }
  }, [rushHourActive, spawnVehicle, speedMultiplier]);

  useEffect(() => {
    if (!isRunning) return undefined;
    void spawnVehicle();
    const interval = window.setInterval(processTick, 1000);
    return () => window.clearInterval(interval);
  }, [isRunning, processTick, spawnVehicle]);

  const segmentMetrics = useMemo(() => getSegmentMetrics(sightings), [sightings]);
  const hotspots = useMemo(() => getHotspots(segmentMetrics), [segmentMetrics]);
  const analytics = useMemo(() => getTrajectoryAnalytics(sightings, segmentMetrics), [sightings, segmentMetrics]);
  const comparison = useMemo<SimulationComparison>(() => {
    const bottleneckPenalty = segmentMetrics.filter((segment) => segment.status !== 'normal').length * 7;
    const fixedAverageWaitSec = 48 + bottleneckPenalty;
    const signalVisionAverageWaitSec = Math.round(fixedAverageWaitSec * 0.72);
    const fixedAverageJourneySec = analytics.averageJourneyTimeSec || 390;
    const signalVisionAverageJourneySec = Math.round(fixedAverageJourneySec * 0.8);
    return {
      fixedAverageWaitSec,
      signalVisionAverageWaitSec,
      fixedAverageJourneySec,
      signalVisionAverageJourneySec,
      waitImprovementPercent: Math.round(((fixedAverageWaitSec - signalVisionAverageWaitSec) / fixedAverageWaitSec) * 100),
      journeyImprovementPercent: Math.round(((fixedAverageJourneySec - signalVisionAverageJourneySec) / fixedAverageJourneySec) * 100),
    };
  }, [analytics.averageJourneyTimeSec, segmentMetrics]);

  const trackVehicle = useCallback(async (plateEntry: string): Promise<TrackedVehicleRoute | null> => {
    const plateHash = await hashPlate(plateEntry); // Entry is scoped to this callback and is not retained.
    return getTrackedVehicleRoute(plateHash, sightings);
  }, [sightings]);

  return {
    simulation: { isRunning, speedMultiplier, rushHourActive, simulatedClock, sightingCount: sightings.length } as TrajectorySimulationState,
    sightings,
    segmentMetrics: segmentMetrics as SegmentTravelMetric[],
    hotspots: hotspots as JunctionHotspot[],
    analytics: analytics as TrajectoryAnalytics,
    comparison,
    start: () => setIsRunning(true),
    pause: () => setIsRunning(false),
    setSpeedMultiplier,
    toggleRushHour: () => setRushHourActive((active) => !active),
    trackVehicle,
  };
}
