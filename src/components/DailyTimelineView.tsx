import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Video, 
  ExternalLink, 
  Clock, 
  Dumbbell, 
  Sparkles, 
  AlertCircle, 
  Plus, 
  Play, 
  Pause, 
  ShieldCheck, 
  Flame, 
  Droplets, 
  ChevronRight,
  UserCheck,
  Mail
} from 'lucide-react';
import type { CalendarEvent, DailyHealthSummary } from '../types/index.ts';
import { IntentDispatcher } from './IntentDispatcher.tsx';
import { api } from '../services/api.ts';

interface DailyTimelineViewProps {
  events: CalendarEvent[];
  healthSummary: DailyHealthSummary | null;
  onRefreshEvents: () => void;
  onRefreshHealth: () => void;
  onOpenScheduleModal: (initialData?: Partial<CalendarEvent>) => void;
  onOpenSummarizeModal: () => void;
  onOpenFollowUpEmailModal: () => void;
}

export const DailyTimelineView: React.FC<DailyTimelineViewProps> = ({
  events,
  healthSummary,
  onRefreshEvents,
  onRefreshHealth,
  onOpenScheduleModal,
  onOpenSummarizeModal,
  onOpenFollowUpEmailModal
}) => {
  const [showProactiveWindow, setShowProactiveWindow] = useState(true);
  const [isPlayingMemo, setIsPlayingMemo] = useState(false);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({
    task1: false,
    task2: false,
    task3: true,
  });

  const toggleTask = (id: string) => {
    setCheckedTasks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [selectedMobileDay, setSelectedMobileDay] = useState('23');

  const mobileDays = [
    { day: 'Mon', num: '21', status: '2 events' },
    { day: 'Tue', num: '22', status: '3 events' },
    { day: 'TODAY', num: '23', status: '4 events', isToday: true },
    { day: 'Thu', num: '24', status: '3 events' },
    { day: 'Fri', num: '25', status: '4 slots' },
    { day: 'Sat', num: '26', status: 'Weekend' },
  ];

  const handleAutoScheduleGap = async () => {
    try {
      await api.scheduleAppointment({
        title: 'High-Protein Refuel & Metabolic Decompression Walk',
        date: '2024-10-23',
        startTime: '15:00',
        durationMin: 45,
        stream: 'nutrition',
        category: 'Health & Vitality',
        notes: 'Target 45g protein intake + 15m outdoor Zone 1 walking decompression.'
      });
      setShowProactiveWindow(false);
      onRefreshEvents();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Intent Dispatcher */}
      <IntentDispatcher 
        onEventCreated={onRefreshEvents} 
        onMealLogged={onRefreshHealth} 
      />

      {/* MOBILE DAY SELECTOR STRIP (Matches screenshot 013735) */}
      <div className="block lg:hidden bg-[#0a0d16] p-2 rounded-2xl border border-slate-800/90 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto touch-pan-x no-scrollbar pb-0.5">
          {mobileDays.map((d) => {
            const isSelected = selectedMobileDay === d.num;
            return (
              <button
                key={d.num}
                type="button"
                onClick={() => setSelectedMobileDay(d.num)}
                className={`flex-1 min-w-[58px] min-h-[58px] p-1.5 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
                    : d.isToday
                    ? 'bg-indigo-950/40 text-indigo-300 border border-indigo-700/40'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span className="text-[9px] uppercase font-mono font-bold tracking-wider">{d.day}</span>
                <span className="text-sm font-bold font-mono mt-0.5">{d.num}</span>
                <span className="w-1.5 h-1.5 rounded-full mt-1 bg-emerald-400"></span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Proactive Window */}
      {showProactiveWindow && (
        <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-800/50 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase text-indigo-400 tracking-wider">Aura Proactive Window</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs font-semibold text-white">Unscheduled 45-Min Gap Detected</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Between <span className="font-semibold text-indigo-200">3:00 PM</span> and <span className="font-semibold text-indigo-200">3:45 PM</span> today. Recommended for your afternoon meal (45g protein target) and 15-min decompression walk before the Clinical Consultation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={handleAutoScheduleGap}
              className="flex-1 md:flex-initial px-4 py-2.5 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-xs font-semibold transition-all shadow-sm flex items-center justify-center cursor-pointer"
            >
              Auto-Schedule Gap
            </button>
            <button
              onClick={() => setShowProactiveWindow(false)}
              className="px-3.5 py-2.5 min-h-[44px] rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors flex items-center justify-center cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Left Timeline + Right Metabolic & Health Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CENTER / LEFT: Today's Unified Timeline (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Today's Unified Timeline</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                OCT 23
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-mono">Stream: Unified</span>
              <button 
                onClick={() => onOpenScheduleModal()}
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Event</span>
              </button>
            </div>
          </div>

          {/* Timeline Stack */}
          <div className="relative border-l border-slate-800/80 ml-3.5 pl-6 space-y-5">
            {/* CURRENT TIME INDICATOR (08:42 AM) */}
            <div className="relative -ml-[31px] flex items-center gap-2 py-1 my-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20 animate-pulse"></span>
              <div className="h-[2px] flex-1 bg-gradient-to-r from-emerald-500 to-transparent"></div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-[#0b0f17] px-2 py-0.5 rounded border border-emerald-500/30">
                08:42 AM CURRENT
              </span>
            </div>

            {events.map((event) => {
              const isPast = event.status === 'completed';
              const isClinical = event.stream === 'clinical';
              const isHealth = event.stream === 'health';
              const isFocus = event.stream === 'focus';

              return (
                <div 
                  key={event.id}
                  className={`group relative rounded-xl border p-4 transition-all ${
                    isPast 
                      ? 'bg-slate-900/40 border-slate-800/50 opacity-80'
                      : isClinical
                      ? 'bg-[#121626] border-indigo-500/40 hover:border-indigo-400 shadow-md shadow-indigo-950/20'
                      : isHealth
                      ? 'bg-[#0f171d] border-emerald-900/50 hover:border-emerald-700/50'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Timeline bullet on the left line */}
                  <span 
                    className={`absolute -left-[31px] top-4 w-2.5 h-2.5 rounded-full border-2 ${
                      isPast
                        ? 'bg-emerald-500 border-slate-900'
                        : isClinical
                        ? 'bg-indigo-400 border-indigo-900 animate-pulse'
                        : isHealth
                        ? 'bg-emerald-400 border-emerald-900'
                        : 'bg-slate-500 border-slate-900'
                    }`} 
                  />

                  {/* Event Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-200">
                          {event.startTime} - {event.endTime}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">({event.durationMin}m)</span>
                        {isPast && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-800/40">
                            Completed
                          </span>
                        )}
                        {isClinical && (
                          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/50 px-1.5 py-0.2 rounded border border-cyan-800/40">
                            Clinical Consultation
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-white mt-1 group-hover:text-indigo-300 transition-colors">
                        {event.title}
                      </h3>
                    </div>

                    {/* Action Icon / Badge */}
                    <div className="flex items-center gap-1.5">
                      {isPast ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : isFocus ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          High Focus
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Notes / Details */}
                  {event.notes && (
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {event.notes}
                    </p>
                  )}

                  {/* Patient badge if clinical */}
                  {event.patientName && (
                    <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="text-slate-200 font-medium">{event.patientName}</span>
                        {event.patientMrn && (
                          <span className="text-[10px] font-mono text-slate-400">({event.patientMrn})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 pt-1 sm:pt-0">
                        <button
                          type="button"
                          onClick={onOpenSummarizeModal}
                          className="flex-1 sm:flex-initial px-3 py-1.5 min-h-[36px] rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 text-[11px] font-medium flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-400" />
                          <span>Summarize Visit</span>
                        </button>
                        <button
                          type="button"
                          onClick={onOpenFollowUpEmailModal}
                          className="flex-1 sm:flex-initial px-3 py-1.5 min-h-[36px] rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 text-[11px] font-medium flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                        >
                          <Mail className="w-3 h-3 text-cyan-400" />
                          <span>Draft Email</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Meeting link / Video call */}
                  {event.locationOrUrl && (
                    <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-800/60">
                      <div className="flex items-center gap-2 text-xs text-indigo-300">
                        <Video className="w-3.5 h-3.5 text-indigo-400" />
                        <a 
                          href={event.locationOrUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="hover:underline truncate max-w-xs"
                        >
                          {event.stream === 'clinical' ? 'Join Telehealth Room' : 'Join Google Meet'}
                        </a>
                      </div>

                      <a
                        href={`/api/calendar/export-ics/${event.id}`}
                        download
                        className="text-[10px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1"
                        title="Download .ics calendar file"
                      >
                        <span>Export .ics</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Metabolic & Health Hub + Active Reminders (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* METABOLIC & HEALTH HUB (Matches screenshot) */}
          <div className="bg-[#0e141f] rounded-xl border border-slate-800/90 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <h3 className="text-xs font-semibold text-white tracking-wide">Metabolic & Health Hub</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                Live Telemetry
              </span>
            </div>

            {/* Calorie Balance Card */}
            <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400">Calorie Intake Target</span>
                  <div className="text-xl font-bold font-mono text-white mt-0.5">
                    1,840 <span className="text-xs font-normal text-slate-400">/ 2,350 kcal</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-emerald-400">510 kcal left</span>
                  <p className="text-[10px] text-slate-400">Paced for dinner</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                <div className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full rounded-full" style={{ width: '78%' }}></div>
              </div>

              {/* Macro breakdown */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-center">
                <div>
                  <span className="text-[10px] font-mono text-slate-400">Protein</span>
                  <p className="text-xs font-mono font-semibold text-slate-200 mt-0.5">145g / 180g</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400">Carbs</span>
                  <p className="text-xs font-mono font-semibold text-slate-200 mt-0.5">188g / 240g</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400">Fats</span>
                  <p className="text-xs font-mono font-semibold text-slate-200 mt-0.5">55g / 70g</p>
                </div>
              </div>
            </div>

            {/* Calories Burned & Weight Trend row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Flame className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono uppercase text-slate-400">Burned Today</span>
                </div>
                <div className="text-base font-bold font-mono text-white mt-1">
                  480 <span className="text-xs font-normal text-slate-400">kcal</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Cardiorespiratory block</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Weight Trend</span>
                  <span className="text-[10px] font-mono text-emerald-400">-0.4 kg</span>
                </div>
                <div className="text-base font-bold font-mono text-white mt-1">
                  74.2 <span className="text-xs font-normal text-slate-400">kg</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Goal: 71.0 kg · BF: 16.8%</p>
              </div>
            </div>

            {/* Hydration */}
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400">Hydration</span>
                  <p className="text-xs font-bold font-mono text-slate-200">2.2L / 3.0L</p>
                </div>
              </div>
              <button 
                onClick={onRefreshHealth}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 cursor-pointer"
                title="Log 250ml water"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ACTIVE NOTES & REMINDERS (Matches screenshot) */}
          <div className="bg-[#0e141f] rounded-xl border border-slate-800/90 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-white tracking-wide">Active Notes & Reminders</h3>
              <span className="text-[10px] font-mono text-slate-400">3 Pending · 4 Cleared</span>
            </div>

            {/* Priority task items */}
            <div className="space-y-2">
              <div 
                onClick={() => toggleTask('task1')}
                className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2.5 cursor-pointer hover:border-slate-700 transition-colors"
              >
                <input 
                  type="checkbox" 
                  checked={checkedTasks['task1']} 
                  onChange={() => {}} 
                  className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer" 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-medium text-slate-200 truncate ${checkedTasks['task1'] ? 'line-through text-slate-400' : ''}`}>
                      Review CABG Holter Lab Results for Sarah Jenkins
                    </p>
                    <span className="text-[9px] font-mono px-1 rounded bg-red-950/80 text-red-400 border border-red-800/40">
                      P0
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Due 04:00 PM · Linked to Telehealth Consult</p>
                </div>
              </div>

              <div 
                onClick={() => toggleTask('task2')}
                className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2.5 cursor-pointer hover:border-slate-700 transition-colors"
              >
                <input 
                  type="checkbox" 
                  checked={checkedTasks['task2']} 
                  onChange={() => {}} 
                  className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer" 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-medium text-slate-200 truncate ${checkedTasks['task2'] ? 'line-through text-slate-400' : ''}`}>
                      Triage David Chen HbA1c Queue & Titrate Metformin
                    </p>
                    <span className="text-[9px] font-mono px-1 rounded bg-amber-950/80 text-amber-400 border border-amber-800/40">
                      P1
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Within 48h · Scheduling Queue</p>
                </div>
              </div>
            </div>

            {/* Dictated Voice Memo Box */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsPlayingMemo(!isPlayingMemo)}
                    className="w-6 h-6 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    {isPlayingMemo ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                  </button>
                  <span className="text-slate-300 font-medium text-[11px]">Dictated Clinical Memo</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">0:42s</span>
              </div>

              {/* Waveform graphic */}
              <div className="flex items-center gap-1 h-5 px-1 py-0.5">
                {[4, 12, 18, 8, 14, 20, 24, 16, 10, 18, 22, 14, 8, 16, 20, 12, 6, 14, 18, 10, 5, 12, 16, 9].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}px` }}
                    className={`w-1 rounded-full transition-all ${
                      isPlayingMemo ? 'bg-indigo-400 animate-pulse' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>

              <p className="text-[11px] text-slate-400 italic">
                "Remind patient Sarah to elevate legs 20m post-rehab and schedule next Holter follow-up in 3 weeks..."
              </p>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-900">
                <button
                  onClick={onOpenSummarizeModal}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono underline"
                >
                  Process to SOAP Note
                </button>
              </div>
            </div>
          </div>

          {/* CONNECTED TELEMETRY (Matches screenshot) */}
          <div className="bg-[#0e141f] rounded-xl border border-slate-800/90 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Connected Telemetry</span>
              <span className="text-[10px] font-mono text-emerald-400">4 Healthy</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium text-[11px]">Google Cal</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">3 events pending</p>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium text-[11px]">Apple Health</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">HR: 64 · 8,420 steps</p>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium text-[11px]">Notion Notes</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">Synced 12m ago</p>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium text-[11px]">HIPAA Vault</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">AES-256 Active</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
