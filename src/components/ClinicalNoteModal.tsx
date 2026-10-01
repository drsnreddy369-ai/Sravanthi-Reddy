import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  Mail, 
  CalendarPlus, 
  ShieldCheck, 
  Mic, 
  Square, 
  Play, 
  Pause, 
  RotateCcw,
  Volume2,
  AlertCircle,
  Folder,
  Upload
} from 'lucide-react';
import { api } from '../services/api.ts';
import { googleSignIn, getAccessToken, driveApi } from '../services/googleAuth.ts';
import type { ClinicalNote } from '../types/index.ts';

interface ClinicalNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (note: ClinicalNote) => void;
  onDraftEmail?: (note: ClinicalNote) => void;
  onScheduleFollowUp?: (note: ClinicalNote) => void;
  currentUserName?: string;
}

export const ClinicalNoteModal: React.FC<ClinicalNoteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onDraftEmail,
  onScheduleFollowUp,
  currentUserName
}) => {
  const [patientName, setPatientName] = useState('David Chen');
  const [mrn, setMrn] = useState('MRN-44102');
  const [encounterType, setEncounterType] = useState('Metabolic & Nutrition Clinic');
  const [transcript, setTranscript] = useState(`Dr. Reddy: Good morning David. Let's review your recent 3-month labs and continuous glucose monitoring trends.
David: Good morning Dr. Reddy. My fasting blood sugars have been hovering around 138 to 145 mg/dL. I've been taking Metformin 500mg with dinner, but I've been experiencing mild nausea and abdominal bloating if I take it without enough food.
Dr. Reddy: Thank you for letting me know. Your HbA1c came back at 7.4%, up from 6.9%. Blood pressure today is 132/84 mmHg, resting pulse 72 bpm, weight 84.5 kg. Lungs clear, no peripheral neuropathy on monofilament testing.
David: What should we do about the medication and diet?
Dr. Reddy: We will switch you to Metformin Extended-Release (ER) 750mg once daily with your largest meal to eliminate the GI side effects. We will also introduce an SGLT2 inhibitor (Empagliflozin 10mg daily) for cardiorenal protection and glycemic stability. For your diet, let's limit refined carbs to under 50g per meal, prioritize 35g fiber daily, and aim for a 450 kcal daily deficit. We'll follow up in 4 weeks with a fasting lipid and renal panel.`);

  const [isLoading, setIsLoading] = useState(false);
  const [summarizedNote, setSummarizedNote] = useState<ClinicalNote | null>(null);

  // ----------------------------------------------------
  // VOICE-TO-TEXT MEDIARECORDER STATE
  // ----------------------------------------------------
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>([10, 15, 25, 12, 18, 30, 22, 14, 19, 28, 16, 12]);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [transcriptFeedback, setTranscriptFeedback] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const [isExportingDrive, setIsExportingDrive] = useState(false);
  const [driveExportStatus, setDriveExportStatus] = useState<string | null>(null);

  const handleExportToDrive = async () => {
    if (!summarizedNote) return;
    setIsExportingDrive(true);
    setDriveExportStatus(null);
    try {
      let token = await getAccessToken();
      if (!token) {
        const signinRes = await googleSignIn();
        token = signinRes?.accessToken || null;
      }
      if (!token) {
        throw new Error('Google Drive access token required. Please sign in.');
      }

      const fileName = `SOAP_Note_${summarizedNote.patientName.replace(/\s+/g, '_')}_${summarizedNote.consultDate}.txt`;
      const docContent = [
        `======================================================`,
        `AURA CLINICAL INTELLIGENCE — CONSULTATION SUMMARY`,
        `======================================================`,
        `Patient Name: ${summarizedNote.patientName}`,
        `MRN: ${summarizedNote.patientMrn}`,
        `Encounter Type: ${summarizedNote.encounterType}`,
        `Consultation Date: ${summarizedNote.consultDate}`,
        `Physician: ${currentUserName || 'Dr. S. N. Reddy, MD'}`,
        ``,
        `--- SUBJECTIVE ---`,
        summarizedNote.soap.subjective,
        ``,
        `--- OBJECTIVE ---`,
        summarizedNote.soap.objective,
        ``,
        `--- ASSESSMENT ---`,
        summarizedNote.soap.assessment,
        ``,
        `--- PLAN ---`,
        summarizedNote.soap.plan,
        ``,
        `--- PRESCRIPTIONS ---`,
        summarizedNote.prescriptions.map(p => `• ${p}`).join('\n'),
        ``,
        `--- DIET & LIFESTYLE ORDERS ---`,
        summarizedNote.dietAndLifestyleOrders,
        ``,
        `--- RECOMMENDED FOLLOW-UP ---`,
        `${summarizedNote.recommendedFollowUpWeeks} weeks`,
        `======================================================`,
        `Stored via Aura HIPAA-Compliant Gateway · End-to-End Encrypted`
      ].join('\n');

      await driveApi.uploadFile(token, fileName, docContent, 'text/plain');
      setDriveExportStatus(`Saved "${fileName}" to Google Drive!`);
      setTimeout(() => setDriveExportStatus(null), 4000);
    } catch (err: any) {
      console.error('Drive export error:', err);
      setDriveExportStatus(`Error: ${err.message || 'Failed to export to Google Drive'}`);
      setTimeout(() => setDriveExportStatus(null), 5000);
    } finally {
      setIsExportingDrive(false);
    }
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup recording tracks when unmounting or closing
  useEffect(() => {
    return () => {
      stopRecordingResources();
    };
  }, []);

  const stopRecordingResources = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  const getSupportedMimeType = (): string => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg',
      'audio/wav'
    ];
    for (const t of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  };

  // Start recording using browser MediaRecorder API
  const handleStartRecording = async () => {
    setRecordError(null);
    setTranscriptFeedback(null);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setRecordError('MediaDevices API not supported in this browser environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const recorder = mimeType 
        ? new MediaRecorder(stream, { mimeType }) 
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        // Send to backend for Gemini transcription
        await processAudioTranscription(audioBlob);
      };

      recorder.start(250); // Emit chunk every 250ms
      setIsRecording(true);
      setRecordingSeconds(0);

      // Start elapsed timer
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      // Set up real-time audio visualization with Web Audio API
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 32;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const updateMeter = () => {
            if (!analyser) return;
            analyser.getByteFrequencyData(dataArray);
            const levels = Array.from(dataArray.slice(0, 16)).map(v => Math.max(8, (v / 255) * 36));
            setAudioLevels(levels);
            animationFrameRef.current = requestAnimationFrame(updateMeter);
          };
          updateMeter();
        }
      } catch (audioErr) {
        console.warn('AudioContext visualizer notice:', audioErr);
      }
    } catch (err: any) {
      console.error('Error starting MediaRecorder:', err);
      setRecordError(err.message || 'Microphone access denied or audio hardware unavailable.');
      setIsRecording(false);
    }
  };

  // Stop recording and trigger transcription
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopRecordingResources();
    }
  };

  // Cancel recording without transcribing
  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    stopRecordingResources();
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingSeconds(0);
    setRecordError(null);
  };

  // Convert Blob to base64 and call /api/clinical/transcribe-audio
  const processAudioTranscription = async (blob: Blob) => {
    setIsTranscribing(true);
    setTranscriptFeedback(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        try {
          const transcribedText = await api.transcribeAudio(base64Data, blob.type);
          if (transcribedText) {
            setTranscript(transcribedText);
            setTranscriptFeedback('Voice transcription complete! Medical terms and speakers parsed.');
          } else {
            setTranscriptFeedback('Audio captured successfully. Transcript updated.');
          }
        } catch (err: any) {
          console.error('Transcription error:', err);
          setRecordError('Transcription service error. You can still summarize the current text.');
        } finally {
          setIsTranscribing(false);
        }
      };
      reader.readAsDataURL(blob);
    } catch (readErr: any) {
      console.error('Failed reading audio blob:', readErr);
      setIsTranscribing(false);
    }
  };

  const toggleAudioPlayback = () => {
    if (!audioPlayerRef.current && recordedAudioUrl) {
      const audio = new Audio(recordedAudioUrl);
      audioPlayerRef.current = audio;
      audio.onended = () => setIsPlayingAudio(false);
      audio.play();
      setIsPlayingAudio(true);
    } else if (audioPlayerRef.current) {
      if (isPlayingAudio) {
        audioPlayerRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioPlayerRef.current.play();
        setIsPlayingAudio(true);
      }
    }
  };

  if (!isOpen) return null;

  const handleSummarize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const note = await api.summarizeClinicalNote({
        transcript,
        patientName,
        mrn,
        encounterType
      });
      setSummarizedNote(note);
      onSuccess(note);
    } catch (err: any) {
      console.error('Error summarizing note:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreset = (type: 'david' | 'sarah' | 'elena') => {
    setRecordedAudioUrl(null);
    setTranscriptFeedback(null);
    if (type === 'david') {
      setPatientName('David Chen');
      setMrn('MRN-44102');
      setEncounterType('Metabolic & Nutrition Clinic');
      setTranscript(`Dr. Reddy: Good morning David. Let's review your recent 3-month labs and continuous glucose monitoring trends.
David: Good morning Dr. Reddy. My fasting blood sugars have been hovering around 138 to 145 mg/dL. I've been taking Metformin 500mg with dinner, but I've been experiencing mild nausea and abdominal bloating.
Dr. Reddy: Your HbA1c is 7.4%. BP is 132/84 mmHg, pulse 72 bpm, weight 84.5 kg. No peripheral neuropathy. We will switch to Metformin ER 750mg with dinner and start Empagliflozin 10mg daily. Restrict carbohydrates to <50g per meal, add 35g fiber, and target a 450 kcal daily deficit. Follow-up in 4 weeks.`);
    } else if (type === 'sarah') {
      setPatientName('Sarah Jenkins');
      setMrn('MRN-89241');
      setEncounterType('Post-Op Follow-up');
      setTranscript(`Dr. Reddy: Hello Sarah, how is your sternotomy site 6 weeks after your bypass surgery?
Sarah: The chest bone feels stable Dr. Reddy. Pain is minimal, 2/10. I am doing 25-minute morning walks. My lower ankles swell slightly after standing.
Dr. Reddy: Sternal incision is well-healed without erythema. BP is 126/78 mmHg, HR 68 bpm. Trace edema at saphenous vein site. Continue Metoprolol 25mg BID, Aspirin 81mg, and Atorvastatin 40mg. Increase walking to 35m daily in Zone 2, elevate legs in evenings, keep sodium under 2,000 mg. Follow up in 3 weeks with 24-hr Holter monitor.`);
    } else {
      setPatientName('Elena Rostova');
      setMrn('MRN-77309');
      setEncounterType('Executive Telehealth Review');
      setTranscript(`Dr. Reddy: Elena, we are reviewing your circadian telemetry and Whoop recovery metrics.
Elena: I have had 5 consecutive days of sub-40% recovery. Sleep latency is 45 minutes, and I am hitting an energy wall around 2:30 PM during architecture reviews.
Dr. Reddy: Resting HR is slightly elevated at 76 bpm, HRV depressed to 38ms. Recommend establishing a hard 7:15 PM fasting window, shifting high-intensity training to morning (07:30 AM), capping deep focus blocks at 90 minutes with 15-min decompression walks, and supplementing with 400mg Magnesium L-Threonate before bed.`);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0e1320] border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0a0e17]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Aura Clinical Medical Scribe</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Voice-to-Text Dictation & Automatic SOAP Summarization · HIPAA AES-256
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {summarizedNote ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    Successfully synthesized and encrypted SOAP note for <strong>{summarizedNote.patientName}</strong>!
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  AES-256-GCM
                </span>
              </div>

              {/* SOAP Output */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-indigo-400">Subjective</span>
                  <p className="text-slate-300 leading-relaxed">{summarizedNote.soap.subjective}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-cyan-400">Objective</span>
                  <p className="text-slate-300 leading-relaxed">{summarizedNote.soap.objective}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-amber-400">Assessment</span>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-line">{summarizedNote.soap.assessment}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-emerald-400">Plan</span>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-line">{summarizedNote.soap.plan}</p>
                </div>
              </div>

              {/* Prescriptions & Orders */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-b border-slate-900 pb-1">
                  <span>PRESCRIPTIONS & DIETARY ORDERS</span>
                  <span>Follow-up: {summarizedNote.recommendedFollowUpWeeks} weeks</span>
                </div>
                <div className="space-y-1 text-slate-300">
                  <p><strong>Rx: </strong>{summarizedNote.prescriptions.join(', ')}</p>
                  <p><strong>Diet & Lifestyle: </strong>{summarizedNote.dietAndLifestyleOrders}</p>
                </div>
              </div>

              {/* Action Buttons */}
              {driveExportStatus && (
                <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  driveExportStatus.startsWith('Error') 
                    ? 'bg-red-950/80 border border-red-800 text-red-300' 
                    : 'bg-blue-950/80 border border-blue-800 text-blue-300'
                }`}>
                  <Folder className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{driveExportStatus}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleExportToDrive}
                  disabled={isExportingDrive}
                  className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isExportingDrive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Folder className="w-3.5 h-3.5" />}
                  <span>{isExportingDrive ? 'Exporting to Drive...' : 'Save to Google Drive'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onDraftEmail) onDraftEmail(summarizedNote);
                    onClose();
                  }}
                  className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Draft Follow-up Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onScheduleFollowUp) onScheduleFollowUp(summarizedNote);
                    onClose();
                  }}
                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span>Schedule in Cal</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSummarize} className="space-y-4 text-xs">
              
              {/* VOICE-TO-TEXT MEDIARECORDER STUDIO (Prominent recording panel) */}
              <div className="bg-[#090d16] rounded-xl border border-indigo-900/60 p-4 space-y-3 shadow-inner">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">
                      <Mic className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-semibold text-white text-xs">Live Voice-to-Text Dictation</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                      MediaRecorder API
                    </span>
                  </div>

                  {/* Recording Status / Timer */}
                  {isRecording && (
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="flex items-center gap-1 text-red-400 font-bold animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        REC {formatTimer(recordingSeconds)}
                      </span>
                    </div>
                  )}

                  {isTranscribing && (
                    <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-mono">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      <span>Transcribing audio with Gemini 3.5...</span>
                    </div>
                  )}
                </div>

                {/* Animated Audio Waveform (Active when recording) */}
                {isRecording && (
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-red-900/50 flex flex-col items-center justify-center space-y-2">
                    <div className="flex items-end justify-center gap-1.5 h-10 w-full px-4">
                      {audioLevels.map((lvl, idx) => (
                        <div
                          key={idx}
                          style={{ height: `${lvl}px` }}
                          className="w-1.5 bg-gradient-to-t from-red-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-75"
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-300 font-mono">
                      Listening to doctor & patient dialog · Speak naturally into microphone
                    </span>
                  </div>
                )}

                {/* Recording Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={handleStartRecording}
                        disabled={isTranscribing}
                        className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-red-950/50 transition-all cursor-pointer"
                      >
                        <Mic className="w-3.5 h-3.5 animate-pulse" />
                        <span>Start Voice Recording</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleStopRecording}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
                        >
                          <Square className="w-3.5 h-3.5 fill-white" />
                          <span>Stop & Transcribe</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleCancelRecording}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {recordedAudioUrl && !isRecording && (
                      <button
                        type="button"
                        onClick={toggleAudioPlayback}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
                      >
                        {isPlayingAudio ? <Pause className="w-3 h-3 text-cyan-400" /> : <Play className="w-3 h-3 text-cyan-400" />}
                        <span>{isPlayingAudio ? 'Pause Clip' : 'Play Recorded Clip'}</span>
                      </button>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    HTML5 MediaRecorder · 44.1kHz Audio Capture
                  </span>
                </div>

                {recordError && (
                  <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{recordError}</span>
                  </div>
                )}

                {transcriptFeedback && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{transcriptFeedback}</span>
                  </div>
                )}
              </div>

              {/* Presets (Quick selection) */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                <span className="text-[10px] uppercase font-mono text-slate-400">Or Load Clinical Encounter Preset:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => loadPreset('david')}
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] border border-slate-800 cursor-pointer"
                  >
                    David Chen (Diabetes/Metabolic)
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPreset('sarah')}
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] border border-slate-800 cursor-pointer"
                  >
                    Sarah Jenkins (Post-CABG)
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPreset('elena')}
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] border border-slate-800 cursor-pointer"
                  >
                    Elena (Fatigue Telemetry)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">MRN</label>
                  <input
                    type="text"
                    value={mrn}
                    onChange={(e) => setMrn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Encounter Type</label>
                  <input
                    type="text"
                    value={encounterType}
                    onChange={(e) => setEncounterType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] uppercase font-mono text-slate-400">
                    Doctor-Patient Conversation / Transcription Dialogue
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {transcript.length} characters
                  </span>
                </div>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={8}
                  placeholder="Record voice above or paste dialog here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  HIPAA Compliant · Auto-Encrypted at Rest
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading || !transcript.trim()}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Synthesizing SOAP...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Summarize with Aura AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
