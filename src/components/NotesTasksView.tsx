import React, { useState } from 'react';
import { 
  FileText, 
  Mail, 
  CalendarPlus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Play, 
  Pause, 
  Sparkles, 
  Send, 
  Plus, 
  Copy, 
  Check, 
  UserCheck, 
  ShieldCheck, 
  ExternalLink,
  Folder,
  Upload,
  Loader2
} from 'lucide-react';
import type { ClinicalNote, FollowUpEmail, SchedulingQueueItem } from '../types/index.ts';
import { api } from '../services/api.ts';
import { googleSignIn, getAccessToken, driveApi } from '../services/googleAuth.ts';

interface NotesTasksViewProps {
  clinicalNotes: ClinicalNote[];
  emailDrafts: FollowUpEmail[];
  schedulingQueue: SchedulingQueueItem[];
  onRefreshAll: () => void;
  onOpenScheduleModal: (initial?: any) => void;
  onOpenSummarizeModal: () => void;
  onOpenDraftEmailModal: (note?: ClinicalNote) => void;
  currentUserName?: string;
}

export const NotesTasksView: React.FC<NotesTasksViewProps> = ({
  clinicalNotes,
  emailDrafts,
  schedulingQueue,
  onRefreshAll,
  onOpenScheduleModal,
  onOpenSummarizeModal,
  onOpenDraftEmailModal,
  currentUserName
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'soap' | 'queue' | 'emails' | 'reminders'>('soap');
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(clinicalNotes[0] || null);
  const [showRawTranscript, setShowRawTranscript] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [exportingDriveId, setExportingDriveId] = useState<string | null>(null);
  const [driveNotification, setDriveNotification] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleExportNoteToDrive = async (note: ClinicalNote) => {
    setExportingDriveId(note.id);
    setDriveNotification(null);
    try {
      let token = await getAccessToken();
      if (!token) {
        const signinRes = await googleSignIn();
        token = signinRes?.accessToken || null;
      }
      if (!token) {
        throw new Error('Google Drive access token required. Please sign in.');
      }

      const fileName = `SOAP_Note_${note.patientName.replace(/\s+/g, '_')}_${note.consultDate}.txt`;
      const docContent = [
        `======================================================`,
        `AURA CLINICAL INTELLIGENCE — CONSULTATION SUMMARY`,
        `======================================================`,
        `Patient Name: ${note.patientName}`,
        `MRN: ${note.patientMrn}`,
        `Encounter Type: ${note.encounterType}`,
        `Consultation Date: ${note.consultDate}`,
        `Physician: ${currentUserName || 'Dr. S. N. Reddy, MD'}`,
        ``,
        `--- SUBJECTIVE ---`,
        note.soap.subjective,
        ``,
        `--- OBJECTIVE ---`,
        note.soap.objective,
        ``,
        `--- ASSESSMENT ---`,
        note.soap.assessment,
        ``,
        `--- PLAN ---`,
        note.soap.plan,
        ``,
        `--- PRESCRIPTIONS ---`,
        note.prescriptions.map(p => `• ${p}`).join('\n'),
        ``,
        `--- DIET & LIFESTYLE ORDERS ---`,
        note.dietAndLifestyleOrders,
        ``,
        `--- RECOMMENDED FOLLOW-UP ---`,
        `${note.recommendedFollowUpWeeks} weeks`,
        `======================================================`,
        `Stored via Aura HIPAA-Compliant Gateway · End-to-End Encrypted`
      ].join('\n');

      await driveApi.uploadFile(token, fileName, docContent, 'text/plain');
      setDriveNotification(`Successfully exported "${fileName}" to Google Drive!`);
      setTimeout(() => setDriveNotification(null), 4000);
    } catch (err: any) {
      console.error('Drive export error:', err);
      setDriveNotification(`Drive export error: ${err.message || 'Failed to upload'}`);
      setTimeout(() => setDriveNotification(null), 5000);
    } finally {
      setExportingDriveId(null);
    }
  };

  const handleDispatchEmail = async (id: string) => {
    setDispatchingId(id);
    try {
      await api.dispatchEmail(id);
      onRefreshAll();
    } catch (e) {
      console.error(e);
    } finally {
      setDispatchingId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header (Matches screenshot) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Smart Notes, Tasks & Reminders</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              HIPAA Verified
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Doctor-patient clinical summaries, follow-up patient emails, scheduling queues, and synchronized deliverables with AES-256 encryption.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSummarizeModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Summarize Clinical Note</span>
          </button>

          <button
            onClick={() => onOpenDraftEmailModal(selectedNote || undefined)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-cyan-400" />
            <span>+ Draft Follow-up Email</span>
          </button>
        </div>
      </div>

      {/* Sub tabs: Clinical SOAP Notes | Scheduling Queue | Email Drafts | Reminders */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('soap')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-medium transition-all ${
            activeSubTab === 'soap'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Doctor-Patient SOAP Notes ({clinicalNotes.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('queue')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-medium transition-all ${
            activeSubTab === 'queue'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          <span>Scheduling Queues ({schedulingQueue.filter(q => q.status === 'pending').length} Pending)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('emails')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-medium transition-all ${
            activeSubTab === 'emails'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Follow-up Email Drafts ({emailDrafts.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reminders')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-medium transition-all ${
            activeSubTab === 'reminders'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Reminders & Habits (5)</span>
        </button>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 1. CLINICAL SOAP NOTES TAB */}
      {/* ----------------------------------------------------------- */}
      {activeSubTab === 'soap' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Notes list (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-[10px] uppercase font-mono text-slate-400">
              Summarized Consultations ({clinicalNotes.length})
            </span>

            <div className="space-y-2">
              {clinicalNotes.map(note => {
                const isSelected = selectedNote?.id === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => {
                      setSelectedNote(note);
                      setShowRawTranscript(false);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500/80 shadow-md text-white'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{note.patientName}</span>
                      <span className="text-[10px] font-mono text-slate-400">{note.patientMrn}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span>{note.encounterType}</span>
                      <span>·</span>
                      <span>{note.consultDate}</span>
                    </div>

                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {note.soap.assessment}
                    </p>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-emerald-400">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        AES-256 Encrypted PHI
                      </span>
                      <span>Follow-up: {note.recommendedFollowUpWeeks}w</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SOAP Detail Card (8 cols) */}
          <div className="lg:col-span-8 bg-[#0a0e17] rounded-xl border border-slate-800/90 p-5 space-y-5">
            {driveNotification && (
              <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                driveNotification.includes('error') || driveNotification.includes('Error')
                  ? 'bg-red-950/80 border border-red-800 text-red-300'
                  : 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
              }`}>
                <Folder className="w-3.5 h-3.5 shrink-0" />
                <span>{driveNotification}</span>
              </div>
            )}

            {selectedNote ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{selectedNote.patientName}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {selectedNote.patientMrn}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                        {selectedNote.encounterType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">Consultation Date: {selectedNote.consultDate}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowRawTranscript(!showRawTranscript)}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-700 transition-colors"
                    >
                      {showRawTranscript ? 'View SOAP Format' : 'View Raw Dialogue'}
                    </button>

                    <button
                      onClick={() => handleExportNoteToDrive(selectedNote)}
                      disabled={exportingDriveId === selectedNote.id}
                      className="flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                      title="Export note directly to Google Drive"
                    >
                      {exportingDriveId === selectedNote.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Folder className="w-3.5 h-3.5 text-blue-200" />
                      )}
                      <span>Export to Drive</span>
                    </button>

                    <button
                      onClick={() => onOpenDraftEmailModal(selectedNote)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Draft Follow-up Email</span>
                    </button>

                    <button
                      onClick={() => onOpenScheduleModal({ patientName: selectedNote.patientName, patientMrn: selectedNote.patientMrn })}
                      className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span>Schedule Next Visit</span>
                    </button>
                  </div>
                </div>

                {showRawTranscript ? (
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-line leading-relaxed max-h-[500px] overflow-y-auto">
                    {selectedNote.rawDoctorTranscript}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* SOAP Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Subjective */}
                      <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800/90 space-y-1.5">
                        <span className="text-[10px] uppercase font-mono font-bold text-indigo-400">
                          S · Subjective
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {selectedNote.soap.subjective}
                        </p>
                      </div>

                      {/* Objective */}
                      <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800/90 space-y-1.5">
                        <span className="text-[10px] uppercase font-mono font-bold text-cyan-400">
                          O · Objective
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {selectedNote.soap.objective}
                        </p>
                      </div>

                      {/* Assessment */}
                      <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800/90 space-y-1.5">
                        <span className="text-[10px] uppercase font-mono font-bold text-amber-400">
                          A · Assessment
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                          {selectedNote.soap.assessment}
                        </p>
                      </div>

                      {/* Plan */}
                      <div className="p-3.5 rounded-lg bg-slate-900/70 border border-slate-800/90 space-y-1.5">
                        <span className="text-[10px] uppercase font-mono font-bold text-emerald-400">
                          P · Plan
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                          {selectedNote.soap.plan}
                        </p>
                      </div>
                    </div>

                    {/* Prescriptions & Diet Orders */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                        <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
                          Prescribed Medications
                        </span>
                        <ul className="space-y-1 text-xs text-slate-300">
                          {selectedNote.prescriptions.map((rx, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                              <span>{rx}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                        <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
                          Diet & Lifestyle Orders
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {selectedNote.dietAndLifestyleOrders}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                No clinical note selected.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 2. SCHEDULING QUEUE TAB (Hooked up to Calendar Endpoints) */}
      {/* ----------------------------------------------------------- */}
      {activeSubTab === 'queue' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Clinical Patient Scheduling Queue</h3>
              <p className="text-xs text-slate-400">
                Organized triage queue. Clicking "Schedule Appointment" hooks directly into calendar endpoints, assigns meeting rooms, and resolves provider availability.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {schedulingQueue.map(item => {
              const isP0 = item.clinicalPriority === 'P0';
              const isP1 = item.clinicalPriority === 'P1';
              const isScheduled = item.status === 'scheduled';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-4 ${
                    isScheduled
                      ? 'bg-slate-900/40 border-slate-800 opacity-70'
                      : isP0
                      ? 'bg-[#181119] border-red-800/60 shadow-md shadow-red-950/20'
                      : isP1
                      ? 'bg-[#16140e] border-amber-800/60 shadow-md shadow-amber-950/20'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{item.patientName}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          isP0
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : isP1
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.clinicalPriority} URGENT
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400">
                      <span>{item.patientMrn}</span> · <span>{item.patientEmail}</span>
                    </div>

                    <p className="text-xs text-slate-200 font-medium">
                      {item.reason}
                    </p>

                    {item.clinicalNotesSummary && (
                      <p className="text-[11px] text-slate-400 italic bg-slate-950/60 p-2 rounded border border-slate-800 leading-snug">
                        "{item.clinicalNotesSummary}"
                      </p>
                    )}

                    <div className="text-[10px] text-slate-400 font-mono space-y-0.5 pt-1">
                      <p>Target Window: <span className="text-slate-200 font-semibold">{item.targetWindow}</span></p>
                      <p>Duration: {item.requestedDurationMin} mins · Time: {item.preferredTimeOfDay}</p>
                    </div>
                  </div>

                  {/* Primary Code Handler: Schedule Appointment */}
                  <div className="pt-2 border-t border-slate-800">
                    {isScheduled ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Appointment Dispatched to Calendar</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          onOpenScheduleModal({
                            title: `Clinical Consultation: ${item.patientName}`,
                            patientName: item.patientName,
                            patientMrn: item.patientMrn,
                            durationMin: item.requestedDurationMin,
                            stream: 'clinical',
                            category: 'Clinical Consultation',
                            notes: item.reason,
                            queueItemId: item.id
                          });
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        <span>Schedule Appointment (Hook to Cal)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 3. FOLLOW-UP EMAIL DRAFTS TAB */}
      {/* ----------------------------------------------------------- */}
      {activeSubTab === 'emails' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Patient Appointment Follow-Up Emails</h3>
              <p className="text-xs text-slate-400">
                AI-drafted personalized follow-up emails explaining care plans, medication instructions, and booking links.
              </p>
            </div>

            <button
              onClick={() => onOpenDraftEmailModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Compose New Email</span>
            </button>
          </div>

          <div className="space-y-4">
            {emailDrafts.map(draft => {
              const isDispatched = draft.status === 'dispatched';

              return (
                <div key={draft.id} className="p-5 rounded-xl bg-[#0a0e17] border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{draft.patientName}</span>
                        <span className="text-xs text-slate-400">({draft.patientEmail})</span>
                      </div>
                      <p className="text-xs text-indigo-300 font-medium mt-0.5">{draft.subject}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        isDispatched ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' : 'bg-slate-800 text-amber-300'
                      }`}>
                        {isDispatched ? 'Dispatched to Patient' : 'Draft Ready'}
                      </span>

                      <button
                        onClick={() => copyText(draft.body, draft.id)}
                        className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-800 flex items-center gap-1 transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedId === draft.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === draft.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      {!isDispatched && (
                        <button
                          onClick={() => handleDispatchEmail(draft.id)}
                          disabled={dispatchingId === draft.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>{dispatchingId === draft.id ? 'Dispatching...' : 'Dispatch Email'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                    {draft.body}
                  </div>

                  {draft.keyInstructions && draft.keyInstructions.length > 0 && (
                    <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                      <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold">
                        Key Takeaways for Patient
                      </span>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {draft.keyInstructions.map((inst, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                            <span>{inst}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 4. REMINDERS & HABIT AUTOMATION TAB */}
      {/* ----------------------------------------------------------- */}
      {activeSubTab === 'reminders' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-3">
            <span className="text-[10px] uppercase font-mono text-slate-400">
              High Priority & Time-Critical Reminders
            </span>

            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <input type="checkbox" className="mt-1 rounded border-slate-700 text-indigo-600 cursor-pointer" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono px-1 rounded bg-red-950 text-red-400 border border-red-800/40">P0 · CRITICAL</span>
                      <span className="text-xs text-slate-400 font-mono">Due Today 02:00 PM</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-100 mt-1">Review Q4 Budget Spreadsheet & GPU Cluster Commitments</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Alert set 15m prior (01:45 PM) · Spreadsheet v4.2 attached (4.8MB)</p>
                  </div>
                </div>
                <button className="text-[10px] text-slate-400 hover:text-slate-200 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  Snooze +30m
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <input type="checkbox" className="mt-1 rounded border-slate-700 text-indigo-600 cursor-pointer" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono px-1 rounded bg-amber-950 text-amber-400 border border-amber-800/40">P1 · HIGH</span>
                      <span className="text-xs text-slate-400 font-mono">Due 05:00 PM</span>
                      <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950 px-1 rounded">Geofence Active: Downtown CVS</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-100 mt-1">Pick up prescription & electrolyte hydration salts</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Rx #982-1049 registered under Dr. Vance · Pre-paid through HSA card sync</p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <input type="checkbox" defaultChecked className="mt-1 rounded border-slate-700 text-indigo-600 cursor-pointer" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono px-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40">HABIT AUTOMATION</span>
                      <span className="text-xs text-slate-400 font-mono">Scheduled 06:45 PM</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-100 mt-1">Post-workout protein shake & 5g pure creatine monohydrate</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Correlates with hypertrophy recovery protocol. Auto-logs 35g protein to database.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            {/* Cognitive Load Index */}
            <div className="bg-[#0e141f] rounded-xl border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
                <span className="font-semibold text-slate-200">Cognitive Load Index</span>
                <span className="text-[10px] font-mono text-emerald-400">Optimal (72%)</span>
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-500/80 border-t-emerald-400 flex flex-col items-center justify-center font-mono">
                  <span className="text-sm font-bold text-white">8</span>
                  <span className="text-[8px] text-slate-400 uppercase">Active</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    <span>Executive Tasks: 5</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Health Protocols: 2</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>Follow-ups: 1</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reminder Engine Core */}
            <div className="bg-[#0e141f] rounded-xl border border-slate-800 p-4 space-y-2.5 text-xs">
              <span className="font-semibold text-slate-200 block pb-1 border-b border-slate-800">
                Reminder Engine Core
              </span>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Desktop System Banner</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Mobile Critical Alerts (P0)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Spatial Audio Chime</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
