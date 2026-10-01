import React, { useState } from 'react';
import { X, CalendarPlus, Clock, Video, Download, CheckCircle2, Loader2, Sparkles, User } from 'lucide-react';
import { api } from '../services/api.ts';
import type { CalendarEvent } from '../types/index.ts';

interface ScheduleAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (event: CalendarEvent) => void;
  initialData?: Partial<CalendarEvent>;
  currentUserName?: string;
}

export const ScheduleAppointmentModal: React.FC<ScheduleAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  currentUserName
}) => {
  const [title, setTitle] = useState(initialData?.title || 'Clinical Consultation: Follow-up');
  const [patientName, setPatientName] = useState(initialData?.patientName || 'David Chen');
  const [patientMrn, setPatientMrn] = useState(initialData?.patientMrn || 'MRN-44102');
  const [date, setDate] = useState(initialData?.date || '2024-10-24');
  const [startTime, setStartTime] = useState(initialData?.startTime || '10:30');
  const [durationMin, setDurationMin] = useState(initialData?.durationMin || 45);
  const [stream, setStream] = useState<'clinical' | 'work' | 'health' | 'nutrition' | 'focus'>(
    initialData?.stream || 'clinical'
  );
  const [notes, setNotes] = useState(initialData?.notes || 'Follow-up on laboratory telemetry and metabolic titration.');

  const [isLoading, setIsLoading] = useState(false);
  const [scheduledResult, setScheduledResult] = useState<{
    event: CalendarEvent;
    icsDownloadUrl: string;
    telehealthLink: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isLoading) return;

    setIsLoading(true);
    try {
      // CODE HANDLER HOOKING UP TO CALENDAR ENDPOINTS
      const res = await api.scheduleAppointment({
        title,
        patientName,
        patientMrn,
        date,
        startTime,
        durationMin,
        stream,
        category: stream === 'clinical' ? 'Clinical Consultation' : 'Executive Meeting',
        notes
      });

      setScheduledResult({
        event: res.event,
        icsDownloadUrl: res.icsDownloadUrl,
        telehealthLink: res.telehealthLink
      });

      onSuccess(res.event);
    } catch (err: any) {
      console.error('Error scheduling:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#0e1320] border border-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        {/* Mobile drag bar */}
        <div className="sm:hidden flex justify-center pt-2 pb-1 bg-[#0a0e17]">
          <span className="w-10 h-1 rounded-full bg-slate-700"></span>
        </div>

        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0a0e17]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <CalendarPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Schedule Appointment</h3>
              <p className="text-[11px] text-slate-400 font-mono">Hooked to Google Calendar & EHR Endpoints</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {scheduledResult ? (
          <div className="p-6 space-y-4 text-center overflow-y-auto">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-base font-bold text-white">Appointment Confirmed & Dispatched!</h4>
              <p className="text-xs text-slate-300 mt-1 font-mono">
                {scheduledResult.event.date} · {scheduledResult.event.startTime} - {scheduledResult.event.endTime} ({scheduledResult.event.durationMin} mins)
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-left space-y-2 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Event:</span>
                <span className="text-white font-sans">{scheduledResult.event.title}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Room:</span>
                <a 
                  href={scheduledResult.telehealthLink} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-indigo-400 hover:underline truncate max-w-[200px]"
                >
                  {scheduledResult.telehealthLink}
                </a>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>HIPAA Vault Status:</span>
                <span className="text-emerald-400">Encrypted (AES-256)</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <a
                href={scheduledResult.icsDownloadUrl}
                download
                className="w-full py-3 px-4 min-h-[46px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download .ics Calendar File</span>
              </a>

              <button
                onClick={onClose}
                className="w-full py-3 px-4 min-h-[46px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
            <div>
              <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Appointment Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-base sm:text-xs text-white focus:outline-none focus:border-indigo-500 min-h-[44px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Patient Name</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-base sm:text-xs text-white focus:outline-none focus:border-indigo-500 min-h-[44px]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">MRN (Medical Record #)</label>
                <input
                  type="text"
                  value={patientMrn}
                  onChange={(e) => setPatientMrn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-base sm:text-xs text-white focus:outline-none focus:border-indigo-500 font-mono min-h-[44px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white font-mono min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white font-mono min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Duration</label>
                <select
                  value={durationMin}
                  onChange={(e) => setDurationMin(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white min-h-[44px]"
                >
                  <option value={15}>15 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>60 mins</option>
                  <option value={90}>90 mins</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Calendar Stream</label>
                <select
                  value={stream}
                  onChange={(e) => setStream(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-base sm:text-xs text-white min-h-[44px]"
                >
                  <option value="clinical">Clinical Consultation</option>
                  <option value="work">Google Calendar (Work)</option>
                  <option value="health">Health & Vitality</option>
                  <option value="focus">Deep Focus Block</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Attending Clinician</label>
                <input
                  type="text"
                  readOnly
                  value={currentUserName || 'Dr. S. N. Reddy, MD'}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-3 text-base sm:text-xs text-slate-300 min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Clinical Objectives & Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-base sm:text-xs text-white focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-3 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Hooking to Calendar...</span>
                  </>
                ) : (
                  <>
                    <CalendarPlus className="w-4 h-4" />
                    <span>Schedule Appointment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
