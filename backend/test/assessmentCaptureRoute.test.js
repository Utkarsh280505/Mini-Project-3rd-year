let mockRole = 'PATIENT';

jest.mock('../src/middleware/authMiddleware', () => ({
  authenticateJWT: (req, res, next) => {
    req.user = { id: 'user-id', role: mockRole };
    next();
  },
  requireRole: (role) => (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
    next();
  }
}));

jest.mock('../src/middleware/patientAccess', () => ({
  authorizeSessionAccess: () => (req, res, next) => next()
}));

jest.mock('../src/controllers/assessmentController', () => ({
  saveMriCapture: jest.fn((req, res) => res.status(201).json({
    received: {
      mriBytes: req.file.buffer.length,
      filename: req.file.originalname,
      sessionId: req.body.sessionId,
      consent: req.body.consent
    }
  })),
  saveClinicalMeasurement: jest.fn((req, res) => res.status(201).json({ saved: true })),
  saveSpeechCapture: jest.fn((req, res) => res.status(201).json({
    received: {
      audioBytes: req.file.buffer.length,
      mimeType: req.file.mimetype,
      sessionId: req.body.sessionId,
      consent: req.body.consent,
      durationSeconds: req.body.durationSeconds
    }
  })),
  submitBiomarker: jest.fn(),
  submitImaging: jest.fn(),
  runFullAssessment: jest.fn()
}));

const express = require('express');
const request = require('supertest');
const { saveMriCapture, saveSpeechCapture } = require('../src/controllers/assessmentController');
const assessmentRoutes = require('../src/routes/assessmentRoutes');

const app = express();
app.use(express.json());
app.use('/api/assessments', assessmentRoutes);

describe('speech capture upload route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRole = 'PATIENT';
  });

  it('parses a consented research MRI upload for a patient session', async () => {
    const nifti = Buffer.alloc(352);
    nifti.writeUInt32LE(348, 0);
    nifti.write('n+1\u0000', 344, 'ascii');
    const response = await request(app)
      .post('/api/assessments/mri-capture')
      .field('sessionId', 'd9428888-122b-4f1a-9a5f-4e8f3f05a930')
      .field('consent', 'true')
      .attach('mri', nifti, { filename: 'research.nii', contentType: 'application/octet-stream' });

    expect(response.status).toBe(201);
    expect(response.body.received).toEqual({
      mriBytes: nifti.length,
      filename: 'research.nii',
      sessionId: 'd9428888-122b-4f1a-9a5f-4e8f3f05a930',
      consent: 'true'
    });
    expect(saveMriCapture).toHaveBeenCalledTimes(1);
  });

  it('blocks clinician accounts from using the patient MRI upload route', async () => {
    mockRole = 'CLINICIAN';
    const response = await request(app)
      .post('/api/assessments/mri-capture')
      .field('sessionId', 'd9428888-122b-4f1a-9a5f-4e8f3f05a930')
      .field('consent', 'true');

    expect(response.status).toBe(403);
    expect(saveMriCapture).not.toHaveBeenCalled();
  });

  it('parses the multipart audio and consent fields', async () => {
    const audio = Buffer.from('temporary recording');
    const response = await request(app)
      .post('/api/assessments/speech-capture')
      .field('sessionId', 'd9428888-122b-4f1a-9a5f-4e8f3f05a930')
      .field('consent', 'true')
      .field('durationSeconds', '2.5')
      .attach('audio', audio, { filename: 'speech.webm', contentType: 'audio/webm' });

    expect(response.status).toBe(201);
    expect(response.body.received).toEqual({
      audioBytes: audio.length,
      mimeType: 'audio/webm',
      sessionId: 'd9428888-122b-4f1a-9a5f-4e8f3f05a930',
      consent: 'true',
      durationSeconds: '2.5'
    });
    expect(saveSpeechCapture).toHaveBeenCalledTimes(1);
  });

  it('rejects files larger than the in-memory upload limit', async () => {
    const oversizedAudio = Buffer.alloc(10 * 1024 * 1024 + 1);
    const response = await request(app)
      .post('/api/assessments/speech-capture')
      .field('sessionId', 'd9428888-122b-4f1a-9a5f-4e8f3f05a930')
      .field('consent', 'true')
      .field('durationSeconds', '2.5')
      .attach('audio', oversizedAudio, { filename: 'speech.webm', contentType: 'audio/webm' });

    expect(response.status).toBe(413);
    expect(response.body.error).toBe('Speech recording upload failed');
    expect(saveSpeechCapture).not.toHaveBeenCalled();
  });

  it('blocks patient accounts from submitting clinician measurements', async () => {
    const response = await request(app)
      .post('/api/assessments/clinical-measurements')
      .send({
        sessionId: 'd9428888-122b-4f1a-9a5f-4e8f3f05a930',
        modality: 'motor',
        instrument: 'External gait sensor',
        record: { gait_speed: 1.1 }
      });

    expect(response.status).toBe(403);
    expect(response.body.error).toMatch(/insufficient privileges/i);
  });

  it('allows a clinician to submit a validated collection record', async () => {
    mockRole = 'CLINICIAN';
    const response = await request(app)
      .post('/api/assessments/clinical-measurements')
      .send({
        sessionId: 'd9428888-122b-4f1a-9a5f-4e8f3f05a930',
        modality: 'motor',
        instrument: 'External gait sensor',
        record: { gait_speed: 1.1 }
      });

    expect(response.status).toBe(201);
    expect(response.body.saved).toBe(true);
  });
});
