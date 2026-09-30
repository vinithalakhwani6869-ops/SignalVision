import React from 'react';
import { Junction, TrackedRouteStop } from '../../types/traffic';

interface TrackedRouteOverlayProps {
  stops: TrackedRouteStop[];
  junctions: Junction[];
}

const clockOf = (timestamp: number) => new Date(timestamp).toTimeString().slice(0, 8);

/**
 * Draws a tracked vehicle's route on the city map (SVG, shares the map's pan/zoom
 * transform). Each waypoint is a camera sighting with its per-camera timestamp.
 */
export const TrackedRouteOverlay: React.FC<TrackedRouteOverlayProps> = ({ stops, junctions }) => {
  const points = stops
    .map((stop) => {
      const junction = junctions.find((j) => j.id === stop.junctionId);
      return junction
        ? { ...stop, x: junction.coordinates.mapX, y: junction.coordinates.mapY }
        : null;
    })
    .filter((point): point is NonNullable<typeof point> => point !== null);

  if (points.length === 0) return null;

  const segments: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
  for (let i = 1; i < points.length; i += 1) {
    segments.push({
      x1: points[i - 1].x,
      y1: points[i - 1].y,
      x2: points[i].x,
      y2: points[i].y,
      key: `${points[i - 1].junctionId}-${points[i].junctionId}-${i}`,
    });
  }

  return (
    <g>
      {segments.map((segment) => (
        <line
          key={segment.key}
          x1={`${segment.x1}%`}
          y1={`${segment.y1}%`}
          x2={`${segment.x2}%`}
          y2={`${segment.y2}%`}
          stroke="#22d3ee"
          strokeWidth={3}
          strokeDasharray="2 6"
          strokeLinecap="round"
          className="animate-pulse"
        />
      ))}
      {points.map((point, index) => (
        <g key={`${point.junctionId}-${point.timestamp}`}>
          <circle cx={`${point.x}%`} cy={`${point.y}%`} r={10} fill="#22d3ee" fillOpacity={0.25} />
          <circle cx={`${point.x}%`} cy={`${point.y}%`} r={4} fill="#22d3ee" stroke="#0e7490" strokeWidth={1.5} />
          <text
            x={`${point.x}%`}
            y={`${point.y}%`}
            dx={14}
            dy={index === 0 ? -8 : 12}
            fill="#e2e8f0"
            fontSize={9}
            fontFamily="monospace"
            stroke="#020617"
            strokeWidth={0.4}
          >
            {point.cameraId} · {clockOf(point.timestamp)}
          </text>
        </g>
      ))}
    </g>
  );
};