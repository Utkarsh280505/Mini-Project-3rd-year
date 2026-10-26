"""
biomarker_model.py
----------------------------------------------------------------------
NeuroEarly AI - Biomarker Processing Service (Table 6: Multi-Modal
Biomarker Capture). Handles the three non-imaging modalities:
speech, motor/gait, and cognitive test scores.

Each modality gets its own GradientBoostingClassifier (small,
interpretable, works well on tabular feature vectors of this size).
Explainability uses the model's built-in feature_importances_,
reported per-prediction as the top contributing features - this
satisfies the "Explainable Score Mapping" feature in the synopsis
without needing SHAP/LIME (kept light for a prototype timeline).
----------------------------------------------------------------------
"""

import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
import joblib

from data_synth import SPEECH_FEATURES, MOTOR_FEATURES, COGNITIVE_FEATURES, OCULAR_FEATURES


def _dict_to_vector(d: dict, feature_order: list) -> np.ndarray:
    return np.array([d[f] for f in feature_order], dtype=np.float32)


class BiomarkerRiskModel:
    """Generic per-modality risk model. One instance per modality
    (speech / motor / cognitive / ocular), parameterised by its feature list."""

    def __init__(self, modality: str, feature_order: list):
        self.modality = modality
        self.feature_order = feature_order
        self.clf = GradientBoostingClassifier(
            n_estimators=150, max_depth=3, learning_rate=0.08, random_state=42
        )
        self._fitted = False

    def fit(self, records: list, labels: list):
        X = np.stack([_dict_to_vector(r, self.feature_order) for r in records])
        y = np.array(labels)
        self.clf.fit(X, y)
        self._fitted = True
        return self

    def predict_risk(self, record: dict) -> dict:
        if not self._fitted:
            raise RuntimeError(f"{self.modality} model not trained.")
        x = _dict_to_vector(record, self.feature_order).reshape(1, -1)
        proba = self.clf.predict_proba(x)[0]
        risk = float(proba[1]) if len(proba) > 1 else float(proba[0])

        # Explainability: rank features by importance
        importances = self.clf.feature_importances_
        ranked = sorted(
            zip(self.feature_order, importances, x.flatten()),
            key=lambda t: t[1],
            reverse=True,
        )
        top_features = [
            {"feature": f, "importance": round(float(imp), 3), "value": round(float(val), 3)}
            for f, imp, val in ranked[:3]
        ]
        return {"modality": self.modality, "risk_score": risk, "top_features": top_features}

    def save(self, path: str):
        joblib.dump(self.clf, path)

    def load(self, path: str):
        self.clf = joblib.load(path)
        self._fitted = True
        return self


def build_biomarker_models() -> dict:
    """Factory returning one untrained model per non-imaging modality."""
    return {
        "speech": BiomarkerRiskModel("speech", SPEECH_FEATURES),
        "motor": BiomarkerRiskModel("motor", MOTOR_FEATURES),
        "cognitive": BiomarkerRiskModel("cognitive", COGNITIVE_FEATURES),
        "ocular": BiomarkerRiskModel("ocular", OCULAR_FEATURES),
    }


if __name__ == "__main__":
    from data_synth import make_dataset

    ds = make_dataset(n_per_class=80)
    split = int(0.8 * len(ds))
    train, test = ds[:split], ds[split:]

    models = build_biomarker_models()
    for name, model in models.items():
        model.fit([r[name] for r in train], [r["label"] for r in train])
        correct = 0
        for r in test:
            pred = model.predict_risk(r[name])["risk_score"] > 0.5
            correct += int(pred == bool(r["label"]))
        print(f"{name:10s} holdout accuracy: {correct}/{len(test)}")

    example = test[0]
    print("\nExample speech prediction:", models["speech"].predict_risk(example["speech"]))
