import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import type { 
  ActiveView, 
  CalendarEvent, 
  ClinicalNote, 
  DailyHealthSummary, 
  FollowUpEmail, 
  SchedulingQueueItem, 
  WorkoutSession,
  UserProfile
} from './types/index.ts';
import { api } from './services/api.ts';
import { onUserChanged } from './services/googleAuth.ts';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { DailyTimelineView } from './components/DailyTimelineView.tsx';
import { AssistantChatView } from './components/AssistantChatView.tsx';
import { CalendarMeetingsView } from './components/CalendarMeetingsView.tsx';
import { NotesTasksView } from './components/NotesTasksView.tsx';
import { HealthVitalityView } from './components/HealthVitalityView.tsx';
import { HipaaVaultModal } from './components/HipaaVaultModal.tsx';
import { GoogleDriveView } from './components/GoogleDriveView.tsx';
import { ScheduleAppointmentModal } from './components/ScheduleAppointmentModal.tsx';
import { ClinicalNoteModal } from './components/ClinicalNoteModal.tsx';
import { FollowUpEmailModal } from './components/FollowUpEmailModal.tsx';
import { LogWorkoutModal } from './components/LogWorkoutModal.tsx';
import { LogMealModal } from './components/LogMealModal.tsx';
import { UserProfileModal } from './components/UserProfileModal.tsx';
import { 
  Calendar, 
  MessageSquare, 
  CalendarDays, 
  FileText, 
  HeartPulse, 
  ShieldCheck,
  Folder
} from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('timeline');

  // Application Data States
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([]);
  const [emailDrafts, setEmailDrafts] = useState<FollowUpEmail[]>([]);
  const [schedulingQueue, setSchedulingQueue] = useState<SchedulingQueueItem[]>([]);
  const [healthSummary, setHealthSummary] = useState<DailyHealthSummary | null>(null);
  const [weightHistory, setWeightHistory] = useState<{ date: string; weightKg: number }[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal Dialogs
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleInitialData, setScheduleInitialData] = useState<Partial<CalendarEvent> | undefined>(undefined);

  const [summarizeModalOpen, setSummarizeModalOpen] = useState(false);

  const [draftEmailModalOpen, setDraftEmailModalOpen] = useState(false);
  const [selectedNoteForEmail, setSelectedNoteForEmail] = useState<ClinicalNote | undefined>(undefined);

  const [logWorkoutModalOpen, setLogWorkoutModalOpen] = useState(false);
  const [logMealModalOpen, setLogMealModalOpen] = useState(false);

  // Dynamic User Profile & Identity State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('aura_user_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      id: 'usr-1',
      name: 'Dr. S. N. Reddy, MD',
      title: 'Chief Medical Officer',
      email: 'drsnreddy369@gmail.com',
      mode: 'Executive'
    };
  });
  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);
  const [googleUser, setGoogleUser] = useState<User | null>(null);

  // Automatically update name and avatar when Google Account / Firebase Auth changes
  useEffect(() => {
    const unsubscribe = onUserChanged((user) => {
      setGoogleUser(user);
      if (user) {
        const googleName = user.displayName || user.email?.split('@')[0] || 'Google User';
        setUserProfile((prev) => {
          const updated: UserProfile = {
            ...prev,
            name: googleName,
            email: user.email || prev.email,
            photoURL: user.photoURL || prev.photoURL,
            title: prev.title === 'Chief Medical Officer' && googleName !== 'Dr. S. N. Reddy, MD'
              ? 'Attending Physician'
              : prev.title
          };
          try {
            localStorage.setItem('aura_user_profile', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSaveProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    try {
      localStorage.setItem('aura_user_profile', JSON.stringify(newProfile));
    } catch (e) {}
  };

  // Load initial data
  const loadAllData = async () => {
    setIsRefreshing(true);
    try {
      const [evts, notes, drafts, queue, health] = await Promise.all([
        api.getEvents().catch(() => []),
        api.getClinicalNotes().catch(() => []),
        api.getEmailDrafts().catch(() => []),
        api.getSchedulingQueue().catch(() => []),
        api.getHealthSummary().catch(() => ({ summary: null as any, weightHistory: [] }))
      ]);

      setEvents(evts);
      setClinicalNotes(notes);
      setEmailDrafts(drafts);
      setSchedulingQueue(queue);
      if (health.summary) {
        setHealthSummary(health.summary);
      }
      if (health.weightHistory) {
        setWeightHistory(health.weightHistory);
      }
    } catch (err) {
      console.error('Error loading Aura clinical data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleOpenScheduleModal = (initial?: Partial<CalendarEvent>) => {
    setScheduleInitialData(initial);
    setScheduleModalOpen(true);
  };

  const handleOpenDraftEmail = (note?: ClinicalNote) => {
    setSelectedNoteForEmail(note);
    setDraftEmailModalOpen(true);
  };

  const pendingQueueCount = schedulingQueue.filter(q => q.status === 'pending').length;

  return (
    <div className="flex h-screen bg-[#0b0f17] text-slate-100 overflow-hidden font-sans">
      {/* Left Sidebar (Desktop) */}
      <div className="hidden md:flex shrink-0">
        <Sidebar 
          activeView={activeView} 
          setActiveView={setActiveView} 
          unreadQueueCount={pendingQueueCount} 
          userProfile={userProfile}
          onOpenProfile={() => setUserProfileModalOpen(true)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Global Top Header with quick clinical actions */}
        <Header
          onOpenSchedule={() => handleOpenScheduleModal()}
          onOpenSummarize={() => setSummarizeModalOpen(true)}
          onOpenDraftEmail={() => handleOpenDraftEmail()}
          onOpenLogWorkout={() => setLogWorkoutModalOpen(true)}
          onOpenLogMeal={() => setLogMealModalOpen(true)}
          onOpenDrive={() => setActiveView('drive')}
          onOpenProfile={() => setUserProfileModalOpen(true)}
          userProfile={userProfile}
          readinessScore={healthSummary?.readinessScore || 92}
          nextEventTime={events[1]?.startTime ? `${events[1].startTime} AM` : '09:30 AM'}
          onRefreshData={loadAllData}
          isRefreshing={isRefreshing}
        />

        {/* View Surface (Scrollable) */}
        <main className="flex-1 overflow-y-auto">
          {activeView === 'timeline' && (
            <DailyTimelineView
              events={events}
              healthSummary={healthSummary}
              onRefreshEvents={loadAllData}
              onRefreshHealth={loadAllData}
              onOpenScheduleModal={handleOpenScheduleModal}
              onOpenSummarizeModal={() => setSummarizeModalOpen(true)}
              onOpenFollowUpEmailModal={() => handleOpenDraftEmail()}
            />
          )}

          {activeView === 'assistant' && (
            <AssistantChatView
              onRefreshEvents={loadAllData}
              onOpenScheduleModal={handleOpenScheduleModal}
              onOpenSummarizeModal={() => setSummarizeModalOpen(true)}
              onOpenDraftEmailModal={() => handleOpenDraftEmail()}
            />
          )}

          {activeView === 'calendar' && (
            <CalendarMeetingsView
              events={events}
              onRefreshEvents={loadAllData}
              onOpenScheduleModal={handleOpenScheduleModal}
            />
          )}

          {activeView === 'notes' && (
            <NotesTasksView
              clinicalNotes={clinicalNotes}
              emailDrafts={emailDrafts}
              schedulingQueue={schedulingQueue}
              onRefreshAll={loadAllData}
              onOpenScheduleModal={handleOpenScheduleModal}
              onOpenSummarizeModal={() => setSummarizeModalOpen(true)}
              onOpenDraftEmailModal={handleOpenDraftEmail}
              currentUserName={userProfile.name}
            />
          )}

          {activeView === 'health' && (
            <HealthVitalityView
              healthSummary={healthSummary}
              weightHistory={weightHistory}
              onRefreshHealth={loadAllData}
              onOpenLogWorkout={() => setLogWorkoutModalOpen(true)}
              onOpenLogMeal={() => setLogMealModalOpen(true)}
              onOpenHipaaVault={() => setActiveView('hipaa')}
            />
          )}

          {activeView === 'drive' && (
            <GoogleDriveView 
              clinicalNotes={clinicalNotes} 
              currentUserName={userProfile.name}
            />
          )}

          {activeView === 'hipaa' && (
            <HipaaVaultModal />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <div className="md:hidden border-t border-slate-800 bg-[#07090e] px-2 py-2 flex items-center justify-around z-20 overflow-x-auto">
          {[
            { id: 'timeline', label: 'Timeline', icon: Calendar },
            { id: 'assistant', label: 'Aura AI', icon: MessageSquare },
            { id: 'calendar', label: 'Calendar', icon: CalendarDays },
            { id: 'notes', label: 'Notes', icon: FileText, badge: pendingQueueCount },
            { id: 'health', label: 'Health', icon: HeartPulse },
            { id: 'drive', label: 'Drive', icon: Folder },
            { id: 'hipaa', label: 'HIPAA', icon: ShieldCheck },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as ActiveView)}
                className={`flex flex-col items-center gap-1 p-1 rounded transition-colors relative ${
                  isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px]">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-black text-[9px] font-mono flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal Dialogs */}
      <ScheduleAppointmentModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        initialData={scheduleInitialData}
        currentUserName={userProfile.name}
        onSuccess={(event) => {
          loadAllData();
        }}
      />

      <ClinicalNoteModal
        isOpen={summarizeModalOpen}
        onClose={() => setSummarizeModalOpen(false)}
        currentUserName={userProfile.name}
        onSuccess={(note) => {
          loadAllData();
        }}
        onDraftEmail={(note) => {
          handleOpenDraftEmail(note);
        }}
        onScheduleFollowUp={(note) => {
          handleOpenScheduleModal({
            title: `Follow-up Consultation: ${note.patientName}`,
            patientName: note.patientName,
            patientMrn: note.patientMrn,
            stream: 'clinical',
            category: 'Clinical Consultation'
          });
        }}
      />

      <FollowUpEmailModal
        isOpen={draftEmailModalOpen}
        onClose={() => setDraftEmailModalOpen(false)}
        initialNote={selectedNoteForEmail}
        onSuccess={(draft) => {
          loadAllData();
        }}
      />

      <LogWorkoutModal
        isOpen={logWorkoutModalOpen}
        onClose={() => setLogWorkoutModalOpen(false)}
        onSuccess={() => {
          loadAllData();
        }}
      />

      <LogMealModal
        isOpen={logMealModalOpen}
        onClose={() => setLogMealModalOpen(false)}
        onSuccess={() => {
          loadAllData();
        }}
      />

      <UserProfileModal
        isOpen={userProfileModalOpen}
        onClose={() => setUserProfileModalOpen(false)}
        currentProfile={userProfile}
        onSaveProfile={handleSaveProfile}
        isGoogleConnected={!!googleUser}
        googleUserEmail={googleUser?.email || undefined}
      />
    </div>
  );
}
