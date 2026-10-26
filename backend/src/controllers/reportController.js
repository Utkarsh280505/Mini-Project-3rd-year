const prisma = require('../config/db');
const { canAccessPatient } = require('../middleware/patientAccess');

const getReportBySessionId = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      select: { patientId: true }
    });

    if (!session || !(await canAccessPatient(req.user, session.patientId))) {
      return res.status(404).json({ error: 'Risk report not found for this session' });
    }

    const report = await prisma.riskReport.findUnique({
      where: { sessionId },
      include: {
        session: {
          include: {
            patient: { include: { user: { select: { name: true, email: true } } } },
            modalityData: true
          }
        }
      }
    });
    if (!report) {
      return res.status(404).json({ error: 'Risk report not found for this session' });
    }

    return res.json({
      ...report,
      modalityScores: report.modalityScoresJson ? JSON.parse(report.modalityScoresJson) : {},
      topContributingFeatures: report.topContributingFeaturesJson ? JSON.parse(report.topContributingFeaturesJson) : {}
    });
  } catch (error) {
    console.error('getReportBySessionId error:', error);
    return res.status(500).json({ error: 'Failed to fetch risk report' });
  }
};

const getLongitudinalReportsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!(await canAccessPatient(req.user, patientId))) {
      return res.status(404).json({ error: 'Patient reports not found' });
    }

    const sessions = await prisma.assessmentSession.findMany({
      where: {
        patientId,
        riskReport: { isNot: null }
      },
      orderBy: { createdAt: 'asc' },
      include: {
        riskReport: true
      }
    });

    const timeline = sessions.map(s => {
      const r = s.riskReport;
      return {
        sessionId: s.id,
        date: s.createdAt,
        formattedDate: new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: s.status,
        fusedRiskScore: r.fusedRiskScore,
        confidenceLow: r.confidenceIntervalLow,
        confidenceHigh: r.confidenceIntervalHigh,
        riskBand: r.riskBand,
        mmseEstimate: r.mmseEstimate,
        modalityScores: r.modalityScoresJson ? JSON.parse(r.modalityScoresJson) : {}
      };
    });

    return res.json({
      patientId,
      totalAssessments: timeline.length,
      timeline
    });
  } catch (error) {
    console.error('getLongitudinalReportsByPatient error:', error);
    return res.status(500).json({ error: 'Failed to fetch longitudinal trend reports' });
  }
};

module.exports = {
  getReportBySessionId,
  getLongitudinalReportsByPatient
};
