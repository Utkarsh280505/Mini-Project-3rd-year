jest.mock('../src/config/db', () => ({
  patientProfile: { findFirst: jest.fn() },
  careAssignment: { findFirst: jest.fn(), findMany: jest.fn() },
  assessmentSession: { findUnique: jest.fn() }
}));

const prisma = require('../src/config/db');
const {
  canAccessPatient,
  authorizeSessionAccess,
  getAccessiblePatientProfileIds
} = require('../src/middleware/patientAccess');

describe('patient access authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows a patient to access only their own profile', async () => {
    prisma.patientProfile.findFirst.mockResolvedValue({ id: 'own-profile' });

    await expect(canAccessPatient({ id: 'patient-user', role: 'PATIENT' }, 'own-profile')).resolves.toBe(true);
    expect(prisma.patientProfile.findFirst).toHaveBeenCalledWith({
      where: { id: 'own-profile', userId: 'patient-user' },
      select: { id: true }
    });

    prisma.patientProfile.findFirst.mockResolvedValue(null);
    await expect(canAccessPatient({ id: 'patient-user', role: 'PATIENT' }, 'other-profile')).resolves.toBe(false);
  });

  it('requires an active assignment, active clinic membership, and active patient affiliation for clinicians', async () => {
    prisma.careAssignment.findFirst.mockResolvedValue({ id: 'assignment-id' });

    await expect(canAccessPatient({ id: 'clinician-user', role: 'CLINICIAN' }, 'patient-profile')).resolves.toBe(true);
    expect(prisma.careAssignment.findFirst).toHaveBeenCalledWith({
      where: {
        patientProfileId: 'patient-profile',
        clinicianUserId: 'clinician-user',
        revokedAt: null,
        organization: {
          is: {
            isActive: true,
            memberships: {
              some: { userId: 'clinician-user', role: 'CLINICIAN', isActive: true }
            },
            patients: {
              some: { patientProfileId: 'patient-profile', isActive: true }
            }
          }
        }
      },
      select: { id: true }
    });

    prisma.careAssignment.findFirst.mockResolvedValue(null);
    await expect(canAccessPatient({ id: 'clinician-user', role: 'CLINICIAN' }, 'unassigned-profile')).resolves.toBe(false);
  });

  it('does not grant patient-record access to administrator accounts', async () => {
    await expect(canAccessPatient({ id: 'admin-user', role: 'ADMIN' }, 'patient-profile')).resolves.toBe(false);
    expect(prisma.patientProfile.findFirst).not.toHaveBeenCalled();
    expect(prisma.careAssignment.findFirst).not.toHaveBeenCalled();
  });

  it('fails closed when a caller requests another patient session', async () => {
    prisma.assessmentSession.findUnique.mockResolvedValue({ id: 'session-id', patientId: 'other-profile' });
    prisma.patientProfile.findFirst.mockResolvedValue(null);
    const req = { user: { id: 'patient-user', role: 'PATIENT' }, body: { sessionId: 'session-id' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    const next = jest.fn();

    await authorizeSessionAccess((request) => request.body.sessionId)(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  it('lists only clinician assignments whose patient remains affiliated with that organization', async () => {
    prisma.careAssignment.findMany.mockResolvedValue([
      {
        patientProfileId: 'active-patient',
        organization: { patients: [{ patientProfileId: 'active-patient' }] }
      },
      {
        patientProfileId: 'unaffiliated-patient',
        organization: { patients: [{ patientProfileId: 'different-patient' }] }
      },
      {
        patientProfileId: 'active-patient',
        organization: { patients: [{ patientProfileId: 'active-patient' }] }
      }
    ]);

    await expect(getAccessiblePatientProfileIds('clinician-user')).resolves.toEqual(['active-patient']);
  });
});
