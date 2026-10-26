const express = require('express');
const multer = require('multer');
const {
  saveSpeechCapture,
  saveMriCapture,
  saveClinicalMeasurement,
  submitBiomarker,
  submitImaging,
  runFullAssessment
} = require('../controllers/assessmentController');
const { authenticateJWT, requireRole } = require('../middleware/authMiddleware');
const { authorizeSessionAccess } = require('../middleware/patientAccess');
const {
  validateBiomarker,
  validateImaging,
  validateFullAssessment,
  validateClinicalMeasurement
} = require('../middleware/assessmentValidation');

const router = express.Router();
const speechCaptureUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 }
}).single('audio');
const mriCaptureUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 64 * 1024 * 1024, files: 1 }
}).single('mri');

const clearMriBufferAfterResponse = (req, res, next) => {
  res.once('finish', () => {
    if (Buffer.isBuffer(req.file?.buffer)) {
      req.file.buffer.fill(0);
    }
  });
  next();
};

router.use(authenticateJWT);

router.post('/mri-capture', requireRole('PATIENT'), (req, res, next) => {
  mriCaptureUpload(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({ error: 'MRI upload failed', details: error.message });
    }
    if (error) return next(error);
    next();
  });
}, clearMriBufferAfterResponse, authorizeSessionAccess((req) => req.body.sessionId), saveMriCapture);

router.post('/speech-capture', (req, res, next) => {
  speechCaptureUpload(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({ error: 'Speech recording upload failed', details: error.message });
    }
    if (error) return next(error);
    next();
  });
}, authorizeSessionAccess((req) => req.body.sessionId), saveSpeechCapture);

router.post(
  '/clinical-measurements',
  requireRole('CLINICIAN'),
  validateClinicalMeasurement,
  authorizeSessionAccess((req) => req.body.sessionId),
  saveClinicalMeasurement
);
router.post('/biomarker', validateBiomarker, authorizeSessionAccess((req) => req.body.sessionId), submitBiomarker);
router.post('/imaging', validateImaging, authorizeSessionAccess((req) => req.body.sessionId), submitImaging);
router.post('/full', validateFullAssessment, authorizeSessionAccess((req) => req.body.sessionId), runFullAssessment);

module.exports = router;
