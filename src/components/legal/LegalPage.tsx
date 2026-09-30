import React from 'react';
import { ShieldCheck, ScrollText, ArrowLeft, Mail, Info } from 'lucide-react';

export type LegalKind = 'privacy' | 'terms';

interface LegalPageProps {
  kind: LegalKind;
  onBack: () => void;
}

const privacySections = [
  {
    title: 'What this prototype collects',
    body: 'SignalVision is a Smart India Hackathon 2026 prototype. It does not collect, store, or transmit any personal data from the public. CCTV imagery shown in this dashboard is simulated using static stock frames; no live video or identifiable imagery of real persons or vehicles is processed.',
  },
  {
    title: 'Vehicle detection & location data',
    body: 'All vehicle counts, queue lengths, bounding boxes, and congestion scores are procedurally generated mock data. YOLOv8/OpenCV references on the interface describe the intended system architecture, not real-time inference on this prototype.',
  },
  {
    title: 'Location & zone data',
    body: 'Junction names and coordinates refer to public roads for situational realism. No location tracking of any device or individual occurs while using this dashboard.',
  },
  {
    title: 'Local storage & cookies',
    body: 'The prototype does not use cookies, tracking pixels, or analytics SDKs. No data leaves your browser.',
  },
  {
    title: 'Contact',
    body: 'For questions about this prototype or the proposed privacy architecture, contact the team at signalvision.sih2026@example.in.',
  },
];

const termsSections = [
  {
    title: 'Purpose',
    body: 'These Terms apply to your use of the SignalVision adaptive traffic signal control command-center prototype, built by Team KYZEN for Smart India Hackathon 2026.',
  },
  {
    title: 'Prototype status',
    body: 'SignalVision is a demonstration prototype. The simulated traffic data, timers, and analytics are illustrative and do not represent real traffic conditions or a deployable signal-controller system.',
  },
  {
    title: 'Prohibited use',
    body: 'Do not use this prototype to operate real traffic infrastructure, to make decisions about real signal phasing, or to misrepresent simulated data as live operational telemetry.',
  },
  {
    title: 'Intellectual property',
    body: 'The interface, code, and concepts presented here are the intellectual property of Team KYZEN unless otherwise stated. Third-party frameworks and assets remain subject to their own licenses.',
  },
  {
    title: 'Prototype Disclaimer',
    body: 'This prototype is intended for demonstration and evaluation only. Its outputs should be validated against applicable traffic regulations, certified traffic-control infrastructure, and real-world conditions before deployment.',
  },
  {
    title: 'Contact',
    body: 'Questions about these Terms may be directed to signalvision.sih2026@example.in.',
  },
];

export const LegalPage: React.FC<LegalPageProps> = ({ kind, onBack }) => {
  const isPrivacy = kind === 'privacy';
  const sections = isPrivacy ? privacySections : termsSections;

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-3xl mx-auto space-y-4 sm:space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-md bg-slate-800 flex items-center justify-center shrink-0">
            {isPrivacy ? (
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            ) : (
              <ScrollText className="w-4 h-4 text-cyan-400" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {isPrivacy ? 'Privacy Policy' : 'Terms & Conditions'}
            </h1>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              SignalVision · Adaptive Traffic Signal Control · SIH 2026 Prototype
            </p>
          </div>
        </div>

        <div className="mt-4 bg-cyan-950/50 border border-cyan-800/60 rounded-md px-3 py-2.5 flex items-start gap-2 text-[11px] text-cyan-200">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            This is a prototype. All CCTV feeds, detections, and metrics
            shown are simulated for demonstration only and are not real operational data.
          </span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg divide-y divide-slate-800/80">
        {sections.map((section) => (
          <div key={section.title} className="p-4 sm:p-5">
            <h2 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
              {section.title}
            </h2>
            <p className="text-[13px] text-slate-400 leading-relaxed mt-1.5">{section.body}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <button
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </button>
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <Mail className="w-3 h-3" />
          signalvision.sih2026@example.in
        </div>
      </div>
    </div>
  );
};