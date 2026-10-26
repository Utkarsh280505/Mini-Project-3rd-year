jest.mock('../src/config/db', () => ({
  assessmentSession: {
    findUnique: jest.fn(),
    update: jest.fn()
  },
  modalityData: {
    create: jest.fn()
  },
  riskReport: {
    upsert: jest.fn()
  }
}));

jest.mock('../src/services/mlEngineService', () => ({
  assessFull: jest.fn(),
  generateHeatmap: jest.fn(),
  analyzeBiomarker: jest.fn(),
  analyzeImaging: jest.fn()
}));

const prisma = require('../src/config/db');
const { saveSpeechCapture } = require('../src/controllers/assessmentController');

describe('saveSpeechCapture', () => {
  const sessionId = 'd9428888-122b-4f1a-9a5f-4e8f3f05a930';

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.assessmentSession.findUnique.mockResolvedValue({
      patient: { userId: 'patient-id' }
    });
    prisma.modalityData.create.mockResolvedValue({ id: 'capture-id' });
  });

  const createRequest = (overrides = {}) => ({
    user: { id: 'patient-id', role: 'PATIENT' },
    body: {
      sessionId,
      consent: 'true',
      durationSeconds: '4.5'
    },
    file: {
      buffer: Buffer.from('temporary audio payload'),
      mimetype: 'audio/webm;codecs=opus'
    },
    ...overrides
  });

  const createResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  });

  it('saves consent and capture metadata, never the audio bytes', async () => {
    const req = createRequest();
    const res = createResponse();

    await saveSpeechCapture(req, res);

    expect(prisma.modalityData.create).toHaveBeenCalledTimes(1);
    const savedData = prisma.modalityData.create.mock.calls[0][0].data;
    expect(savedData).toEqual(expect.objectContaining({
      sessionId,
      modalityType: 'speech',
      featureVectorJson: '{}',
      riskScore: null,
      source: 'collected'
    }));
    expect(JSON.parse(savedData.rawDataJson)).toEqual(expect.objectContaining({
      mimeType: 'audio/webm',
      sizeBytes: Buffer.byteLength('temporary audio payload'),
      durationSeconds: 4.5,
      consentTextVersion: 'speech-capture-v1',
      rawMediaStored: false
    }));
    expect(req.file.buffer.every((byte) => byte === 0)).toBe(true);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].speechCapture.status).toBe('collected_not_analyzed');
  });

  it('rejects speech capture without consent', async () => {
    const req = createRequest({
      body: { sessionId, consent: 'false', durationSeconds: '4.5' }
    });
    const res = createResponse();

    await saveSpeechCapture(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.modalityData.create).not.toHaveBeenCalled();
    expect(req.file.buffer.every((byte) => byte === 0)).toBe(true);
  });

  it('rejects attempts to submit a recording to another patient session', async () => {
    prisma.assessmentSession.findUnique.mockResolvedValue({
      patient: { userId: 'different-patient' }
    });
    const req = createRequest();
    const res = createResponse();

    await saveSpeechCapture(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(prisma.modalityData.create).not.toHaveBeenCalled();
    expect(req.file.buffer.every((byte) => byte === 0)).toBe(true);
  });
});
