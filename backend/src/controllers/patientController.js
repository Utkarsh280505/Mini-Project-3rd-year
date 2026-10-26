const prisma = require('../config/db');
const { canAccessPatient, getAccessiblePatientProfileIds } = require('../middleware/patientAccess');

const getAllPatients = async (req, res) => {
  try {
    const patientProfileIds = await getAccessiblePatientProfileIds(req.user.id);
    const patients = await prisma.patientProfile.findMany({
      where: { id: { in: patientProfileIds } },
      include: {
        user: { select: { id: true, name: true, email: true } },
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { riskReport: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(patients);
  } catch (error) {
    console.error('getAllPatients error:', error);
    return res.status(500).json({ error: 'Failed to fetch patients' });
  }
};

const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!(await canAccessPatient(req.user, id))) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patient = await prisma.patientProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        sessions: {
          orderBy: { createdAt: 'desc' },
          include: {
            modalityData: true,
            riskReport: true
          }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    return res.json(patient);
  } catch (error) {
    console.error('getPatientById error:', error);
    return res.status(500).json({ error: 'Failed to fetch patient details' });
  }
};

module.exports = { getAllPatients, getPatientById };
