const prisma = require('../config/db');
const MLEngineService = require('../services/mlEngineService');
const { createGunzip } = require('zlib');

const isNiftiHeader = (buffer) => buffer.length >= 352
  && (buffer.readUInt32LE(0) === 348 || buffer.readUInt32BE(0) === 348)
  && buffer.toString('ascii', 344, 348) === 'n+1\u0000';

const hasGzippedNiftiHeader = (buffer) => new Promise((resolve) => {
  const gunzip = createGunzip();
  let header = Buffer.alloc(0);
  let settled = false;
  const finish = (isNifti) => {
    if (settled) return;
    settled = true;
    gunzip.destroy();
    resolve(isNifti);
  };

  gunzip.on('data', (chunk) => {
    const bytesToCopy = Math.min(352 - header.length, chunk.length);
    header = Buffer.concat([header, chunk.subarray(0, bytesToCopy)]);
    if (header.length === 352) finish(isNiftiHeader(header));
  });
  gunzip.on('end', () => finish(false));
  gunzip.on('error', () => finish(false));
  gunzip.end(buffer);
});

const isSupportedMriFile = async (file) => {
  const filename = typeof file.originalname === 'string' ? file.originalname.toLowerCase() : '';
  const buffer = file.buffer;
  if (!buffer?.length) return false;

  if (filename.endsWith('.dcm')) {
    return buffer.length >= 132 && buffer.toString('ascii', 128, 132) === 'DICM';
  }
  if (filename.endsWith('.nii')) {
    return isNiftiHeader(buffer);
  }
  if (filename.endsWith('.nii.gz')) {
    return hasGzippedNiftiHeader(buffer);
  }
  return false;
};

const saveMriCapture = async (req, res) => {
  try {
    if (req.user.role !== 'PATIENT') {
      return res.status(403).json({ error: 'Only patients can submit their own MRI capture' });
    }

    const consentAccepted = req.body.consent === 'true';
    if (!consentAccepted) {
      return res.status(400).json({ error: 'Research upload consent is required' });
    }

    const mriFile = req.file;
    if (!mriFile?.buffer?.length || !(await isSupportedMriFile(mriFile))) {
      return res.status(400).json({ error: 'Upload a valid single-file DICOM (.dcm) or NIfTI (.nii or .nii.gz) scan' });
    }

    const filename = mriFile.originalname.toLowerCase();
    const fileType = filename.endsWith('.nii.gz') ? 'application/gzip'
      : filename.endsWith('.nii') ? 'application/nifti'
        : 'application/dicom';
    const captureMetadata = {
      fileType,
      sizeBytes: mriFile.buffer.length,
      consentGivenAt: new Date().toISOString(),
      consentTextVersion: 'mri-upload-v1',
      rawMediaStored: false,
      analyzed: false
    };

    let modalityProvenance = {};
    const session = await prisma.assessmentSession.findUnique({
      where: { id: req.body.sessionId },
      select: { status: true, modalityProvenanceJson: true }
    });
    if (!session) {
      return res.status(404).json({ error: 'Assessment session not found' });
    }
    try {
      modalityProvenance = JSON.parse(session.modalityProvenanceJson || '{}');
    } catch (error) {
      console.error(`Invalid modality provenance for session ${req.body.sessionId}:`, error);
    }
    modalityProvenance.imaging = 'collected';

    const modalityData = await prisma.$transaction(async (tx) => {
      const savedCapture = await tx.modalityData.create({
        data: {
          sessionId: req.body.sessionId,
          modalityType: 'imaging',
          rawDataJson: JSON.stringify(captureMetadata),
          featureVectorJson: JSON.stringify({}),
          riskScore: null,
          source: 'collected'
        }
      });
      await tx.assessmentSession.update({
        where: { id: req.body.sessionId },
        data: {
          status: session.status === 'COMPLETED' ? 'COMPLETED' : 'CAPTURING',
          modalityProvenanceJson: JSON.stringify(modalityProvenance)
        }
      });
      return savedCapture;
    });

    return res.status(201).json({
      mriCapture: {
        ...captureMetadata,
        status: 'received_not_analyzed'
      },
      modalityData
    });
  } catch (error) {
    console.error('saveMriCapture error:', error);
    return res.status(500).json({ error: 'Failed to save MRI capture metadata' });
  } finally {
    if (Buffer.isBuffer(req.file?.buffer)) {
      req.file.buffer.fill(0);
    }
  }
};

const saveClinicalMeasurement = async (req, res) => {
  try {
    const { sessionId, modality, instrument } = req.body;
    const normalizedInstrument = typeof instrument === 'string' ? instrument.trim() : '';
    if (!sessionId || !modality || !normalizedInstrument) {
      return res.status(400).json({ error: 'Session ID, modality, and instrument are required' });
    }

    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      select: { id: true, status: true, modalityProvenanceJson: true }
    });

    if (!session) {
      return res.status(404).json({ error: 'Assessment session not found' });
    }

    const measurement = {
      instrument: normalizedInstrument,
      enteredByUserId: req.user.id,
      collectedAt: new Date().toISOString(),
      ...(modality === 'imaging'
        ? { findings: req.body.measurements }
        : { values: req.body.record })
    };
    let modalityProvenance = {};
    try {
      modalityProvenance = JSON.parse(session.modalityProvenanceJson || '{}');
    } catch (error) {
      console.error(`Invalid modality provenance for session ${sessionId}:`, error);
    }
    modalityProvenance[modality] = 'collected';

    const modalityData = await prisma.$transaction(async (tx) => {
      const savedMeasurement = await tx.modalityData.create({
        data: {
          sessionId,
          modalityType: modality,
          rawDataJson: JSON.stringify(measurement),
          featureVectorJson: JSON.stringify(modality === 'imaging'
            ? { findings: req.body.measurements, unitsIncluded: true }
            : req.body.record),
          riskScore: null,
          source: 'collected'
        }
      });

      await tx.assessmentSession.update({
        where: { id: sessionId },
        data: {
          status: session.status === 'COMPLETED' ? 'COMPLETED' : 'CAPTURING',
          modalityProvenanceJson: JSON.stringify(modalityProvenance)
        }
      });

      return savedMeasurement;
    });

    return res.status(201).json({
      modalityData,
      notice: 'Measurement saved as collected clinical data. It was not analyzed and did not produce a risk score.'
    });
  } catch (error) {
    console.error('saveClinicalMeasurement error:', error);
    return res.status(500).json({ error: error.message || 'Failed to save clinical measurement' });
  }
};

const saveSpeechCapture = async (req, res) => {
  try {
    const { sessionId, consent, durationSeconds: durationValue } = req.body;
    const durationSeconds = Number(durationValue);
    const audioFile = req.file;
    const consentAccepted = consent === true || consent === 'true' || consent === 1 || consent === '1';

    if (req.user.role !== 'PATIENT') {
      return res.status(403).json({ error: 'Only patients can submit their own speech capture' });
    }

    if (typeof sessionId !== 'string' || !sessionId) {
      return res.status(400).json({ error: 'A session ID is required' });
    }

    if (!consentAccepted) {
      return res.status(400).json({ error: 'Consent is required before submitting a speech capture' });
    }

    if (!Number.isFinite(durationSeconds) || durationSeconds < 1 || durationSeconds > 30) {
      return res.status(400).json({ error: 'Recording duration must be between 1 and 30 seconds' });
    }

    if (!audioFile?.buffer?.length || typeof audioFile.mimetype !== 'string') {
      return res.status(400).json({ error: 'A non-empty speech recording is required' });
    }

    const mimeType = audioFile.mimetype.split(';')[0].toLowerCase();
    const supportedTypes = new Set([
      'audio/webm',
      'audio/mp4',
      'audio/ogg',
      'audio/wav',
      'audio/x-wav',
      'audio/mpeg'
    ]);
    if (!supportedTypes.has(mimeType)) {
      return res.status(400).json({ error: 'Unsupported audio format' });
    }

    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: { patient: { select: { userId: true } } }
    });

    if (!session) {
      return res.status(404).json({ error: 'Assessment session not found' });
    }

    if (session.patient?.userId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to submit to this assessment session' });
    }

    const captureMetadata = {
      mimeType,
      sizeBytes: audioFile.buffer.length,
      durationSeconds,
      consentGivenAt: new Date().toISOString(),
      consentTextVersion: 'speech-capture-v1',
      rawMediaStored: false
    };

    await prisma.modalityData.create({
      data: {
        sessionId,
        modalityType: 'speech',
        rawDataJson: JSON.stringify(captureMetadata),
        featureVectorJson: JSON.stringify({}),
        riskScore: null,
        source: 'collected'
      }
    });

    return res.status(201).json({
      speechCapture: {
        ...captureMetadata,
        status: 'collected_not_analyzed'
      }
    });
  } catch (error) {
    console.error('saveSpeechCapture error:', error);
    return res.status(500).json({ error: error.message || 'Failed to save speech capture metadata' });
  } finally {
    if (Buffer.isBuffer(req.file?.buffer)) {
      req.file.buffer.fill(0);
    }
  }
};

const submitBiomarker = async (req, res) => {
  try {
    const { sessionId, modality, record, source } = req.body;
    const normalizedSource = typeof source === 'string' ? source.trim().toLowerCase() : '';
    const normalizedModality = typeof modality === 'string' ? modality.trim().toLowerCase() : '';

    if (normalizedSource !== 'measured') {
      return res.status(400).json({ error: 'Only measured biomarker data can be analyzed' });
    }

    if (!sessionId || !normalizedModality || !record) {
      return res.status(400).json({ error: 'Session ID, modality, and biomarker record are required' });
    }

    // Analyze via ML Engine
    const mlResult = await MLEngineService.analyzeBiomarker(normalizedModality, record);

    // Save modality data
    const modalityData = await prisma.modalityData.create({
      data: {
        sessionId,
        modalityType: normalizedModality,
        rawDataJson: JSON.stringify(record),
        featureVectorJson: JSON.stringify(record),
        riskScore: mlResult.risk_score,
        source: normalizedSource
      }
    });

    // Update session status to CAPTURING
    await prisma.assessmentSession.update({
      where: { id: sessionId },
      data: { status: 'CAPTURING' }
    });

    return res.status(201).json({
      modalityData,
      analysis: mlResult
    });
  } catch (error) {
    console.error('submitBiomarker error:', error);
    return res.status(500).json({ error: error.message || 'Failed to submit biomarker data' });
  }
};

const submitImaging = async (req, res) => {
  try {
    const { sessionId, image, source } = req.body;
    const normalizedSource = typeof source === 'string' ? source.trim().toLowerCase() : '';

    if (normalizedSource !== 'measured' || !image) {
      return res.status(400).json({ error: 'Only an actual measured image can be analyzed; presets are not scored' });
    }

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Run ML analysis and heatmap generation in parallel
    const [mlResult, heatmapResult] = await Promise.all([
      MLEngineService.analyzeImaging(image),
      MLEngineService.generateHeatmap(image)
    ]);

    // Save imaging modality record
    const modalityData = await prisma.modalityData.create({
      data: {
        sessionId,
        modalityType: 'imaging',
        rawDataJson: JSON.stringify(image),
        featureVectorJson: JSON.stringify({ matrixShape: [image.length, image[0]?.length] }),
        riskScore: mlResult.risk_score,
        source: normalizedSource
      }
    });

    // Update session status to PROCESSING
    await prisma.assessmentSession.update({
      where: { id: sessionId },
      data: { status: 'PROCESSING' }
    });

    return res.status(201).json({
      modalityData,
      analysis: mlResult,
      heatmapPngBase64: heatmapResult.heatmap_png_base64
    });
  } catch (error) {
    console.error('submitImaging error:', error);
    return res.status(500).json({ error: error.message || 'Failed to submit imaging scan' });
  }
};

const runFullAssessment = async (req, res) => {
  try {
    const { sessionId, modalitySources } = req.body;
    const normalizedModalitySources = modalitySources && typeof modalitySources === 'object' ? modalitySources : {};

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: { modalityData: true }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Build the ML payload from explicitly measured data only.
    const mlPayload = {};
    const modalityProvenance = { ...normalizedModalitySources };
    for (const modality of ['imaging', 'speech', 'motor', 'cognitive', 'ocular']) {
      if (modalitySources[modality] !== 'measured') continue;

      if (req.body[modality]) {
        mlPayload[modality] = req.body[modality];
        continue;
      }

      const savedData = session.modalityData.find(
        (item) => item.modalityType === modality && item.source === 'measured'
      );
      if (!savedData) {
        modalityProvenance[modality] = 'not_provided';
        continue;
      }

      try {
        mlPayload[modality] = JSON.parse(
          modality === 'imaging' ? savedData.rawDataJson : savedData.featureVectorJson
        );
      } catch (error) {
        console.error(`Invalid saved ${modality} assessment data for session ${sessionId}:`, error);
        modalityProvenance[modality] = 'not_provided';
      }
    }

    if (Object.keys(mlPayload).length === 0) {
      await prisma.assessmentSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          modalityProvenanceJson: JSON.stringify(modalityProvenance)
        }
      });

      return res.json({
        sessionStatus: 'INSUFFICIENT_DATA',
        riskReport: null,
        modalitySources: modalityProvenance,
        notice: 'No screening score was generated because no validated measured feature data was provided. If speech audio was captured, it was not analyzed or retained; only its consent and capture metadata are saved.'
      });
    }

    // Call ML Engine /assess/full
    const reportResult = await MLEngineService.assessFull(mlPayload);

    // Generate MRI heatmap if imaging was included
    let heatmapBase64 = null;
    if (Object.prototype.hasOwnProperty.call(mlPayload, 'imaging')) {
      try {
        const heatResult = await MLEngineService.generateHeatmap(mlPayload.imaging);
        heatmapBase64 = heatResult.heatmap_png_base64;
      } catch (err) {
        console.warn('Could not generate heatmap:', err.message);
      }
    }

    const clinicalMapping = reportResult.clinical_scale_mapping || {};
    const mmseRange = clinicalMapping.mmse_estimate_range;
    const mmseEstimate = Array.isArray(mmseRange)
      ? Number(((mmseRange[0] + mmseRange[1]) / 2).toFixed(1))
      : null;
    const modalityScores = reportResult.modality_scores || {};
    const topContributingFeatures = reportResult.top_contributing_features || {};

    // Upsert RiskReport
    const riskReport = await prisma.riskReport.upsert({
      where: { sessionId },
      update: {
        fusedRiskScore: reportResult.fused_risk_score,
        confidenceIntervalLow: reportResult.confidence_interval[0],
        confidenceIntervalHigh: reportResult.confidence_interval[1],
        riskBand: reportResult.risk_band || clinicalMapping.risk_band || 'screening indicator',
        mmseEstimate,
        modalityScoresJson: JSON.stringify(modalityScores),
        topContributingFeaturesJson: JSON.stringify(topContributingFeatures),
        heatmapPngBase64: heatmapBase64 || undefined
      },
      create: {
        sessionId,
        fusedRiskScore: reportResult.fused_risk_score,
        confidenceIntervalLow: reportResult.confidence_interval[0],
        confidenceIntervalHigh: reportResult.confidence_interval[1],
        riskBand: reportResult.risk_band || clinicalMapping.risk_band || 'screening indicator',
        mmseEstimate,
        modalityScoresJson: JSON.stringify(modalityScores),
        topContributingFeaturesJson: JSON.stringify(topContributingFeatures),
        heatmapPngBase64: heatmapBase64
      }
    });

    // Advance state machine to UNDER_REVIEW
    await prisma.assessmentSession.update({
      where: { id: sessionId },
      data: {
        status: 'UNDER_REVIEW',
        modalityProvenanceJson: JSON.stringify(modalityProvenance)
      }
    });

    return res.json({
      sessionStatus: 'UNDER_REVIEW',
      modalitySources: modalityProvenance,
      riskReport: {
        ...riskReport,
        modalitySources: modalityProvenance,
        modalityScores,
        topContributingFeatures,
        clinicalMapping
      }
    });
  } catch (error) {
    console.error('runFullAssessment error:', error);
    return res.status(500).json({ error: error.message || 'Failed to execute multi-modal risk engine' });
  }
};

module.exports = {
  saveMriCapture,
  saveClinicalMeasurement,
  saveSpeechCapture,
  submitBiomarker,
  submitImaging,
  runFullAssessment
};
