import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Video, 
  CheckSquare, 
  Square, 
  ShieldCheck, 
  RefreshCw, 
  Clock, 
  Users, 
  Send,
  Download,
  AlertCircle
} from 'lucide-react';
import type { CalendarEvent } from '../types/index.ts';
import { api } from '../services/api.ts';

interface CalendarMeetingsViewProps {
  events: CalendarEvent[];
  onRefreshEvents: () => void;
  onOpenScheduleModal: (initial?: Partial<CalendarEvent>) => void;
}

export const CalendarMeetingsView: React.FC<CalendarMeetingsViewProps> = ({
  events,
  onRefreshEvents,
  onOpenScheduleModal
}) => {
  const [selectedStream, setSelectedStream] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(events[1] || events[0] || null);
  const [activeTab, setActiveTab] = useState<'month' | 'week' | 'day' | 'agenda'>('week');

  // Quick Schedule Form State
  const [qsTitle, setQsTitle] = useState('Patient Cardiac Rehab Touchpoint');
  const [qsDate, setQsDate] = useState('2024-10-24');
  const [qsTime, setQsTime] = useState('14:00');
  const [qsDuration, setQsDuration] = useState(45);
  const [qsCategory, setQsCategory] = useState('Clinical Consultation');
  const [qsStream, setQsStream] = useState<'clinical' | 'work' | 'health'>('clinical');
  const [isDispatching, setIsDispatching] = useState(false);
  const [qsSuccess, setQsSuccess] = useState<string | null>(null);

  const streams = [
    { id: 'all', label: 'All Calendars (18)', color: 'bg-indigo-500' },
    { id: 'clinical', label: 'Clinical Telehealth', color: 'bg-cyan-500' },
    { id: 'work', label: 'Google Calendar (Work)', color: 'bg-blue-500' },
    { id: 'health', label: 'Health & Vitality', color: 'bg-emerald-500' },
    { id: 'nutrition', label: 'Nutrition & Macros', color: 'bg-amber-500' },
    { id: 'focus', label: 'Deep Focus & Commutes', color: 'bg-purple-500' },
  ];

  const daysOfWeek = [
    { day: 'Mon', date: '21', key: '2024-10-21' },
    { day: 'Tue', date: '22', key: '2024-10-22' },
    { day: 'Wed', date: '23', key: '2024-10-23', isToday: true },
    { day: 'Thu', date: '24', key: '2024-10-24' },
    { day: 'Fri', date: '25', key: '2024-10-25' },
    { day: 'Sat', date: '26', key: '2024-10-26' },
    { day: 'Sun', date: '27', key: '2024-10-27' },
  ];

  const hours = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  // Code handler hooking up to calendar endpoint
  const handleQuickDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qsTitle.trim() || isDispatching) return;

    setIsDispatching(true);
    setQsSuccess(null);

    try {
      const res = await api.scheduleAppointment({
        title: qsTitle,
        date: qsDate,
        startTime: qsTime,
        durationMin: Number(qsDuration),
        stream: qsStream,
        category: qsCategory,
        notes: `Quick scheduled via Calendar Hub handler.`
      });

      setQsSuccess(`Scheduled: ${res.event.title} on ${res.event.date} at ${res.event.startTime}`);
      onRefreshEvents();
      setSelectedEvent(res.event);
      setTimeout(() => setQsSuccess(null), 4000);
    } catch (err: any) {
      console.error('Dispatch error:', err);
    } finally {
      setIsDispatching(false);
    }
  };

  const filteredEvents = selectedStream === 'all' 
    ? events 
    : events.filter(e => e.stream === selectedStream);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Top Header Controls (Matches screenshot) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button className="p-1 hover:text-white text-slate-400">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="px-2 py-0.5 text-xs font-semibold text-slate-200 hover:text-white">
              Today
            </button>
            <button className="p-1 hover:text-white text-slate-400">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              October 21 – October 27, 2024
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">W43 · Active Clinical & Executive Quarter</p>
          </div>
        </div>

        {/* View Switcher & Add Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
            {(['month', 'week', 'day', 'agenda'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-2 min-h-[40px] rounded-lg capitalize font-medium transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={() => onOpenScheduleModal()}
            className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Event / Schedule Task</span>
          </button>
        </div>
      </div>

      {/* Stream filter tags - touch swipeable on mobile */}
      <div className="flex items-center gap-2 text-xs overflow-x-auto touch-pan-x no-scrollbar pb-1">
        <span className="text-slate-400 text-[11px] font-mono mr-1 shrink-0">STREAMS:</span>
        {streams.map(stream => {
          const isSelected = selectedStream === stream.id;
          return (
            <button
              key={stream.id}
              onClick={() => setSelectedStream(stream.id)}
              className={`flex items-center gap-2 px-3 py-2 min-h-[40px] rounded-xl text-xs transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-slate-800 text-white font-medium border border-slate-700 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${stream.color}`}></span>
              <span className="whitespace-nowrap">{stream.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Calendar Section: Grid or Day/Agenda List + Detail & Quick Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Main Calendar Viewport (8 cols) */}
        <div className="lg:col-span-8 bg-[#0a0e17] rounded-2xl border border-slate-800/90 overflow-hidden shadow-sm flex flex-col">
          {activeTab === 'day' || activeTab === 'agenda' ? (
            /* MOBILE & TOUCH-OPTIMIZED DAY / AGENDA LIST VIEW */
            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white font-mono uppercase">
                    {activeTab === 'day' ? "Today's Consultations & Telehealth Slots (Wed, Oct 23)" : 'Chronological Agenda Queue'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {filteredEvents.length} Scheduled
                </span>
              </div>

              <div className="space-y-3">
                {filteredEvents.map((evt) => {
                  const isSelected = selectedEvent?.id === evt.id;
                  const isClinical = evt.stream === 'clinical';
                  const isHealth = evt.stream === 'health';

                  return (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer active:scale-[0.99] flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#151c2e] border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                          : isClinical
                          ? 'bg-slate-950/90 border-cyan-900/50 hover:border-cyan-700/60'
                          : isHealth
                          ? 'bg-slate-950/90 border-emerald-900/50 hover:border-emerald-700/60'
                          : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 font-mono text-center shrink-0 min-w-[64px]">
                          <span className="text-xs font-bold text-white block">{evt.startTime}</span>
                          <span className="text-[10px] text-slate-400 block">{evt.durationMin}m</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                              isClinical 
                                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50' 
                                : isHealth
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                              {evt.stream}
                            </span>
                            {evt.patientName && (
                              <span className="text-xs text-indigo-300 font-medium truncate">
                                Pt: {evt.patientName}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-white mt-1 truncate">{evt.title}</h4>
                          {evt.notes && (
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{evt.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                        {evt.locationOrUrl && (
                          <a
                            href={evt.locationOrUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 sm:flex-initial px-3.5 py-2 min-h-[40px] rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(evt);
                          }}
                          className="px-3.5 py-2 min-h-[40px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* 7-DAY DESKTOP/TABLET GRID WITH TOUCH SCROLLING */
            <div className="overflow-x-auto touch-pan-x">
              <div className="min-w-[620px]">
                {/* Day Headers */}
                <div className="grid grid-cols-8 border-b border-slate-800 bg-[#0e1320] text-center text-xs">
                  <div className="py-2.5 text-slate-400 font-mono text-[10px] border-r border-slate-800">
                    GMT-7
                  </div>
                  {daysOfWeek.map((d) => (
                    <div
                      key={d.key}
                      className={`py-2.5 border-r border-slate-800/80 flex flex-col items-center ${
                        d.isToday ? 'bg-indigo-950/40 text-indigo-300 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-mono text-slate-400">{d.day}</span>
                      <span className={`text-xs mt-0.5 ${d.isToday ? 'text-indigo-400' : ''}`}>{d.date}</span>
                    </div>
                  ))}
                </div>

                {/* Time Slots Table */}
                <div className="flex-1 overflow-y-auto max-h-[640px] divide-y divide-slate-800/60 relative">
                  {hours.map((hour) => {
                    const hourNumber = parseInt(hour.split(':')[0], 10);

                    return (
                      <div key={hour} className="grid grid-cols-8 min-h-[58px] text-xs">
                        {/* Hour label */}
                        <div className="p-1.5 text-right font-mono text-[10px] text-slate-400 border-r border-slate-800/70 select-none">
                          {hour}
                        </div>

                        {/* 7 day cells */}
                        {daysOfWeek.map((d) => {
                          const isWednesday = d.day === 'Wed';
                          // Find events matching this hour
                          const matchingEvents = isWednesday
                            ? filteredEvents.filter(e => {
                                const eventStartHour = parseInt(e.startTime.split(':')[0], 10);
                                return eventStartHour === hourNumber;
                              })
                            : [];

                          return (
                            <div
                              key={d.key}
                              onClick={() => {
                                onOpenScheduleModal({
                                  date: d.key,
                                  startTime: hour
                                });
                              }}
                              className={`border-r border-slate-800/50 p-1 relative hover:bg-slate-900/40 transition-colors cursor-pointer ${
                                d.isToday ? 'bg-indigo-950/10' : ''
                              }`}
                            >
                              {matchingEvents.map((evt) => {
                                const isSelected = selectedEvent?.id === evt.id;
                                const isClinical = evt.stream === 'clinical';
                                const isHealth = evt.stream === 'health';

                                return (
                                  <div
                                    key={evt.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedEvent(evt);
                                    }}
                                    className={`p-1.5 rounded text-[10px] leading-tight border transition-all z-10 shadow-sm ${
                                      isSelected
                                        ? 'ring-2 ring-indigo-400 bg-indigo-900/80 text-white border-indigo-400'
                                        : isClinical
                                        ? 'bg-cyan-950/80 text-cyan-200 border-cyan-700/60 hover:border-cyan-400'
                                        : isHealth
                                        ? 'bg-emerald-950/80 text-emerald-200 border-emerald-700/60 hover:border-emerald-400'
                                        : 'bg-indigo-950/80 text-indigo-200 border-indigo-800/60 hover:border-indigo-500'
                                    }`}
                                  >
                                    <div className="font-semibold truncate">{evt.title}</div>
                                    <div className="font-mono text-[9px] text-slate-400 mt-0.5 truncate">
                                      {evt.startTime} - {evt.endTime}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Detail Panel + Quick Schedule (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Selected Event Card (Matches screenshot) */}
          {selectedEvent ? (
            <div className="bg-[#0e141f] rounded-xl border border-slate-800/90 p-4 space-y-3.5">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
                <span className="text-[10px] uppercase font-mono text-indigo-400">
                  {selectedEvent.category || 'GOOGLE CALENDAR (WORK)'}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/40">
                  Confirmed
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {selectedEvent.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-300 font-mono mt-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Today · {selectedEvent.startTime} – {selectedEvent.endTime}</span>
                  <span className="text-[10px] text-amber-300 font-semibold bg-amber-950/50 px-1 rounded">In 15m</span>
                </div>
              </div>

              {/* Video call button */}
              {selectedEvent.locationOrUrl && (
                <div className="flex items-center gap-2">
                  <a
                    href={selectedEvent.locationOrUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>{selectedEvent.stream === 'clinical' ? 'Join Telehealth Room' : 'Join Google Meet'}</span>
                  </a>

                  <a
                    href={`/api/calendar/export-ics/${selectedEvent.id}`}
                    download
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700"
                    title="Export iCalendar (.ics)"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Confirmed Attendees */}
              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">
                    Confirmed Attendees ({selectedEvent.attendees.length})
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {selectedEvent.attendees.map((att, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        {att}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Autonomous Brief (Matches screenshot) */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-indigo-300 font-semibold text-[11px]">
                  <span>Aura Autonomous Brief</span>
                  <span className="text-[9px] font-mono text-slate-400">Synced from Notion</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {selectedEvent.notes || 'Physician review of telemetry data, metabolic adherence, and follow-up clinical goals.'}
                </p>
              </div>

              {/* AI Guardrails & Reminders */}
              <div className="space-y-2 pt-1 border-t border-slate-800 text-xs">
                <span className="text-[10px] uppercase font-mono text-slate-400">AI Guardrails & Reminders</span>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-300">Send updated latency & lab metrics 10m before call</span>
                    <span className="text-[9px] font-mono text-emerald-400">Auto-Fired</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-300">Confirm Marcus records architecture RFC diagram</span>
                    <span className="text-[9px] font-mono text-amber-400">Pending</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0e141f] rounded-xl border border-slate-800/90 p-4 text-center text-xs text-slate-400">
              Select an appointment or slot to view clinical briefs.
            </div>
          )}

          {/* Quick Schedule Form (Matches screenshot bottom right) */}
          <div className="bg-[#0e141f] rounded-xl border border-slate-800/90 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                Quick Schedule
              </span>
              <span className="text-[10px] font-mono text-indigo-400">Smart NLP Enabled</span>
            </div>

            <form onSubmit={handleQuickDispatch} className="space-y-2.5 text-xs">
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  Event Title / Task
                </label>
                <input
                  type="text"
                  value={qsTitle}
                  onChange={(e) => setQsTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-base sm:text-xs text-slate-200 min-h-[44px] focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Date</label>
                  <input
                    type="date"
                    value={qsDate}
                    onChange={(e) => setQsDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-base sm:text-xs text-slate-200 font-mono min-h-[44px] focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Time</label>
                  <input
                    type="time"
                    value={qsTime}
                    onChange={(e) => setQsTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-base sm:text-xs text-slate-200 font-mono min-h-[44px] focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Stream</label>
                  <select
                    value={qsStream}
                    onChange={(e) => setQsStream(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-base sm:text-xs text-slate-200 min-h-[44px] focus:outline-none focus:border-indigo-500"
                  >
                    <option value="clinical">Clinical Telehealth</option>
                    <option value="work">Google Calendar</option>
                    <option value="health">Health & Vitality</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Duration</label>
                  <select
                    value={qsDuration}
                    onChange={(e) => setQsDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-base sm:text-xs text-slate-200 min-h-[44px] focus:outline-none focus:border-indigo-500"
                  >
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isDispatching || !qsTitle.trim()}
                className="w-full py-3 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-900/30 mt-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isDispatching ? 'Connecting to Calendar...' : 'Confirm & Dispatch'}</span>
              </button>

              {qsSuccess && (
                <div className="p-2 rounded bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-[11px]">
                  {qsSuccess}
                </div>
              )}
            </form>
          </div>

        </div>

      </div>

      {/* Bottom Sync Network Status Bar (Matches screenshot) */}
      <div className="p-3 rounded-xl bg-[#0a0e17] border border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-300 font-medium">Google Workspace</span>
            <span className="text-[10px] font-mono text-slate-400">Synced 2m ago</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-300 font-medium">MS Exchange / Outlook</span>
            <span className="text-[10px] font-mono text-slate-400">Synced 4m ago</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-300 font-medium">Apple iCal (Local)</span>
            <span className="text-[10px] font-mono text-slate-400">Synced Just now</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            End-to-End Encrypted
          </span>
          <button
            onClick={onRefreshEvents}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-800 transition-colors"
          >
            <RefreshCw className="w-3 h-3 text-indigo-400" />
            <span>Force Immediate Sync</span>
          </button>
        </div>
      </div>
    </div>
  );
};
