const express = require('express');
const {
  getReportBySessionId,
  getLongitudinalReportsByPatient
} = require('../controllers/reportController');
const { authenticateJWT } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateJWT);

router.get('/session/:sessionId', getReportBySessionId);
router.get('/patient/:patientId/longitudinal', getLongitudinalReportsByPatient);

module.exports = router;
