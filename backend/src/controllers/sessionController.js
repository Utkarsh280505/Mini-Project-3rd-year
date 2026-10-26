const prisma = require('../config/db');
const { canAccessPatient } = require('../middleware/patientAccess');

// Valid state machine transitions per synopsis
const VALID_STATUSES = ['CREATED', 'CAPTURING', 'PROCESSING', 'FUSED', 'UNDER_REVIEW', 'COMPLETED'];

const createSession = async (req, res) => {
  try {
    let patientId;
    if (req.user.role === 'PATIENT') {
      const profile = await prisma.patientProfile.findUnique({ where: { userId: req.user.id } });
      if (!profile || (req.body.patientId && req.body.patientId !== profile.id)) {
        return res.status(404).json({ error: 'Patient profile not found' });
      }
      patientId = profile.id;
    } else if (req.user.role === 'CLINICIAN') {
      patientId = req.body.patientId;
      if (!patientId || !(await canAccessPatient(req.user, patientId))) {
        return res.status(404).json({ error: 'Assigned patient not found' });
      }
    } else {
      return res.status(403).json({ error: 'Forbidden: Patient access is required' });
    }

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }

    const session = await prisma.assessmentSession.create({
      data: {
        patientId,
        clinicianId: req.user.role === 'CLINICIAN' ? req.user.id : null,
        status: 'CREATED',
        notes: req.body.notes || 'New multi-modal assessment session'
      },
      include: {
        patient: { include: { user: { select: { name: true, email: true } } } }
      }
    });

    return res.status(201).json(session);
  } catch (error) {
    console.error('createSession error:', error);
    return res.status(500).json({ error: 'Failed to create assessment session' });
  }
};

const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const sessionAccess = await prisma.assessmentSession.findUnique({
      where: { id },
      select: { patientId: true }
    });

    if (!sessionAccess || !(await canAccessPatient(req.user, sessionAccess.patientId))) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = await prisma.assessmentSession.findUnique({
      where: { id },
      include: {
        patient: { include: { user: { select: { name: true, email: true } } } },
        modalityData: true,
        riskReport: true
      }
    });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.json(session);
  } catch (error) {
    console.error('getSessionById error:', error);
    return res.status(500).json({ error: 'Failed to fetch session' });
  }
};

const getPatientSessions = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!(await canAccessPatient(req.user, patientId))) {
      return res.status(404).json({ error: 'Patient sessions not found' });
    }

    const sessions = await prisma.assessmentSession.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        modalityData: true,
        riskReport: true
      }
    });

    return res.json(sessions);
  } catch (error) {
    console.error('getPatientSessions error:', error);
    return res.status(500).json({ error: 'Failed to fetch patient sessions' });
  }
};

const updateSessionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (req.user.role !== 'CLINICIAN') {
      return res.status(403).json({ error: 'Forbidden: Clinician access is required' });
    }

    if (status && !VALID_STATUSES.includes(status.toUpperCase())) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const existingSession = await prisma.assessmentSession.findUnique({
      where: { id },
      select: { patientId: true }
    });
    if (!existingSession || !(await canAccessPatient(req.user, existingSession.patientId))) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = await prisma.assessmentSession.update({
      where: { id },
      data: {
        ...(status ? { status: status.toUpperCase() } : {}),
        ...(notes !== undefined ? { notes } : {})
      },
      include: {
        modalityData: true,
        riskReport: true
      }
    });

    return res.json(session);
  } catch (error) {
    console.error('updateSessionStatus error:', error);
    return res.status(500).json({ error: 'Failed to update session status' });
  }
};

const reviewSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { clinicianNotes, updatedRiskBand } = req.body;

    if (req.user.role !== 'CLINICIAN') {
      return res.status(403).json({ error: 'Forbidden: Clinician access is required' });
    }

    const sessionAccess = await prisma.assessmentSession.findUnique({
      where: { id },
      select: { patientId: true }
    });
    if (!sessionAccess || !(await canAccessPatient(req.user, sessionAccess.patientId))) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = await prisma.assessmentSession.findUnique({
      where: { id },
      include: { riskReport: true }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update risk report notes & sign off
    if (session.riskReport) {
      await prisma.riskReport.update({
        where: { id: session.riskReport.id },
        data: {
          clinicianNotes: clinicianNotes || session.riskReport.clinicianNotes,
          ...(updatedRiskBand ? { riskBand: updatedRiskBand } : {}),
          reviewedBy: req.user.name || req.user.email,
          reviewedAt: new Date()
        }
      });
    }

    // Advance state to COMPLETED
    const updatedSession = await prisma.assessmentSession.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        clinicianId: req.user.id
      },
      include: {
        patient: { include: { user: { select: { name: true, email: true } } } },
        modalityData: true,
        riskReport: true
      }
    });

    return res.json(updatedSession);
  } catch (error) {
    console.error('reviewSession error:', error);
    return res.status(500).json({ error: 'Failed to submit doctor review' });
  }
};

module.exports = {
  createSession,
  getSessionById,
  getPatientSessions,
  updateSessionStatus,
  reviewSession
};
