jest.mock('../src/config/db', () => ({
  patientProfile: { findUnique: jest.fn() },
  assessmentSession: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn()
  },
  riskReport: { update: jest.fn() }
}));

jest.mock('../src/middleware/patientAccess', () => ({
  canAccessPatient: jest.fn()
}));

const prisma = require('../src/config/db');
const { canAccessPatient } = require('../src/middleware/patientAccess');
const {
  createSession,
  updateSessionStatus
} = require('../src/controllers/sessionController');

const response = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis()
});

describe('session controller authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not allow a clinician to create a session for an unassigned patient', async () => {
    canAccessPatient.mockResolvedValue(false);
    const res = response();

    await createSession({
      user: { id: 'clinician-user', role: 'CLINICIAN' },
      body: { patientId: 'unassigned-patient' }
    }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(prisma.assessmentSession.create).not.toHaveBeenCalled();
  });

  it('binds patient-created sessions to the authenticated patient profile', async () => {
    prisma.patientProfile.findUnique.mockResolvedValue({ id: 'own-patient' });
    prisma.assessmentSession.create.mockResolvedValue({ id: 'new-session', patientId: 'own-patient' });
    const res = response();

    await createSession({
      user: { id: 'patient-user', role: 'PATIENT' },
      body: { patientId: 'own-patient', notes: 'Synthetic test session' }
    }, res);

    expect(prisma.assessmentSession.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        patientId: 'own-patient',
        clinicianId: null
      })
    }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('does not allow patients to change session status', async () => {
    const res = response();

    await updateSessionStatus({
      user: { id: 'patient-user', role: 'PATIENT' },
      params: { id: 'session-id' },
      body: { status: 'COMPLETED' }
    }, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(prisma.assessmentSession.findUnique).not.toHaveBeenCalled();
    expect(prisma.assessmentSession.update).not.toHaveBeenCalled();
  });

  it('does not allow clinicians to change an unassigned session', async () => {
    prisma.assessmentSession.findUnique.mockResolvedValue({ patientId: 'unassigned-patient' });
    canAccessPatient.mockResolvedValue(false);
    const res = response();

    await updateSessionStatus({
      user: { id: 'clinician-user', role: 'CLINICIAN' },
      params: { id: 'session-id' },
      body: { status: 'UNDER_REVIEW' }
    }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(prisma.assessmentSession.update).not.toHaveBeenCalled();
  });
});
