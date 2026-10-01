import React, { useState } from 'react';
import { 
  CalendarPlus, 
  FileText, 
  Mail, 
  Dumbbell, 
  UtensilsCrossed, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  RefreshCw,
  Sparkles,
  Folder,
  User
} from 'lucide-react';
import type { UserProfile } from '../types/index.ts';

interface HeaderProps {
  onOpenSchedule: () => void;
  onOpenSummarize: () => void;
  onOpenDraftEmail: () => void;
  onOpenLogWorkout: () => void;
  onOpenLogMeal: () => void;
  onOpenDrive?: () => void;
  onOpenProfile?: () => void;
  userProfile?: UserProfile;
  readinessScore?: number;
  nextEventTime?: string;
  onRefreshData: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSchedule,
  onOpenSummarize,
  onOpenDraftEmail,
  onOpenLogWorkout,
  onOpenLogMeal,
  onOpenDrive,
  onOpenProfile,
  userProfile,
  readinessScore = 92,
  nextEventTime = '09:30 AM',
  onRefreshData,
  isRefreshing = false
}) => {
  const [isPlayingBriefing, setIsPlayingBriefing] = useState(false);

  const toggleBriefing = () => {
    setIsPlayingBriefing(!isPlayingBriefing);
  };

  const displayName = userProfile?.name || 'Dr. S. N. Reddy';
  const displayMode = userProfile?.mode ? `${userProfile.mode} Mode` : 'Active Protocol';
  const userInitials = displayName.replace(/^Dr\.\s*/i, '').slice(0, 2).toUpperCase() || 'DR';

  return (
    <header className="border-b border-slate-800/80 bg-[#0c101a] px-6 py-4">
      {/* Top micro bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800/50 text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
          <span className="text-emerald-400 font-semibold">08:42 AM</span>
          <span>·</span>
          <span>WEDNESDAY, OCT 23</span>
          <span>·</span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Aura Cognitive Core Active
          </span>
          <span className="hidden md:inline text-emerald-400/80 bg-emerald-950/40 px-2 py-0.5 rounded text-[10px] border border-emerald-800/40">
            Telemetry Synced
          </span>
        </div>

        {/* Readiness, briefing & User Profile button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenProfile && (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs transition-colors cursor-pointer group"
              title="Click to edit user name or switch persona"
            >
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt={displayName} className="w-5 h-5 rounded-full object-cover border border-indigo-500/50" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold text-[9px] flex items-center justify-center shadow-sm">
                  {userInitials}
                </div>
              )}
              <span className="text-slate-300 font-medium group-hover:text-white max-w-[120px] truncate">{displayName}</span>
              <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-indigo-400 border border-slate-700">
                Switch
              </span>
            </button>
          )}

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Readiness:</span>
            <span className="font-semibold text-emerald-400 font-mono">{readinessScore}%</span>
            <span className="text-[10px] text-slate-400">Optimal</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">Next:</span>
            <span className="font-semibold text-amber-300 font-mono">{nextEventTime}</span>
          </div>

          <button
            onClick={toggleBriefing}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              isPlayingBriefing
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-indigo-950/60 text-indigo-300 border border-indigo-700/50 hover:bg-indigo-900/60'
            }`}
          >
            {isPlayingBriefing ? (
              <>
                <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                <span>Stop Briefing</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Play AI Briefing</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main greeting & subtitle */}
      <div className="pt-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Good morning, {displayName}.
            <span className="text-xs font-normal font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {displayMode}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            4 patient consultations & executive sessions today (3.5 hrs focus reserve). Morning cardio completed. Metabolic pacing is on track with 510 kcal available for dinner.
          </p>
        </div>

        {/* Action Buttons Hub */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Schedule Appointment - PRIMARY HOOK TO CALENDAR */}
          <button
            onClick={onOpenSchedule}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-medium shadow-md shadow-indigo-700/20 transition-all border border-indigo-500/30 cursor-pointer"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>Schedule Appointment</span>
          </button>

          {/* Summarize Clinical Note */}
          <button
            onClick={onOpenSummarize}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/80 transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Summarize Note</span>
          </button>

          {/* Draft Follow-up Email */}
          <button
            onClick={onOpenDraftEmail}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/80 transition-all cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-cyan-400" />
            <span>Draft Email</span>
          </button>

          {/* Log Workout (HIPAA PHI) */}
          <button
            onClick={onOpenLogWorkout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 text-xs font-medium border border-emerald-900/60 transition-all cursor-pointer"
          >
            <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
            <span>Log Workout</span>
          </button>

          {/* Log Meal (HIPAA PHI) */}
          <button
            onClick={onOpenLogMeal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-medium border border-amber-900/60 transition-all cursor-pointer"
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
            <span>Log Meal & Macros</span>
          </button>

          {/* Google Drive Vault Shortcut */}
          {onOpenDrive && (
            <button
              onClick={onOpenDrive}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 text-xs font-medium border border-blue-800/60 transition-all cursor-pointer"
              title="Open Google Drive Clinical Vault"
            >
              <Folder className="w-3.5 h-3.5 text-blue-400" />
              <span>Drive</span>
            </button>
          )}

          {/* Refresh / Synced */}
          <button
            onClick={onRefreshData}
            title="Refresh connected telemetry"
            className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Briefing Player Bar (when active) */}
      {isPlayingBriefing && (
        <div className="mt-3 p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/60 flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
            <p className="text-indigo-200">
              <strong className="text-white">Aura Voice Synthesis:</strong> "Good morning Doctor. You have 3 priority clinical reviews today. Sarah Jenkins is awaiting CABG follow-up triage at 4:00 PM, and your 45m metabolic cardio block at 5:30 PM is protected. Calorie budget remaining is 510 kcal."
            </p>
          </div>
          <button
            onClick={() => setIsPlayingBriefing(false)}
            className="text-xs text-indigo-400 hover:text-indigo-200 font-mono underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </header>
  );
};
