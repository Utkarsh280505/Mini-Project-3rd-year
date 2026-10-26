const MODALITY_FIELDS = {
  speech: ['jitter', 'shimmer', 'pause_ratio', 'pitch_var', 'speech_rate'],
  motor: ['stride_var', 'tremor_amp', 'reaction_time_ms', 'gait_speed'],
  cognitive: ['mmse_score', 'moca_score', 'recall_score', 'attention_score'],
  ocular: ['saccade_velocity', 'fixation_duration_ms', 'gaze_deviation', 'blink_rate']
};
const MODALITIES = ['imaging', ...Object.keys(MODALITY_FIELDS)];
const SOURCE_STATUSES = ['measured', 'simulated', 'collected', 'not_provided'];

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isUuid = (value) => typeof value === 'string'
  && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const validateSessionId = (sessionId, errors) => {
  if (typeof sessionId !== 'string' || !isUuid(sessionId)) {
    errors.push({ field: 'sessionId', message: 'Must be a valid UUID' });
  }
};

const validateRecord = (record, modality, errors, field = modality) => {
  if (!isObject(record)) {
    errors.push({ field, message: 'Must be an object containing modality features' });
    return;
  }

  const expectedFields = MODALITY_FIELDS[modality];
  for (const name of expectedFields) {
    const value = record[name];
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      errors.push({ field: `${field}.${name}`, message: 'Must be a finite number' });
      continue;
    }

    if (modality === 'cognitive') {
      const max = name === 'mmse_score' || name === 'moca_score' ? 30 : 10;
      if (value < 0 || value > max) {
        errors.push({ field: `${field}.${name}`, message: `Must be between 0 and ${max}` });
      }
    }
  }

  for (const name of Object.keys(record)) {
    if (!expectedFields.includes(name)) {
      errors.push({ field: `${field}.${name}`, message: 'Feature is not supported for this modality' });
    }
  }
};

const validateImage = (image, errors, field = 'image') => {
  if (!Array.isArray(image) || image.length < 8 || image.length > 512) {
    errors.push({ field, message: 'Must be a 2D image array with 8 to 512 rows' });
    return;
  }

  const rowLength = Array.isArray(image[0]) ? image[0].length : 0;
  if (rowLength < 8 || rowLength > 512) {
    errors.push({ field, message: 'Must have 8 to 512 columns' });
    return;
  }

  for (let rowIndex = 0; rowIndex < image.length; rowIndex++) {
    const row = image[rowIndex];
    if (!Array.isArray(row) || row.length !== rowLength) {
      errors.push({ field: `${field}[${rowIndex}]`, message: 'All rows must have the same number of columns' });
      return;
    }

    for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
      const value = row[columnIndex];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
        errors.push({
          field: `${field}[${rowIndex}][${columnIndex}]`,
          message: 'Pixel values must be finite numbers between 0 and 1'
        });
        return;
      }
    }
  }
};

const validateModalitySources = (sources, errors) => {
  if (!isObject(sources)) {
    errors.push({ field: 'modalitySources', message: 'Must identify the source status for each modality' });
    return;
  }

  for (const modality of MODALITIES) {
    if (!SOURCE_STATUSES.includes(sources[modality])) {
      errors.push({
        field: `modalitySources.${modality}`,
        message: `Must be one of: ${SOURCE_STATUSES.join(', ')}`
      });
    }
  }

  for (const modality of Object.keys(sources)) {
    if (!MODALITIES.includes(modality)) {
      errors.push({ field: `modalitySources.${modality}`, message: 'Unsupported modality' });
    }
  }
};

const sendValidationErrors = (res, errors) => {
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
};

const validateBiomarker = (req, res, next) => {
  const errors = [];
  const body = req.body;

  if (!isObject(body)) {
    errors.push({ field: 'body', message: 'Must be a JSON object' });
  } else {
    validateSessionId(body.sessionId, errors);
    if (body.source !== 'measured') {
      errors.push({ field: 'source', message: 'Only measured biomarker data can be analyzed' });
    }
    if (!Object.prototype.hasOwnProperty.call(MODALITY_FIELDS, body.modality)) {
      errors.push({ field: 'modality', message: 'Must be one of: speech, motor, cognitive, ocular' });
    } else {
      validateRecord(body.record, body.modality, errors, 'record');
    }
  }

  if (sendValidationErrors(res, errors)) return;
  next();
};

const validateImaging = (req, res, next) => {
  const errors = [];
  const body = req.body;

  if (!isObject(body)) {
    errors.push({ field: 'body', message: 'Must be a JSON object' });
  } else {
    validateSessionId(body.sessionId, errors);
    if (body.source !== 'measured') {
      errors.push({ field: 'source', message: 'Only measured imaging data can be analyzed' });
    }
    if (!Object.prototype.hasOwnProperty.call(body, 'image')) {
      errors.push({ field: 'image', message: 'An actual image array is required; presets are not scored' });
    } else {
      validateImage(body.image, errors);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'isAtRiskPreset')) {
      errors.push({ field: 'isAtRiskPreset', message: 'Preset imaging cannot be analyzed' });
    }
  }

  if (sendValidationErrors(res, errors)) return;
  next();
};

const validateFullAssessment = (req, res, next) => {
  const errors = [];
  const body = req.body;

  if (!isObject(body)) {
    errors.push({ field: 'body', message: 'Must be a JSON object' });
  } else {
    validateSessionId(body.sessionId, errors);
    validateModalitySources(body.modalitySources, errors);

    if (Object.prototype.hasOwnProperty.call(body, 'imaging')) {
      validateImage(body.imaging, errors, 'imaging');
    }
    for (const modality of Object.keys(MODALITY_FIELDS)) {
      if (Object.prototype.hasOwnProperty.call(body, modality)) {
        validateRecord(body[modality], modality, errors);
      }
    }
  }

  if (sendValidationErrors(res, errors)) return;
  next();
};

const validateClinicalMeasurement = (req, res, next) => {
  const errors = [];
  const body = req.body;
  const supportedModalities = ['motor', 'cognitive', 'imaging'];
  const featureFields = MODALITY_FIELDS[body?.modality];

  if (!isObject(body)) {
    errors.push({ field: 'body', message: 'Must be a JSON object' });
  } else {
    validateSessionId(body.sessionId, errors);

    if (!supportedModalities.includes(body.modality)) {
      errors.push({ field: 'modality', message: `Must be one of: ${supportedModalities.join(', ')}` });
    }

    if (typeof body.instrument !== 'string' || !body.instrument.trim() || body.instrument.length > 120) {
      errors.push({ field: 'instrument', message: 'A measurement source or instrument name of 1 to 120 characters is required' });
    }

    if (featureFields) {
      if (!isObject(body.record) || Object.keys(body.record).length === 0) {
        errors.push({ field: 'record', message: 'At least one measurement is required' });
      } else {
        for (const name of Object.keys(body.record)) {
          if (!featureFields.includes(name)) {
            errors.push({ field: `record.${name}`, message: 'Feature is not supported for this modality' });
            continue;
          }
          const value = body.record[name];
          if (typeof value !== 'number' || !Number.isFinite(value)) {
            errors.push({ field: `record.${name}`, message: 'Must be a finite number' });
            continue;
          }
          if (body.modality === 'cognitive') {
            const max = name === 'mmse_score' || name === 'moca_score' ? 30 : 10;
            if (value < 0 || value > max) {
              errors.push({ field: `record.${name}`, message: `Must be between 0 and ${max}` });
            }
          }
        }
      }
    }

    if (body.modality === 'imaging') {
      if (!Array.isArray(body.measurements) || body.measurements.length === 0 || body.measurements.length > 20) {
        errors.push({ field: 'measurements', message: 'Provide 1 to 20 numeric findings from the imaging report' });
      } else {
        body.measurements.forEach((measurement, index) => {
          if (!isObject(measurement)) {
            errors.push({ field: `measurements.${index}`, message: 'Must be an object with label, value, and unit' });
            return;
          }
          if (typeof measurement.label !== 'string' || !measurement.label.trim() || measurement.label.length > 80) {
            errors.push({ field: `measurements.${index}.label`, message: 'A measurement name of 1 to 80 characters is required' });
          }
          if (typeof measurement.value !== 'number' || !Number.isFinite(measurement.value)) {
            errors.push({ field: `measurements.${index}.value`, message: 'Must be a finite number' });
          }
          if (typeof measurement.unit !== 'string' || !measurement.unit.trim() || measurement.unit.length > 24) {
            errors.push({ field: `measurements.${index}.unit`, message: 'A measurement unit of 1 to 24 characters is required' });
          }
          for (const name of Object.keys(measurement)) {
            if (!['label', 'value', 'unit'].includes(name)) {
              errors.push({ field: `measurements.${index}.${name}`, message: 'Field is not supported' });
            }
          }
        });
      }
    }
  }

  if (sendValidationErrors(res, errors)) return;
  next();
};

module.exports = {
  validateBiomarker,
  validateImaging,
  validateFullAssessment,
  validateClinicalMeasurement
};
