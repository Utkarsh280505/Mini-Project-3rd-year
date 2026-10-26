"""
demo.py
----------------------------------------------------------------------
End-to-end demo, no server needed: generates one synthetic patient,
runs it through imaging + biomarker + fusion models, prints the
report, and saves a saliency heatmap image to demo_heatmap.png.

Run: python3 train.py   (once, to create models/)
     python3 demo.py
----------------------------------------------------------------------
"""

import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from data_synth import make_dataset
from imaging_model import ImagingRiskModel
from biomarker_model import build_biomarker_models
from fusion_engine import FusionRiskEngine

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")


def load_all_models():
    imaging_model = ImagingRiskModel().load(os.path.join(MODELS_DIR, "imaging.joblib"))
    bio_models = build_biomarker_models()
    for name, model in bio_models.items():
        model.load(os.path.join(MODELS_DIR, f"{name}.joblib"))
    fusion_engine = FusionRiskEngine().load(os.path.join(MODELS_DIR, "fusion.joblib"))
    return imaging_model, bio_models, fusion_engine


def run_patient(patient, imaging_model, bio_models, fusion_engine):
    scores = {"imaging": imaging_model.predict_risk(patient["imaging"])["risk_score"]}
    explanations = {}
    for name, model in bio_models.items():
        res = model.predict_risk(patient[name])
        scores[name] = res["risk_score"]
        explanations[name] = res["top_features"]
    fused = fusion_engine.fuse(scores)
    return fused, explanations


def main():
    if not os.path.exists(os.path.join(MODELS_DIR, "fusion.joblib")):
        raise SystemExit("No trained models found - run `python3 train.py` first.")

    imaging_model, bio_models, fusion_engine = load_all_models()

    ds = make_dataset(n_per_class=1, seed=7)
    healthy = next(p for p in ds if p["label"] == 0)
    at_risk = next(p for p in ds if p["label"] == 1)

    for label_name, patient in [("HEALTHY (simulated)", healthy), ("AT-RISK (simulated)", at_risk)]:
        print(f"\n=== Patient: {label_name} ===")
        fused, explanations = run_patient(patient, imaging_model, bio_models, fusion_engine)
        print(f"Fused risk score : {fused['fused_risk_score']}  "
              f"(confidence {fused['confidence']}, CI {fused['confidence_interval']})")
        print(f"Risk band        : {fused['clinical_scale_mapping']['risk_band']}")
        print(f"Per-modality     : {fused['modality_scores']}")
        for modality, feats in explanations.items():
            top = feats[0]
            print(f"  {modality:10s} top driver: {top['feature']} = {top['value']} "
                  f"(importance {top['importance']})")

    # save a heatmap for the at-risk patient
    heat = imaging_model.saliency_heatmap(at_risk["imaging"])
    fig, axes = plt.subplots(1, 2, figsize=(6, 3))
    axes[0].imshow(at_risk["imaging"], cmap="gray")
    axes[0].set_title("MRI slice (simulated)")
    axes[0].axis("off")
    axes[1].imshow(at_risk["imaging"], cmap="gray")
    axes[1].imshow(heat, cmap="jet", alpha=0.45, extent=(0, 64, 64, 0))
    axes[1].set_title("Saliency overlay")
    axes[1].axis("off")
    out_path = os.path.join(os.path.dirname(__file__), "demo_heatmap.png")
    fig.savefig(out_path, dpi=120, bbox_inches="tight")
    print(f"\nSaved saliency visualization to {out_path}")


if __name__ == "__main__":
    main()
