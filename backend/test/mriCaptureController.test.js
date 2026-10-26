const mockTransactionClient = {
  modalityData: { create: jest.fn() },
  assessmentSession: { update: jest.fn() }
};

jest.mock('../src/config/db', () => ({
  assessmentSession: { findUnique: jest.fn() },
  $transaction: jest.fn(async (callback) => callback(mockTransactionClient))
}));

jest.mock('../src/services/mlEngineService', () => ({
  assessFull: jest.fn()
}));

const prisma = require('../src/config/db');
const MLEngineService = require('../src/services/mlEngineService');
const { saveMriCapture } = require('../src/controllers/assessmentController');
const { gzipSync } = require('zlib');

const makeResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis()
});

const makeNiftiBuffer = () => {
  const buffer = Buffer.alloc(352);
  buffer.writeUInt32LE(348, 0);
  buffer.write('n+1\u0000', 344, 'ascii');
  return buffer;
};

describe('saveMriCapture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.assessmentSession.findUnique.mockResolvedValue({
      status: 'CREATED',
      modalityProvenanceJson: '{}'
    });
  });

  it('requires patient consent and discards the upload buffer', async () => {
    const buffer = makeNiftiBuffer();
    const req = {
      user: { id: 'patient-id', role: 'PATIENT' },
      body: { sessionId: 'session-id', consent: 'false' },
      file: { originalname: 'research.nii', buffer }
    };
    const res = makeResponse();

    await saveMriCapture(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(buffer.every((byte) => byte === 0)).toBe(true);
  });

  it('stores only capture metadata and never analyzes a supported scan', async () => {
    const buffer = makeNiftiBuffer();
    const req = {
      user: { id: 'patient-id', role: 'PATIENT' },
      body: { sessionId: 'session-id', consent: 'true' },
      file: { originalname: 'research.nii', buffer }
    };
    const res = makeResponse();

    await saveMriCapture(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      mriCapture: expect.objectContaining({
        fileType: 'application/nifti',
        rawMediaStored: false,
        analyzed: false,
        status: 'received_not_analyzed'
      })
    }));
    expect(mockTransactionClient.modalityData.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sessionId: 'session-id',
        modalityType: 'imaging',
        riskScore: null,
        source: 'collected',
        featureVectorJson: '{}'
      })
    });
    const persistedMetadata = JSON.parse(
      mockTransactionClient.modalityData.create.mock.calls[0][0].data.rawDataJson
    );
    expect(persistedMetadata).toEqual(expect.objectContaining({
      sizeBytes: 352,
      rawMediaStored: false,
      analyzed: false
    }));
    expect(persistedMetadata).not.toHaveProperty('filename');
    expect(persistedMetadata).not.toHaveProperty('patientId');
    expect(MLEngineService.assessFull).not.toHaveBeenCalled();
    expect(buffer.every((byte) => byte === 0)).toBe(true);
  });

  it('rejects an unsupported file and clears its memory buffer', async () => {
    const buffer = Buffer.from('not an MRI file');
    const req = {
      user: { id: 'patient-id', role: 'PATIENT' },
      body: { sessionId: 'session-id', consent: 'true' },
      file: { originalname: 'scan.txt', buffer }
    };
    const res = makeResponse();

    await saveMriCapture(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(buffer.every((byte) => byte === 0)).toBe(true);
  });

  it('validates the NIfTI header inside a compressed NIfTI file', async () => {
    const buffer = gzipSync(makeNiftiBuffer());
    const req = {
      user: { id: 'patient-id', role: 'PATIENT' },
      body: { sessionId: 'session-id', consent: 'true' },
      file: { originalname: 'research.nii.gz', buffer }
    };
    const res = makeResponse();

    await saveMriCapture(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      mriCapture: expect.objectContaining({ fileType: 'application/gzip' })
    }));
    expect(buffer.every((byte) => byte === 0)).toBe(true);
  });
});
