const express = require('express');
const { getAllPatients, getPatientById } = require('../controllers/patientController');
const { authenticateJWT, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateJWT);

router.get('/', requireRole('CLINICIAN'), getAllPatients);
router.get('/:id', getPatientById);

module.exports = router;
