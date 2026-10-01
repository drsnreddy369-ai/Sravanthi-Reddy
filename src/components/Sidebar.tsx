import React from 'react';
import { 
  Calendar, 
  MessageSquare, 
  CalendarDays, 
  FileText, 
  HeartPulse, 
  ShieldCheck, 
  Activity, 
  Layers,
  Folder,
  UserCog
} from 'lucide-react';
import type { ActiveView, UserProfile } from '../types/index.ts';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  unreadQueueCount?: number;
  userProfile?: UserProfile;
  onOpenProfile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  setActiveView, 
  unreadQueueCount = 3,
  userProfile,
  onOpenProfile
}) => {
  const navItems: { id: ActiveView; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'timeline', label: 'Daily Schedule', icon: Calendar },
    { id: 'assistant', label: 'Assistant Chat', icon: MessageSquare },
    { id: 'calendar', label: 'Calendar & Meetings', icon: CalendarDays },
    { id: 'notes', label: 'Notes & Tasks', icon: FileText, badge: unreadQueueCount },
    { id: 'health', label: 'Health & Vitality', icon: HeartPulse },
    { id: 'drive', label: 'Google Drive', icon: Folder },
    { id: 'hipaa', label: 'HIPAA Vault', icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 bg-[#0a0d14] border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none">
      {/* Brand & Workspace */}
      <div className="p-4 border-b border-slate-800/70">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-sm">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-white">Aura</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Clinical
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Executive & Health AI</p>
          </div>
        </div>

        <div className="mt-4 px-2 py-1.5 rounded-md bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-medium text-[11px]">Neural Core v4.2</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">Online</span>
        </div>
      </div>

      {/* Nav List */}
      <div className="px-3 py-4 flex-1 space-y-1">
        <div className="px-3 pb-2 text-[10px] uppercase tracking-wider font-mono text-slate-400">
          Workspace
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-slate-800 text-white font-semibold shadow-inner border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* HIPAA & Telemetry Status Footer */}
      <div className="p-3 border-t border-slate-800/70 bg-[#07090e]">
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              HIPAA Compliant PHI
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">AES-256</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Workouts, diet, and clinical notes encrypted at rest.
          </p>
        </div>

        {/* Dynamic User Card (Clickable to switch or edit profile) */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="mt-3 w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors text-left group cursor-pointer"
          title="Click to change physician name or switch profile"
        >
          {userProfile?.photoURL ? (
            <img 
              src={userProfile.photoURL} 
              alt={userProfile.name} 
              className="w-7 h-7 rounded-full object-cover border border-indigo-500/50" 
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white border border-indigo-500/40">
              {userProfile?.name ? userProfile.name.replace(/^Dr\.\s*/i, '').slice(0, 2).toUpperCase() : 'DR'}
            </div>
          )}
          <div className="truncate flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate group-hover:text-white transition-colors">
              {userProfile?.name || 'Dr. S. N. Reddy, MD'}
            </p>
            <p className="text-[10px] text-slate-400 font-mono truncate">
              {userProfile?.title || 'Chief Medical Officer'}
            </p>
          </div>
          <UserCog className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
        </button>
      </div>
    </aside>
  );
};
