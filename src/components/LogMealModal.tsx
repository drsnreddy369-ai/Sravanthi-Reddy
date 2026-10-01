import React, { useState } from 'react';
import { X, UtensilsCrossed, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../services/api.ts';
import type { MealRecord } from '../types/index.ts';

interface LogMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (meal: MealRecord) => void;
}

export const LogMealModal: React.FC<LogMealModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [mealType, setMealType] = useState<MealRecord['mealType']>('Lunch');
  const [title, setTitle] = useState('Wild Atlantic Salmon & Ancient Grain Bowl');
  const [foodsDescription, setFoodsDescription] = useState('Grilled Atlantic salmon bowl, tri-color quinoa, steamed broccolini, cold-pressed olive oil');
  const [calories, setCalories] = useState(650);
  const [proteinG, setProteinG] = useState(52);
  const [carbsG, setCarbsG] = useState(48);
  const [fatG, setFatG] = useState(22);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const res = await api.logMeal({
        title,
        mealType,
        foodsDescription,
        calories: Number(calories),
        proteinG: Number(proteinG),
        carbsG: Number(carbsG),
        fatG: Number(fatG)
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
            <div className="p-2 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 shrink-0">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">Log Meal & Macronutrients</h3>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                Stored in Secure HIPAA Vault with AES-256-GCM
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Meal Type</label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-white min-h-[44px] focus:outline-none focus:border-amber-500"
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snack">Snack</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Total Calories (kcal)</label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-white font-mono min-h-[44px] focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Meal Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-white min-h-[44px] focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Foods & Ingredients Description</label>
            <textarea
              value={foodsDescription}
              onChange={(e) => setFoodsDescription(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-base sm:text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Macronutrients */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase font-mono text-indigo-400 block mb-1">Protein (g)</label>
              <input
                type="number"
                value={proteinG}
                onChange={(e) => setProteinG(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-base sm:text-xs text-white font-mono min-h-[44px] focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono text-amber-400 block mb-1">Carbs (g)</label>
              <input
                type="number"
                value={carbsG}
                onChange={(e) => setCarbsG(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-base sm:text-xs text-white font-mono min-h-[44px] focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono text-emerald-400 block mb-1">Fats (g)</label>
              <input
                type="number"
                value={fatG}
                onChange={(e) => setFatG(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-base sm:text-xs text-white font-mono min-h-[44px] focus:outline-none focus:border-emerald-500"
              />
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
                className="flex-1 sm:flex-initial px-5 py-2.5 min-h-[44px] rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-amber-950/40 cursor-pointer"
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
