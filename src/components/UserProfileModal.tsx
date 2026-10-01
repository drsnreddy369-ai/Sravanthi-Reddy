import React, { useState } from 'react';
import { 
  X, 
  User, 
  UserCheck, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  LogOut, 
  Camera, 
  Briefcase,
  IdCard,
  Building
} from 'lucide-react';
import type { UserProfile } from '../types/index.ts';
import { googleSignIn, googleLogout } from '../services/googleAuth.ts';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  isGoogleConnected: boolean;
  googleUserEmail?: string;
  onRefreshGoogleAuth?: () => void;
}

const PRESET_PERSONAS: { name: string; title: string; mode: string; initials: string; badge: string }[] = [
  {
    name: 'Dr. S. N. Reddy, MD',
    title: 'Chief Medical Officer',
    mode: 'Metabolic & Clinical',
    initials: 'SR',
    badge: 'CMO Lead'
  },
  {
    name: 'Dr. Marcus Vance, MD',
    title: 'VP Medical Affairs & Cardiology',
    mode: 'Cardiovascular Core',
    initials: 'MV',
    badge: 'Cardiology'
  },
  {
    name: 'Dr. Elena Rostova, MD',
    title: 'Performance & Circadian Health Lead',
    mode: 'Circadian Pacing',
    initials: 'ER',
    badge: 'Endocrinology'
  },
  {
    name: 'Dr. Devon Lee, MD',
    title: 'Cardiothoracic Surgery Fellow',
    mode: 'Surgical Recovery',
    initials: 'DL',
    badge: 'Surgery'
  }
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSaveProfile,
  isGoogleConnected,
  googleUserEmail,
  onRefreshGoogleAuth
}) => {
  const [name, setName] = useState(currentProfile.name);
  const [title, setTitle] = useState(currentProfile.title);
  const [mode, setMode] = useState(currentProfile.mode || 'Executive');
  const [photoURL, setPhotoURL] = useState(currentProfile.photoURL || '');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated: UserProfile = {
      ...currentProfile,
      name: name.trim(),
      title: title.trim() || 'Physician',
      mode: mode.trim() || 'Clinical',
      photoURL: photoURL.trim() || undefined
    };

    onSaveProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleSelectPreset = (preset: typeof PRESET_PERSONAS[0]) => {
    setName(preset.name);
    setTitle(preset.title);
    setMode(preset.mode);
    const updated: UserProfile = {
      ...currentProfile,
      name: preset.name,
      title: preset.title,
      mode: preset.mode
    };
    onSaveProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleGoogleSignInFlow = async () => {
    setIsSigningIn(true);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        const googleName = res.user.displayName || res.user.email?.split('@')[0] || 'Google User';
        setName(googleName);
        if (res.user.photoURL) setPhotoURL(res.user.photoURL);
        const updated: UserProfile = {
          ...currentProfile,
          name: googleName,
          email: res.user.email || undefined,
          photoURL: res.user.photoURL || undefined,
          title: title || 'Google Workspace Attending'
        };
        onSaveProfile(updated);
        if (onRefreshGoogleAuth) onRefreshGoogleAuth();
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          onClose();
        }, 1200);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
      await googleLogout();
      if (onRefreshGoogleAuth) onRefreshGoogleAuth();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0e1320] border border-slate-800 rounded-2xl w-full max-w-lg p-5 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Active User Profile & Identity</h3>
              <p className="text-[11px] text-slate-400">
                Update your display name, provider title, and Google account sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success indicator */}
        {savedSuccess && (
          <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Active user profile updated across Aura dashboard!</span>
          </div>
        )}

        {/* Current Active Persona Overview */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {photoURL ? (
              <img src={photoURL} alt={name} className="w-10 h-10 rounded-full object-cover border border-indigo-500/50 shadow" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow">
                {name.replace(/^Dr\.\s*/i, '').slice(0, 2).toUpperCase() || 'U'}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white truncate">{name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                  {mode}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono truncate">{title}</p>
              {googleUserEmail && (
                <p className="text-[11px] text-blue-400 font-mono flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  Google: {googleUserEmail}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 justify-end">
              <ShieldCheck className="w-3 h-3" />
              Active Session
            </span>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
              Display Name (e.g. Dr. S. N. Reddy, Dr. Marcus Vance, Sarah Jenkins)
            </label>
            <div className="relative">
              <IdCard className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Full physician or user name"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                Professional Title / Role
              </label>
              <div className="relative">
                <Briefcase className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chief Medical Officer"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                Workspace Mode / Tag
              </label>
              <div className="relative">
                <Sparkles className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  placeholder="e.g. Metabolic & Clinical"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Quick-Switch Presets */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[10px] uppercase font-mono text-slate-400 block mb-2">
              Quick-Switch Provider Persona
            </span>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_PERSONAS.map((preset) => {
                const isSelected = name.toLowerCase().includes(preset.name.toLowerCase().split(' ')[1] || preset.name);
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2 rounded-lg text-left border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-600/70 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <p className="text-[11px] font-semibold truncate">{preset.name}</p>
                      <p className="text-[9px] text-slate-400 truncate">{preset.title}</p>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 shrink-0">
                      {preset.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Google Workspace Account Link / Switch */}
          <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-[11px] font-semibold text-white flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                Google Workspace Account
              </span>
              <p className="text-[10px] text-slate-400">
                {isGoogleConnected ? `Connected as ${googleUserEmail}` : 'Sync name and permissions from Google'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGoogleSignInFlow}
                disabled={isSigningIn}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-800 text-[11px] font-medium transition-all shadow cursor-pointer disabled:opacity-50"
              >
                {isSigningIn ? 'Connecting...' : isGoogleConnected ? 'Switch Account' : 'Sign in with Google'}
              </button>
              {isGoogleConnected && (
                <button
                  type="button"
                  onClick={handleGoogleDisconnect}
                  className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                  title="Disconnect Google Account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Apply Name</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
