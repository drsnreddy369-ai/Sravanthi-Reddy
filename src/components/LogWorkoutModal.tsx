import React, { useState } from 'react';
import { X, Dumbbell, ShieldCheck, Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api.ts';
import type { ExerciseSet, WorkoutSession } from '../types/index.ts';

interface LogWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (workout: WorkoutSession) => void;
}

export const LogWorkoutModal: React.FC<LogWorkoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('Zone 2 Aerobic Cardio & Mobility');
  const [type, setType] = useState<WorkoutSession['type']>('Zone 2 Cardio');
  const [durationMin, setDurationMin] = useState(45);
  const [activeKcalBurned, setActiveKcalBurned] = useState(410);
  const [avgHrBpm, setAvgHrBpm] = useState(138);
  const [notes, setNotes] = useState('Outdoor trail run · Continuous nasal breathing');
  const [exercises, setExercises] = useState<ExerciseSet[]>([
    { name: 'Warm-up Mobility Flow', sets: 1, reps: 10, loadKg: 0 }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: 3, reps: 10, loadKg: 20 }]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof ExerciseSet, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const res = await api.logWorkout({
        name,
        type,
        durationMin: Number(durationMin),
        activeKcalBurned: Number(activeKcalBurned),
        avgHrBpm: Number(avgHrBpm),
        notes,
        exercises: exercises.filter(e => e.name.trim().length > 0)
      });
      onSuccess(res);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overscroll-contain">
      <div className="bg-[#0e1320] border border-slate-800 rounded-2xl w-full max-w-lg max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
        <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-[#0a0e17] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">Log Workout Session</h3>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                Encrypted in HIPAA Vault with AES-256-GCM
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            aria-label="Close modal"
            className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3.5 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1 touch-pan-y overscroll-contain">
          <div>
            <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Workout Protocol Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-white min-h-[44px] focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Protocol Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-white min-h-[44px] focus:outline-none focus:border-emerald-500"
              >
                <option value="Zone 2 Cardio">Zone 2 Cardio</option>
                <option value="Hypertrophy Strength">Hypertrophy Strength</option>
                <option value="HIIT">HIIT Block</option>
                <option value="Mobility & Recovery">Mobility & Recovery</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Duration (Mins)</label>
              <input
                type="number"
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-white font-mono min-h-[44px] focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Active Calories (kcal)</label>
              <input
                type="number"
                value={activeKcalBurned}
                onChange={(e) => setActiveKcalBurned(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-white font-mono min-h-[44px] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Average Heart Rate (bpm)</label>
              <input
                type="number"
                value={avgHrBpm}
                onChange={(e) => setAvgHrBpm(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-white font-mono min-h-[44px] focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Exercise list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-slate-400">Exercises / Sets</span>
              <button
                type="button"
                onClick={addExercise}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1.5 py-1 px-2 rounded-lg bg-emerald-950/60 border border-emerald-800/40 min-h-[36px] active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Exercise</span>
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {exercises.map((ex, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <input
                    type="text"
                    placeholder="Exercise name"
                    value={ex.name}
                    onChange={(e) => updateExercise(idx, 'name', e.target.value)}
                    className="flex-1 bg-transparent text-base sm:text-xs text-white outline-none min-h-[38px] px-1"
                  />
                  <input
                    type="number"
                    placeholder="Sets"
                    value={ex.sets}
                    onChange={(e) => updateExercise(idx, 'sets', Number(e.target.value))}
                    className="w-12 bg-slate-900 text-center font-mono rounded-lg px-1 py-1.5 text-xs text-white min-h-[38px]"
                    title="Sets"
                  />
                  <input
                    type="number"
                    placeholder="Reps"
                    value={ex.reps}
                    onChange={(e) => updateExercise(idx, 'reps', Number(e.target.value))}
                    className="w-12 bg-slate-900 text-center font-mono rounded-lg px-1 py-1.5 text-xs text-white min-h-[38px]"
                    title="Reps"
                  />
                  <input
                    type="number"
                    placeholder="Kg"
                    value={ex.loadKg}
                    onChange={(e) => updateExercise(idx, 'loadKg', Number(e.target.value))}
                    className="w-12 bg-slate-900 text-center font-mono rounded-lg px-1 py-1.5 text-xs text-white min-h-[38px]"
                    title="Weight (kg)"
                  />
                  <button
                    type="button"
                    onClick={() => removeExercise(idx)}
                    aria-label="Remove exercise"
                    className="text-slate-500 hover:text-red-400 p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              HIPAA Encrypted PHI (AES-256)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 sm:flex-initial px-5 py-2.5 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-emerald-950/40 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save to Vault</span>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
