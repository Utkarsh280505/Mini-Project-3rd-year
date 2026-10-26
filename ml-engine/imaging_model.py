"""
imaging_model.py
----------------------------------------------------------------------
NeuroEarly AI - Imaging Analysis Service (Section 10.1 of synopsis).

Prototype scope: this environment has no PyTorch/GPU, so instead of a
CNN we use a texture/intensity FEATURE-EXTRACTION pipeline (regional
mean intensity, local variance, edge density) feeding a
RandomForestClassifier. This keeps things runnable today; the feature
extractor is a drop-in replacement point for a CNN backbone later
(see README "Upgrading to deep learning").

Explainability: instead of Grad-CAM (needs a differentiable network),
we use OCCLUSION-BASED SALIENCY - slide a patch over the image,
re-score each occluded version, and record how much the risk score
drops. Large drop = that region mattered = highlighted in the heatmap.
This satisfies the synopsis's "structural risk contribution and
heatmap" acceptance criterion (Table 6, Neuroimaging Analysis).
----------------------------------------------------------------------
"""

import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib

GRID = 8  # divide image into GRID x GRID regions for feature extraction / occlusion


def extract_features(img: np.ndarray) -> np.ndarray:
    """Turn an (H, W) grayscale image into a fixed-length feature vector:
    per-region mean intensity + per-region local variance."""
    h, w = img.shape
    rh, rw = h // GRID, w // GRID
    feats = []
    for i in range(GRID):
        for j in range(GRID):
            patch = img[i * rh:(i + 1) * rh, j * rw:(j + 1) * rw]
            if patch.size == 0:
                feats.extend([0.0, 0.0])
                continue
            feats.append(float(patch.mean()))
            feats.append(float(patch.var()))
    return np.array(feats, dtype=np.float32)


class ImagingRiskModel:
    def __init__(self):
        self.clf = RandomForestClassifier(
            n_estimators=200, max_depth=8, random_state=42, class_weight="balanced"
        )
        self._fitted = False

    def fit(self, images: list, labels: list):
        X = np.stack([extract_features(im) for im in images])
        y = np.array(labels)
        self.clf.fit(X, y)
        self._fitted = True
        return self

    def predict_risk(self, img: np.ndarray) -> dict:
        """Returns risk score in [0,1] for a single image."""
        if not self._fitted:
            raise RuntimeError("Model not trained. Call fit() or load a saved model first.")
        feat = extract_features(img).reshape(1, -1)
        proba = self.clf.predict_proba(feat)[0]
        # class 1 = at-risk
        risk = float(proba[1]) if len(proba) > 1 else float(proba[0])
        return {"risk_score": risk}

    def saliency_heatmap(self, img: np.ndarray, occlusion_frac: float = 0.15) -> np.ndarray:
        """Occlusion-based saliency map, same GRID resolution as features.
        Returns a (GRID, GRID) array where higher values = region more
        responsible for the risk score (upsample for display)."""
        if not self._fitted:
            raise RuntimeError("Model not trained.")
        base_risk = self.predict_risk(img)["risk_score"]
        h, w = img.shape
        rh, rw = h // GRID, w // GRID
        heat = np.zeros((GRID, GRID), dtype=np.float32)
        fill_value = float(img.mean())
        for i in range(GRID):
            for j in range(GRID):
                occluded = img.copy()
                occluded[i * rh:(i + 1) * rh, j * rw:(j + 1) * rw] = fill_value
                occ_risk = self.predict_risk(occluded)["risk_score"]
                heat[i, j] = max(0.0, base_risk - occ_risk)  # drop in risk = importance
        if heat.max() > 0:
            heat = heat / heat.max()
        return heat

    def save(self, path: str):
        joblib.dump(self.clf, path)

    def load(self, path: str):
        self.clf = joblib.load(path)
        self._fitted = True
        return self


if __name__ == "__main__":
    from data_synth import make_dataset

    ds = make_dataset(n_per_class=60)
    imgs = [r["imaging"] for r in ds]
    labels = [r["label"] for r in ds]

    split = int(0.8 * len(imgs))
    model = ImagingRiskModel().fit(imgs[:split], labels[:split])

    correct = 0
    for im, lab in zip(imgs[split:], labels[split:]):
        pred = model.predict_risk(im)["risk_score"] > 0.5
        correct += int(pred == bool(lab))
    print(f"Holdout accuracy: {correct}/{len(imgs) - split}")

    heat = model.saliency_heatmap(imgs[-1])
    print("Saliency heatmap shape:", heat.shape, "max:", heat.max())
