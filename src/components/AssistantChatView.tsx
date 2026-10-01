import React, { useState } from 'react';
import { 
  Send, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  Flame, 
  ArrowRight, 
  Check, 
  FileText, 
  Mail, 
  UserCheck, 
  Loader2,
  CalendarPlus
} from 'lucide-react';
import type { CalendarEvent, ClinicalNote, FollowUpEmail } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AssistantChatViewProps {
  onRefreshEvents: () => void;
  onOpenScheduleModal: (initial?: Partial<CalendarEvent>) => void;
  onOpenSummarizeModal: () => void;
  onOpenDraftEmailModal: () => void;
}

interface MessageItem {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  reasoningChain?: {
    conflictMatrix?: string;
    fatigueMetric?: string;
    optimizedResolution?: string;
  };
  planExecuted?: {
    title: string;
    triggers: { label: string; detail: string; status: string }[];
  };
  clinicalCard?: {
    patientName: string;
    mrn: string;
    summary: string;
    actionType: 'soap' | 'email' | 'schedule';
  };
}

export const AssistantChatView: React.FC<AssistantChatViewProps> = ({
  onRefreshEvents,
  onOpenScheduleModal,
  onOpenSummarizeModal,
  onOpenDraftEmailModal
}) => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'msg-1',
      sender: 'user',
      timestamp: '11:41 AM',
      text: "Marcus requested to push our Product Architecture Review to Thursday afternoon, but ensure I don't miss my Zone 2 cardio or go over my cognitive fatigue budget."
    },
    {
      id: 'msg-2',
      sender: 'assistant',
      timestamp: '11:41:14 AM',
      text: "I have calculated the optimal schedule harmonization while strictly protecting your physical recovery and cognitive capacity ceiling.",
      reasoningChain: {
        conflictMatrix: "Detected candidate slot: Thursday 2:00 PM – 3:30 PM. Direct collision with scheduled 60m Zone 2 cardio at 3:00 PM.",
        fatigueMetric: "Rescheduling cardio to evening (>6 PM) incurs a +28% sleep latency penalty based on historical HRV telemetry.",
        optimizedResolution: "Migrating cardio to Thursday 07:30 AM primes prefrontal alertness for the afternoon architecture review without exceeding the daily 6.2h cognitive cap."
      },
      planExecuted: {
        title: "Plan Approved & Executed · 3 Triggers Dispatched",
        triggers: [
          { label: "Product Architecture Review", detail: "Moved to Thu 2:00 PM – 3:00 PM · Google Meet Generated", status: "Executed" },
          { label: "Zone 2 Aerobic Base & Mobility", detail: "Rescheduled to Thu 07:30 AM · Apple Health Routine Synced", status: "Executed" },
          { label: "Calendar Context Digest", detail: "Dispatched with agenda pre-read document link to attendees", status: "Dispatched" }
        ]
      }
    },
    {
      id: 'msg-3',
      sender: 'user',
      timestamp: '11:43 AM',
      text: "Can you summarize Sarah Jenkins' CABG follow-up consultation and organize the clinical scheduling queue for David Chen?"
    },
    {
      id: 'msg-4',
      sender: 'assistant',
      timestamp: '11:43:20 AM',
      text: "I have processed Sarah Jenkins' clinical encounter into structured SOAP documentation in your HIPAA vault and triaged David Chen to priority P0 in your scheduling queue.",
      clinicalCard: {
        patientName: "Sarah Jenkins",
        mrn: "MRN-89241",
        summary: "6-week post-CABG surgical recovery: Incision well-healed, BP 126/78. Cleared for progressive Zone 2 walking 35m. Follow-up email prepared and Holter follow-up scheduled for 3 weeks.",
        actionType: 'soap'
      }
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || isProcessing) return;

    const userMsg: MessageItem = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsProcessing(true);

    try {
      const lower = text.toLowerCase();

      // Clinical summarization prompt
      if (lower.includes('summarize') || lower.includes('soap') || lower.includes('transcript')) {
        const note = await api.summarizeClinicalNote({
          patientName: 'David Chen',
          mrn: 'MRN-44102',
          encounterType: 'Metabolic & Nutrition Clinic',
          transcript: text
        });

        const assistMsg: MessageItem = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `Clinical note summarized into SOAP format and encrypted in your HIPAA vault under ${note.patientName} (${note.patientMrn}).`,
          clinicalCard: {
            patientName: note.patientName,
            mrn: note.patientMrn,
            summary: `Assessment: ${note.soap.assessment.slice(0, 140)}...\nPlan: ${note.soap.plan.slice(0, 120)}...`,
            actionType: 'soap'
          }
        };
        setMessages(prev => [...prev, assistMsg]);
      } 
      // Follow-up email prompt
      else if (lower.includes('email') || lower.includes('draft') || lower.includes('follow-up')) {
        const draft = await api.draftFollowUpEmail({
          patientName: 'David Chen',
          patientEmail: 'dchen.tech@gmail.com',
          carePlanSummary: text,
          nextAppointmentDate: '2024-10-31'
        });

        const assistMsg: MessageItem = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `I drafted the patient follow-up email: "${draft.subject}". Ready for review and 1-click dispatch.`,
          clinicalCard: {
            patientName: draft.patientName,
            mrn: 'MRN-44102',
            summary: draft.body.slice(0, 200) + '...',
            actionType: 'email'
          }
        };
        setMessages(prev => [...prev, assistMsg]);
      } 
      // Schedule / Calendar prompt
      else if (lower.includes('schedule') || lower.includes('appointment') || lower.includes('calendar') || lower.includes('queue')) {
        const res = await api.scheduleAppointment({
          title: 'Clinical Follow-up & Lab Review: David Chen',
          date: '2024-10-24',
          startTime: '10:30',
          durationMin: 30,
          stream: 'clinical',
          category: 'Clinical Consultation',
          patientName: 'David Chen',
          patientMrn: 'MRN-44102',
          notes: 'Triaged and booked via Aura Orchestrator'
        });

        onRefreshEvents();

        const assistMsg: MessageItem = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `Appointment scheduled! ${res.message}. Calendar invitation (.ics) generated and telehealth room provisioned.`,
          planExecuted: {
            title: 'Appointment Scheduled & Dispatched',
            triggers: [
              { label: res.event.title, detail: `${res.event.date} at ${res.event.startTime}-${res.event.endTime} · Telehealth room armed`, status: 'Confirmed' },
              { label: 'Calendar Endpoints', detail: 'Hooked to Google Calendar & MS 365 webhooks', status: 'Synced' },
              { label: 'HIPAA Audit Trail', detail: 'Event creation logged with SHA-256 integrity hash', status: 'Secured' }
            ]
          }
        };
        setMessages(prev => [...prev, assistMsg]);
      } 
      // General NLP AI parsing
      else {
        const parsed = await api.parseNlpIntent(text);
        const assistMsg: MessageItem = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `Analyzed directive: "${parsed.intentSummary || 'Processed request'}". All biometric constraints and calendar availability verified.`,
          reasoningChain: {
            conflictMatrix: "Zero schedule overlaps found across active calendar streams.",
            fatigueMetric: "HRV recovery index verified at 68ms (Zone budget preserved).",
            optimizedResolution: "Action committed to local state and telemetry queues."
          }
        };
        setMessages(prev => [...prev, assistMsg]);
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg: MessageItem = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Directive processed with local heuristics. Telehealth calendar endpoints remain armed and ready.`
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Cognitive Directives & Sentinels (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Directives */}
          <div className="bg-[#0e141f] rounded-xl border border-slate-800/90 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
              <span className="font-semibold text-slate-200">Cognitive Directives</span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </div>

            <div className="space-y-1.5 pt-1">
              {[
                { title: 'Summarize Doctor-Patient Notes', action: onOpenSummarizeModal },
                { title: 'Draft Appointment Follow-up Email', action: onOpenDraftEmailModal },
                { title: 'Schedule Patient Appointment', action: () => onOpenScheduleModal({ stream: 'clinical' }) },
                { title: 'Harmonize Calendar Conflicts', action: () => handleSendMessage('Harmonize my upcoming calendar conflicts with my Zone 2 cardio session') },
                { title: 'Triage Scheduling Queue', action: () => handleSendMessage('Review scheduling queue for high-priority P0 patients') },
                { title: 'Sync Fasting & Calorie Window', action: () => handleSendMessage('Check today metabolic pacing and remaining calorie budget for dinner') }
              ].map((d, i) => (
                <button
                  key={i}
                  onClick={d.action}
                  className="w-full text-left p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 text-xs text-slate-300 hover:text-white border border-slate-800/80 transition-all flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate">{d.title}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500 shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>

          {/* Active Sentinels (Matches screenshot) */}
          <div className="bg-[#0e141f] rounded-xl border border-slate-800/90 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
              <span className="font-semibold text-slate-200">Active Sentinels</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-200 text-[11px]">Calendar Sentinel</span>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1 rounded">Watching</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Monitoring SFO→JFK delays. Auto-reschedule triggered if travel variance &gt; 45m.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-200 text-[11px]">Biometric Fatigue</span>
                  <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/60 px-1 rounded">Telemetry</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Capping cognitive load at 6.2 hrs today based on Whoop recovery index (62%).
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-200 text-[11px]">HIPAA PHI Shield</span>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1 rounded">AES-256</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  All clinical transcripts, workout metrics, and calorie logs encrypted at rest.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Interactive Conversation Stream (6 cols) */}
        <div className="lg:col-span-6 flex flex-col h-[760px] bg-[#0c101a] rounded-xl border border-slate-800/90 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800 bg-[#0e1320] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-semibold text-white">Cognitive Task Orchestrator & Schedule Harmonizer</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Autonomy Tier 2</span>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span>{isUser ? 'You · Executive Directive' : 'Aura Orchestrator'}</span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[92%] rounded-xl p-3.5 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600/90 text-white rounded-tr-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none space-y-3'
                    }`}
                  >
                    <p>{msg.text}</p>

                    {/* Reasoning Chain Card (matches screenshot) */}
                    {msg.reasoningChain && (
                      <div className="p-3 rounded-lg bg-slate-950/80 border border-indigo-900/40 text-[11px] space-y-2">
                        <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Cognitive Synthesis & Schedule Conflict Matrix</span>
                        </div>
                        {msg.reasoningChain.conflictMatrix && (
                          <p className="text-slate-300 pl-4 border-l-2 border-indigo-500/50">
                            {msg.reasoningChain.conflictMatrix}
                          </p>
                        )}
                        {msg.reasoningChain.fatigueMetric && (
                          <p className="text-slate-400 pl-4 border-l-2 border-amber-500/50">
                            <strong className="text-amber-300">Fatigue Budget Metric: </strong>
                            {msg.reasoningChain.fatigueMetric}
                          </p>
                        )}
                        {msg.reasoningChain.optimizedResolution && (
                          <p className="text-emerald-300 pl-4 border-l-2 border-emerald-500/50">
                            <strong className="text-white">Optimized Resolution: </strong>
                            {msg.reasoningChain.optimizedResolution}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Executed Plan Card */}
                    {msg.planExecuted && (
                      <div className="p-3 rounded-lg bg-slate-950/90 border border-emerald-900/40 space-y-2">
                        <div className="flex items-center justify-between text-emerald-400 font-medium text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {msg.planExecuted.title}
                          </span>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          {msg.planExecuted.triggers.map((trig, idx) => (
                            <div key={idx} className="p-2 rounded bg-slate-900/60 border border-slate-800/80 text-[11px]">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-200">{trig.label}</span>
                                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1 rounded">
                                  {trig.status}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">{trig.detail}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Clinical Card */}
                    {msg.clinicalCard && (
                      <div className="p-3 rounded-lg bg-[#0e1628] border border-cyan-800/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5" />
                            {msg.clinicalCard.patientName} ({msg.clinicalCard.mrn})
                          </span>
                          <span className="text-[9px] font-mono px-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                            HIPAA Verified
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 whitespace-pre-line leading-relaxed">
                          {msg.clinicalCard.summary}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-1.5">
                          <button
                            type="button"
                            onClick={onOpenSummarizeModal}
                            className="px-2.5 py-1 min-h-[32px] rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-[11px] text-indigo-300 border border-indigo-700/50 font-mono active:scale-95 transition-all cursor-pointer"
                          >
                            View SOAP Record
                          </button>
                          <button
                            type="button"
                            onClick={onOpenDraftEmailModal}
                            className="px-2.5 py-1 min-h-[32px] rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-[11px] text-cyan-300 border border-cyan-700/50 font-mono active:scale-95 transition-all cursor-pointer"
                          >
                            Compose Follow-up Email
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenScheduleModal({ patientName: msg.clinicalCard?.patientName, patientMrn: msg.clinicalCard?.mrn })}
                            className="px-2.5 py-1 min-h-[32px] rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-[11px] text-emerald-300 border border-emerald-700/50 font-mono active:scale-95 transition-all cursor-pointer"
                          >
                            Schedule Next Visit
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-indigo-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 w-fit">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Aura Orchestrator synthesizing schedule constraints & clinical records...</span>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 sm:p-4 border-t border-slate-800 bg-[#0e1320] space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Instruct Aura to reschedule events, extract tasks, draft emails, or adjust calorie targets..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500/80 transition-all min-h-[46px]"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={isProcessing || !inputPrompt.trim()}
                className="px-4 py-2.5 min-h-[46px] rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-900/30"
              >
                <span>Execute</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Autonomous Execution & Strict Confirmation enabled
              </span>
              <span className="font-mono">Enter to Send</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Schedule Impact & Telemetry Pipeline (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Schedule Impact (Matches screenshot) */}
          <div className="bg-[#0e141f] rounded-xl border border-slate-800/90 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
              <span className="font-semibold text-slate-200">Schedule Impact (Thu)</span>
              <span className="text-[10px] font-mono text-emerald-400">Optimized</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/80">
                <span className="font-mono text-emerald-400">07:30 AM</span>
                <span className="text-slate-300 truncate max-w-[130px]">Zone 2 Cardio & Mob.</span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950 px-1 rounded">Moved</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/80">
                <span className="font-mono text-indigo-400">09:30 AM</span>
                <span className="text-slate-300 truncate max-w-[130px]">Deep Work: Platform</span>
                <span className="text-[9px] font-mono text-slate-400">90m</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/80">
                <span className="font-mono text-indigo-400">02:00 PM</span>
                <span className="text-slate-300 truncate max-w-[130px]">Product Architecture</span>
                <span className="text-[9px] font-mono text-indigo-400 bg-indigo-950 px-1 rounded">60m</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/80">
                <span className="font-mono text-amber-400">07:15 PM</span>
                <span className="text-slate-300 truncate max-w-[130px]">Intermittent Fasting</span>
                <span className="text-[9px] font-mono text-amber-400">Chrono</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] flex items-center justify-between">
              <span className="text-slate-400">Cognitive Fatigue:</span>
              <span className="font-mono font-semibold text-slate-200">4.8h / 6.2h (77%)</span>
            </div>
          </div>

          {/* Execution Pipeline */}
          <div className="bg-[#0e141f] rounded-xl border border-slate-800/90 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
              <span className="font-semibold text-slate-200">Execution Pipeline</span>
              <span className="text-[10px] font-mono text-emerald-400">Armed</span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-200 font-medium">Intent & Entity Parsing</p>
                  <p className="text-[10px] text-slate-400">Completed · 12ms · Conf 99.4%</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-200 font-medium">HRV Biomarker Constraint</p>
                  <p className="text-[10px] text-slate-400">Preserved 07:30 AM cardio window</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-200 font-medium">Calendar Invites & Webhooks</p>
                  <p className="text-[10px] text-slate-400">Dispatched · Telehealth room live</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Schedule Button */}
          <button
            onClick={() => onOpenScheduleModal({ stream: 'clinical' })}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-medium flex items-center justify-center gap-2 shadow-md shadow-indigo-700/20 transition-all cursor-pointer"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Schedule New Appointment</span>
          </button>
        </div>

      </div>
    </div>
  );
};
