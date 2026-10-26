# NeuroEarly AI ML Engine

This folder contains the machine learning service for NeuroEarly AI. It provides a lightweight, explainable multimodal risk pipeline for dementia-related risk screening using synthetic clinical-style data and a Flask API that can be called by the Node.js backend.

## What this model does

The ML service combines four modalities into a single risk estimate:

- Imaging: 2D grayscale MRI-like slice analysis
- Speech: acoustic summary features
- Motor: gait and tremor indicators
- Cognitive: MMSE/MoCA-style test metrics

The pipeline runs as follows:

1. Synthetic patient records are generated in `data_synth.py`
2. A model is trained for each modality in `imaging_model.py` and `biomarker_model.py`
3. The fusion model in `fusion_engine.py` combines modality risk scores into one final score
4. The Flask service in `api.py` exposes prediction endpoints for the backend

## Model architecture

### 1. Imaging model

File: `imaging_model.py`

- Uses a `RandomForestClassifier`
- Converts a grayscale image into a fixed feature vector by dividing it into an 8x8 grid
- Extracts per-region:
  - mean intensity
  - local variance
- Produces a risk score between 0 and 1
- Supports explainability through an occlusion-based saliency heatmap

The image feature extraction is intentionally simple and deterministic so the project can run without a GPU or deep learning stack.

### 2. Biomarker models

File: `biomarker_model.py`

- Uses one `GradientBoostingClassifier` per modality:
  - `speech`
  - `motor`
  - `cognitive`
- Each classifier accepts a fixed set of modality-specific features and returns:
  - `risk_score`
  - `top_features` with feature importance values

Feature inputs are defined in `data_synth.py`:

- Speech: `jitter`, `shimmer`, `pause_ratio`, `pitch_var`, `speech_rate`
- Motor: `stride_var`, `tremor_amp`, `reaction_time_ms`, `gait_speed`
- Cognitive: `mmse_score`, `moca_score`, `recall_score`, `attention_score`

### 3. Fusion engine

File: `fusion_engine.py`

- Uses `LogisticRegression` to fuse modality risk scores
- Inputs are the modality probabilities:
  - `imaging`
  - `speech`
  - `motor`
  - `cognitive`
- Produces:
  - `fused_risk_score`
  - `confidence`
  - `confidence_interval`
  - `clinical_scale_mapping`
  - `modalities_used`

This is a late-fusion approach: individual modality models first decide risk, then the fusion layer combines them.

## Data source and scope

This model currently uses synthetic data instead of real clinical datasets.

- File: `data_synth.py`
- Purpose: generate balanced synthetic patient records that mimic MRI-like scans and multimodal risk indicators
- Why: the project is structured to allow replacement with ADNI/PPMI-like real datasets later without changing the overall training and API interfaces

Important: this is a prototype pipeline, not a validated clinical diagnostic model.

## Directory structure

```text
ml-engine/
├── api.py                  # Flask REST API
├── biomarker_model.py      # speech / motor / cognitive models
├── data_synth.py           # synthetic multimodal data generator
├── demo.py                 # end-to-end demo script
├── fusion_engine.py        # modality fusion + explainability summary
├── imaging_model.py        # imaging classifier + saliency heatmap
├── models/                 # trained joblib artifacts
├── README.md               # project documentation
├── requirements.txt        # Python dependencies
├── train.py                # model training script
└── demo_heatmap.png        # generated sample output
```

## Setup

```bash
cd ml-engine
pip install -r requirements.txt
```

## Train the models

```bash
python train.py
```

This script:

- generates synthetic patient records
- trains the imaging classifier
- trains 3 biomarker models
- trains the fusion layer
- saves all models under `models/`
- prints validation metrics on the holdout set

## Run the demo

```bash
python demo.py
```

This creates a sample risk evaluation for one healthy and one at-risk synthetic patient and saves a saliency heatmap to `demo_heatmap.png`.

## Run the API

```bash
python api.py
```

The service listens on:

- `http://localhost:5001`

### Available endpoints

```http
GET /health

POST /biomarker/analyze
Content-Type: application/json
{
  "modality": "speech",
  "record": {
    "jitter": 0.42,
    "shimmer": 0.31,
    "pause_ratio": 0.18,
    "pitch_var": 0.48,
    "speech_rate": 3.1
  }
}

POST /imaging/analyze
Content-Type: application/json
{
  "image": [[0.1, 0.2, ...], [...]]
}

POST /imaging/heatmap
Content-Type: application/json
{
  "image": [[0.1, 0.2, ...], [...]]
}

POST /fusion/analyze
Content-Type: application/json
{
  "modality_scores": {
    "imaging": 0.82,
    "speech": 0.46,
    "motor": 0.58,
    "cognitive": 0.67
  }
}

POST /assess/full
Content-Type: application/json
{
  "imaging": [[...]],
  "speech": {...},
  "motor": {...},
  "cognitive": {...}
}
```

### Example response shape

```json
{
  "fused_risk_score": 0.824,
  "confidence": 0.712,
  "confidence_interval": [0.612, 0.936],
  "modalities_used": ["imaging", "speech", "motor", "cognitive"],
  "modality_scores": {
    "imaging": 0.81,
    "speech": 0.61,
    "motor": 0.67,
    "cognitive": 0.74
  },
  "clinical_scale_mapping": {
    "risk_band": "elevated risk - recommend specialist evaluation",
    "mmse_estimate_range": [18.5, 24.0],
    "moca_estimate_range": [16.2, 21.3],
    "note": "Estimates only - clinician validation required before use in diagnosis."
  }
}
```

## Expected behavior and limitations

### Strengths

- End-to-end multimodal risk scoring is implemented
- Explainers are included at both modality and imaging levels
- Missing modalities are handled gracefully in the fusion model
- The service is lightweight and can run locally without GPU support

### Limitations

- The project currently uses synthetic data, so performance is not clinically validated
- The imaging model uses engineered features instead of a real CNN/transformer
- The saliency map is a prototype explainability method, not clinical-grade imaging attribution
- The scores should be treated as research-stage estimates only

## Recommended next steps

1. Replace synthetic generation with real clinical data pipelines
2. Upgrade the imaging branch to a CNN or transformer-based model
3. Add validation, calibration, and uncertainty reporting for production use
4. Connect the API to the backend and database layer in the main application

## Summary

This repo implements a working prototype of a multimodal dementia-risk screening model. It is designed to be modular, explainable, and easy to evolve into a more clinically serious system with real data and deeper model architectures.
