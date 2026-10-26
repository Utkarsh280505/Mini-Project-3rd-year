import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/apiClient';
import confetti from 'canvas-confetti';
import { Mic, Activity, Eye, Brain, Upload, CheckCircle2, ChevronRight, AlertCircle, RefreshCw, Target, Zap, Download } from 'lucide-react';
import { exportClinicalReport } from '../services/reportExporter';

const cognitiveQuestionVariants = {
  q1: [
    'Without looking at a calendar, what year and month is it today?',
    'What month and day of the week is it today?',
    'What year and season is it now?'
  ],
  q2: [
    'Word-list recall practice: Apple, Table, Penny',
    'Word-list recall practice: River, Candle, Garden',
    'Word-list recall practice: Train, Lemon, Window'
  ],
  q3: [
    'Starting at 100, count backward by 7 for five steps.',
    'Starting at 50, count backward by 3 for five steps.',
    'Starting at 30, count backward by 2 for five steps.'
  ]
};

export default function PatientFlow() {
  const [step, setStep] = useState(1);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Assessment activity states
  const [ocularData, setOcularData] = useState({});
  const [cognitiveAnswers, setCognitiveAnswers] = useState({ q1: '', q2: '', q3: '' });
  const [cognitiveQuestionIndexes, setCognitiveQuestionIndexes] = useState({ q1: 0, q2: 0, q3: 0 });
  const [modalitySources, setModalitySources] = useState({
    imaging: 'not_provided',
    speech: 'not_provided',
    motor: 'not_provided',
    cognitive: 'not_provided',
    ocular: 'not_provided'
  });
  const [assessmentError, setAssessmentError] = useState('');
  const [speechConsent, setSpeechConsent] = useState(false);
  const [speechCaptureMetadata, setSpeechCaptureMetadata] = useState(null);
  const [speechCaptureError, setSpeechCaptureError] = useState('');
  const [savingSpeechCapture, setSavingSpeechCapture] = useState(false);
  const [selectedMriFile, setSelectedMriFile] = useState(null);
  const [mriUploadConsent, setMriUploadConsent] = useState(false);
  const [mriCaptureMetadata, setMriCaptureMetadata] = useState(null);
  const [mriCaptureError, setMriCaptureError] = useState('');
  const [savingMriCapture, setSavingMriCapture] = useState(false);

  // Results & Interaction states
  const [fusedResult, setFusedResult] = useState(null);
  const [recordingAudio, setRecordingAudio] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [tapTestActive, setTapTestActive] = useState(false);
  const [tapTestRemaining, setTapTestRemaining] = useState(10);
  const [trackingOcular, setTrackingOcular] = useState(false);
  const [ocularProgress, setOcularProgress] = useState(0);

  // File Upload States
  const [uploadedOcularFile, setUploadedOcularFile] = useState(null);

  // Canvas Refs
  const ocularCanvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingStartedAtRef = useRef(0);
  const recordingTimerRef = useRef(null);
  const recorderFailedRef = useRef(false);
  const tappingStartedAtRef = useRef(0);
  const tappingIntervalRef = useRef(null);

  async function initSession() {
    try {
      const res = await apiClient.post('/sessions', { notes: 'Multimodal Screening Assessment' });
      setSessionId(res.data.id);
    } catch (err) {
      console.error('Session init error:', err);
      setAssessmentError(err.response?.data?.error || 'Assessment session could not be created.');
    } finally {
      setLoading(false);
    }
  }

  // Initialize session on mount
  useEffect(() => {
    initSession();
  }, []);

  useEffect(() => () => {
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
    }
    if (tappingIntervalRef.current) {
      clearInterval(tappingIntervalRef.current);
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    if (!tapTestActive) return undefined;

    tappingIntervalRef.current = window.setInterval(() => {
      const elapsedMs = performance.now() - tappingStartedAtRef.current;
      const remainingSeconds = Math.max(0, Math.ceil((10000 - elapsedMs) / 1000));
      setTapTestRemaining(remainingSeconds);

      if (elapsedMs >= 10000) {
        clearInterval(tappingIntervalRef.current);
        setTapTestActive(false);
      }
    }, 100);

    return () => {
      if (tappingIntervalRef.current) {
        clearInterval(tappingIntervalRef.current);
      }
    };
  }, [tapTestActive]);

  // Trigger celebration confetti on assessment completion (Step 6)
  useEffect(() => {
    if (step === 6) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#6366f1', '#10b981', '#8b5cf6']
      });
    }
  }, [step]);

  // Ocular Smooth Pursuit & Eye Tracking Visualizer
  useEffect(() => {
    if (step !== 3 || !ocularCanvasRef.current) return;
    const canvas = ocularCanvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      // Grid background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Smooth pursuit target dot trajectory (infinity / Lissajous loop)
      const rx = width * 0.35;
      const ry = height * 0.28;
      const targetX = cx + Math.sin(angle) * rx;
      const targetY = cy + Math.sin(angle * 2) * ry * 0.5;

      // Simulated gaze point with saccadic latency & jitter
      const jitterAmount = trackingOcular ? 4 : 8;
      const gazeX = targetX + (Math.sin(angle * 5) * jitterAmount);
      const gazeY = targetY + (Math.cos(angle * 4) * jitterAmount);

      // Target Dot (Cyan)
      ctx.beginPath();
      ctx.arc(targetX, targetY, 12, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4';
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#06b6d4';
      ctx.fill();

      // Gaze Tracking Dot (Magenta / Emerald)
      ctx.beginPath();
      ctx.arc(gazeX, gazeY, 6, 0, Math.PI * 2);
      ctx.fillStyle = trackingOcular ? '#10b981' : '#f43f5e';
      ctx.shadowBlur = 12;
      ctx.shadowColor = ctx.fillStyle;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Saccadic latency line connecting target & gaze
      ctx.beginPath();
      ctx.moveTo(targetX, targetY);
      ctx.lineTo(gazeX, gazeY);
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      angle += trackingOcular ? 0.03 : 0.015;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [step, trackingOcular]);

  const stopSpeechCapture = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const startSpeechCapture = async () => {
    setSpeechCaptureError('');
    if (!speechConsent) {
      setSpeechCaptureError('Please provide consent before recording.');
      return;
    }
    if (!sessionId) {
      setSpeechCaptureError('The assessment session is not ready yet. Please try again.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setSpeechCaptureError('This browser does not support microphone recording.');
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const preferredType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus']
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = preferredType
        ? new MediaRecorder(stream, { mimeType: preferredType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorderFailedRef.current = false;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        recorderFailedRef.current = true;
        setSpeechCaptureError('The microphone recording failed. Please try again.');
        if (recorder.state === 'recording') recorder.stop();
      };
      recorder.onstop = async () => {
        audioStreamRef.current?.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
        setRecordingAudio(false);
        if (recordingTimerRef.current) {
          clearTimeout(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        if (recorderFailedRef.current) {
          audioChunksRef.current = [];
          return;
        }

        const mimeType = recorder.mimeType || 'audio/webm';
        const recording = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        const durationSeconds = Number(((performance.now() - recordingStartedAtRef.current) / 1000).toFixed(2));
        if (recording.size === 0 || durationSeconds < 1) {
          setSpeechCaptureError('Record at least one second of audio before saving.');
          return;
        }

        const formData = new FormData();
        formData.append('audio', recording, `speech-capture.${mimeType.split('/')[1].split(';')[0]}`);
        formData.append('sessionId', sessionId);
        formData.append('durationSeconds', String(durationSeconds));
        formData.append('consent', 'true');

        setSavingSpeechCapture(true);
        try {
          const response = await apiClient.post('/assessments/speech-capture', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setSpeechCaptureMetadata(response.data.speechCapture);
          setModalitySources((sources) => ({ ...sources, speech: 'collected' }));
        } catch (error) {
          console.error('Speech capture submission failed:', error);
          setSpeechCaptureError(error.response?.data?.error || 'Speech capture could not be saved.');
        } finally {
          setSavingSpeechCapture(false);
        }
      };

      recorder.start();
      recordingStartedAtRef.current = performance.now();
      setRecordingAudio(true);
      recordingTimerRef.current = window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 30000);
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
      setRecordingAudio(false);
      setSpeechCaptureError(error.message || 'Microphone access failed. Check your browser permissions and try again.');
    }
  };

  const startTappingTest = () => {
    setTapCount(0);
    setTapTestRemaining(10);
    tappingStartedAtRef.current = performance.now();
    setTapTestActive(true);
  };

  const handleTapTest = () => {
    if (!tapTestActive) return;
    setTapCount((count) => count + 1);
  };

  // Interactive Ocular Eye Tracking Saccade Test
  const runOcularTrackingTask = () => {
    setTrackingOcular(true);
    setOcularProgress(0);

    let prog = 0;
    const interval = setInterval(() => {
      prog += 10;
      setOcularProgress(prog);
      if (prog >= 100) {
        clearInterval(interval);
        setTrackingOcular(false);

        setOcularData({
          saccade_velocity: 365,
          fixation_duration_ms: 195,
          gaze_deviation: 0.65,
          blink_rate: 14
        });
        setModalitySources((sources) => ({ ...sources, ocular: 'simulated' }));
      }
    }, 300);
  };

  const handleOcularFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedOcularFile(file.name);
    setModalitySources((sources) => ({ ...sources, ocular: 'simulated' }));
    setOcularData({
      saccade_velocity: Math.round(Math.random() * 120 + 260),
      fixation_duration_ms: Math.round(Math.random() * 90 + 170),
      gaze_deviation: parseFloat((Math.random() * 1.2 + 0.4).toFixed(2)),
      blink_rate: Math.round(Math.random() * 10 + 12)
    });
  };

  const handleCognitiveAnswerChange = (question, answer) => {
    setCognitiveAnswers((answers) => ({ ...answers, [question]: answer }));
    setModalitySources((sources) => ({ ...sources, cognitive: 'simulated' }));
  };

  const refreshCognitiveQuestion = (question) => {
    setCognitiveQuestionIndexes((indexes) => ({
      ...indexes,
      [question]: (indexes[question] + 1) % cognitiveQuestionVariants[question].length
    }));
    setCognitiveAnswers((answers) => ({ ...answers, [question]: '' }));
    const hasOtherAnswers = Object.entries(cognitiveAnswers)
      .some(([key, answer]) => key !== question && answer !== '');
    setModalitySources((sources) => ({
      ...sources,
      cognitive: hasOtherAnswers ? 'simulated' : 'not_provided'
    }));
  };

  const handleMriFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setMriCaptureError('');
    setMriCaptureMetadata(null);
    if (!file) {
      setSelectedMriFile(null);
      return;
    }

    const filename = file.name.toLowerCase();
    const supportedFormat = filename.endsWith('.dcm')
      || filename.endsWith('.nii')
      || filename.endsWith('.nii.gz');
    if (!supportedFormat) {
      setSelectedMriFile(null);
      setMriCaptureError('Choose one DICOM (.dcm) or NIfTI (.nii or .nii.gz) file.');
      event.target.value = '';
      return;
    }
    if (file.size === 0 || file.size > 64 * 1024 * 1024) {
      setSelectedMriFile(null);
      setMriCaptureError('The scan must be non-empty and no larger than 64 MB.');
      event.target.value = '';
      return;
    }
    setSelectedMriFile(file);
  };

  const uploadMriCapture = async () => {
    setMriCaptureError('');
    if (!mriUploadConsent) {
      setMriCaptureError('Consent is required before uploading a research scan.');
      return;
    }
    if (!selectedMriFile || !sessionId) {
      setMriCaptureError('Choose a supported scan and wait for the assessment session to be ready.');
      return;
    }

    const formData = new FormData();
    formData.append('mri', selectedMriFile);
    formData.append('sessionId', sessionId);
    formData.append('consent', 'true');
    setSavingMriCapture(true);
    try {
      const response = await apiClient.post('/assessments/mri-capture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMriCaptureMetadata(response.data.mriCapture);
      setModalitySources((sources) => ({ ...sources, imaging: 'collected' }));
      setSelectedMriFile(null);
    } catch (error) {
      console.error('MRI capture submission failed:', error);
      setMriCaptureError(error.response?.data?.error || 'MRI capture could not be received.');
    } finally {
      setSavingMriCapture(false);
    }
  };

  const submitBiomarkersAndAnalyze = async () => {
    setLoading(true);
    setAssessmentError('');
    try {
      if (sessionId) {
        const fullRes = await apiClient.post('/assessments/full', {
          sessionId,
          modalitySources
        });

        setFusedResult({
          ...(fullRes.data.riskReport || {}),
          assessmentStatus: fullRes.data.sessionStatus,
          modalitySources: fullRes.data.modalitySources,
          notice: fullRes.data.notice
        });
        setStep(6);
      } else {
        throw new Error('Assessment session is not ready. Please try again.');
      }
    } catch (err) {
      console.error('Submission failed:', err);
      setAssessmentError(err.response?.data?.error || err.message || 'Assessment could not be submitted.');
    } finally {
      setLoading(false);
    }
  };

  const hasRiskScore = Number.isFinite(fusedResult?.fusedRiskScore);

  return (
    <div style={{ maxWidth: '880px', margin: '36px auto', padding: '0 20px', position: 'relative', zIndex: 1 }}>
      {(Object.values(modalitySources).includes('simulated') || speechCaptureMetadata) && (
        <div role="status" style={{
          padding: '14px 18px',
          marginBottom: '20px',
          borderRadius: '12px',
          border: '1px solid rgba(251, 191, 36, 0.4)',
          background: 'rgba(120, 53, 15, 0.25)',
          color: '#fde68a',
          fontSize: '0.88rem',
          lineHeight: 1.5
        }}>
          Demo tasks are excluded from scoring. Speech recordings are saved only as capture metadata; the audio is discarded and is not analyzed.
        </div>
      )}
      {assessmentError && (
        <div role="alert" style={{ padding: '12px 16px', marginBottom: '20px', color: '#fda4af', background: 'rgba(127, 29, 29, 0.3)', borderRadius: '12px' }}>
          {assessmentError}
        </div>
      )}
      <div aria-label="Assessment input status" style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        marginBottom: '20px',
        color: '#cbd5e1',
        fontSize: '0.8rem'
      }}>
        {Object.entries(modalitySources).map(([modality, source]) => (
          <span key={modality} style={{
            padding: '5px 9px',
            borderRadius: '999px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: source === 'simulated' ? 'rgba(120, 53, 15, 0.3)' : source === 'collected' ? 'rgba(8, 145, 178, 0.22)' : 'rgba(15, 23, 42, 0.7)'
          }}>
            {modality}: {source.replace('_', ' ')}
          </span>
        ))}
      </div>
      {/* Step Progress Tracker */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        {[
          { title: 'Speech', icon: Mic },
          { title: 'Gait & Motor', icon: Activity },
          { title: 'Ocular Tracking', icon: Eye },
          { title: 'Cognitive Quiz', icon: Brain },
          { title: 'MRI Scan', icon: Upload },
          { title: 'Risk Insights', icon: CheckCircle2 }
        ].map((s, idx) => {
          const Icon = s.icon;
          const isActive = step === idx + 1;
          const isDone = step > idx + 1;
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: isActive || isDone ? 1 : 0.45 }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isDone ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : isActive ? 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)' : 'rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.8rem',
                boxShadow: isActive ? '0 0 18px rgba(6, 182, 212, 0.5)' : 'none',
                border: isActive ? '1px solid rgba(255,255,255,0.4)' : 'none'
              }}>
                <Icon size={16} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isActive ? '#f8fafc' : '#94a3b8' }}>
                {s.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* STEP 1: SPEECH BIOMARKER */}
      {step === 1 && (
        <div className="glass-panel" style={{ padding: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Mic size={26} color="#06b6d4" />
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>Speech Recording</h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px' }}>
            If you choose, read this phrase aloud: <em>"The quick brown fox jumps over the lazy dog."</em> This prototype records audio but does not transcribe it or calculate speech biomarkers.
          </p>

          <div style={{
            background: 'radial-gradient(circle at 50% 50%, #0f172a 0%, #030712 100%)',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            marginBottom: '28px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <p style={{ color: '#cbd5e1', lineHeight: 1.6, marginBottom: '18px' }}>
              With your consent, the recording is sent to the backend temporarily and discarded after capture metadata is saved. The database stores the recording format, duration, file size, and consent time only. The recording is not analyzed and no score is produced.
            </p>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', textAlign: 'left', color: '#e2e8f0', marginBottom: '18px' }}>
              <input
                type="checkbox"
                checked={speechConsent}
                onChange={(event) => setSpeechConsent(event.target.checked)}
                disabled={recordingAudio || savingSpeechCapture}
              />
              <span>I consent to record and temporarily upload my speech for this assessment session. I understand the audio is not retained or analyzed.</span>
            </label>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={recordingAudio ? stopSpeechCapture : startSpeechCapture}
                disabled={!recordingAudio && (!speechConsent || !sessionId || savingSpeechCapture)}
                className="btn-primary"
                style={{ background: recordingAudio ? '#f43f5e' : undefined }}
              >
                {recordingAudio ? 'Stop and save recording' : savingSpeechCapture ? 'Saving capture metadata...' : 'Record speech (max 30 seconds)'}
              </button>
            </div>
          </div>

          {speechCaptureError && (
            <div role="alert" style={{ color: '#fda4af', marginBottom: '16px' }}>{speechCaptureError}</div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
            <div className="stat-card">
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Capture status</span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>{speechCaptureMetadata ? 'Saved' : 'Not recorded'}</div>
            </div>
            <div className="stat-card">
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Duration</span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>{speechCaptureMetadata ? `${speechCaptureMetadata.durationSeconds}s` : '—'}</div>
            </div>
            <div className="stat-card">
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Audio retained</span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>{speechCaptureMetadata ? 'No' : '—'}</div>
            </div>
            <div className="stat-card">
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Speech analysis</span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>Disabled</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setStep(2)} className="btn-primary">
              Next: Gait & Motor Capture <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: GAIT & MOTOR BIOMARKER */}
      {step === 2 && (
        <div className="glass-panel" style={{ padding: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Activity size={26} color="#a855f7" />
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>Guided Finger-Tapping Activity</h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px' }}>
            This optional activity demonstrates a simple movement task. It is not a standardized clinical test, does not measure tremor or gait, and is not used to calculate a health score.
          </p>

          <div style={{ marginBottom: '24px' }}>
            <section style={{ background: 'rgba(15,23,42,0.6)', padding: '20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px', color: '#e9d5ff' }}>Finger tapping · 10 seconds</h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '12px' }}>
                <strong>Use:</strong> A brief coordination activity. This page counts button taps only; it does not assess tremor, dexterity, or diagnose a condition.
              </p>
              <ol style={{ color: '#cbd5e1', fontSize: '0.86rem', lineHeight: 1.7, paddingLeft: '20px', marginBottom: '16px' }}>
                <li>Sit comfortably and rest your forearm on a table if helpful.</li>
                <li>When ready, press Start, then tap the large button as quickly and comfortably as you can until the 10-second timer ends.</li>
                <li>Stop if you feel pain or discomfort. You may skip this activity.</li>
              </ol>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
                {!tapTestActive && tapTestRemaining === 10 && tapCount === 0 && (
                  <button onClick={startTappingTest} className="btn-primary" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' }}>
                    Start 10-second tapping
                  </button>
                )}
                {(tapTestActive || tapTestRemaining < 10) && (
                  <button
                    onClick={handleTapTest}
                    disabled={!tapTestActive}
                    className="btn-primary"
                    style={{ minWidth: '210px', minHeight: '64px', background: tapTestActive ? 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' : '#334155' }}
                  >
                    {tapTestActive ? `Tap here · ${tapTestRemaining}s left` : 'Tapping activity complete'}
                  </button>
                )}
                <span role="status" aria-live="polite" style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                  {tapTestActive ? `${tapCount} taps so far` : tapTestRemaining < 10 ? `${tapCount} taps counted` : 'Not started'}
                </span>
              </div>
            </section>
          </div>

          <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '28px' }}>
            Counts and elapsed time are shown in this browser only; they are not saved, sent for analysis, or used to produce a score. Device responsiveness and manual timing can affect the displayed results.
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(1)} className="btn-secondary">
              Back
            </button>
            <button onClick={() => setStep(3)} className="btn-primary">
              Next: Ocular Tracking <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: OCULAR OCULOMOTOR TRACKING BIOMARKER */}
      {step === 3 && (
        <div className="glass-panel" style={{ padding: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Eye size={26} color="#06b6d4" />
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>Oculomotor & Saccadic Eye-Tracking</h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px' }}>
            Follow the moving cyan target. This is a visual demo only; no camera-based eye tracking is performed and the displayed values are simulated.
          </p>

          <div style={{
            background: 'radial-gradient(circle at 50% 50%, #0f172a 0%, #030712 100%)',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center',
            marginBottom: '28px',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            position: 'relative'
          }}>
            <canvas ref={ocularCanvasRef} width={540} height={160} style={{ width: '100%', height: '160px', borderRadius: '12px' }} />

            {trackingOcular && (
              <div style={{ position: 'absolute', top: '12px', right: '16px', background: 'rgba(6, 182, 212, 0.2)', color: '#38bdf8', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>
                Tracking: {ocularProgress}%
              </div>
            )}

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={runOcularTrackingTask}
                disabled={trackingOcular}
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)' }}
              >
                <Target size={16} /> {trackingOcular ? 'Running 4s Smooth Pursuit Task...' : 'Start Ocular Saccade Test (4s)'}
              </button>
              <label className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={16} /> {uploadedOcularFile ? `Uploaded: ${uploadedOcularFile}` : 'Upload Gaze Log (.csv, .json)'}
                <input type="file" accept=".csv,.json,.txt" style={{ display: 'none' }} onChange={handleOcularFileUpload} />
              </label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
            <div className="stat-card">
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Saccade Velocity</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: ocularData.saccade_velocity < 250 ? '#f43f5e' : '#38bdf8' }}>{ocularData.saccade_velocity !== undefined ? `${ocularData.saccade_velocity} deg/s` : 'Not provided'}</div>
            </div>
            <div className="stat-card">
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Fixation Duration</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>{ocularData.fixation_duration_ms !== undefined ? `${ocularData.fixation_duration_ms} ms` : 'Not provided'}</div>
            </div>
            <div className="stat-card">
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Gaze Deviation</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: ocularData.gaze_deviation > 1.5 ? '#f43f5e' : '#38bdf8' }}>{ocularData.gaze_deviation !== undefined ? `${ocularData.gaze_deviation}°` : 'Not provided'}</div>
            </div>
            <div className="stat-card">
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Blink Frequency</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>{ocularData.blink_rate !== undefined ? `${ocularData.blink_rate} /min` : 'Not provided'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(2)} className="btn-secondary">
              Back
            </button>
            <button onClick={() => setStep(4)} className="btn-primary">
              Next: Cognitive Quiz <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: COGNITIVE ASSESSMENT */}
      {step === 4 && (
        <div className="glass-panel" style={{ padding: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Brain size={26} color="#10b981" />
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>Cognitive Demo Questions</h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px' }}>
            These custom questions are not validated MMSE/MoCA items. Any derived cognitive values are simulated and excluded from scoring. You may skip questions.
          </p>
          <p style={{ color: '#94a3b8', fontSize: '0.84rem', marginBottom: '20px' }}>
            Use <strong>New question</strong> to show another practice prompt in the same section. Your answer for that section will be cleared; other answers stay unchanged.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '28px' }}>
            <div style={{ background: 'rgba(15,23,42,0.6)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <label htmlFor="cognitive-q1" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                  1. {cognitiveQuestionVariants.q1[cognitiveQuestionIndexes.q1]}
                </label>
                <button type="button" onClick={() => refreshCognitiveQuestion('q1')} className="btn-secondary" aria-label="Show a new orientation question">
                  <RefreshCw size={14} /> New question
                </button>
              </div>
              <select
                id="cognitive-q1"
                value={cognitiveAnswers.q1}
                onChange={(e) => handleCognitiveAnswerChange('q1', e.target.value)}
                style={{ width: '100%', background: '#030712', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '12px', borderRadius: '10px' }}
              >
                <option value="">Select an answer</option>
                <option value="3">Both parts correct</option>
                <option value="1">One part correct</option>
                <option value="0">Not sure</option>
              </select>
            </div>

            <div style={{ background: 'rgba(15,23,42,0.6)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <label htmlFor="cognitive-q2" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                  2. {cognitiveQuestionVariants.q2[cognitiveQuestionIndexes.q2]}
                </label>
                <button type="button" onClick={() => refreshCognitiveQuestion('q2')} className="btn-secondary" aria-label="Show a new word recall question">
                  <RefreshCw size={14} /> New question
                </button>
              </div>
              <select
                id="cognitive-q2"
                value={cognitiveAnswers.q2}
                onChange={(e) => handleCognitiveAnswerChange('q2', e.target.value)}
                style={{ width: '100%', background: '#030712', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '12px', borderRadius: '10px' }}
              >
                <option value="">Select an answer</option>
                <option value="3">I recalled all 3 words</option>
                <option value="2">I recalled 2 words</option>
                <option value="0">I could not recall the words</option>
              </select>
            </div>

            <div style={{ background: 'rgba(15,23,42,0.6)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <label htmlFor="cognitive-q3" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                  3. {cognitiveQuestionVariants.q3[cognitiveQuestionIndexes.q3]}
                </label>
                <button type="button" onClick={() => refreshCognitiveQuestion('q3')} className="btn-secondary" aria-label="Show a new attention question">
                  <RefreshCw size={14} /> New question
                </button>
              </div>
              <select
                id="cognitive-q3"
                value={cognitiveAnswers.q3}
                onChange={(e) => handleCognitiveAnswerChange('q3', e.target.value)}
                style={{ width: '100%', background: '#030712', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '12px', borderRadius: '10px' }}
              >
                <option value="">Select an answer</option>
                <option value="4">All 5 steps correct</option>
                <option value="2">2–4 steps correct</option>
                <option value="0">Could not complete the sequence</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(3)} className="btn-secondary">
              Back
            </button>
            <button
              onClick={() => setStep(5)}
              className="btn-primary"
            >
              Next: MRI Scan Upload <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: MRI SCAN UPLOAD */}
      {step === 5 && (
        <div className="glass-panel" style={{ padding: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Upload size={26} color="#f43f5e" />
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>Optional MRI Scan</h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px' }}>
            You may skip this step and continue with the other assessment inputs. An uploaded scan is received for research capture only: it is not interpreted, analyzed, or used to generate a score.
          </p>

          <div style={{
            border: '2px dashed rgba(6, 182, 212, 0.3)',
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            marginBottom: '28px',
            background: 'rgba(3, 7, 18, 0.5)'
          }}>
            <Upload size={44} color="#06b6d4" style={{ margin: '0 auto 14px' }} />
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
              Choose one research scan file
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px', marginBottom: '24px' }}>
              Supported: one DICOM (.dcm) or NIfTI (.nii, .nii.gz) file, up to 64 MB. A multi-file DICOM series is not supported.
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
              <input
                type="file"
                accept=".dcm,.nii,.nii.gz,application/dicom,application/gzip"
                onChange={handleMriFileChange}
                disabled={savingMriCapture || Boolean(mriCaptureMetadata)}
                aria-label="Choose a DICOM or NIfTI MRI file"
              />
            </div>
            {selectedMriFile && (
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '16px' }}>
                Selected: {selectedMriFile.name} ({(selectedMriFile.size / (1024 * 1024)).toFixed(1)} MB)
              </p>
            )}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', textAlign: 'left', color: '#e2e8f0', margin: '0 auto 18px', maxWidth: '680px', fontSize: '0.84rem', lineHeight: 1.5 }}>
              <input
                type="checkbox"
                checked={mriUploadConsent}
                onChange={(event) => setMriUploadConsent(event.target.checked)}
                disabled={savingMriCapture || Boolean(mriCaptureMetadata)}
              />
              <span>I consent to temporarily upload a de-identified scan for this research prototype. I understand the raw file is not retained or analyzed, only capture metadata is saved, and no score is produced from the scan. I will not upload identifiable patient data.</span>
            </label>
            <button
              type="button"
              onClick={uploadMriCapture}
              disabled={!selectedMriFile || !mriUploadConsent || !sessionId || savingMriCapture || Boolean(mriCaptureMetadata)}
              className="btn-primary"
            >
              {savingMriCapture ? 'Receiving scan...' : mriCaptureMetadata ? 'Scan received — not analyzed' : 'Upload research scan'}
            </button>
          </div>

          {mriCaptureError && (
            <div role="alert" style={{ color: '#fda4af', marginBottom: '16px' }}>{mriCaptureError}</div>
          )}
          {mriCaptureMetadata && (
            <div role="status" style={{ color: '#a5f3fc', marginBottom: '16px' }}>
              Scan file received. The raw file was discarded; only its format, size, and consent timestamp were saved. It was not analyzed or scored.
            </div>
          )}
          <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: '24px' }}>
            MRI is optional. If omitted, the assessment continues. A score can only be generated from supported measured inputs; the guided patient activities in this prototype are demonstrations and are excluded, so this patient flow does not currently generate a score.
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setStep(4)} className="btn-secondary">
              Back
            </button>
            <button onClick={submitBiomarkersAndAnalyze} disabled={loading} className="btn-primary" style={{ background: '#10b981' }}>
              {loading ? 'Checking measured inputs...' : 'Finish Assessment'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: RESULTS SUMMARY */}
      {step === 6 && fusedResult && (
        <div className="glass-panel" style={{ padding: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: hasRiskScore
                ? fusedResult.fusedRiskScore > 0.6 ? 'rgba(244, 63, 94, 0.18)' : 'rgba(16, 185, 129, 0.18)'
                : 'rgba(251, 191, 36, 0.12)',
              border: `2px solid ${hasRiskScore ? fusedResult.fusedRiskScore > 0.6 ? '#f43f5e' : '#10b981' : '#fbbf24'}`,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: hasRiskScore
                ? `0 0 30px ${fusedResult.fusedRiskScore > 0.6 ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
                : '0 0 30px rgba(251, 191, 36, 0.2)'
            }}>
              <span style={{ fontSize: hasRiskScore ? '2rem' : '1rem', fontWeight: 800, color: hasRiskScore ? fusedResult.fusedRiskScore > 0.6 ? '#f87171' : '#34d399' : '#fbbf24', fontFamily: 'Orbitron, sans-serif' }}>
                {hasRiskScore ? `${(fusedResult.fusedRiskScore * 100).toFixed(0)}%` : 'NO SCORE'}
              </span>
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{hasRiskScore ? 'Assessment Complete' : 'Assessment Data Review'}</h2>
            {hasRiskScore && (
              <div style={{ marginTop: '8px' }}>
                <span className={`badge ${fusedResult.fusedRiskScore > 0.6 ? 'badge-high' : fusedResult.fusedRiskScore > 0.3 ? 'badge-moderate' : 'badge-low'}`} style={{ fontSize: '0.9rem', padding: '6px 18px' }}>
                  {fusedResult.riskBand}
                </span>
              </div>
            )}
          </div>

          {hasRiskScore ? (
            <div style={{
              background: fusedResult.fusedRiskScore > 0.6 ? 'rgba(127, 29, 29, 0.25)' : 'rgba(15, 23, 42, 0.6)',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#cbd5e1', marginBottom: '8px' }}>Screening indicator</div>
              <strong style={{ fontSize: '2rem', color: '#f8fafc' }}>{(fusedResult.fusedRiskScore * 100).toFixed(0)}%</strong>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '8px' }}>
                Confidence interval: {(fusedResult.confidenceIntervalLow * 100).toFixed(0)}% - {(fusedResult.confidenceIntervalHigh * 100).toFixed(0)}%
              </div>
            </div>
          ) : (
            <div role="status" style={{
              background: 'rgba(120, 53, 15, 0.25)',
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              marginBottom: '24px',
              color: '#fde68a',
              lineHeight: 1.6
            }}>
              {fusedResult.notice || 'No risk score was generated because this assessment contains no measured modality data. Simulated and missing inputs are excluded.'}
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>Input provenance</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
              {Object.entries(fusedResult.modalitySources || modalitySources).map(([modality, source]) => (
                <div key={modality} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ textTransform: 'capitalize', color: '#cbd5e1', marginBottom: '4px' }}>{modality}</div>
                  <div style={{ color: source === 'simulated' ? '#fbbf24' : source === 'measured' ? '#34d399' : source === 'collected' ? '#67e8f9' : '#94a3b8', fontWeight: 700 }}>{source.replace('_', ' ')}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '32px'
          }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={20} color="#06b6d4" />
              Patient Guidance & Recommendations
            </h4>
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.6' }}>
              {hasRiskScore
                ? 'This prototype screening indicator is not a diagnosis. Please discuss it with your clinician before making health decisions.'
                : 'This demo does not provide a diagnosis or meaningful risk estimate. No score is shown until measured, supported input data is available.'}
            </p>
          </div>

          <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button
              onClick={() => {
                setModalitySources({
                  imaging: 'not_provided',
                  speech: 'not_provided',
                  motor: 'not_provided',
                  cognitive: 'not_provided',
                  ocular: 'not_provided'
                });
                setTapTestActive(false);
                setTapTestRemaining(10);
                setSelectedMriFile(null);
                setMriUploadConsent(false);
                setMriCaptureMetadata(null);
                setMriCaptureError('');
                setOcularData({});
                setCognitiveAnswers({ q1: '', q2: '', q3: '' });
                setCognitiveQuestionIndexes({ q1: 0, q2: 0, q3: 0 });
                setUploadedOcularFile(null);
                setSpeechConsent(false);
                setSpeechCaptureMetadata(null);
                setSpeechCaptureError('');
                setTapCount(0);
                setFusedResult(null);
                setAssessmentError('');
                setLoading(true);
                setSessionId(null);
                initSession();
                setStep(1);
              }}
              className="btn-secondary"
            >
              <RefreshCw size={16} /> Run New Assessment
            </button>
            <button
              onClick={() => exportClinicalReport({
                patientName: 'Jane Doe',
                patientAge: 68,
                patientGender: 'Female',
                sessionDate: new Date().toLocaleDateString(),
                riskReport: fusedResult
              })}
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)' }}
            >
              <Download size={16} /> Export Assessment Summary
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
