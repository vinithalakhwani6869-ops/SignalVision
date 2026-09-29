import { useState, useEffect, useCallback, useRef } from 'react';
import { Junction, TrafficAlert, SystemMode, BoundingBox, EmergencyType } from '../types/traffic';
import { INITIAL_JUNCTIONS, INITIAL_ALERTS } from '../data/mockTrafficData';

// Generates dynamic YOLO bounding boxes based on active lane counts.
// Detection is simulated: boxes are procedurally derived from lane queues and
// emergency override state; they are suppressed while a pedestrian walk phase
// (all approaches held) is being served.
export function generateBoundingBoxes(junction: Junction, emergencyTypes: EmergencyType[] = []): BoundingBox[] {
  if (junction.pedestrian.walkActive) {
    return [];
  }

  const boxes: BoundingBox[] = [];
  const laneA = junction.lanes[0];
  const laneB = junction.lanes[1];
  const laneC = junction.lanes[2];
  const laneD = junction.lanes[3];

  // Lane A (Top Left to Center / North approach)
  const aCount = Math.min(laneA.vehicleCount, 14);
  for (let i = 0; i < aCount; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    boxes.push({
      id: `TRK-A${i + 1}`,
      label: i % 4 === 0 ? 'bus' : i % 3 === 0 ? 'auto' : 'car',
      confidence: 0.86 + (i * 0.01) % 0.12,
      x: 22 + col * 9 + (row * 1.5),
      y: 18 + row * 8,
      width: 7.5,
      height: 6.5,
      lane: 'A',
      speedKmph: laneA.signalState === 'GREEN' ? 24 : 0,
    });
  }

  // Lane B (Right to Center / East approach) - emergency vehicles appear here
  // to match the Lane-B green-wave corridor surfaced in the UI.
  const bCount = Math.min(laneB.vehicleCount, 16);
  for (let i = 0; i < bCount; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const emergencyType = i < emergencyTypes.length ? emergencyTypes[i] : undefined;
    const emergencyLabel =
      emergencyType === 'FIRE'
        ? 'fire truck'
        : emergencyType === 'OTHER'
        ? 'police'
        : emergencyType === 'AMBULANCE'
        ? 'ambulance'
        : undefined;
    boxes.push({
      id: `TRK-B${i + 1}`,
      label: emergencyLabel || (i % 5 === 0 ? 'truck' : i % 2 === 0 ? 'car' : 'motorcycle'),
      confidence: emergencyType ? 0.99 : 0.88 + (i * 0.01) % 0.1,
      x: 58 + col * 9,
      y: 35 + row * 9,
      width: emergencyType ? 10 : i % 5 === 0 ? 11 : 7,
      height: emergencyType ? 9 : 7,
      lane: 'B',
      speedKmph: laneB.signalState === 'GREEN' ? 26 : 0,
      isEmergency: !!emergencyType,
      emergencyType,
    });
  }

  // Lane C (Bottom approach / Southbound)
  const cCount = Math.min(laneC.vehicleCount, 12);
  for (let i = 0; i < cCount; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    boxes.push({
      id: `TRK-C${i + 1}`,
      label: i % 3 === 0 ? 'auto' : 'car',
      confidence: 0.87 + (i * 0.015) % 0.1,
      x: 36 + col * 10,
      y: 62 + row * 6.5,
      width: 8,
      height: 7,
      lane: 'C',
      speedKmph: laneC.signalState === 'GREEN' ? 20 : 0,
    });
  }

  // Lane D (Left / West approach)
  const dCount = Math.min(laneD.vehicleCount, 10);
  for (let i = 0; i < dCount; i++) {
    const row = Math.floor(i / 2);
    const col = i % 2;
    boxes.push({
      id: `TRK-D${i + 1}`,
      label: i % 2 === 0 ? 'motorcycle' : 'car',
      confidence: 0.89 + (i * 0.01) % 0.09,
      x: 8 + col * 8,
      y: 42 + row * 8,
      width: 6.5,
      height: 6,
      lane: 'D',
      speedKmph: laneD.signalState === 'GREEN' ? 28 : 0,
    });
  }

  return boxes;
}

export function useTrafficSimulation() {
  const [junctions, setJunctions] = useState<Junction[]>(INITIAL_JUNCTIONS);
  const [selectedJunctionId, setSelectedJunctionId] = useState<string>('J-14');
  const [alerts, setAlerts] = useState<TrafficAlert[]>(INITIAL_ALERTS);
  const [globalFailSafe, setGlobalFailSafe] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeEmergencyTypes, setActiveEmergencyTypes] = useState<EmergencyType[]>([]);
  const emergencyReleaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emergencyActive = activeEmergencyTypes.length > 0;

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

          const activeLane = updatedLanes[activeIdx];

          // Advance to the next lane's green (density-based or fixed fallback)
          const startNextLaneGreen = () => {
            // Determine next lane: highest demand in Adaptive mode, round-robin in Fixed mode
            if (j.config.mode === 'ADAPTIVE_AI' && !globalFailSafe) {
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

            const nextLaneGreenTime =
              j.config.mode === 'FIXED_FALLBACK' || globalFailSafe
                ? updatedLanes[activeIdx].fixedTimerBaselineSec
                : updatedLanes[activeIdx].allocatedGreenSec;

            updatedLanes[activeIdx] = {
              ...updatedLanes[activeIdx],
              signalState: 'GREEN',
              currentTimerSec: nextLaneGreenTime,
            };
            currentTimer = nextLaneGreenTime;
          };

          // Timer expired for active lane / walk phase
          if (currentTimer <= 0) {
            if (pedestrian.walkActive) {
              // Pedestrian walk phase finished: clear crossing state and resume vehicle service
              pedestrian = { ...pedestrian, walkActive: false, waiting: false, walkTimerSec: 0 };
              startNextLaneGreen();
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
                // Serve waiting pedestrians: hold every approach at RED during the walk phase
                updatedLanes = updatedLanes.map((l) => ({
                  ...l,
                  signalState: 'RED',
                  currentTimerSec: 0,
                }));
                pedestrian = {
                  ...pedestrian,
                  walkActive: true,
                  walkTimerSec: j.config.pedestrianWalkSec,
                };
                currentTimer = j.config.pedestrianWalkSec;
              } else {
                startNextLaneGreen();
              }
            }
          } else {
            // Decrement active lane timer (walk phase countdown during pedestrian crossing)
            if (pedestrian.walkActive) {
              pedestrian = { ...pedestrian, walkTimerSec: currentTimer };
            } else {
              updatedLanes[activeIdx] = {
                ...activeLane,
                currentTimerSec: currentTimer,
              };
            }

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

          // Recalculate adaptive values if in AI mode
          if (j.config.mode === 'ADAPTIVE_AI' && !globalFailSafe) {
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
        const recalced = recalculateAdaptiveGreens(newLanes, j.config);
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
        ? 'Manual operator fail-safe interlock triggered. Fixed 45-50s timing tables applied across all intersections.'
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
        const recalcedLanes = recalculateAdaptiveGreens(j.lanes, newConfig);
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
