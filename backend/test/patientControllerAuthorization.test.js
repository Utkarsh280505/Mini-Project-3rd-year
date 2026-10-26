jest.mock('../src/config/db', () => ({
  patientProfile: {
    findMany: jest.fn(),
    findUnique: jest.fn()
  }
}));

jest.mock('../src/middleware/patientAccess', () => ({
  canAccessPatient: jest.fn(),
  getAccessiblePatientProfileIds: jest.fn()
}));

const prisma = require('../src/config/db');
const {
  canAccessPatient,
  getAccessiblePatientProfileIds
} = require('../src/middleware/patientAccess');
const {
  getAllPatients,
  getPatientById
} = require('../src/controllers/patientController');

const response = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis()
});

describe('patient controller authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('limits the clinician roster query to assigned patient profiles', async () => {
    getAccessiblePatientProfileIds.mockResolvedValue(['assigned-patient']);
    prisma.patientProfile.findMany.mockResolvedValue([]);
    const res = response();

    await getAllPatients({ user: { id: 'clinician-user', role: 'CLINICIAN' } }, res);

    expect(prisma.patientProfile.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: { in: ['assigned-patient'] } }
    }));
  });

  it('does not fetch a patient profile when the caller has no active access', async () => {
    canAccessPatient.mockResolvedValue(false);
    const res = response();

    await getPatientById({
      user: { id: 'clinician-user', role: 'CLINICIAN' },
      params: { id: 'unassigned-patient' }
    }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(prisma.patientProfile.findUnique).not.toHaveBeenCalled();
  });
});
