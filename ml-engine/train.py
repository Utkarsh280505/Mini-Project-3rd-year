"""
train.py
----------------------------------------------------------------------
Trains the imaging model, the three biomarker models, and the fusion
engine on synthetic data, then saves all of them to models/ so the
API can load them without retraining on every startup.

Run: python3 train.py
Swap `make_dataset()` for a real ADNI/PPMI-backed loader when you
have access to labelled data (see README).
----------------------------------------------------------------------
"""

import os
import joblib

from data_synth import make_dataset
from imaging_model import ImagingRiskModel
from biomarker_model import build_biomarker_models
from fusion_engine import FusionRiskEngine, MODALITIES

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


def main(n_per_class: int = 200):
    os.makedirs(MODELS_DIR, exist_ok=True)
    print(f"Generating {n_per_class * 2} synthetic patients...")
    ds = make_dataset(n_per_class=n_per_class)
    split = int(0.85 * len(ds))
    train, test = ds[:split], ds[split:]

    print("Training imaging model...")
    imaging_model = ImagingRiskModel().fit([r["imaging"] for r in train], [r["label"] for r in train])
    imaging_model.save(os.path.join(MODELS_DIR, "imaging.joblib"))

    print("Training biomarker models (speech, motor, cognitive)...")
    bio_models = build_biomarker_models()
    for name, model in bio_models.items():
        model.fit([r[name] for r in train], [r["label"] for r in train])
        model.save(os.path.join(MODELS_DIR, f"{name}.joblib"))

    print("Building fusion training set + training fusion engine...")
    train_scores, train_labels = [], []
    for r in train:
        scores = {"imaging": imaging_model.predict_risk(r["imaging"])["risk_score"]}
        for name, model in bio_models.items():
            scores[name] = model.predict_risk(r[name])["risk_score"]
        train_scores.append(scores)
        train_labels.append(r["label"])
    fusion = FusionRiskEngine().fit(train_scores, train_labels)
    fusion.save(os.path.join(MODELS_DIR, "fusion.joblib"))

    # ---- holdout evaluation, mirrors synopsis O3 (>=85% F1) ----
    from sklearn.metrics import f1_score, precision_score, recall_score

    y_true, y_pred = [], []
    for r in test:
        scores = {"imaging": imaging_model.predict_risk(r["imaging"])["risk_score"]}
        for name, model in bio_models.items():
            scores[name] = model.predict_risk(r[name])["risk_score"]
        fused = fusion.fuse(scores)
        y_true.append(r["label"])
        y_pred.append(int(fused["fused_risk_score"] > 0.5))

    print("\n--- Holdout evaluation (synthetic data) ---")
    print(f"F1 score : {f1_score(y_true, y_pred):.3f}  (target >= 0.85 per synopsis O3)")
    print(f"Precision: {precision_score(y_true, y_pred):.3f}")
    print(f"Recall   : {recall_score(y_true, y_pred):.3f}")
    print(f"\nModels saved to {MODELS_DIR}/")


if __name__ == "__main__":
    main()
