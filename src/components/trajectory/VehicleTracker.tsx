import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { TrackedVehicleRoute } from '../../types/traffic';

interface VehicleTrackerProps {
  onTrack: (plate: string) => Promise<TrackedVehicleRoute | null>;
  route: TrackedVehicleRoute | null;
  onRouteChange: (route: TrackedVehicleRoute | null) => void;
}

export const VehicleTracker: React.FC<VehicleTrackerProps> = ({ onTrack, route, onRouteChange }) => {
  const [plate, setPlate] = useState('');
  const [message, setMessage] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await onTrack(plate);
    onRouteChange(result);
    setMessage(result ? `${result.stops.length} cameras matched` : 'No simulated route found');
    setPlate('');
  };
  return <form onSubmit={submit} className="bg-slate-900 border border-slate-600 rounded-lg p-2 shadow-lg text-xs w-64 flex-shrink-0">
    <label className="text-slate-300 font-semibold">Track a vehicle</label>
    <div className="flex gap-1 mt-1"><input value={plate} onChange={(event) => setPlate(event.target.value)} placeholder="KA01AB1234" className="min-w-0 flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white uppercase" /><button className="p-1.5 rounded bg-cyan-700 text-white" title="Hash plate locally and find its route"><Search className="w-3.5 h-3.5" /></button></div>
    <p className="text-[10px] text-slate-400 mt-1">Entry is hashed locally and never retained.</p>
    {message && <p className={`text-[10px] mt-1 ${route ? 'text-emerald-300' : 'text-slate-400'}`}>{message}</p>}
  </form>;
};
