import type { 
  CalendarEvent, 
  ClinicalNote, 
  DailyHealthSummary, 
  FollowUpEmail, 
  HipaaAuditLog, 
  MealRecord, 
  SchedulingQueueItem, 
  WorkoutSession 
} from '../types/index.ts';

export const api = {
  // Calendar endpoints
  async getEvents(): Promise<CalendarEvent[]> {
    const res = await fetch('/api/calendar/events');
    const data = await res.json();
    return data.events || [];
  },

  async scheduleAppointment(payload: {
    title: string;
    date: string;
    startTime: string;
    durationMin: number;
    stream?: string;
    category?: string;
    patientName?: string;
    patientMrn?: string;
    attendees?: string[];
    notes?: string;
    queueItemId?: string;
  }): Promise<{ success: boolean; message: string; event: CalendarEvent; icsDownloadUrl: string; telehealthLink: string }> {
    const res = await fetch('/api/calendar/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to schedule appointment');
    }
    return res.json();
  },

  async rescheduleAppointment(id: string, newDate: string, newStartTime: string, durationMin = 45): Promise<CalendarEvent> {
    const res = await fetch('/api/calendar/reschedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, newDate, newStartTime, durationMin })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reschedule');
    return data.event;
  },

  async cancelAppointment(id: string): Promise<boolean> {
    const res = await fetch(`/api/calendar/events/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },

  getIcsExportUrl(eventId: string): string {
    return `/api/calendar/export-ics/${eventId}`;
  },

  // Scheduling queue
  async getSchedulingQueue(): Promise<SchedulingQueueItem[]> {
    const res = await fetch('/api/clinical/queue');
    const data = await res.json();
    return data.queue || [];
  },

  async addToQueue(item: Partial<SchedulingQueueItem>): Promise<SchedulingQueueItem> {
    const res = await fetch('/api/clinical/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    const data = await res.json();
    return data.item;
  },

  async triageQueue(id: string, status: SchedulingQueueItem['status']): Promise<boolean> {
    const res = await fetch('/api/clinical/queue/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    const data = await res.json();
    return data.success;
  },

  // Clinical Notes & SOAP summarizer
  async transcribeAudio(audioBase64: string, mimeType = 'audio/webm'): Promise<string> {
    const res = await fetch('/api/clinical/transcribe-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64, mimeType })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to transcribe audio');
    return data.transcript || '';
  },

  async summarizeClinicalNote(params: {
    transcript: string;
    patientName?: string;
    encounterType?: string;
    mrn?: string;
  }): Promise<ClinicalNote> {
    const res = await fetch('/api/clinical/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to summarize clinical note');
    return data.note;
  },

  async getClinicalNotes(): Promise<ClinicalNote[]> {
    const res = await fetch('/api/clinical/notes');
    const data = await res.json();
    return data.notes || [];
  },

  // Follow-up email drafting
  async draftFollowUpEmail(params: {
    patientName: string;
    patientEmail: string;
    clinicalNoteId?: string;
    carePlanSummary?: string;
    nextAppointmentDate?: string;
    dietOrders?: string;
    prescriptions?: string[];
  }): Promise<FollowUpEmail> {
    const res = await fetch('/api/clinical/draft-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to draft email');
    return data.draft;
  },

  async dispatchEmail(id: string): Promise<boolean> {
    const res = await fetch(`/api/clinical/email-dispatch/${id}`, { method: 'POST' });
    const data = await res.json();
    return data.success;
  },

  async getEmailDrafts(): Promise<FollowUpEmail[]> {
    const res = await fetch('/api/clinical/emails');
    const data = await res.json();
    return data.drafts || [];
  },

  // NLP Intent Dispatcher
  async parseNlpIntent(prompt: string): Promise<any> {
    const res = await fetch('/api/clinical/nlp-parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    return data.result;
  },

  // Health & HIPAA-compliant PHI
  async getHealthSummary(): Promise<{ summary: DailyHealthSummary; weightHistory: { date: string; weightKg: number }[] }> {
    const res = await fetch('/api/health/summary');
    const data = await res.json();
    return { summary: data.summary, weightHistory: data.weightHistory || [] };
  },

  async logWorkout(payload: Partial<WorkoutSession>): Promise<WorkoutSession> {
    const res = await fetch('/api/health/workout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save workout');
    return data.workout;
  },

  async logMeal(payload: Partial<MealRecord>): Promise<MealRecord> {
    const res = await fetch('/api/health/meal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save meal');
    return data.meal;
  },

  async recordWeight(weightKg: number): Promise<number> {
    const res = await fetch('/api/health/weight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weightKg })
    });
    const data = await res.json();
    return data.weightKg;
  },

  // HIPAA audit log inspection
  async getHipaaAuditLogs(): Promise<{ complianceStatus: any; logs: HipaaAuditLog[] }> {
    const res = await fetch('/api/hipaa/audit-logs');
    const data = await res.json();
    return { complianceStatus: data.complianceStatus, logs: data.logs || [] };
  }
};
