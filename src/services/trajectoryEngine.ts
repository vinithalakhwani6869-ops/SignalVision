import {
  HourlyTrafficMetric,
  JunctionHotspot,
  OriginDestinationMetric,
  SegmentTravelMetric,
  TrackedVehicleRoute,
  TrajectoryAnalytics,
  VehicleSighting,
} from '../types/traffic';
import { CITY_SEGMENTS, HOTSPOT_TRAVEL_TIME_RATIO, RETENTION_WINDOW_MS, TRAJECTORY_JUNCTION_IDS } from '../data/cityNetwork';

export function pruneExpiredSightings(sightings: VehicleSighting[], now: number): VehicleSighting[] {
  return sightings.filter((sighting) => now - sighting.timestamp < RETENTION_WINDOW_MS);
}

export function getSegmentMetrics(sightings: VehicleSighting[]): SegmentTravelMetric[] {
  const samples = new Map<string, number[]>();
  const byVehicle = new Map<string, VehicleSighting[]>();
  sightings.forEach((s) => byVehicle.set(s.plateHash, [...(byVehicle.get(s.plateHash) || []), s]));

  byVehicle.forEach((vehicleSightings) => {
    const ordered = [...vehicleSightings].sort((a, b) => a.timestamp - b.timestamp);
    for (let index = 1; index < ordered.length; index += 1) {
      const from = ordered[index - 1];
      const to = ordered[index];
      const segment = CITY_SEGMENTS.find((candidate) => candidate.fromJunctionId === from.junctionId && candidate.toJunctionId === to.junctionId);
      if (segment) samples.set(segment.id, [...(samples.get(segment.id) || []), Math.max(1, (to.timestamp - from.timestamp) / 1000)]);
    }
  });

  return CITY_SEGMENTS.map((segment) => {
    const values = samples.get(segment.id) || [];
    const averageTravelTimeSec = values.length ? values.reduce((total, value) => total + value, 0) / values.length : segment.baselineTravelTimeSec;
    const congestionRatio = averageTravelTimeSec / segment.baselineTravelTimeSec;
    return {
      ...segment,
      averageTravelTimeSec: Math.round(averageTravelTimeSec),
      sampleCount: values.length,
      congestionRatio,
      status: congestionRatio >= 1.65 ? 'critical' : congestionRatio >= HOTSPOT_TRAVEL_TIME_RATIO ? 'moderate' : 'normal',
    };
  });
}

export function getHotspots(metrics: SegmentTravelMetric[]): JunctionHotspot[] {
  return TRAJECTORY_JUNCTION_IDS.map((junctionId) => {
    const incoming = metrics.filter((metric) => metric.toJunctionId === junctionId && metric.sampleCount > 0);
    const ratio = incoming.length ? incoming.reduce((sum, item) => sum + item.congestionRatio, 0) / incoming.length : 1;
    const averageIncomingTravelTimeSec = incoming.length ? Math.round(incoming.reduce((sum, item) => sum + item.averageTravelTimeSec, 0) / incoming.length) : 0;
    return {
      junctionId,
      averageIncomingTravelTimeSec,
      status: ratio >= 1.65 ? 'critical' : ratio >= HOTSPOT_TRAVEL_TIME_RATIO ? 'moderate' : 'normal',
      isFlagged: ratio >= HOTSPOT_TRAVEL_TIME_RATIO,
    };
  });
}

export function getTrackedVehicleRoute(plateHash: string, sightings: VehicleSighting[]): TrackedVehicleRoute | null {
  const stops = sightings.filter((s) => s.plateHash === plateHash).sort((a, b) => a.timestamp - b.timestamp).map(({ junctionId, cameraId, timestamp }) => ({ junctionId, cameraId, timestamp }));
  if (!stops.length) return null;
  const vehicleSightings = sightings.filter((s) => s.plateHash === plateHash);
  const segmentTimes = getSegmentMetrics(vehicleSightings).filter((metric) => metric.sampleCount > 0);
  return { plateHash, stops, segmentTimes };
}

export function getTrajectoryAnalytics(sightings: VehicleSighting[], metrics: SegmentTravelMetric[]): TrajectoryAnalytics {
  const journeys = new Map<string, VehicleSighting[]>();
  sightings.forEach((s) => journeys.set(s.plateHash, [...(journeys.get(s.plateHash) || []), s]));
  const completed = [...journeys.values()].map((items) => items.sort((a, b) => a.timestamp - b.timestamp)).filter((items) => items.length > 1);
  const durations = completed.map((items) => (items[items.length - 1].timestamp - items[0].timestamp) / 1000);
  const pairMap = new Map<string, { count: number; times: number[] }>();
  completed.forEach((items) => {
    const key = `${items[0].junctionId}|${items[items.length - 1].junctionId}`;
    const entry = pairMap.get(key) || { count: 0, times: [] };
    entry.count += 1;
    entry.times.push((items[items.length - 1].timestamp - items[0].timestamp) / 1000);
    pairMap.set(key, entry);
  });
  const peakHourSeries: HourlyTrafficMetric[] = Array.from({ length: 24 }, (_, hour) => {
    const matching = completed.filter((items) => new Date(items[0].timestamp).getHours() === hour);
    const values = matching.map((items) => (items[items.length - 1].timestamp - items[0].timestamp) / 1000);
    return { hour: `${String(hour).padStart(2, '0')}:00`, journeys: matching.length, averageTravelTimeSec: values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0 };
  });
  const topOriginDestinationPairs: OriginDestinationMetric[] = [...pairMap.entries()].map(([key, entry]) => {
    const [originJunctionId, destinationJunctionId] = key.split('|');
    return { originJunctionId, destinationJunctionId, vehicleCount: entry.count, averageJourneyTimeSec: Math.round(entry.times.reduce((sum, value) => sum + value, 0) / entry.times.length) };
  }).sort((a, b) => b.vehicleCount - a.vehicleCount).slice(0, 5);
  return {
    averageJourneyTimeSec: durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 0,
    busiestRoads: [...metrics].sort((a, b) => b.sampleCount - a.sampleCount).slice(0, 5),
    bottlenecks: metrics.filter((metric) => metric.status !== 'normal').sort((a, b) => b.congestionRatio - a.congestionRatio),
    peakHourSeries,
    topOriginDestinationPairs,
  };
}
