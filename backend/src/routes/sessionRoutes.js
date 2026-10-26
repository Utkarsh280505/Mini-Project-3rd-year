const express = require('express');
const {
  createSession,
  getSessionById,
  getPatientSessions,
  updateSessionStatus,
  reviewSession
} = require('../controllers/sessionController');
const { authenticateJWT, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateJWT);

router.post('/', createSession);
router.get('/:id', getSessionById);
router.get('/patient/:patientId', getPatientSessions);
router.patch('/:id/status', updateSessionStatus);
router.post('/:id/review', requireRole('CLINICIAN'), reviewSession);

module.exports = router;
