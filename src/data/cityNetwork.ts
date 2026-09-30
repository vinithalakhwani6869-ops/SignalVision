import { RoadSegment } from '../types/traffic';

// These six existing nodes form the most connected corridor already represented
// on the map: a central spine with Electronic City and ORR East branches.
export const TRAJECTORY_JUNCTION_IDS = ['J-09', 'J-01', 'J-14', 'J-04', 'J-12', 'J-07'] as const;

export const RETENTION_WINDOW_MS = 24 * 60 * 60 * 1000;
export const HOTSPOT_TRAVEL_TIME_RATIO = 1.35;

export const CITY_SEGMENTS: RoadSegment[] = [
  { id: 'J09-J01', name: 'Old Madras Link', fromJunctionId: 'J-09', toJunctionId: 'J-01', baselineTravelTimeSec: 85 },
  { id: 'J01-J09', name: 'Old Madras Link', fromJunctionId: 'J-01', toJunctionId: 'J-09', baselineTravelTimeSec: 85 },
  { id: 'J01-J14', name: 'Hosur Inbound Arterial', fromJunctionId: 'J-01', toJunctionId: 'J-14', baselineTravelTimeSec: 110 },
  { id: 'J14-J01', name: 'Hosur Inbound Arterial', fromJunctionId: 'J-14', toJunctionId: 'J-01', baselineTravelTimeSec: 110 },
  { id: 'J14-J04', name: 'Koramangala-Silkboard 100ft', fromJunctionId: 'J-14', toJunctionId: 'J-04', baselineTravelTimeSec: 95 },
  { id: 'J04-J14', name: 'Koramangala-Silkboard 100ft', fromJunctionId: 'J-04', toJunctionId: 'J-14', baselineTravelTimeSec: 95 },
  { id: 'J04-J12', name: 'Electronic City Flyover', fromJunctionId: 'J-04', toJunctionId: 'J-12', baselineTravelTimeSec: 135 },
  { id: 'J12-J04', name: 'Electronic City Flyover', fromJunctionId: 'J-12', toJunctionId: 'J-04', baselineTravelTimeSec: 135 },
  { id: 'J04-J07', name: 'Outer Ring Road East', fromJunctionId: 'J-04', toJunctionId: 'J-07', baselineTravelTimeSec: 120 },
  { id: 'J07-J04', name: 'Outer Ring Road East', fromJunctionId: 'J-07', toJunctionId: 'J-04', baselineTravelTimeSec: 120 },
];

export const SIMULATOR_ROUTES = [
  ['J-09', 'J-01', 'J-14', 'J-04', 'J-12'],
  ['J-09', 'J-01', 'J-14', 'J-04', 'J-07'],
  ['J-12', 'J-04', 'J-14', 'J-01', 'J-09'],
  ['J-07', 'J-04', 'J-14', 'J-01'],
  ['J-01', 'J-14', 'J-04', 'J-12'],
] as const;
