"""
fusion_engine.py
----------------------------------------------------------------------
NeuroEarly AI - Fusion & Risk Engine (Table 6: "Fusion Risk Engine",
Section 10.1 architecture diagram).

Prototype approach: a learned LOGISTIC REGRESSION fused on top of the
four per-modality risk scores (imaging, speech, motor, cognitive).
This is the practical stand-in for the "multi-modal transformer"
described in the synopsis - it is still a *learned* fusion (not a
fixed weighted average), it handles missing modalities gracefully,
and it is easy to swap for a small transformer/MLP later without
touching any other module (see README).

Also implements:
  - confidence interval on the fused score (from modality agreement)
  - explainable clinical-scale mapping (MMSE / MoCA / UPDRS bands),
    satisfying the "Explainable Score Mapping" feature (Should-have)
----------------------------------------------------------------------
"""

import numpy as np
from sklearn.linear_model import LogisticRegression
import joblib

MODALITIES = ["imaging", "speech", "motor", "cognitive", "ocular"]


class FusionRiskEngine:
    def __init__(self):
        self.clf = LogisticRegression(max_iter=1000)
        self._fitted = False

    def fit(self, modality_scores: list, labels: list):
        """modality_scores: list of dicts like {"imaging": 0.8, "speech": 0.3, ...}"""
        X = np.array([[m.get(mod, 0.5) for mod in MODALITIES] for m in modality_scores])
        y = np.array(labels)
        self.clf.fit(X, y)
        self._fitted = True
        return self

    def fuse(self, modality_scores: dict) -> dict:
        """
        modality_scores: dict of {modality_name: risk_score in [0,1]}.
        A complete set uses the trained fusion model. For an incomplete
        set, only available scores contribute to the mean; missing inputs
        are not imputed into the risk estimate.
        """
        if not self._fitted:
            raise RuntimeError("Fusion engine not trained.")
        if not isinstance(modality_scores, dict):
            raise ValueError("Modality scores must be provided as an object.")

        unknown = set(modality_scores) - set(MODALITIES)
        if unknown:
            raise ValueError(f"Unsupported modalities: {', '.join(sorted(unknown))}.")

        for modality, score in modality_scores.items():
            if not isinstance(score, (int, float, np.number)) or not np.isfinite(score) or not 0 <= score <= 1:
                raise ValueError(f"Score for {modality} must be a finite number between 0 and 1.")

        present = [m for m in MODALITIES if m in modality_scores]
        if not present:
            raise ValueError("At least one modality score is required.")

        if len(present) == len(MODALITIES):
            x = np.array([[modality_scores[mod] for mod in MODALITIES]])
            fused_score = float(self.clf.predict_proba(x)[0][1])
            fusion_method = "trained_meta_model"
        else:
            fused_score = float(np.mean([modality_scores[mod] for mod in present]))
            fusion_method = "mean_available_modalities"

        # Confidence: higher when more modalities are present AND when
        # they agree with each other (low variance across present scores)
        coverage = len(present) / len(MODALITIES)
        if len(present) > 1:
            agreement = 1.0 - float(np.std([modality_scores[m] for m in present]))
            agreement = max(0.0, min(1.0, agreement))
        else:
            agreement = 0.5
        confidence = round(0.5 * coverage + 0.5 * agreement, 3)
        margin = round((1 - confidence) * 0.25, 3)  # tighter interval as confidence grows

        return {
            "fused_risk_score": round(fused_score, 3),
            "confidence": confidence,
            "confidence_interval": [
                round(max(0.0, fused_score - margin), 3),
                round(min(1.0, fused_score + margin), 3),
            ],
            "modalities_used": present,
            "modality_scores": {k: round(v, 3) for k, v in modality_scores.items()},
            "fusion_method": fusion_method,
            "clinical_scale_mapping": self._map_to_clinical_scales(fused_score),
        }

    @staticmethod
    def _map_to_clinical_scales(fused_score: float) -> dict:
        """Rough band mapping for clinician context (not a diagnosis -
        matches synopsis's 'Explainable Score Mapping' feature)."""
        if fused_score < 0.3:
            band = "low risk"
        elif fused_score < 0.6:
            band = "moderate risk - monitor"
        else:
            band = "elevated risk - recommend specialist evaluation"
        return {
            "risk_band": band,
            "mmse_estimate_range": [
                round(30 - fused_score * 12, 1),
                round(30 - fused_score * 8, 1),
            ],
            "moca_estimate_range": [
                round(30 - fused_score * 14, 1),
                round(30 - fused_score * 9, 1),
            ],
            "note": "Estimates only - clinician validation required before use in diagnosis.",
        }

    def save(self, path: str):
        joblib.dump(self.clf, path)

    def load(self, path: str):
        self.clf = joblib.load(path)
        self._fitted = True
        return self


if __name__ == "__main__":
    from data_synth import make_dataset
    from imaging_model import ImagingRiskModel
    from biomarker_model import build_biomarker_models

    ds = make_dataset(n_per_class=80)
    split = int(0.8 * len(ds))
    train, test = ds[:split], ds[split:]

    imaging_model = ImagingRiskModel().fit([r["imaging"] for r in train], [r["label"] for r in train])
    bio_models = build_biomarker_models()
    for name, model in bio_models.items():
        model.fit([r[name] for r in train], [r["label"] for r in train])

    # build per-modality score training set for the fusion engine
    train_scores, train_labels = [], []
    for r in train:
        scores = {"imaging": imaging_model.predict_risk(r["imaging"])["risk_score"]}
        for name, model in bio_models.items():
            scores[name] = model.predict_risk(r[name])["risk_score"]
        train_scores.append(scores)
        train_labels.append(r["label"])

    fusion = FusionRiskEngine().fit(train_scores, train_labels)

    # evaluate on holdout
    correct = 0
    for r in test:
        scores = {"imaging": imaging_model.predict_risk(r["imaging"])["risk_score"]}
        for name, model in bio_models.items():
            scores[name] = model.predict_risk(r[name])["risk_score"]
        result = fusion.fuse(scores)
        pred = result["fused_risk_score"] > 0.5
        correct += int(pred == bool(r["label"]))
    print(f"Fusion holdout accuracy: {correct}/{len(test)}")

    print("\nExample fused result:")
    print(fusion.fuse(train_scores[0]))

    print("\nExample with a missing modality (no imaging uploaded yet):")
    partial = {k: v for k, v in train_scores[1].items() if k != "imaging"}
    print(fusion.fuse(partial))
