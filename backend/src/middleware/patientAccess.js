const prisma = require('../config/db');

const canAccessPatient = async (user, patientProfileId) => {
  if (user.role === 'PATIENT') {
    const patient = await prisma.patientProfile.findFirst({
      where: { id: patientProfileId, userId: user.id },
      select: { id: true }
    });
    return Boolean(patient);
  }

  if (user.role !== 'CLINICIAN') {
    return false;
  }

  const assignment = await prisma.careAssignment.findFirst({
    where: {
      patientProfileId,
      clinicianUserId: user.id,
      revokedAt: null,
      organization: {
        is: {
          isActive: true,
          memberships: {
            some: { userId: user.id, role: 'CLINICIAN', isActive: true }
          },
          patients: {
            some: { patientProfileId, isActive: true }
          }
        }
      }
    },
    select: { id: true }
  });

  return Boolean(assignment);
};

const authorizeSessionAccess = (getSessionId) => async (req, res, next) => {
  const sessionId = getSessionId(req);
  if (typeof sessionId !== 'string' || !sessionId) {
    return res.status(400).json({ error: 'Assessment session ID is required' });
  }

  try {
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      select: { id: true, patientId: true }
    });
    if (!session || !(await canAccessPatient(req.user, session.patientId))) {
      return res.status(404).json({ error: 'Assessment session not found' });
    }

    req.patientProfileId = session.patientId;
    return next();
  } catch (error) {
    console.error('Assessment session access check failed:', error);
    return res.status(500).json({ error: 'Unable to verify assessment access' });
  }
};

const getAccessiblePatientProfileIds = async (clinicianUserId) => {
  const assignments = await prisma.careAssignment.findMany({
    where: {
      clinicianUserId,
      revokedAt: null,
      organization: {
        is: {
          isActive: true,
          memberships: {
            some: { userId: clinicianUserId, role: 'CLINICIAN', isActive: true }
          }
        }
      }
    },
    select: {
      patientProfileId: true,
      organization: {
        select: {
          patients: {
            where: { isActive: true },
            select: { patientProfileId: true }
          }
        }
      }
    }
  });

  return [...new Set(assignments
    .filter((assignment) => assignment.organization.patients
      .some((patient) => patient.patientProfileId === assignment.patientProfileId))
    .map((assignment) => assignment.patientProfileId))];
};

module.exports = {
  canAccessPatient,
  authorizeSessionAccess,
  getAccessiblePatientProfileIds
};
