import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const PrivacyPanel: React.FC = () => (
  <section className="bg-slate-900 border border-emerald-900/70 rounded-lg p-3 text-xs">
    <div className="flex items-center gap-2 text-emerald-300 font-semibold"><ShieldCheck className="w-4 h-4" />Privacy by design</div>
    <p className="text-slate-400 mt-1.5 leading-relaxed">This prototype stores a one-way plate hash, camera ID, lane, and timestamp for up to 24 hours. It does not store raw plate text, faces, or video. Simulated plates are hashed immediately before a sighting is created.</p>
  </section>
);
