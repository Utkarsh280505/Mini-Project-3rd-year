jest.mock('../src/config/db', () => ({
  assessmentSession: {
    findUnique: jest.fn(),
    update: jest.fn()
  },
  $transaction: jest.fn(async (callback) => callback({
    assessmentSession: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    modalityData: {
      create: jest.fn()
    }
  })),
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
const MLEngineService = require('../src/services/mlEngineService');
const { runFullAssessment } = require('../src/controllers/assessmentController');

describe('runFullAssessment provenance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.assessmentSession.findUnique.mockResolvedValue({
      id: 'd9428888-122b-4f1a-9a5f-4e8f3f05a930',
      modalityData: []
    });
    prisma.assessmentSession.update.mockResolvedValue({});
  });

  it('does not send simulated input to ML and returns no score when none is measured', async () => {
    const body = {
      sessionId: 'd9428888-122b-4f1a-9a5f-4e8f3f05a930',
      speech: { jitter: 0.9 },
      modalitySources: {
        imaging: 'not_provided',
        speech: 'simulated',
        motor: 'not_provided',
        ocular: 'not_provided',
        cognitive: 'not_provided'
      }
    };
    const req = { body };
    const res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };

    await runFullAssessment(req, res);

    expect(MLEngineService.assessFull).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      sessionStatus: 'INSUFFICIENT_DATA',
      riskReport: null,
      modalitySources: body.modalitySources
    }));
    expect(prisma.assessmentSession.update).toHaveBeenCalledWith({
      where: { id: body.sessionId },
      data: {
        status: 'COMPLETED',
        modalityProvenanceJson: JSON.stringify(body.modalitySources)
      }
    });
  });

  it('sends only measured inputs and uses the returned clinical risk band', async () => {
    const body = {
      sessionId: 'd9428888-122b-4f1a-9a5f-4e8f3f05a930',
      speech: {
        jitter: 0.4,
        shimmer: 0.3,
        pause_ratio: 0.2,
        pitch_var: 0.5,
        speech_rate: 3.2
      },
      motor: { stride_var: 0.1 },
      modalitySources: {
        imaging: 'not_provided',
        speech: 'measured',
        motor: 'simulated',
        ocular: 'not_provided',
        cognitive: 'not_provided'
      }
    };
    MLEngineService.assessFull.mockResolvedValue({
      fused_risk_score: 0.42,
      confidence_interval: [0.3, 0.54],
      modality_scores: { speech: 0.42 },
      clinical_scale_mapping: {
        risk_band: 'moderate risk - monitor',
        mmse_estimate_range: [24, 26]
      }
    });
    prisma.riskReport.upsert.mockResolvedValue({ id: 'report-id' });
    const req = { body };
    const res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };

    await runFullAssessment(req, res);

    expect(MLEngineService.assessFull).toHaveBeenCalledWith({ speech: body.speech });
    expect(prisma.riskReport.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        riskBand: 'moderate risk - monitor',
        modalityScoresJson: JSON.stringify({ speech: 0.42 }),
        mmseEstimate: 25
      })
    }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      sessionStatus: 'UNDER_REVIEW',
      modalitySources: body.modalitySources
    }));
  });

  it('does not send collected speech media to the model and completes without a score', async () => {
    const body = {
      sessionId: 'd9428888-122b-4f1a-9a5f-4e8f3f05a930',
      modalitySources: {
        imaging: 'not_provided',
        speech: 'collected',
        motor: 'not_provided',
        ocular: 'not_provided',
        cognitive: 'not_provided'
      }
    };
    const req = { body };
    const res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    };

    await runFullAssessment(req, res);

    expect(MLEngineService.assessFull).not.toHaveBeenCalled();
    expect(prisma.riskReport.upsert).not.toHaveBeenCalled();
    expect(prisma.assessmentSession.update).toHaveBeenCalledWith({
      where: { id: body.sessionId },
      data: {
        status: 'COMPLETED',
        modalityProvenanceJson: JSON.stringify(body.modalitySources)
      }
    });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      sessionStatus: 'INSUFFICIENT_DATA',
      riskReport: null,
      modalitySources: body.modalitySources
    }));
  });
});
