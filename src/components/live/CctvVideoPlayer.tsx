import React, { useState, useEffect, useRef } from 'react';
import { Junction, EmergencyType } from '../../types/traffic';
import {
  CROSSWALKS,
  getCameraDetections,
  getFocusLane,
  initialCrosswalkFlows,
  initialLaneFlows,
  isCrosswalkActive,
  SCENE_ANGLES,
  SceneAngle,
  SceneVehicle,
} from './junctionScene';
import cctvJunction from '../../assets/images/cctv_junction_crossroad_1790312031757.jpg';
import cctvArterial from '../../assets/images/cctv_arterial_expressway_1790312050067.jpg';
import cctvRoundabout from '../../assets/images/cctv_urban_roundabout_1790312061152.jpg';
import { Scan, Sparkles, Eye, EyeOff } from 'lucide-react';

interface CctvVideoPlayerProps {
  junction: Junction;
  emergencyTypes: EmergencyType[];
  onRequestPedestrian?: () => void;
}

// Standard pedestrian-signal pictograms (walking person / raised hand).
const WalkGlyph = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-11 h-11"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="4.6" r="2.2" fill="currentColor" stroke="none" />
    <path d="M12 8.5 L11.2 14.4" />
    <path d="M11.2 10.4 L14.6 13.2" />
    <path d="M11.2 14.4 L7.6 20" />
    <path d="M11.4 15 L15.8 18.2" />
  </svg>
);

const HandGlyph = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-11 h-11"
    fill="currentColor"
    aria-hidden="true"
  >
    <rect x="9.1" y="2.4" width="1.6" height="5.2" rx="0.8" />
    <rect x="11.2" y="1.8" width="1.6" height="5.9" rx="0.8" />
    <rect x="13.3" y="1.8" width="1.6" height="5.9" rx="0.8" />
    <rect x="15.4" y="2.4" width="1.6" height="5.2" rx="0.8" />
    <path d="M9.6 7.2 h5.8 v4 c0 1.1 -0.4 2 -1.2 2.7 a2.8 2.8 0 0 1 -3.4 0 c-0.8 -0.7 -1.2 -1.6 -1.2 -2.7 Z" />
    <rect x="7" y="8.6" width="3.4" height="1.6" rx="0.8" transform="rotate(-26 8.7 9.4)" />
  </svg>
);

const EMERGENCY_LABEL: Record<EmergencyType, string> = {
  AMBULANCE: 'AMBULANCE',
  FIRE: 'FIRE TRUCK',
  OTHER: 'POLICE',
};

// Only three distinct CCTV frames exist in the asset library, so the four
// approach presets cycle them with a per-core visual treatment; the reused
// frame gets a "different camera preset" look so every tab is distinct.
const ANGLE_BG: Record<SceneAngle, { src: string; filter?: string }> = {
  'North Approach': { src: cctvArterial },
  'East Approach': { src: cctvRoundabout },
  'South Approach': { src: cctvJunction },
  'West Approach': { src: cctvArterial, filter: 'brightness(0.92) saturate(0.82) contrast(1.08)' },
};

export const CctvVideoPlayer: React.FC<CctvVideoPlayerProps> = ({ junction, emergencyTypes, onRequestPedestrian }) => {
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [showConfidence, setShowConfidence] = useState<boolean>(true);
  const [showZones, setShowZones] = useState<boolean>(true);
  const [selectedAngle, setSelectedAngle] = useState<SceneAngle>(junction.camera.angle);
  const [fpsCounter, setFpsCounter] = useState<number>(29.8);
  const [timecode, setTimecode] = useState<string>('');

  // Animation state: mutable flow cursors advanced by a single lightweight
  // render clock (rAF), gated by the existing signal state.
  const flowsRef = useRef(initialLaneFlows());
  const pedFlowsRef = useRef(initialCrosswalkFlows());
  const [, setFrameTick] = useState<number>(0);

  // Reset camera preset + flow cursors when the junction changes.
  useEffect(() => {
    setSelectedAngle(junction.camera.angle);
    flowsRef.current = initialLaneFlows();
    pedFlowsRef.current = initialCrosswalkFlows();
  }, [junction.id]);

  // Live milliseconds timecode & small FPS jitter for authentic CCTV feel
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimecode(
        now.toISOString().replace('T', ' ').substring(0, 19) + '.' + String(now.getMilliseconds()).padStart(3, '0')
      );
      setFpsCounter(Number((29.6 + Math.random() * 0.6).toFixed(1)));
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Render/smooth-motion clock: advances the single green lane's vehicles and
  // any actively-cleared crosswalk's pedestrians. No signal scheduling happens
  // here — it purely reads the existing adaptive state each frame.
  const signalsKey = junction.lanes.map((l) => l.signalState).join('');
  const walkKey = junction.pedestrian.walkActive ? '1' : '0';
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.12);
      last = now;
      const flows = flowsRef.current;
      const pedFlows = pedFlowsRef.current;
      const greenLaneId = junction.lanes.find((l) => l.signalState === 'GREEN')?.laneId ?? null;

      for (const lane of junction.lanes) {
        if (lane.signalState === 'GREEN') {
          flows[lane.laneId] = (flows[lane.laneId] + dt / 7) % 1;
        }
      }
      for (const cw of CROSSWALKS) {
        if (isCrosswalkActive(cw, junction, greenLaneId)) {
          pedFlows[cw.id] = (pedFlows[cw.id] + dt / 5.5) % 1;
        }
      }

      acc += dt;
      if (acc >= 1 / 30) {
        acc = 0;
        setFrameTick((f) => f + 1);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [junction.id, signalsKey, walkKey, junction.pedestrian.walkTimerSec]);

  // Every box is derived from an actual vehicle in the selected camera frame.
  // There is no synthetic vehicle layer over the CCTV image.
  const vehicles = getCameraDetections(selectedAngle);
  const greenLaneId = junction.lanes.find((l) => l.signalState === 'GREEN')?.laneId ?? null;
  const focusLane = getFocusLane(selectedAngle);
  const walkActive = junction.pedestrian.walkActive;
  const pedWaiting = junction.pedestrian.waiting;
  const walkTimerSec = junction.pedestrian.walkTimerSec;

  const boxBorderClass = (v: SceneVehicle) => {
    if (v.isEmergency) {
      return v.emergencyType === 'FIRE'
        ? 'border-2 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.9)] animate-pulse'
        : v.emergencyType === 'OTHER'
        ? 'border-2 border-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.9)] animate-pulse'
        : 'border-2 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.9)] animate-pulse';
    }
    const isHeavy = v.kind === 'bus' || v.kind === 'truck';
    return isHeavy ? 'border border-amber-400 bg-amber-500/10' : 'border border-cyan-400 bg-cyan-500/10';
  };

  const boxTagClass = (v: SceneVehicle) => {
    if (v.isEmergency) {
      return v.emergencyType === 'FIRE'
        ? 'bg-orange-500 text-slate-950 font-bold'
        : v.emergencyType === 'OTHER'
        ? 'bg-sky-500 text-slate-950 font-bold'
        : 'bg-rose-600 text-white font-bold';
    }
    const isHeavy = v.kind === 'bus' || v.kind === 'truck';
    return isHeavy ? 'bg-amber-500 text-slate-950 font-semibold' : 'bg-cyan-500 text-slate-950 font-semibold';
  };

  const emergencyBoxClass = (t: EmergencyType) =>
    t === 'FIRE'
      ? 'border-2 border-orange-500 shadow-[0_0_14px_rgba(249,115,22,0.95)] animate-pulse'
      : t === 'OTHER'
      ? 'border-2 border-sky-500 shadow-[0_0_14px_rgba(14,165,233,0.95)] animate-pulse'
      : 'border-2 border-rose-500 shadow-[0_0_14px_rgba(244,63,94,0.95)] animate-pulse';

  const emergencyTagClass = (t: EmergencyType) =>
    t === 'FIRE'
      ? 'bg-orange-500 text-slate-950 font-bold'
      : t === 'OTHER'
      ? 'bg-sky-500 text-slate-950 font-bold'
      : 'bg-rose-600 text-white font-bold';

  const zoneDim = (laneIndex: number) => {
    const laneId = 'ABCD'[laneIndex] as 'A' | 'B' | 'C' | 'D';
    const green = junction.lanes[laneIndex].signalState === 'GREEN';
    const focus = focusLane === laneId;
    return {
      fill: green
        ? focus
          ? 'rgba(16, 185, 129, 0.22)'
          : 'rgba(16, 185, 129, 0.12)'
        : focus
        ? 'rgba(239, 68, 68, 0.15)'
        : 'rgba(239, 68, 68, 0.08)',
      stroke: green ? '#10b981' : '#ef4444',
      strokeWidth: focus ? 2.5 : 1.5,
    };
  };

  const zoneA = zoneDim(0);
  const zoneB = zoneDim(1);
  const zoneC = zoneDim(2);
  const zoneD = zoneDim(3);

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
            {junction.camera.id} · {selectedAngle}
          </span>
        </div>

        {/* Camera Angle Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800 text-[11px] overflow-x-auto max-w-full">
          {SCENE_ANGLES.map((ang) => (
            <button
              key={ang}
              onClick={() => setSelectedAngle(ang)}
              className={`px-2 py-1 sm:py-0.5 rounded text-[10px] font-medium transition-colors shrink-0 cursor-pointer ${
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
        {/* Background CCTV Image (per selected approach preset) */}
        <img
          src={ANGLE_BG[selectedAngle].src}
          alt={`CCTV Feed for ${junction.name} · ${selectedAngle}`}
          className={`w-full h-full object-cover filter brightness-90 contrast-105 ${ANGLE_BG[selectedAngle].filter ?? ''}`}
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
            <polygon
              points="18%,15% 42%,15% 40%,48% 22%,48%"
              fill={zoneA.fill}
              stroke={zoneA.stroke}
              strokeWidth={zoneA.strokeWidth}
              strokeDasharray="4 2"
            />
            <polygon
              points="54%,30% 92%,30% 90%,68% 52%,68%"
              fill={zoneB.fill}
              stroke={zoneB.stroke}
              strokeWidth={zoneB.strokeWidth}
              strokeDasharray="4 2"
            />
            <polygon
              points="32%,58% 62%,58% 60%,92% 30%,92%"
              fill={zoneC.fill}
              stroke={zoneC.stroke}
              strokeWidth={zoneC.strokeWidth}
              strokeDasharray="4 2"
            />
            <polygon
              points="6%,38% 30%,38% 28%,75% 6%,75%"
              fill={zoneD.fill}
              stroke={zoneD.stroke}
              strokeWidth={zoneD.strokeWidth}
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
              } ${focusLane === 'A' ? 'ring-1 ring-white/70' : ''}`}
            >
              LANE A: {junction.lanes[0].vehicleCount} veh
            </div>

            <div
              className={`absolute top-[32%] left-[64%] px-2 py-0.5 rounded backdrop-blur ${
                junction.lanes[1].signalState === 'GREEN'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500'
                  : 'bg-slate-900/80 text-rose-300 border border-slate-700'
              } ${focusLane === 'B' ? 'ring-1 ring-white/70' : ''}`}
            >
              LANE B: {junction.lanes[1].vehicleCount} veh
            </div>

            <div
              className={`absolute bottom-[10%] left-[40%] px-2 py-0.5 rounded backdrop-blur ${
                junction.lanes[2].signalState === 'GREEN'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500'
                  : 'bg-slate-900/80 text-rose-300 border border-slate-700'
              } ${focusLane === 'C' ? 'ring-1 ring-white/70' : ''}`}
            >
              LANE C: {junction.lanes[2].vehicleCount} veh
            </div>

            <div
              className={`absolute top-[44%] left-[10%] px-2 py-0.5 rounded backdrop-blur ${
                junction.lanes[3].signalState === 'GREEN'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500'
                  : 'bg-slate-900/80 text-rose-300 border border-slate-700'
              } ${focusLane === 'D' ? 'ring-1 ring-white/70' : ''}`}
            >
              LANE D: {junction.lanes[3].vehicleCount} veh
            </div>
          </div>
        )}

        {/* Bounding boxes are anchored to real vehicles in the camera frame. */}
        {showBoxes && (
          <div className="absolute inset-0 pointer-events-none z-[2]">
            {vehicles.map((v) => (
              <div
                key={`box-${v.id}`}
                className={`absolute transition-all duration-300 ${boxBorderClass(v)}`}
                style={{ left: `${v.x}%`, top: `${v.y}%`, width: `${v.width}%`, height: `${v.height}%` }}
              >
                <div
                  className={`absolute -top-4 left-0 text-[9px] font-mono px-1 leading-tight flex items-center gap-1 whitespace-nowrap rounded-t-sm ${boxTagClass(v)}`}
                >
                  <span>{v.kind}</span>
                  {showConfidence && <span className="opacity-80">{v.confidence.toFixed(2)}</span>}
                </div>
                <span className="absolute bottom-0 right-0 text-[8px] font-mono text-cyan-200/80 bg-slate-950/70 px-0.5">
                  {v.id}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Emergency vehicle (test-buttons) overlay: labeled bounding boxes on
            the B priority corridor, in the same style as standard detections. */}
        {emergencyTypes.length > 0 && (
          <div className="absolute inset-0 pointer-events-none z-[2]">
            {emergencyTypes.map((t, k) => (
              <div
                key={t}
                className={`absolute ${emergencyBoxClass(t)}`}
                style={{ left: `${56 + k * 7}%`, top: `${33 + k * 5}%`, width: '14%', height: '10%' }}
              >
                <div
                  className={`absolute -top-4 left-0 text-[9px] font-mono px-1 leading-tight whitespace-nowrap rounded-t-sm ${emergencyTagClass(t)}`}
                >
                  {EMERGENCY_LABEL[t]}
                </div>
                <span className="absolute bottom-0 right-0 text-[8px] font-mono text-cyan-200/80 bg-slate-950/70 px-0.5">
                  {'TRK-EMG-' + (k + 1)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Pedestrian Crosswalks (concurrent parallel-phase model) */}
        <div className="absolute inset-0 pointer-events-none z-[3]">
          {CROSSWALKS.map((cw) => {
            const active = isCrosswalkActive(cw, junction, greenLaneId);
            return (
              <div
                key={cw.id}
                className={`absolute rounded-sm ${active ? 'bg-emerald-500/30' : 'bg-slate-500/15'}`}
                style={{
                  left: `${cw.x}%`,
                  top: `${cw.y}%`,
                  width: `${cw.width}%`,
                  height: `${cw.height}%`,
                  border: active ? '1px solid rgba(52,211,153,0.9)' : '1px dashed rgba(100,116,139,0.5)',
                }}
              >
                {/* Keep the crossing status band, but never draw a person or
                    hand glyph into the vehicle scene. */}
              </div>
            );
          })}
        </div>

        {/* Top-Right HUD OSD overlay */}
        <div className="absolute top-2.5 right-2.5 bg-slate-950/85 border border-slate-800 rounded px-2.5 py-1.5 text-[10px] font-mono text-slate-300 backdrop-blur pointer-events-none space-y-0.5 w-max max-w-[calc(100%-1.25rem)]">
          <div className="flex items-center gap-x-3 text-cyan-300">
            <span>FPS: {fpsCounter}</span>
            <span>LAT: {junction.camera.modelLatencyMs}ms</span>
          </div>
          <div className="text-slate-400">{timecode}</div>
          <div className="text-[9px] text-slate-400">YOLOv8n / OpenCV 4.10</div>
        </div>

        {/* Bottom-Left Camera Details overlay */}
        <div className="absolute bottom-2.5 left-2.5 bg-slate-950/85 border border-slate-800 rounded px-2.5 py-1.5 text-[10px] font-mono text-slate-300 backdrop-blur pointer-events-none w-max max-w-[calc(100%-1.25rem)]">
          <div className="text-emerald-400 font-bold">RTSP: {junction.camera.streamStatus}</div>
          <div className="text-slate-400">{junction.camera.resolution}</div>
        </div>

        {/* Standard Pedestrian Signal Head — WALK / DON'T WALK state is tied to
            the actual crossing phase (junction.pedestrian). The DON'T WALK plate
            is the walk-request push-button: it registers pedestrian demand via
            the same handler as the Live view's "Pedestrian Call" control. */}
        <button
          type="button"
          disabled={walkActive}
          onClick={() => onRequestPedestrian?.()}
          title={
            walkActive
              ? 'Pedestrians already crossing'
              : pedWaiting
              ? 'Crossing request registered — walk will start at the next signal boundary'
              : 'Press to request a pedestrian crossing'
          }
          aria-label={walkActive ? 'Pedestrian walk in progress' : 'Request pedestrian crossing'}
          className={`absolute bottom-10 right-2.5 w-[112px] rounded-lg border-2 border-slate-700 bg-slate-950/95 backdrop-blur overflow-hidden shadow-xl text-center z-[3] transition-transform focus:outline-none ${
            walkActive || !onRequestPedestrian
              ? 'pointer-events-none'
              : 'cursor-pointer hover:border-emerald-500 hover:scale-[1.03] active:scale-[0.98] focus-visible:ring-1 focus-visible:ring-emerald-500'
          }`}
        >
          <span
            className={`h-[72px] flex items-center justify-center ${
              walkActive ? 'bg-emerald-500' : 'bg-slate-950'
            }`}
          >
            {walkActive ? (
              <span className="text-white">
                <WalkGlyph />
              </span>
            ) : (
              <span className="text-amber-600">
                <HandGlyph />
              </span>
            )}
          </span>
          <span className={`block px-1 py-1.5 ${walkActive ? 'bg-emerald-950/90' : 'bg-slate-900/90'}`}>
            {walkActive ? (
              <>
                <span className="block font-mono text-3xl font-bold leading-none text-emerald-300 tabular-nums">
                  {walkTimerSec}
                </span>
                <span className="mt-1 block text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-300">
                  Walk
                </span>
              </>
            ) : (
              <>
                <span className="block font-mono text-[11px] font-bold tracking-widest text-rose-400">
                  Don&apos;t Walk
                </span>
                <span
                  className={`mt-0.5 block text-[8px] font-mono ${
                    pedWaiting ? 'text-slate-400' : 'text-emerald-300 underline decoration-dotted underline-offset-2'
                  }`}
                >
                  {pedWaiting ? 'Service next phase' : onRequestPedestrian ? 'Press button to request' : ''}
                </span>
              </>
            )}
          </span>
        </button>
      </div>

      {/* Operator Detection Controls Bar */}
      <div className="px-3 sm:px-4 py-2 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className={`flex items-center gap-1.5 px-2 py-1.5 sm:py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-2 py-1.5 sm:py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
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
            className={`flex items-center gap-1.5 px-2 py-1.5 sm:py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
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
          <span className="font-bold text-white tabular-nums">{vehicles.length}</span>
        </div>
      </div>
    </div>
  );
};
