import React, { useState, useEffect } from 'react';
import { Junction, BoundingBox } from '../../types/traffic';
import { generateBoundingBoxes } from '../../hooks/useTrafficSimulation';
import {
  Camera,
  Maximize2,
  Scan,
  Layers,
  Sparkles,
  Compass,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface CctvVideoPlayerProps {
  junction: Junction;
  emergencyActive: boolean;
}

export const CctvVideoPlayer: React.FC<CctvVideoPlayerProps> = ({
  junction,
  emergencyActive,
}) => {
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [showConfidence, setShowConfidence] = useState<boolean>(true);
  const [showZones, setShowZones] = useState<boolean>(true);
  const [selectedAngle, setSelectedAngle] = useState<string>(junction.camera.angle);
  const [fpsCounter, setFpsCounter] = useState<number>(29.8);
  const [timecode, setTimecode] = useState<string>('');

  // Generate bounding boxes according to current junction lanes
  const boxes = generateBoundingBoxes(junction, emergencyActive);

  // Live milliseconds timecode & small FPS jitter for authentic CCTV feel
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimecode(
        now.toISOString().replace('T', ' ').substring(0, 19) +
          '.' +
          String(now.getMilliseconds()).padStart(3, '0')
      );
      setFpsCounter(Number((29.6 + Math.random() * 0.6).toFixed(1)));
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const angles = [
    'North Approach',
    'South Approach',
    'East Approach',
    'West Approach',
  ] as const;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col h-full">
      {/* Feed Title Bar & Telemetry */}
      <div className="px-3 sm:px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-950/80 border border-rose-700/80 text-rose-300 text-[11px] font-mono font-bold uppercase tracking-wider shrink-0">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            LIVE CCTV
          </div>
          <span className="text-xs font-semibold text-slate-200 truncate">
            {junction.camera.name}
          </span>
          <span className="text-slate-500 text-xs hidden sm:inline">·</span>
          <span className="text-[11px] font-mono text-cyan-400 truncate">
            {junction.camera.id}
          </span>
        </div>

        {/* Camera Angle Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800 text-[11px] overflow-x-auto max-w-full">
          {angles.map((ang) => (
            <button
              key={ang}
              onClick={() => setSelectedAngle(ang)}
              className={`px-2 py-1 sm:py-0.5 rounded text-[10px] font-medium transition-colors shrink-0 ${
                selectedAngle === ang
                  ? 'bg-cyan-950 text-cyan-300 font-semibold border border-cyan-800/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {ang.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="relative flex-1 bg-black overflow-hidden select-none min-h-[240px] sm:min-h-[320px] max-h-[500px]">
        {/* Background CCTV Image */}
        <img
          src={junction.camera.bgImage}
          alt={`CCTV Feed for ${junction.name}`}
          className="w-full h-full object-cover filter brightness-90 contrast-105"
          referrerPolicy="no-referrer"
        />

        {/* Scanlines Overlay for CCTV Realism */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(0,0,0,0.5), rgba(0,0,0,0.5) 1px, transparent 1px, transparent 3px)',
          }}
        />

        {/* Lane Detection ROI Polygon Zones */}
        {showZones && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Zone A (North approach) */}
            <polygon
              points="18%,15% 42%,15% 40%,48% 22%,48%"
              fill={junction.lanes[0].signalState === 'GREEN' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.08)'}
              stroke={junction.lanes[0].signalState === 'GREEN' ? '#10b981' : '#ef4444'}
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            {/* Zone B (East approach) */}
            <polygon
              points="54%,30% 92%,30% 90%,68% 52%,68%"
              fill={junction.lanes[1].signalState === 'GREEN' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.08)'}
              stroke={junction.lanes[1].signalState === 'GREEN' ? '#10b981' : '#ef4444'}
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            {/* Zone C (South approach) */}
            <polygon
              points="32%,58% 62%,58% 60%,92% 30%,92%"
              fill={junction.lanes[2].signalState === 'GREEN' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.08)'}
              stroke={junction.lanes[2].signalState === 'GREEN' ? '#10b981' : '#ef4444'}
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            {/* Zone D (West approach) */}
            <polygon
              points="6%,38% 30%,38% 28%,75% 6%,75%"
              fill={junction.lanes[3].signalState === 'GREEN' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.08)'}
              stroke={junction.lanes[3].signalState === 'GREEN' ? '#10b981' : '#ef4444'}
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
          </svg>
        )}

        {/* Live Lane Head Counts Floating Overlays */}
        {showZones && (
          <div className="absolute inset-0 pointer-events-none text-[10px] font-mono font-bold">
            <div
              className={`absolute top-[16%] left-[24%] px-2 py-0.5 rounded backdrop-blur ${
                junction.lanes[0].signalState === 'GREEN'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500'
                  : 'bg-slate-900/80 text-rose-300 border border-slate-700'
              }`}
            >
              LANE A: {junction.lanes[0].vehicleCount} veh
            </div>

            <div
              className={`absolute top-[32%] left-[64%] px-2 py-0.5 rounded backdrop-blur ${
                junction.lanes[1].signalState === 'GREEN'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500'
                  : 'bg-slate-900/80 text-rose-300 border border-slate-700'
              }`}
            >
              LANE B: {junction.lanes[1].vehicleCount} veh
            </div>

            <div
              className={`absolute bottom-[10%] left-[40%] px-2 py-0.5 rounded backdrop-blur ${
                junction.lanes[2].signalState === 'GREEN'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500'
                  : 'bg-slate-900/80 text-rose-300 border border-slate-700'
              }`}
            >
              LANE C: {junction.lanes[2].vehicleCount} veh
            </div>

            <div
              className={`absolute top-[44%] left-[10%] px-2 py-0.5 rounded backdrop-blur ${
                junction.lanes[3].signalState === 'GREEN'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500'
                  : 'bg-slate-900/80 text-rose-300 border border-slate-700'
              }`}
            >
              LANE D: {junction.lanes[3].vehicleCount} veh
            </div>
          </div>
        )}

        {/* Dynamic YOLOv8 Bounding Boxes */}
        {showBoxes && (
          <div className="absolute inset-0 pointer-events-none">
            {boxes.map((box) => {
              const isAmbulance = box.isEmergency;
              const isHeavy = box.label === 'bus' || box.label === 'truck';

              const boxBorder = isAmbulance
                ? 'border-2 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.9)] animate-pulse'
                : isHeavy
                ? 'border border-amber-400 bg-amber-500/10'
                : 'border border-cyan-400 bg-cyan-500/10';

              const tagBg = isAmbulance
                ? 'bg-rose-600 text-white font-bold'
                : isHeavy
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'bg-cyan-500 text-slate-950 font-semibold';

              return (
                <div
                  key={box.id}
                  className={`absolute transition-all duration-300 ${boxBorder}`}
                  style={{
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.width}%`,
                    height: `${box.height}%`,
                  }}
                >
                  {/* Label tag above box */}
                  <div
                    className={`absolute -top-4 left-0 text-[9px] font-mono px-1 leading-tight flex items-center gap-1 whitespace-nowrap rounded-t-sm ${tagBg}`}
                  >
                    <span>{box.label}</span>
                    {showConfidence && (
                      <span className="opacity-80">
                        {box.confidence.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Tracker ID inside box */}
                  <span className="absolute bottom-0 right-0 text-[8px] font-mono text-cyan-200/80 bg-slate-950/70 px-0.5">
                    {box.id}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Top-Right HUD OSD overlay */}
        <div className="absolute top-2.5 right-2.5 bg-slate-950/85 border border-slate-800 rounded px-2.5 py-1.5 text-[10px] font-mono text-slate-300 backdrop-blur pointer-events-none space-y-0.5">
          <div className="flex items-center justify-between gap-3 text-cyan-300">
            <span>FPS: {fpsCounter}</span>
            <span>LAT: {junction.camera.modelLatencyMs}ms</span>
          </div>
          <div className="text-slate-400">{timecode}</div>
          <div className="text-[9px] text-slate-400">YOLOv8n / OpenCV 4.10</div>
        </div>

        {/* Bottom-Left Camera Details overlay */}
        <div className="absolute bottom-2.5 left-2.5 bg-slate-950/85 border border-slate-800 rounded px-2.5 py-1.5 text-[10px] font-mono text-slate-300 backdrop-blur pointer-events-none">
          <div className="text-emerald-400 font-bold">RTSP: {junction.camera.streamStatus}</div>
          <div className="text-slate-400">{junction.camera.resolution}</div>
        </div>
      </div>

      {/* Operator Detection Controls Bar */}
      <div className="px-3 sm:px-4 py-2 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className={`flex items-center gap-1.5 px-2 py-1.5 sm:py-1 rounded text-[11px] font-medium transition-colors ${
              showBoxes
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {showBoxes ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3" />}
            <span>Bounding Boxes</span>
          </button>

          <button
            onClick={() => setShowConfidence(!showConfidence)}
            className={`flex items-center gap-1.5 px-2 py-1.5 sm:py-1 rounded text-[11px] font-medium transition-colors ${
              showConfidence
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Confidence</span>
          </button>

          <button
            onClick={() => setShowZones(!showZones)}
            className={`flex items-center gap-1.5 px-2 py-1.5 sm:py-1 rounded text-[11px] font-medium transition-colors ${
              showZones
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Scan className="w-3 h-3" />
            <span>Lane ROIs</span>
          </button>
        </div>

        <div className="font-mono text-[11px] text-slate-400 flex items-center gap-2">
          <span>Vehicles in Frame:</span>
          <span className="font-bold text-white tabular-nums">{boxes.length}</span>
        </div>
      </div>
    </div>
  );
};
