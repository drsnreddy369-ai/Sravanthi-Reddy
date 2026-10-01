import crypto from 'crypto';
import type { 
  CalendarEvent, 
  ClinicalNote, 
  DailyHealthSummary, 
  FollowUpEmail, 
  HipaaAuditLog, 
  MealRecord, 
  SchedulingQueueItem, 
  WorkoutSession 
} from '../src/types/index.ts';

// HIPAA Secure Key Derivation (AES-256-GCM)
const SECRET_SEED = process.env.HIPAA_MASTER_KEY || 'aura-hipaa-secure-enterprise-phi-seed-2026';
const SALT = Buffer.from('aura-clinical-phi-salt-v1', 'utf8');
const ENCRYPTION_KEY = crypto.pbkdf2Sync(SECRET_SEED, SALT, 100000, 32, 'sha256');

export function encryptPHI(plainText: string): { cipherText: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return {
    cipherText: encrypted,
    iv: iv.toString('hex'),
    tag
  };
}

export function decryptPHI(cipherText: string, ivHex: string, tagHex: string): string {
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let decrypted = decipher.update(cipherText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('HIPAA PHI Decryption failed or integrity corrupted:', err);
    return '[ENCRYPTED PHI - INTEGRITY VERIFICATION FAILED]';
  }
}

// In-Memory HIPAA Vault with encrypted storage and hash-chained audit trails
class HipaaDatabaseVault {
  private auditLogs: HipaaAuditLog[] = [];
  private lastAuditHash = '0000000000000000000000000000000000000000000000000000000000000000';

  // Raw encrypted stores for PHI
  private encryptedWorkouts: Map<string, { payload: string; iv: string; tag: string }> = new Map();
  private encryptedMeals: Map<string, { payload: string; iv: string; tag: string }> = new Map();
  private encryptedClinicalNotes: Map<string, { payload: string; iv: string; tag: string }> = new Map();

  // Calendar & Scheduling Queues
  private events: Map<string, CalendarEvent> = new Map();
  private queue: Map<string, SchedulingQueueItem> = new Map();
  private emailDrafts: Map<string, FollowUpEmail> = new Map();

  // Metrics
  private weightHistory = [
    { date: '2024-09-25', weightKg: 76.5 },
    { date: '2024-10-02', weightKg: 75.8 },
    { date: '2024-10-09', weightKg: 75.2 },
    { date: '2024-10-16', weightKg: 74.6 },
    { date: '2024-10-23', weightKg: 74.2 },
  ];
  private hydrationMl = 2400;
  private currentWeight = 74.2;

  constructor() {
    this.seedInitialData();
  }

  // HIPAA CFR 164.312 Audit Logger with SHA-256 Chaining
  public logAudit(
    actor: string,
    action: HipaaAuditLog['action'],
    resourceType: HipaaAuditLog['resourceType'],
    resourceId: string,
    details: string
  ): HipaaAuditLog {
    const timestamp = new Date().toISOString();
    const hashData = `${this.lastAuditHash}|${timestamp}|${actor}|${action}|${resourceType}|${resourceId}|${details}`;
    const integrityHash = crypto.createHash('sha256').update(hashData).digest('hex');
    this.lastAuditHash = integrityHash;

    const logEntry: HipaaAuditLog = {
      id: `audit-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      timestamp,
      actor,
      action,
      resourceType,
      resourceId,
      details,
      integrityHash
    };

    this.auditLogs.unshift(logEntry);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    return logEntry;
  }

  public getAuditLogs(): HipaaAuditLog[] {
    return [...this.auditLogs];
  }

  // Workouts (Encrypted PHI)
  public saveWorkout(workout: WorkoutSession, actor = 'clinical_user'): WorkoutSession {
    const raw = JSON.stringify(workout);
    const enc = encryptPHI(raw);
    this.encryptedWorkouts.set(workout.id, { payload: enc.cipherText, iv: enc.iv, tag: enc.tag });

    this.logAudit(
      actor,
      'CREATE',
      'PHI_WORKOUT',
      workout.id,
      `Encrypted workout stored: ${workout.name} (${workout.durationMin}m, ${workout.activeKcalBurned} kcal)`
    );
    return workout;
  }

  public getWorkouts(actor = 'clinical_user'): WorkoutSession[] {
    const list: WorkoutSession[] = [];
    for (const [id, enc] of this.encryptedWorkouts.entries()) {
      const decryptedStr = decryptPHI(enc.payload, enc.iv, enc.tag);
      try {
        const item: WorkoutSession = JSON.parse(decryptedStr);
        item.hipaaEncrypted = true;
        list.push(item);
      } catch (e) {
        console.error('Error parsing workout PHI:', e);
      }
    }
    this.logAudit(actor, 'READ', 'PHI_WORKOUT', 'bulk_query', `Decrypted and retrieved ${list.length} workout records`);
    return list.sort((a, b) => (a.time > b.time ? 1 : -1));
  }

  // Meals & Diet (Encrypted PHI)
  public saveMeal(meal: MealRecord, actor = 'clinical_user'): MealRecord {
    const raw = JSON.stringify(meal);
    const enc = encryptPHI(raw);
    this.encryptedMeals.set(meal.id, { payload: enc.cipherText, iv: enc.iv, tag: enc.tag });

    this.logAudit(
      actor,
      'CREATE',
      'PHI_DIET',
      meal.id,
      `Encrypted meal logged: ${meal.mealType} - ${meal.title} (${meal.calories} kcal, ${meal.proteinG}g protein)`
    );
    return meal;
  }

  public getMeals(actor = 'clinical_user'): MealRecord[] {
    const list: MealRecord[] = [];
    for (const [id, enc] of this.encryptedMeals.entries()) {
      const decryptedStr = decryptPHI(enc.payload, enc.iv, enc.tag);
      try {
        const item: MealRecord = JSON.parse(decryptedStr);
        item.hipaaEncrypted = true;
        list.push(item);
      } catch (e) {
        console.error('Error parsing meal PHI:', e);
      }
    }
    this.logAudit(actor, 'READ', 'PHI_DIET', 'bulk_query', `Decrypted and retrieved ${list.length} meal records`);
    return list.sort((a, b) => (a.time > b.time ? 1 : -1));
  }

  // Health Summary (Calorie balance, macros, weight, deficit)
  public getHealthSummary(actor = 'clinical_user'): DailyHealthSummary {
    const workouts = this.getWorkouts(actor);
    const meals = this.getMeals(actor);

    const totalKcalIntake = meals.reduce((sum, m) => sum + m.calories, 0);
    const totalProtein = meals.reduce((sum, m) => sum + m.proteinG, 0);
    const totalCarbs = meals.reduce((sum, m) => sum + m.carbsG, 0);
    const totalFat = meals.reduce((sum, m) => sum + m.fatG, 0);

    const totalKcalBurned = workouts.reduce((sum, w) => sum + w.activeKcalBurned, 0) + 140; // baseline activity
    const targetKcal = 2350;
    const netDeficit = targetKcal - totalKcalIntake; // e.g. 510 kcal deficit

    return {
      date: '2024-10-23',
      calorieTarget: targetKcal,
      calorieIntake: totalKcalIntake,
      calorieBurned: totalKcalBurned,
      netDeficit,
      macros: {
        protein: { current: totalProtein, target: 175 },
        carbs: { current: totalCarbs, target: 210 },
        fat: { current: totalFat, target: 65 }
      },
      weight: {
        current: this.currentWeight,
        goal: 71.0,
        change7d: -0.4,
        bodyFatPct: 16.8,
        bmi: 22.4
      },
      hydrationMl: this.hydrationMl,
      hydrationTargetMl: 3000,
      readinessScore: 92,
      workouts,
      meals,
      hipaaStatus: {
        encryptedAtRest: true,
        cipher: 'AES-256-GCM',
        lastAuditCheck: new Date().toISOString(),
        complianceStandard: 'HIPAA Security Rule 45 CFR § 164.312'
      }
    };
  }

  public updateWeight(weightKg: number, actor = 'clinical_user') {
    this.currentWeight = weightKg;
    this.weightHistory.push({
      date: new Date().toISOString().slice(0, 10),
      weightKg
    });
    this.logAudit(actor, 'UPDATE', 'PHI_CLINICAL_NOTE', 'biometric_weight', `Updated weight to ${weightKg} kg`);
  }

  public getWeightHistory() {
    return [...this.weightHistory];
  }

  // Clinical Consultation Notes (Encrypted PHI)
  public saveClinicalNote(note: ClinicalNote, actor = 'dr_reddy_chief_clinician'): ClinicalNote {
    const raw = JSON.stringify(note);
    const enc = encryptPHI(raw);
    this.encryptedClinicalNotes.set(note.id, { payload: enc.cipherText, iv: enc.iv, tag: enc.tag });

    this.logAudit(
      actor,
      'CREATE',
      'PHI_CLINICAL_NOTE',
      note.id,
      `Encrypted SOAP clinical note saved for patient ${note.patientName} (MRN: ${note.patientMrn})`
    );
    return note;
  }

  public getClinicalNotes(actor = 'dr_reddy_chief_clinician'): ClinicalNote[] {
    const list: ClinicalNote[] = [];
    for (const [id, enc] of this.encryptedClinicalNotes.entries()) {
      const decryptedStr = decryptPHI(enc.payload, enc.iv, enc.tag);
      try {
        const item: ClinicalNote = JSON.parse(decryptedStr);
        item.hipaaEncrypted = true;
        list.push(item);
      } catch (e) {
        console.error('Error parsing clinical note PHI:', e);
      }
    }
    this.logAudit(actor, 'READ', 'PHI_CLINICAL_NOTE', 'bulk_query', `Decrypted and retrieved ${list.length} clinical notes`);
    return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  public getClinicalNoteById(id: string, actor = 'dr_reddy_chief_clinician'): ClinicalNote | null {
    const enc = this.encryptedClinicalNotes.get(id);
    if (!enc) return null;
    const decryptedStr = decryptPHI(enc.payload, enc.iv, enc.tag);
    try {
      const item: ClinicalNote = JSON.parse(decryptedStr);
      item.hipaaEncrypted = true;
      this.logAudit(actor, 'READ', 'PHI_CLINICAL_NOTE', id, `Accessed clinical note for patient ${item.patientName}`);
      return item;
    } catch {
      return null;
    }
  }

  // Follow-Up Email Drafts
  public saveEmailDraft(draft: FollowUpEmail, actor = 'dr_reddy_chief_clinician'): FollowUpEmail {
    this.emailDrafts.set(draft.id, draft);
    this.logAudit(actor, 'CREATE', 'PHI_CLINICAL_NOTE', draft.id, `Created follow-up email draft for ${draft.patientName}`);
    return draft;
  }

  public getEmailDrafts(): FollowUpEmail[] {
    return Array.from(this.emailDrafts.values());
  }

  public markEmailDispatched(id: string, actor = 'dr_reddy_chief_clinician'): boolean {
    const draft = this.emailDrafts.get(id);
    if (!draft) return false;
    draft.status = 'dispatched';
    draft.sentAt = new Date().toISOString();
    this.emailDrafts.set(id, draft);
    this.logAudit(actor, 'UPDATE', 'PHI_CLINICAL_NOTE', id, `Follow-up email dispatched to ${draft.patientEmail}`);
    return true;
  }

  // Scheduling Queue
  public getSchedulingQueue(): SchedulingQueueItem[] {
    return Array.from(this.queue.values()).sort((a, b) => {
      const pOrder = { P0: 0, P1: 1, P2: 2 };
      return pOrder[a.clinicalPriority] - pOrder[b.clinicalPriority];
    });
  }

  public addToQueue(item: SchedulingQueueItem, actor = 'clinical_assistant'): SchedulingQueueItem {
    this.queue.set(item.id, item);
    this.logAudit(actor, 'CREATE', 'PHI_APPOINTMENT', item.id, `Enqueued patient ${item.patientName} with priority ${item.clinicalPriority}`);
    return item;
  }

  public updateQueueStatus(id: string, status: SchedulingQueueItem['status'], scheduledEventId?: string, actor = 'clinical_assistant'): boolean {
    const item = this.queue.get(id);
    if (!item) return false;
    item.status = status;
    if (scheduledEventId) {
      item.scheduledEventId = scheduledEventId;
    }
    this.queue.set(id, item);
    this.logAudit(actor, 'UPDATE', 'PHI_APPOINTMENT', id, `Updated scheduling queue item ${item.patientName} to status '${status}'`);
    return true;
  }

  // Calendar Events
  public getEvents(): CalendarEvent[] {
    return Array.from(this.events.values()).sort((a, b) => (a.startTime > b.startTime ? 1 : -1));
  }

  public addEvent(event: CalendarEvent, actor = 'calendar_dispatcher'): CalendarEvent {
    this.events.set(event.id, event);
    this.logAudit(
      actor,
      'CREATE',
      'PHI_APPOINTMENT',
      event.id,
      `Scheduled calendar event: '${event.title}' on ${event.date} at ${event.startTime}-${event.endTime}`
    );
    return event;
  }

  public deleteEvent(id: string, actor = 'calendar_dispatcher'): boolean {
    const existing = this.events.get(id);
    if (!existing) return false;
    this.events.delete(id);
    this.logAudit(actor, 'DELETE', 'PHI_APPOINTMENT', id, `Cancelled calendar event: '${existing.title}'`);
    return true;
  }

  public rescheduleEvent(id: string, newDate: string, newStartTime: string, newEndTime: string, actor = 'calendar_dispatcher'): CalendarEvent | null {
    const existing = this.events.get(id);
    if (!existing) return null;
    existing.date = newDate;
    existing.startTime = newStartTime;
    existing.endTime = newEndTime;
    this.events.set(id, existing);
    this.logAudit(
      actor,
      'UPDATE',
      'PHI_APPOINTMENT',
      id,
      `Rescheduled event '${existing.title}' to ${newDate} ${newStartTime}-${newEndTime}`
    );
    return existing;
  }

  // Generate .ics calendar payload for universal sync
  public generateIcs(eventId: string): string | null {
    const ev = this.events.get(eventId);
    if (!ev) return null;

    const [year, month, day] = ev.date.split('-');
    const [startH, startM] = ev.startTime.split(':');
    const [endH, endM] = ev.endTime.split(':');

    const dtStart = `${year}${month}${day}T${startH}${startM}00`;
    const dtEnd = `${year}${month}${day}T${endH}${endM}00`;
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Aura Clinical Intelligence//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${ev.id}@aura-clinical.ai`,
      `DTSTAMP:${now}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${ev.title}`,
      `DESCRIPTION:${(ev.notes || 'Clinical consultation scheduled via Aura AI').replace(/\n/g, '\\n')}`,
      `LOCATION:${ev.locationOrUrl || 'Telehealth Virtual Room / Google Meet'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  // Seed data matching the user's dashboard screenshots
  private seedInitialData() {
    // 1. Initial Workouts
    const workout1: WorkoutSession = {
      id: 'w-01',
      date: '2024-10-23',
      time: '07:00 AM',
      name: 'Zone 2 Aerobic Cardio & Mobility',
      type: 'Zone 2 Cardio',
      durationMin: 45,
      activeKcalBurned: 410,
      avgHrBpm: 138,
      maxHrBpm: 152,
      notes: 'Outdoor trail run · Continuous nasal breathing · Zone 2 metabolic base',
      verifiedSource: 'Apple Health',
      hipaaEncrypted: true
    };

    const workout2: WorkoutSession = {
      id: 'w-02',
      date: '2024-10-23',
      time: '05:30 PM',
      name: 'Hypertrophy Strength Training: Upper Body A',
      type: 'Hypertrophy Strength',
      durationMin: 48,
      activeKcalBurned: 340,
      avgHrBpm: 124,
      exercises: [
        { name: 'Incline DB Press', sets: 4, reps: 8, loadKg: 32 },
        { name: 'Cable Flyes', sets: 3, reps: 12, loadKg: 18 },
        { name: 'Hanging Leg Raise', sets: 3, reps: 15, loadKg: 0 },
        { name: 'Overhead Press', sets: 3, reps: 8, loadKg: 24 }
      ],
      notes: 'Focus on chest/triceps/core mechanical tension',
      verifiedSource: 'WHOOP 4.0',
      hipaaEncrypted: true
    };

    this.saveWorkout(workout1, 'system_seed');
    this.saveWorkout(workout2, 'system_seed');

    // 2. Initial Meals (1,840 kcal / 2,350 kcal)
    const meal1: MealRecord = {
      id: 'm-01',
      date: '2024-10-23',
      time: '08:30 AM',
      mealType: 'Breakfast',
      title: 'High-Protein Antioxidant Oats',
      foodsDescription: 'Oatmeal with wild blueberries, greek yogurt 0%, isolate whey protein scoop',
      calories: 480,
      proteinG: 42,
      carbsG: 55,
      fatG: 8,
      verified: true,
      hipaaEncrypted: true
    };

    const meal2: MealRecord = {
      id: 'm-02',
      date: '2024-10-23',
      time: '01:00 PM',
      mealType: 'Lunch',
      title: 'Wild Atlantic Salmon & Ancient Grain Bowl',
      foodsDescription: 'Grilled Atlantic salmon bowl, tri-color quinoa, steamed broccolini, cold-pressed olive oil',
      calories: 650,
      proteinG: 52,
      carbsG: 48,
      fatG: 22,
      verified: true,
      hipaaEncrypted: true
    };

    const meal3: MealRecord = {
      id: 'm-03',
      date: '2024-10-23',
      time: '04:15 PM',
      mealType: 'Snack',
      title: 'Pre-Workout Honeycrisp & Raw Almond Butter',
      foodsDescription: 'Crisp honeycrisp apple slices, all-natural almond butter (1.5 tbsp)',
      calories: 210,
      proteinG: 6,
      carbsG: 22,
      fatG: 12,
      verified: true,
      hipaaEncrypted: true
    };

    const meal4: MealRecord = {
      id: 'm-04',
      date: '2024-10-23',
      time: '07:30 PM',
      mealType: 'Dinner',
      title: 'Planned Tenderloin & Roasted Sweet Potato',
      foodsDescription: 'Free-range chicken breast tenderloins (200g), baked sweet potato wedges, avocado garden salad',
      calories: 500,
      proteinG: 45,
      carbsG: 40,
      fatG: 10,
      verified: false,
      hipaaEncrypted: true
    };

    this.saveMeal(meal1, 'system_seed');
    this.saveMeal(meal2, 'system_seed');
    this.saveMeal(meal3, 'system_seed');
    this.saveMeal(meal4, 'system_seed');

    // 3. Calendar Events matching screenshots
    const eventsList: CalendarEvent[] = [
      {
        id: 'evt-01',
        title: 'Zone 2 Aerobic Cardio & Mobility',
        date: '2024-10-23',
        startTime: '07:00',
        endTime: '07:45',
        durationMin: 45,
        stream: 'health',
        category: 'Health Protocol',
        notes: 'Outdoor run · Avg HR 138 bpm · 410 active kcal recorded via Apple Health',
        status: 'completed',
        guardrails: ['Target HRV > 65ms', 'Zone 2 heart rate clamp (130-142 bpm)'],
        cognitiveLoad: 'Low',
        icsAvailable: true
      },
      {
        id: 'evt-02',
        title: 'Weekly Executive Sprint Kickoff',
        date: '2024-10-23',
        startTime: '09:30',
        endTime: '10:15',
        durationMin: 45,
        stream: 'work',
        category: 'Google Cal (Work)',
        attendees: ['Devon L.', 'Marcus K.', 'Sarah R.', 'Priya P.'],
        locationOrUrl: 'https://meet.google.com/aur-exsq-wsk',
        notes: 'With Product Leads, Growth, & Engineering Directors · Aura Auto-Summarizer Armed',
        status: 'confirmed',
        guardrails: ['Autonomous Brief synced from Notion', 'Hard 45m timebox'],
        cognitiveLoad: 'Medium',
        icsAvailable: true
      },
      {
        id: 'evt-03',
        title: 'Deep Focus: Q4 Platform Roadmap & Budgeting',
        date: '2024-10-23',
        startTime: '11:00',
        endTime: '12:30',
        durationMin: 90,
        stream: 'focus',
        category: 'Manual Focus Block',
        notes: 'Slack DND auto-engaged · Distraction shielding enabled · Review GPU cluster unit economics',
        status: 'confirmed',
        guardrails: ['Distraction shielding 100%', 'No inbound Slack interruptions'],
        cognitiveLoad: 'High',
        icsAvailable: true
      },
      {
        id: 'evt-04',
        title: 'Product Architecture Review (Enterprise Core)',
        date: '2024-10-23',
        startTime: '13:15',
        endTime: '14:15',
        durationMin: 60,
        stream: 'work',
        category: 'Work Outlook',
        attendees: ['Elena Rostova', 'Marcus Vance (VP Infra)'],
        locationOrUrl: 'https://meet.google.com/aur-arch-rvw',
        notes: 'Reviewing RFC #408 with Principal Architect · Asymmetric token rotation and latency p99 audit',
        status: 'confirmed',
        guardrails: ['Confirm Marcus records architecture RFC diagram', 'Send latency metrics 10m prior'],
        cognitiveLoad: 'High',
        icsAvailable: true
      },
      {
        id: 'evt-05',
        title: 'Clinical Consultation: Cardiac Post-Op Review',
        date: '2024-10-23',
        startTime: '16:00',
        endTime: '16:45',
        durationMin: 45,
        stream: 'clinical',
        category: 'Telehealth Review',
        patientName: 'Sarah Jenkins',
        patientMrn: 'MRN-89241',
        attendees: ['Dr. Reddy', 'Sarah Jenkins'],
        locationOrUrl: 'https://telehealth.aura-clinical.health/v/s-jenkins-89241',
        notes: 'Follow-up on 8-week CABG recovery · Review Holter monitor 24h readings and beta-blocker titration',
        status: 'confirmed',
        guardrails: ['HIPAA Audio Recording Consent Verified', 'SOAP Note Auto-Synthesize Armed'],
        cognitiveLoad: 'High',
        icsAvailable: true
      },
      {
        id: 'evt-06',
        title: 'Hypertrophy Strength Training: Upper Body A',
        date: '2024-10-23',
        startTime: '17:30',
        endTime: '18:30',
        durationMin: 60,
        stream: 'health',
        category: 'Health Protocol',
        notes: 'Bench Press, Pendlay Rows, Overhead Press, Incline DB Curl',
        status: 'confirmed',
        guardrails: ['Post-workout 35g protein window', 'Pre-workout electrolyte check'],
        cognitiveLoad: 'Low',
        icsAvailable: true
      }
    ];

    for (const ev of eventsList) {
      this.events.set(ev.id, ev);
    }

    // 4. Scheduling Queue (Clinical appointments waiting for booking)
    const queueList: SchedulingQueueItem[] = [
      {
        id: 'q-01',
        patientName: 'David Chen',
        patientMrn: 'MRN-44102',
        patientEmail: 'dchen.tech@gmail.com',
        phone: '+1 (415) 883-2910',
        reason: 'HbA1c Lab Follow-up & Metformin / GLP-1 Titration Review',
        clinicalPriority: 'P0',
        targetWindow: 'Within 48 hours (Optimal: Oct 24-25)',
        preferredTimeOfDay: 'Morning',
        requestedDurationMin: 30,
        status: 'pending',
        assignedProvider: 'Dr. S. N. Reddy',
        clinicalNotesSummary: 'Recent fasting glucose 142 mg/dL, HbA1c elevated to 7.4%. Patient experienced mild GI intolerance with current dose; needs regimen optimization.'
      },
      {
        id: 'q-02',
        patientName: 'Elena Rostova',
        patientMrn: 'MRN-77309',
        patientEmail: 'elena.rostova@acme-cloud.io',
        phone: '+1 (415) 902-1144',
        reason: 'Executive Cognitive Burnout & Circadian Fatigue Telemetry Review',
        clinicalPriority: 'P1',
        targetWindow: 'This Week (Thursday afternoon preferred)',
        preferredTimeOfDay: 'Afternoon',
        requestedDurationMin: 45,
        status: 'pending',
        assignedProvider: 'Dr. S. N. Reddy',
        clinicalNotesSummary: 'Whoop recovery index consistently < 38% for 6 consecutive days. Sleep latency elevated to 42m. High cognitive load leading to afternoon crash.'
      },
      {
        id: 'q-03',
        patientName: 'Michael Sterling',
        patientMrn: 'MRN-19284',
        patientEmail: 'm.sterling@investcap.com',
        phone: '+1 (650) 412-9901',
        reason: 'Annual Comprehensive Metabolic Panel & VO2 Max Evaluation',
        clinicalPriority: 'P2',
        targetWindow: 'Next 7-10 Days',
        preferredTimeOfDay: 'Morning',
        requestedDurationMin: 45,
        status: 'pending',
        assignedProvider: 'Dr. S. N. Reddy',
        clinicalNotesSummary: 'Asymptomatic executive baseline check. Target: Zone 2 protocol prescription and lipid profile review.'
      }
    ];

    for (const q of queueList) {
      this.queue.set(q.id, q);
    }

    // 5. Clinical Consultation Notes (Encrypted PHI)
    const initialClinicalNote: ClinicalNote = {
      id: 'cn-01',
      patientName: 'Sarah Jenkins',
      patientMrn: 'MRN-89241',
      consultDate: '2024-10-18',
      encounterType: 'Post-Op Follow-up',
      rawDoctorTranscript: `Dr. Reddy: Good morning Sarah, how are you feeling 6 weeks post your coronary artery bypass graft?
Sarah: Overall much better Doctor. Sternotomy pain is down to a 2/10, mostly when coughing. I've started walking 25 minutes every morning as you recommended. No chest tightness, but my legs feel slightly swollen in the evenings.
Dr. Reddy: That is promising progress. Let's look at your vitals: Blood pressure is 126/78 mmHg, resting HR is 68 bpm. Sternal incision has healed with no erythema or discharge. Mild bilateral non-pitting edema at the saphenous harvest site, which is expected.
Sarah: Should I continue the Metoprolol and Aspirin?
Dr. Reddy: Yes, continue Metoprolol Tartrate 25mg BID and baby aspirin 81mg daily. Let's advance your aerobic rehab to 35 minutes in Zone 1-2. Keep daily sodium under 2,000 mg. We will schedule a routine Holter review in 3 weeks.`,
      soap: {
        subjective: '62-year-old female presents for routine 6-week post-CABG surgical recovery check. Sternal discomfort significantly reduced (2/10). Adhering to initial 25-minute morning walks with zero exertional angina, syncope, or orthopnea. Reports mild bilateral lower extremity dependent fullness in the evenings.',
        objective: 'BP: 126/78 mmHg | HR: 68 bpm regular | SpO2: 98% on room air | BMI: 25.1. Sternal wound well-apposed, non-tender, no signs of infection. Mild 1+ non-pitting dependent edema over bilateral lower extremities distal to vein harvest incisions. Lungs clear to auscultation bilaterally.',
        assessment: '1. Atherosclerotic heart disease of native coronary artery, status post coronary artery bypass graft (CABG x3) - Excellent post-operative convalescence.\n2. Mild dependent venous insufficiency secondary to saphenectomy - Benign, resolving.\n3. Essential hypertension - Well-controlled on current beta-blocker therapy.',
        plan: '1. Medications: Continue Metoprolol Tartrate 25mg BID, Aspirin 81mg daily, Atorvastatin 40mg at bedtime.\n2. Cardiac Rehab & Exercise: Clear patient to increase daily low-impact Zone 2 walking to 35-40 minutes with continuous heart rate monitoring (<125 bpm).\n3. Nutrition & Fluid: Restrict dietary sodium to <2,000 mg/day; maintain 2.5L daily hydration.\n4. Follow-up: Schedule follow-up appointment in 3 weeks with 24-hour Holter monitoring.'
      },
      keyFindings: [
        'Sternal incision fully healed with minimal residual discomfort',
        'Blood pressure well-controlled at 126/78 mmHg, HR 68 bpm',
        'Zero exertional angina or shortness of breath',
        'Expected mild saphenous harvest site dependent edema'
      ],
      prescriptions: [
        'Metoprolol Tartrate 25mg PO BID',
        'Aspirin 81mg PO daily',
        'Atorvastatin 40mg PO QHS'
      ],
      recommendedFollowUpWeeks: 3,
      dietAndLifestyleOrders: 'Sodium <2g/day, progressive Zone 2 walking 35m daily, leg elevation 20m in evenings.',
      hipaaEncrypted: true,
      createdAt: '2024-10-18T14:30:00Z'
    };

    this.saveClinicalNote(initialClinicalNote, 'system_seed');

    // 6. Follow-up email draft
    const initialEmailDraft: FollowUpEmail = {
      id: 'em-01',
      patientName: 'Sarah Jenkins',
      patientEmail: 'sarah.jenkins82@gmail.com',
      subject: 'Follow-Up Summary & Cardiac Recovery Care Plan — Dr. S. N. Reddy',
      body: `Dear Sarah,

It was wonderful seeing you today for your 6-week post-surgical follow-up. You are making tremendous progress, and your sternal incision and vital signs (BP 126/78, resting HR 68 bpm) look excellent.

Here is a summary of our discussion and your personalized care plan:

1. Exercise & Activity:
You are officially cleared to advance your daily morning walks from 25 to 35 minutes. Maintain a steady, comfortable pace (Zone 1 to Zone 2, keeping your heart rate under 125 bpm).

2. Leg Swelling Care:
The mild evening puffiness in your lower legs is normal following the saphenous vein harvest. Please elevate your legs above hip level for 20 minutes when resting in the evening.

3. Nutrition & Hydration:
Keep your daily sodium intake under 2,000 mg (avoid canned soups, cured meats, and heavy restaurant sauces) and drink 2.5 liters of water daily.

4. Medications:
• Metoprolol Tartrate 25mg — 1 tablet twice daily with meals
• Aspirin 81mg — 1 tablet daily
• Atorvastatin 40mg — 1 tablet every evening at bedtime

5. Next Appointment:
We will see you in 3 weeks for your follow-up and Holter review. Our office calendar link has been prepared for you.

Warm regards,
Dr. S. N. Reddy, MD
Aura Clinical Intelligence & Cardiovascular Health`,
      nextAppointmentDate: '2024-11-08',
      keyInstructions: [
        'Increase daily walk to 35 mins (Zone 1-2, HR < 125 bpm)',
        'Elevate legs 20m every evening',
        'Sodium intake < 2,000 mg/day',
        'Continue Metoprolol 25mg BID, Aspirin 81mg daily, Atorvastatin 40mg QHS'
      ],
      status: 'draft'
    };

    this.saveEmailDraft(initialEmailDraft, 'system_seed');
  }
}

export const hipaaVault = new HipaaDatabaseVault();
