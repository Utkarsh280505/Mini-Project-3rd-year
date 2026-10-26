"""
api.py
----------------------------------------------------------------------
NeuroEarly AI - ML microservice.

This is a separate Python service that your Node/Express backend
calls over HTTP (see synopsis Section 10.1: "Imaging Analysis
Service", "Assessment & Biomarker service" both sit behind the
backend, in front of the Fusion & Risk Engine).

Run:  python3 api.py            (starts on http://localhost:5001)

Endpoints:
  GET  /health
  POST /biomarker/analyze   { "modality": "speech"|"motor"|"cognitive", "record": {...} }
  POST /imaging/analyze     { "image": [[...]] }            (2D array, or omit for demo image)
  POST /imaging/heatmap     { "image": [[...]] }            -> base64 PNG saliency overlay
  POST /fusion/analyze      { "modality_scores": {"imaging": 0.8, "speech": 0.3, ...} }
  POST /assess/full         { "imaging": [[...]], "speech": {...}, "motor": {...}, "cognitive": {...} }
                             -> runs the entire pipeline in one call (what your
                                Assessment & Capture Service will most likely use)
----------------------------------------------------------------------
"""

import os
import base64
import io
import time

import numpy as np
from flask import Flask, request, jsonify
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from imaging_model import ImagingRiskModel
from biomarker_model import build_biomarker_models
from fusion_engine import FusionRiskEngine

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
app = Flask(__name__)

# ---- load models once at startup ----
imaging_model = ImagingRiskModel()
imaging_model.load(os.path.join(MODELS_DIR, "imaging.joblib"))

bio_models = build_biomarker_models()
for name, model in bio_models.items():
    model.load(os.path.join(MODELS_DIR, f"{name}.joblib"))

fusion_engine = FusionRiskEngine()
fusion_engine.load(os.path.join(MODELS_DIR, "fusion.joblib"))


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "neuroearly-ml"})


@app.route("/biomarker/analyze", methods=["POST"])
def biomarker_analyze():
    payload = request.get_json(force=True)
    modality = payload.get("modality")
    record = payload.get("record")
    if modality not in bio_models:
        return jsonify({"error": f"unknown modality '{modality}', expected one of {list(bio_models)}"}), 400
    t0 = time.time()
    result = bio_models[modality].predict_risk(record)
    result["latency_ms"] = round((time.time() - t0) * 1000, 1)
    return jsonify(result)


@app.route("/imaging/analyze", methods=["POST"])
def imaging_analyze():
    payload = request.get_json(force=True)
    img = np.array(payload["image"], dtype=np.float32)
    t0 = time.time()
    result = imaging_model.predict_risk(img)
    result["latency_ms"] = round((time.time() - t0) * 1000, 1)
    return jsonify(result)


@app.route("/imaging/heatmap", methods=["POST"])
def imaging_heatmap():
    payload = request.get_json(force=True)
    img = np.array(payload["image"], dtype=np.float32)
    heat = imaging_model.saliency_heatmap(img)

    # render as base64 PNG overlay for the clinician dashboard
    fig, ax = plt.subplots(figsize=(3, 3))
    ax.imshow(img, cmap="gray")
    ax.imshow(heat, cmap="jet", alpha=0.45, extent=(0, img.shape[1], img.shape[0], 0))
    ax.axis("off")
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", pad_inches=0)
    plt.close(fig)
    buf.seek(0)
    encoded = base64.b64encode(buf.read()).decode("utf-8")

    return jsonify({"heatmap_png_base64": encoded, "grid_shape": list(heat.shape)})


@app.route("/fusion/analyze", methods=["POST"])
def fusion_analyze():
    payload = request.get_json(force=True)
    scores = payload.get("modality_scores", {})
    if not isinstance(scores, dict) or not scores:
        return jsonify({"error": "At least one modality score is required"}), 400
    t0 = time.time()
    try:
        result = fusion_engine.fuse(scores)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    result["latency_ms"] = round((time.time() - t0) * 1000, 1)
    return jsonify(result)


@app.route("/assess/full", methods=["POST"])
def assess_full():
    """One-shot endpoint: raw modality inputs in -> fused risk report out.
    Any modality can be omitted (e.g. no scan uploaded yet)."""
    payload = request.get_json(force=True)
    t0 = time.time()
    scores = {}

    if "imaging" in payload:
        img = np.array(payload["imaging"], dtype=np.float32)
        scores["imaging"] = imaging_model.predict_risk(img)["risk_score"]

    for modality in ("speech", "motor", "cognitive", "ocular"):
        if modality in payload:
            scores[modality] = bio_models[modality].predict_risk(payload[modality])["risk_score"]

    if not scores:
        return jsonify({"error": "no modalities provided"}), 400

    result = fusion_engine.fuse(scores)
    result["latency_ms"] = round((time.time() - t0) * 1000, 1)
    return jsonify(result)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
