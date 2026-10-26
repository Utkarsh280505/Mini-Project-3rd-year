const {
  validateBiomarker,
  validateImaging,
  validateFullAssessment,
  validateClinicalMeasurement
} = require('../src/middleware/assessmentValidation');

const VALID_SESSION_ID = 'd9428888-122b-4f1a-9a5f-4e8f3f05a930';

const runValidation = (middleware, body) => {
  const req = { body };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
  const next = jest.fn();

  middleware(req, res, next);
  return { res, next };
};

describe('assessment request validation', () => {
  it('accepts partial clinician-entered motor values with a named source', () => {
    const { res, next } = runValidation(validateClinicalMeasurement, {
      sessionId: VALID_SESSION_ID,
      modality: 'motor',
      instrument: 'External gait sensor',
      record: { gait_speed: 1.1 }
    });

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects an out-of-range cognitive score for collected measurements', () => {
    const { res, next } = runValidation(validateClinicalMeasurement, {
      sessionId: VALID_SESSION_ID,
      modality: 'cognitive',
      instrument: 'Clinician-administered validated assessment',
      record: { mmse_score: 31 }
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].details).toContainEqual({
      field: 'record.mmse_score',
      message: 'Must be between 0 and 30'
    });
  });

  it('requires numeric imaging report findings to include their source labels and units', () => {
    const { res, next } = runValidation(validateClinicalMeasurement, {
      sessionId: VALID_SESSION_ID,
      modality: 'imaging',
      instrument: 'Radiology report',
      measurements: [{ label: 'Measurement name', value: 1.25, unit: 'mm' }]
    });

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('accepts a valid biomarker record and continues to the controller', () => {
    const { res, next } = runValidation(validateBiomarker, {
      sessionId: VALID_SESSION_ID,
      source: 'measured',
      modality: 'speech',
      record: {
        jitter: 0.4,
        shimmer: 0.3,
        pause_ratio: 0.2,
        pitch_var: 0.5,
        speech_rate: 3.2
      }
    });

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects missing, non-numeric, and unsupported biomarker features', () => {
    const { res, next } = runValidation(validateBiomarker, {
      sessionId: VALID_SESSION_ID,
      source: 'measured',
      modality: 'speech',
      record: { jitter: '0.4', unexpected: 1 }
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Validation failed',
      details: expect.arrayContaining([
        { field: 'record.jitter', message: 'Must be a finite number' },
        { field: 'record.shimmer', message: 'Must be a finite number' },
        { field: 'record.unexpected', message: 'Feature is not supported for this modality' }
      ])
    });
  });

  it('rejects cognitive scores outside their valid ranges', () => {
    const { res, next } = runValidation(validateBiomarker, {
      sessionId: VALID_SESSION_ID,
      modality: 'cognitive',
      record: {
        mmse_score: 31,
        moca_score: 20,
        recall_score: -1,
        attention_score: 5
      }
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].details).toEqual(expect.arrayContaining([
      { field: 'record.mmse_score', message: 'Must be between 0 and 30' },
      { field: 'record.recall_score', message: 'Must be between 0 and 10' }
    ]));
  });

  it('rejects simulated biomarker values at the analysis endpoint', () => {
    const { res, next } = runValidation(validateBiomarker, {
      sessionId: VALID_SESSION_ID,
      source: 'simulated',
      modality: 'speech',
      record: {
        jitter: 0.4,
        shimmer: 0.3,
        pause_ratio: 0.2,
        pitch_var: 0.5,
        speech_rate: 3.2
      }
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].details).toContainEqual({
      field: 'source',
      message: 'Only measured biomarker data can be analyzed'
    });
  });

  it('rejects a ragged image', () => {
    const image = Array.from({ length: 8 }, () => Array(8).fill(0.5));
    image[7] = [0.5];
    const { res, next } = runValidation(validateImaging, {
      sessionId: VALID_SESSION_ID,
      source: 'measured',
      image
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].details).toEqual(expect.arrayContaining([
      { field: 'image[7]', message: 'All rows must have the same number of columns' }
    ]));
  });

  it('rejects image pixels outside the supported range', () => {
    const image = Array.from({ length: 8 }, () => Array(8).fill(0.5));
    image[3][5] = 1.5;
    const { res, next } = runValidation(validateImaging, {
      sessionId: VALID_SESSION_ID,
      source: 'measured',
      image
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].details).toContainEqual({
      field: 'image[3][5]',
      message: 'Pixel values must be finite numbers between 0 and 1'
    });
  });

  it('validates each supplied modality in full assessments', () => {
    const { res, next } = runValidation(validateFullAssessment, {
      sessionId: VALID_SESSION_ID,
      modalitySources: {
        imaging: 'not_provided',
        speech: 'not_provided',
        motor: 'measured',
        ocular: 'not_provided',
        cognitive: 'not_provided'
      },
      motor: { stride_var: 0.1 }
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].details).toEqual(expect.arrayContaining([
      { field: 'motor.tremor_amp', message: 'Must be a finite number' }
    ]));
  });

  it('requires explicit source statuses for full assessments', () => {
    const { res, next } = runValidation(validateFullAssessment, {
      sessionId: VALID_SESSION_ID,
      modalitySources: {
        imaging: 'not_provided',
        speech: 'simulated',
        motor: 'not_provided',
        ocular: 'not_provided',
        cognitive: 'invalid'
      }
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].details).toContainEqual({
      field: 'modalitySources.cognitive',
      message: 'Must be one of: measured, simulated, collected, not_provided'
    });
  });

  it('accepts collected media as provenance without implying it was measured', () => {
    const { res, next } = runValidation(validateFullAssessment, {
      sessionId: VALID_SESSION_ID,
      modalitySources: {
        imaging: 'not_provided',
        speech: 'collected',
        motor: 'simulated',
        ocular: 'not_provided',
        cognitive: 'not_provided'
      }
    });

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects preset MRI data without a measured image', () => {
    const { res, next } = runValidation(validateImaging, {
      sessionId: VALID_SESSION_ID,
      source: 'simulated',
      isAtRiskPreset: true
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].details).toEqual(expect.arrayContaining([
      { field: 'source', message: 'Only measured imaging data can be analyzed' },
      { field: 'image', message: 'An actual image array is required; presets are not scored' },
      { field: 'isAtRiskPreset', message: 'Preset imaging cannot be analyzed' }
    ]));
  });
});
