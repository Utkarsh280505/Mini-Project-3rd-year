jest.mock('../src/config/db', () => ({
  assessmentSession: {
    findUnique: jest.fn(),
    update: jest.fn()
  },
  modalityData: {
    create: jest.fn()
  },
  $transaction: jest.fn()
}));

jest.mock('../src/services/mlEngineService', () => ({
  assessFull: jest.fn(),
  generateHeatmap: jest.fn(),
  analyzeBiomarker: jest.fn(),
  analyzeImaging: jest.fn()
}));

const prisma = require('../src/config/db');
const MLEngineService = require('../src/services/mlEngineService');
const { saveClinicalMeasurement } = require('../src/controllers/assessmentController');

describe('saveClinicalMeasurement', () => {
  const sessionId = 'd9428888-122b-4f1a-9a5f-4e8f3f05a930';
  const tx = {
    assessmentSession: { update: jest.fn() },
    modalityData: { create: jest.fn() }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.assessmentSession.findUnique.mockResolvedValue({
      id: sessionId,
      status: 'CREATED',
      modalityProvenanceJson: '{}'
    });
    prisma.$transaction.mockImplementation((callback) => callback(tx));
    tx.modalityData.create.mockResolvedValue({ id: 'measurement-id' });
    tx.assessmentSession.update.mockResolvedValue({});
  });

  const createResponse = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  });

  it('saves motor measurements as collected, updates provenance, and never calls ML', async () => {
    const req = {
      user: { id: 'clinician-id', role: 'CLINICIAN' },
      body: {
        sessionId,
        modality: 'motor',
        instrument: 'External gait sensor',
        record: { gait_speed: 1.1 }
      }
    };
    const res = createResponse();

    await saveClinicalMeasurement(req, res);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.modalityData.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sessionId,
        modalityType: 'motor',
        featureVectorJson: JSON.stringify({ gait_speed: 1.1 }),
        riskScore: null,
        source: 'collected'
      })
    });
    expect(JSON.parse(tx.modalityData.create.mock.calls[0][0].data.rawDataJson)).toEqual(expect.objectContaining({
      instrument: 'External gait sensor',
      enteredByUserId: 'clinician-id',
      values: { gait_speed: 1.1 }
    }));
    expect(tx.assessmentSession.update).toHaveBeenCalledWith({
      where: { id: sessionId },
      data: { status: 'CAPTURING', modalityProvenanceJson: JSON.stringify({ motor: 'collected' }) }
    });
    expect(MLEngineService.assessFull).not.toHaveBeenCalled();
    expect(MLEngineService.analyzeBiomarker).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('stores imaging report findings with units without storing or analyzing an image', async () => {
    const req = {
      user: { id: 'clinician-id', role: 'CLINICIAN' },
      body: {
        sessionId,
        modality: 'imaging',
        instrument: 'Radiology report',
        measurements: [{ label: 'Finding', value: 1.25, unit: 'mm' }]
      }
    };
    const res = createResponse();

    await saveClinicalMeasurement(req, res);

    const saved = tx.modalityData.create.mock.calls[0][0].data;
    expect(saved.modalityType).toBe('imaging');
    expect(saved.source).toBe('collected');
    expect(JSON.parse(saved.featureVectorJson)).toEqual({
      findings: [{ label: 'Finding', value: 1.25, unit: 'mm' }],
      unitsIncluded: true
    });
    expect(MLEngineService.analyzeImaging).not.toHaveBeenCalled();
    expect(MLEngineService.assessFull).not.toHaveBeenCalled();
  });

  it('returns not found when the requested session does not exist', async () => {
    prisma.assessmentSession.findUnique.mockResolvedValue(null);
    const req = {
      user: { id: 'clinician-id', role: 'CLINICIAN' },
      body: { sessionId, modality: 'motor', instrument: 'Sensor', record: { gait_speed: 1 } }
    };
    const res = createResponse();

    await saveClinicalMeasurement(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
