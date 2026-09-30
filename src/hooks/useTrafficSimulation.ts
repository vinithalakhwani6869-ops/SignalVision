import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Junction, TrafficAlert, SystemMode, EmergencyType, JunctionHotspot } from '../types/traffic';
import { INITIAL_JUNCTIONS, INITIAL_ALERTS } from '../data/mockTrafficData';

// FIND→FIX: unflagged junctions run this fixed green duration (spec: "fixed 30s
// timer") while adaptive logic only runs for junctions the trajectory layer flagged.
const FIND_FIX_FIXED_GREEN_SEC = 30;

export function useTrafficSimulation(hotspots: JunctionHotspot[] = []) {
  const [junctions, setJunctions] = useState<Junction[]>(INITIAL_JUNCTIONS);
  const [selectedJunctionId, setSelectedJunctionId] = useState<string>('J-14');
  const [alerts, setAlerts] = useState<TrafficAlert[]>(INITIAL_ALERTS);
  const [globalFailSafe, setGlobalFailSafe] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeEmergencyTypes, setActiveEmergencyTypes] = useState<EmergencyType[]>([]);
  const emergencyReleaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emergencyActive = activeEmergencyTypes.length > 0;
  const flaggedJunctionIds = useMemo(
    () => new Set(hotspots.filter((hotspot) => hotspot.isFlagged).map((hotspot) => hotspot.junctionId)),
    [hotspots]
  );

  // FIND flags are read through a ref so the trajectory layer never tears down
  // or recreates the 1-second traffic loop. The trajectory sim produces a new
  // `hotspots` array identity on every tick, and if that identity were a dep of
  // the loop effect its interval would be cleared+recreated each second — which
  // starves the lane-timer tick and freezes the live junction view.
  const flaggedJunctionIdsRef = useRef(flaggedJunctionIds);
  useEffect(() => {
    flaggedJunctionIdsRef.current = flaggedJunctionIds;
  }, [flaggedJunctionIds]);

  const selectedJunction = junctions.find((j) => j.id === selectedJunctionId) || junctions[0];

  // Helper: Recalculate adaptive green times across 4 lanes based on density
  const recalculateAdaptiveGreens = useCallback(
    (lanes: Junction['lanes'], config: Junction['config']): Junction['lanes'] => {
      const totalVehicles = lanes.reduce((sum, l) => sum + Math.max(l.vehicleCount, 1), 0);
      const totalGreenPool = 140; // baseline pool in seconds

      return lanes.map((lane) => {
        const ratio = lane.vehicleCount / totalVehicles;
        // Clamp between min and max bounds configured for this junction
        const calculatedGreen = Math.round(
          Math.min(
            config.maxGreenSec,
            Math.max(config.minGreenSec, totalGreenPool * ratio)
          )
        );
        const timeSaved = Math.max(0, Math.round(lane.fixedTimerBaselineSec - calculatedGreen));

        return {
          ...lane,
          allocatedGreenSec: calculatedGreen,
          timeSavedSec: timeSaved,
        };
      });
    },
    []
  );

  // Main 1-second simulation loop
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setJunctions((prevJunctions) =>
        prevJunctions.map((j) => {
          let updatedLanes = [...j.lanes];
          let currentTimer = j.currentPhaseTimer - 1;
          let activeIdx = j.activeLaneIndex;
          let pedestrian = { ...j.pedestrian };

          // Walk countdown runs concurrently with the parallel lane green and
          // is decremented independently of the lane's own phase timer.
          if (pedestrian.walkActive) {
            const nextWalkSec = Math.max(0, pedestrian.walkTimerSec - 1);
            pedestrian =
              nextWalkSec <= 0
                ? { walkActive: false, waiting: false, walkTimerSec: 0 }
                : { ...pedestrian, walkTimerSec: nextWalkSec };
          }

          const activeLane = updatedLanes[activeIdx];

          // Advance to the next lane's green (density-based or fixed fallback)
          const startNextLaneGreen = () => {
            // Priority order is immutable: emergency preemption, manual fail-safe,
            // then junction operating mode. FIND→FIX flags ONLY decide the
            // green-time MODE (adaptive split vs fixed 30s) — they never pick the
            // lane. WHICH lane gets green always comes from the lane-density
            // comparison while the adaptive engine is running.
            const emergencyOverride = j.config.emergencyPreemptionActive || j.config.mode === 'EMERGENCY_PRIORITY';
            const inFailSafe = j.config.mode === 'FIXED_FALLBACK' || globalFailSafe;
            const adaptiveModeActive = !emergencyOverride && !inFailSafe && j.config.mode === 'ADAPTIVE_AI';

            if (adaptiveModeActive) {
              // Find next non-cleared lane with highest vehicle queue
              let nextIdx = (activeIdx + 1) % 4;
              let maxVeh = -1;
              for (let i = 0; i < 4; i++) {
                if (i !== activeIdx && updatedLanes[i].vehicleCount > maxVeh) {
                  maxVeh = updatedLanes[i].vehicleCount;
                  nextIdx = i;
                }
              }
              activeIdx = nextIdx;
            } else {
              activeIdx = (activeIdx + 1) % 4;
            }

            const nextLaneGreenTime = inFailSafe
              ? updatedLanes[activeIdx].fixedTimerBaselineSec
              : emergencyOverride
              ? updatedLanes[activeIdx].allocatedGreenSec
              : adaptiveModeActive && flaggedJunctionIdsRef.current.has(j.id)
              ? updatedLanes[activeIdx].allocatedGreenSec
              : FIND_FIX_FIXED_GREEN_SEC;

            updatedLanes[activeIdx] = {
              ...updatedLanes[activeIdx],
              signalState: 'GREEN',
              currentTimerSec: nextLaneGreenTime,
            };
            currentTimer = nextLaneGreenTime;
          };

          // Timer expired for the active lane / concurrent walk phase
          if (currentTimer <= 0) {
            if (pedestrian.walkActive) {
              // Still serving the walk: hold this lane's green so pedestrians
              // finish crossing before the parallel phase is cleared.
              updatedLanes[activeIdx] = { ...activeLane, signalState: 'GREEN', currentTimerSec: 1 };
              currentTimer = 1;
            } else if (activeLane.signalState === 'GREEN') {
              // Transition to Amber clearance
              updatedLanes[activeIdx] = {
                ...activeLane,
                signalState: 'AMBER',
                currentTimerSec: j.config.amberDurationSec,
              };
              currentTimer = j.config.amberDurationSec;
            } else if (activeLane.signalState === 'AMBER') {
              // Finish amber, switch to RED
              updatedLanes[activeIdx] = {
                ...activeLane,
                signalState: 'RED',
                currentTimerSec: 0,
              };

              if (pedestrian.waiting && !j.config.emergencyPreemptionActive) {
                // Standard concurrent/parallel pedestrian phase (US MUTCD §4E):
                // the walk is served together with the next non-conflicting
                // lane's green instead of an all-red scramble. N/S crosswalks
                // walk parallel to E-W traffic (lanes B/D); E/W crosswalks walk
                // parallel to N-S traffic (lanes A/C).
                pedestrian = {
                  ...pedestrian,
                  waiting: false,
                  walkActive: true,
                  walkTimerSec: j.config.pedestrianWalkSec,
                };
                startNextLaneGreen();
              } else {
                startNextLaneGreen();
              }
            }
          } else {
            // Decrement the active lane's phase timer (walk timer handled above)
            updatedLanes[activeIdx] = {
              ...activeLane,
              currentTimerSec: currentTimer,
            };

            // Small live vehicle flow simulation:
            // Active green lane discharges vehicles (~1-2 every 3s)
            // Red lanes occasionally accumulate vehicles (~0-1 every 4s)
            if (Math.random() > 0.45 && activeLane.signalState === 'GREEN' && activeLane.vehicleCount > 5) {
              const discharged = Math.min(2, activeLane.vehicleCount);
              updatedLanes[activeIdx] = {
                ...updatedLanes[activeIdx],
                vehicleCount: Math.max(3, activeLane.vehicleCount - discharged),
                queueLengthMeters: Math.round(Math.max(15, activeLane.queueLengthMeters - discharged * 3)),
              };
            }

            // Inflow on other lanes
            updatedLanes = updatedLanes.map((l, idx) => {
              if (idx !== activeIdx && Math.random() > 0.75) {
                const add = Math.random() > 0.6 ? 2 : 1;
                return {
                  ...l,
                  vehicleCount: l.vehicleCount + add,
                  queueLengthMeters: Math.round(l.queueLengthMeters + add * 3.2),
                };
              }
              return l;
            });
          }

          // Recalculate adaptive values whenever the adaptive engine is running
          // (FIND flags only choose the green-time mode, never the density math)
          const emergencyOverride = j.config.emergencyPreemptionActive || j.config.mode === 'EMERGENCY_PRIORITY';
          if (!emergencyOverride && !globalFailSafe) {
            updatedLanes = recalculateAdaptiveGreens(updatedLanes, j.config);
          }

          const totalVeh = updatedLanes.reduce((s, l) => s + l.vehicleCount, 0);
          const score = Math.min(100, Math.round((totalVeh / 200) * 100));
          const congestionLevel = score > 75 ? 'critical' : score > 45 ? 'moderate' : 'normal';

          return {
            ...j,
            activeLaneIndex: activeIdx,
            currentPhaseTimer: currentTimer,
            lanes: updatedLanes,
            pedestrian,
            totalVehicleCount: totalVeh,
            congestionScore: score,
            congestionLevel,
            lastUpdated: 'Live',
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, globalFailSafe, recalculateAdaptiveGreens]);

  // Operator Action: Surge traffic on a specific lane
  const triggerTrafficSurge = (laneId: 'A' | 'B' | 'C' | 'D', count: number = 30) => {
    setJunctions((prev) =>
      prev.map((j) => {
        if (j.id !== selectedJunctionId) return j;
        const newLanes = j.lanes.map((l) =>
          l.laneId === laneId
            ? {
                ...l,
                vehicleCount: l.vehicleCount + count,
                queueLengthMeters: Math.round(l.queueLengthMeters + count * 3.5),
              }
            : l
        );
        const recalced = !globalFailSafe
          ? recalculateAdaptiveGreens(newLanes, j.config)
          : newLanes;
        return {
          ...j,
          lanes: recalced,
          totalVehicleCount: recalced.reduce((s, l) => s + l.vehicleCount, 0),
        };
      })
    );

    // Push alert
    const newAlert: TrafficAlert = {
      id: `ALT-${Date.now().toString().slice(-4)}`,
      junctionId: selectedJunction.id,
      junctionName: selectedJunction.name,
      laneId,
      timestamp: 'Just now',
      severity: 'warning',
      title: `Surge Detected on Lane ${laneId} (+${count} vehicles)`,
      description: `YOLOv8 density surge triggered adaptive green-time expansion. Optimization model adapted dynamically within safety bounds.`,
      acknowledged: false,
    };
    setAlerts((prev) => [newAlert, ...prev.slice(0, 7)]);
  };

  // Operator Action: Emergency Vehicle Priority Preemption (Green Wave)
  // Ambulance, fire, and other emergency vehicles share identical priority handling.
  const triggerEmergencyPreemption = (
    targetLaneId: 'A' | 'B' | 'C' | 'D' = 'B',
    emergencyType: EmergencyType = 'AMBULANCE'
  ) => {
    // Multiple simultaneous emergency vehicles are treated equally (no type preference),
    // accumulating into the active priority window.
    setActiveEmergencyTypes((prev) =>
      prev.includes(emergencyType) ? prev : [...prev, emergencyType]
    );

    if (emergencyReleaseTimerRef.current) {
      clearTimeout(emergencyReleaseTimerRef.current);
    }

    setJunctions((prev) =>
      prev.map((j) => {
        if (j.id !== selectedJunctionId) return j;
        const targetIndex = j.lanes.findIndex((l) => l.laneId === targetLaneId);
        const updatedLanes = j.lanes.map((l, idx) => ({
          ...l,
          signalState: (idx === targetIndex ? 'GREEN' : 'RED') as Junction['lanes'][0]['signalState'],
          currentTimerSec: idx === targetIndex ? 45 : 0,
        }));

        return {
          ...j,
          activeLaneIndex: targetIndex >= 0 ? targetIndex : 0,
          currentPhaseTimer: 45,
          lanes: updatedLanes,
          // Emergency preempts any active pedestrian walk; waiting pedestrians are
          // deferred and served once the priority corridor is released.
          pedestrian: { waiting: true, walkActive: false, walkTimerSec: 0 },
          config: {
            ...j.config,
            mode: 'EMERGENCY_PRIORITY',
            emergencyPreemptionActive: true,
          },
        };
      })
    );

    const emergencyLabelMap: Record<EmergencyType, string> = {
      AMBULANCE: 'EMERGENCY VEHICLE',
      FIRE: 'EMERGENCY FIRE VEHICLE',
      OTHER: 'EMERGENCY SERVICE VEHICLE (POLICE/OTHER)',
    };
    const alert: TrafficAlert = {
      id: `ALT-EMG-${Date.now().toString().slice(-3)}`,
      junctionId: selectedJunction.id,
      junctionName: selectedJunction.name,
      laneId: targetLaneId,
      timestamp: 'Just now',
      severity: 'critical',
      title: `${emergencyLabelMap[emergencyType]} PREEMPTION ACTIVATED (Lane ${targetLaneId})`,
      description: `Optical/YOLO ${
        emergencyType === 'AMBULANCE'
          ? 'emergency'
          : emergencyType === 'FIRE'
          ? 'fire-engine'
          : 'emergency-service'
      } recognition detected rapid approach. Conflict lanes halted in all-red clearance. Priority corridor active.`,
      acknowledged: false,
    };
    setAlerts((prev) => [alert, ...prev.slice(0, 7)]);

    // Automatically release after 30 seconds back to adaptive (window extends on
    // subsequent simultaneous emergency triggers)
    emergencyReleaseTimerRef.current = setTimeout(() => {
      setActiveEmergencyTypes([]);
      setJunctions((prev) =>
        prev.map((j) => {
          if (j.id !== selectedJunctionId) return j;
          return {
            ...j,
            config: {
              ...j.config,
              mode: 'ADAPTIVE_AI',
              emergencyPreemptionActive: false,
            },
          };
        })
      );
      emergencyReleaseTimerRef.current = null;
    }, 30000);
  };

  // Operator Action: Pedestrian Crossing Demand (Walk Phase Request)
  const triggerPedestrianCall = () => {
    setJunctions((prev) =>
      prev.map((j) => {
        if (j.id !== selectedJunctionId) return j;
        if (j.pedestrian.walkActive) return j;

        // If a green phase is still running long, truncate it to the safety floor
        // (minGreenSec) so the walk phase starts promptly at the next signal boundary.
        const activeIdx = j.activeLaneIndex;
        const active = j.lanes[activeIdx];
        let updatedLanes = j.lanes;
        let currentPhaseTimer = j.currentPhaseTimer;
        if (
          active &&
          active.signalState === 'GREEN' &&
          active.currentTimerSec > j.config.minGreenSec
        ) {
          updatedLanes = j.lanes.map((l, idx) =>
            idx === activeIdx ? { ...l, currentTimerSec: j.config.minGreenSec } : l
          );
          currentPhaseTimer = j.config.minGreenSec;
        }

        return {
          ...j,
          currentPhaseTimer,
          lanes: updatedLanes,
          pedestrian: { ...j.pedestrian, waiting: true },
        };
      })
    );

    const alert: TrafficAlert = {
      id: `ALT-PED-${Date.now().toString().slice(-3)}`,
      junctionId: selectedJunction.id,
      junctionName: selectedJunction.name,
      timestamp: 'Just now',
      severity: 'warning',
      title: 'Pedestrian Crossing Demand Spike',
      description: `Pedestrian push-button & optical count triggered guaranteed ${selectedJunction.config.pedestrianWalkSec}s walk phase at the next signal boundary.`,
      acknowledged: false,
    };
    setAlerts((prev) => [alert, ...prev.slice(0, 7)]);
  };

  // Operator Action: Toggle Fail-safe (revert to fixed-timer)
  const toggleFailSafe = () => {
    const nextState = !globalFailSafe;
    setGlobalFailSafe(nextState);

    setJunctions((prev) =>
      prev.map((j) => ({
        ...j,
        config: {
          ...j.config,
          mode: nextState ? 'FIXED_FALLBACK' : 'ADAPTIVE_AI',
          failSafeActive: nextState,
        },
      }))
    );

    const alert: TrafficAlert = {
      id: `ALT-FS-${Date.now().toString().slice(-3)}`,
      junctionId: 'ALL',
      junctionName: 'City-wide Network',
      timestamp: 'Just now',
      severity: nextState ? 'warning' : 'info',
      title: nextState ? 'Fail-Safe Activated: Reverted to Fixed Timers' : 'Adaptive AI Mode Restored',
      description: nextState
        ? 'Manual operator fail-safe interlock triggered. Fixed 60s timing tables applied across all intersections.'
        : 'YOLOv8 density control re-engaged. Dynamic green split optimization active.',
      acknowledged: false,
    };
    setAlerts((prev) => [alert, ...prev.slice(0, 7)]);
  };

  // Operator Action: Update Junction Config
  const updateJunctionConfig = (junctionId: string, partialConfig: Partial<Junction['config']>) => {
    setJunctions((prev) =>
      prev.map((j) => {
        if (j.id !== junctionId) return j;
        const newConfig = { ...j.config, ...partialConfig };
        const recalcedLanes = !globalFailSafe
          ? recalculateAdaptiveGreens(j.lanes, newConfig)
          : j.lanes;
        return {
          ...j,
          config: newConfig,
          lanes: recalcedLanes,
        };
      })
    );
  };

  // Acknowledge alert
  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
  };

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  return {
    junctions,
    selectedJunction,
    selectedJunctionId,
    setSelectedJunctionId,
    alerts,
    globalFailSafe,
    hotspotFlags: hotspots,
    isSignalVisionActive: (junctionId: string) =>
      !globalFailSafe && flaggedJunctionIds.has(junctionId),
    isPaused,
    setIsPaused,
    emergencyActive,
    activeEmergencyTypes,
    triggerTrafficSurge,
    triggerEmergencyPreemption,
    triggerPedestrianCall,
    toggleFailSafe,
    updateJunctionConfig,
    acknowledgeAlert,
    dismissAlert,
  };
}
