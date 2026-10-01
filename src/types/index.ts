export type ActiveView = 
  | 'timeline' 
  | 'assistant' 
  | 'calendar' 
  | 'notes' 
  | 'health' 
  | 'drive'
  | 'hipaa';

export interface UserProfile {
  id: string;
  name: string;
  title: string;
  email?: string;
  photoURL?: string;
  mode?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMin: number;
  stream: 'clinical' | 'work' | 'health' | 'nutrition' | 'focus';
  category: string;
  patientName?: string;
  patientMrn?: string;
  attendees?: string[];
  locationOrUrl?: string;
  notes?: string;
  status: 'confirmed' | 'pending' | 'in-progress' | 'completed';
  guardrails?: string[];
  cognitiveLoad?: 'High' | 'Medium' | 'Low';
  icsAvailable?: boolean;
}

export interface SchedulingQueueItem {
  id: string;
  patientName: string;
  patientMrn: string;
  patientEmail: string;
  phone: string;
  reason: string;
  clinicalPriority: 'P0' | 'P1' | 'P2';
  targetWindow: string;
  preferredTimeOfDay: 'Morning' | 'Afternoon' | 'Anytime';
  requestedDurationMin: number;
  status: 'pending' | 'scheduled' | 'triaged';
  assignedProvider: string;
  clinicalNotesSummary?: string;
  scheduledEventId?: string;
}

export interface ClinicalNote {
  id: string;
  patientName: string;
  patientMrn: string;
  consultDate: string;
  encounterType: 'In-Person Consultation' | 'Telehealth Review' | 'Post-Op Follow-up' | 'Metabolic & Nutrition Clinic';
  rawDoctorTranscript: string;
  soap: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  keyFindings: string[];
  prescriptions: string[];
  recommendedFollowUpWeeks: number;
  dietAndLifestyleOrders: string;
  hipaaEncrypted: boolean;
  createdAt: string;
}

export interface FollowUpEmail {
  id: string;
  patientName: string;
  patientEmail: string;
  subject: string;
  body: string;
  nextAppointmentDate?: string;
  keyInstructions: string[];
  status: 'draft' | 'dispatched';
  sentAt?: string;
}

export interface ExerciseSet {
  name: string;
  sets: number;
  reps: number;
  loadKg: number;
}

export interface WorkoutSession {
  id: string;
  date: string;
  time: string;
  name: string;
  type: 'Zone 2 Cardio' | 'Hypertrophy Strength' | 'HIIT' | 'Mobility & Recovery';
  durationMin: number;
  activeKcalBurned: number;
  avgHrBpm: number;
  maxHrBpm?: number;
  exercises?: ExerciseSet[];
  notes?: string;
  verifiedSource: string; // e.g. "Apple Health", "WHOOP", "Manual"
  hipaaEncrypted: boolean;
}

export interface MealRecord {
  id: string;
  date: string;
  time: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  title: string;
  foodsDescription: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  verified: boolean;
  hipaaEncrypted: boolean;
}

export interface DailyHealthSummary {
  date: string;
  calorieTarget: number;
  calorieIntake: number;
  calorieBurned: number;
  netDeficit: number;
  macros: {
    protein: { current: number; target: number };
    carbs: { current: number; target: number };
    fat: { current: number; target: number };
  };
  weight: {
    current: number;
    goal: number;
    change7d: number;
    bodyFatPct: number;
    bmi: number;
  };
  hydrationMl: number;
  hydrationTargetMl: number;
  readinessScore: number;
  workouts: WorkoutSession[];
  meals: MealRecord[];
  hipaaStatus: {
    encryptedAtRest: boolean;
    cipher: string;
    lastAuditCheck: string;
    complianceStandard: string;
  };
}

export interface HipaaAuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'ENCRYPT_AT_REST';
  resourceType: 'PHI_WORKOUT' | 'PHI_DIET' | 'PHI_CLINICAL_NOTE' | 'PHI_APPOINTMENT';
  resourceId: string;
  details: string;
  integrityHash: string;
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  reasoningChain?: {
    conflictMatrix?: string;
    biometricImpact?: string;
    clinicalResolution?: string;
  };
  actionsPrepared?: {
    title: string;
    type: 'calendar' | 'workout' | 'clinical' | 'email';
    details: string;
    status: 'pending' | 'executed' | 'reverted';
    eventId?: string;
  }[];
  quickSuggestions?: string[];
}
