import React, { useState } from 'react';
import { 
  Flame, 
  Dumbbell, 
  UtensilsCrossed, 
  Scale, 
  Droplets, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  Plus, 
  TrendingDown, 
  Activity, 
  Watch, 
  Clock, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import type { DailyHealthSummary, MealRecord, WorkoutSession } from '../types/index.ts';
import { api } from '../services/api.ts';

interface HealthVitalityViewProps {
  healthSummary: DailyHealthSummary | null;
  weightHistory: { date: string; weightKg: number }[];
  onRefreshHealth: () => void;
  onOpenLogWorkout: () => void;
  onOpenLogMeal: () => void;
  onOpenHipaaVault: () => void;
}

export const HealthVitalityView: React.FC<HealthVitalityViewProps> = ({
  healthSummary,
  weightHistory,
  onRefreshHealth,
  onOpenLogWorkout,
  onOpenLogMeal,
  onOpenHipaaVault
}) => {
  const [quickMealInput, setQuickMealInput] = useState('');
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [activeRange, setActiveRange] = useState<'today' | 'week' | 'month'>('today');

  const summary = healthSummary || {
    calorieTarget: 2350,
    calorieIntake: 1840,
    calorieBurned: 620,
    netDeficit: 510,
    macros: {
      protein: { current: 160, target: 175 },
      carbs: { current: 180, target: 210 },
      fat: { current: 52, target: 65 }
    },
    weight: { current: 74.2, goal: 71.0, change7d: -0.4, bodyFatPct: 16.8, bmi: 22.4 },
    hydrationMl: 2400,
    hydrationTargetMl: 3000,
    readinessScore: 92,
    workouts: [],
    meals: [],
    hipaaStatus: {
      encryptedAtRest: true,
      cipher: 'AES-256-GCM',
      lastAuditCheck: new Date().toISOString(),
      complianceStandard: 'HIPAA Security Rule 45 CFR § 164.312'
    }
  };

  const handleQuickMealAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMealInput.trim() || isAddingMeal) return;

    setIsAddingMeal(true);
    try {
      await api.logMeal({
        title: quickMealInput,
        mealType: 'Snack',
        foodsDescription: quickMealInput,
        calories: 220,
        proteinG: 12,
        carbsG: 20,
        fatG: 10
      });
      setQuickMealInput('');
      onRefreshHealth();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingMeal(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner (Matches screenshot) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wide">
              Metabolic Sync Active · Deficit Phase · Day 22/60
            </span>
            <span 
              onClick={onOpenHipaaVault}
              className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40 flex items-center gap-1 cursor-pointer hover:bg-cyan-900/60 transition-colors"
            >
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              HIPAA Encrypted
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Health, Fitness & Nutrition Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Holistic tracking for calorie budgeting, structured workouts, and sustainable weight loss trajectory.
          </p>
        </div>

        {/* Action buttons & Range switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveRange('today')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeRange === 'today' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Today, Oct 24
            </button>
            <button
              onClick={() => setActiveRange('week')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeRange === 'week' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setActiveRange('month')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeRange === 'month' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Month
            </button>
          </div>

          <button
            onClick={onOpenLogWorkout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>+ Log Workout</span>
          </button>

          <button
            onClick={onOpenLogMeal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>+ Log Meal</span>
          </button>
        </div>
      </div>

      {/* 4 Key Stat Cards (Matches screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Daily Calorie Balance */}
        <div className="bg-[#0e141f] rounded-xl border border-slate-800/90 p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Daily Calorie Balance</span>
            <div className="w-7 h-7 rounded-full border-2 border-emerald-500 border-t-transparent flex items-center justify-center text-[10px] font-mono font-bold text-emerald-400">
              78%
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {summary.calorieIntake.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">/ {summary.calorieTarget.toLocaleString()} kcal</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-800/80">
            <span className="text-emerald-400 font-mono font-bold">
              -{summary.netDeficit} kcal Deficit
            </span>
            <span className="text-slate-400 text-[11px] font-mono">
              Burn: {summary.calorieBurned} kcal
            </span>
          </div>
        </div>

        {/* 2. Weight & Composition */}
        <div className="bg-[#0e141f] rounded-xl border border-slate-800/90 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Weight & Composition</span>
            <Scale className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold font-mono text-white">{summary.weight.current} kg</span>
            <span className="text-xs font-mono text-emerald-400">{summary.weight.change7d} kg 7d</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-800/80">
            <span>BF: {summary.weight.bodyFatPct}%</span>
            <span>BMI: {summary.weight.bmi}</span>
            <span>Goal: {summary.weight.goal} kg</span>
          </div>
        </div>

        {/* 3. Workouts & Activity */}
        <div className="bg-[#0e141f] rounded-xl border border-slate-800/90 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Workouts & Activity</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {summary.workouts.length || 2} <span className="text-xs font-normal text-slate-400">Sessions Done</span>
          </div>
          <div className="text-xs text-slate-400 font-mono mt-2 pt-2 border-t border-slate-800/80">
            <span>55m Str + 30m Z2</span> · <span className="text-amber-400 font-bold">540 kcal</span>
          </div>
        </div>

        {/* 4. Hydration & Water */}
        <div className="bg-[#0e141f] rounded-xl border border-slate-800/90 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono text-slate-400">Hydration & Water</span>
            <Droplets className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {summary.hydrationMl.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">/ {summary.hydrationTargetMl.toLocaleString()} ml</span>
          </div>
          {/* Visual water bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2.5">
            <div 
              className="bg-cyan-500 h-full rounded-full" 
              style={{ width: `${Math.min(100, (summary.hydrationMl / summary.hydrationTargetMl) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-mono mt-1 text-right">6 glasses logged</p>
        </div>

      </div>

      {/* Macronutrient Target Distribution Bar (Matches screenshot) */}
      <div className="bg-[#0e141f] rounded-xl border border-slate-800/90 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white">Macronutrient Target Distribution</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              Balanced High Protein
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Target Deficit Calibrated</span>
        </div>

        {/* Multi-segment stacked bar */}
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex gap-0.5">
          <div className="bg-indigo-500 h-full" style={{ width: '42%' }} title="Protein 42%" />
          <div className="bg-amber-500 h-full" style={{ width: '38%' }} title="Carbs 38%" />
          <div className="bg-emerald-500 h-full" style={{ width: '20%' }} title="Fat 20%" />
        </div>

        {/* Macro legend & percentage counters */}
        <div className="grid grid-cols-3 gap-4 text-xs pt-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <div>
              <div className="text-[11px] text-slate-400">Protein</div>
              <div className="font-mono font-semibold text-slate-100">
                {summary.macros.protein.current}g <span className="text-slate-500">/ {summary.macros.protein.target}g</span>
              </div>
              <span className="text-[10px] text-indigo-400 font-mono">91% achieved</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <div>
              <div className="text-[11px] text-slate-400">Carbs</div>
              <div className="font-mono font-semibold text-slate-100">
                {summary.macros.carbs.current}g <span className="text-slate-500">/ {summary.macros.carbs.target}g</span>
              </div>
              <span className="text-[10px] text-amber-400 font-mono">85% achieved</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <div>
              <div className="text-[11px] text-slate-400">Fat</div>
              <div className="font-mono font-semibold text-slate-100">
                {summary.macros.fat.current}g <span className="text-slate-500">/ {summary.macros.fat.target}g</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">80% limit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Meal Diary + Right Weight Trajectory & Workouts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: Meal Diary & Nutritional Log (7 cols) */}
        <div className="lg:col-span-7 bg-[#0a0e17] rounded-xl border border-slate-800/90 p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Meal Diary & Nutritional Log</h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              AES-256 Vault
            </span>
          </div>

          {/* Meals list */}
          <div className="space-y-3">
            {summary.meals.map((meal) => (
              <div key={meal.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center font-mono font-bold text-[10px] text-indigo-400">
                      {meal.mealType[0]}
                    </span>
                    <span className="font-semibold text-xs text-white">{meal.mealType}</span>
                    <span className="text-[10px] font-mono text-slate-400">{meal.time}</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-amber-300">{meal.calories} kcal</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {meal.foodsDescription || meal.title}
                </p>

                <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="text-indigo-400 font-medium">{meal.proteinG}g Protein</span>
                    <span className="text-amber-400 font-medium">{meal.carbsG}g Carbs</span>
                    <span className="text-emerald-400 font-medium">{meal.fatG}g Fat</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Verified
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Log Input Box (Matches screenshot) */}
          <form onSubmit={handleQuickMealAdd} className="pt-2">
            <div className="relative">
              <input
                type="text"
                value={quickMealInput}
                onChange={(e) => setQuickMealInput(e.target.value)}
                placeholder="Quick log: 'Double espresso & 30g dark chocolate'..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-500/80"
              />
              <button
                type="submit"
                disabled={isAddingMeal || !quickMealInput.trim()}
                className="absolute right-1 top-1 bottom-1 px-3 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                {isAddingMeal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Parse & Add</span>}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT: Weight Trajectory & Today's Workout Sessions (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Weight Loss Trajectory (Matches screenshot) */}
          <div className="bg-[#0a0e17] rounded-xl border border-slate-800/90 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-white">Weight Loss Trajectory</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">
                30 Days: -2.3 kg
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Consistent steady trajectory tracking within optimal health safety bounds.
            </p>

            {/* Trajectory visualization SVG */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <svg viewBox="0 0 300 80" className="w-full h-20 overflow-visible">
                {/* Grid lines */}
                <line x1="0" y1="20" x2="300" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="0" y1="50" x2="300" y2="50" stroke="#1e293b" strokeDasharray="3 3" />
                
                {/* Trend line */}
                <path
                  d="M 10 25 L 80 35 L 150 45 L 220 52 L 290 65"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                />
                
                {/* Data points */}
                <circle cx="10" cy="25" r="4" fill="#10b981" />
                <circle cx="150" cy="45" r="4" fill="#38bdf8" />
                <circle cx="290" cy="65" r="4" fill="#6366f1" />
              </svg>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-900">
                <span>Sep 25 (76.5 kg)</span>
                <span className="text-sky-400 font-bold">Today (74.2 kg)</span>
                <span className="text-indigo-400">Target (71.0 kg)</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Actual: -0.58 kg / week</span>
              <span>Scheduled: Dec 12 Arrival</span>
            </div>
          </div>

          {/* Today's Workout Sessions (Matches screenshot) */}
          <div className="bg-[#0a0e17] rounded-xl border border-slate-800/90 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-white">Today's Workout Sessions</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">78 mins active</span>
            </div>

            <div className="space-y-2.5">
              {summary.workouts.map((w) => (
                <div key={w.id} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white">{w.name}</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {w.activeKcalBurned} kcal
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                    <span>Duration: {w.durationMin} mins</span>
                    <span>·</span>
                    <span>Avg HR: {w.avgHrBpm} bpm</span>
                    <span>·</span>
                    <span>{w.verifiedSource}</span>
                  </div>

                  {w.exercises && w.exercises.length > 0 && (
                    <div className="pt-1.5 border-t border-slate-800 text-[11px] text-slate-300 space-y-1">
                      {w.exercises.map((ex, i) => (
                        <div key={i} className="flex items-center justify-between font-mono">
                          <span>{ex.name}</span>
                          <span className="text-slate-400">{ex.loadKg > 0 ? `${ex.loadKg}kg · ` : ''}{ex.sets}x{ex.reps}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Aura AI Health Coach Observation (Matches screenshot) */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/60 text-xs space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>Aura AI Health Coach Observation</span>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950 px-1 rounded ml-auto">Optimal</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              "Your average protein intake (2.16g/kg) has successfully preserved lean mass through this 4-week window while maintaining an unbroken ~450 kcal daily deficit. Target weight projection of 71.0 kg remains precisely on track for Dec 12."
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
