"""
data_synth.py
----------------------------------------------------------------------
NeuroEarly AI - synthetic multimodal data generator.

Real neurological datasets (ADNI, PPMI) require registration/approval
and are not reachable from this environment, so this module generates
STRUCTURALLY REALISTIC synthetic data for each modality:

  - imaging   : 2D "MRI-like" slices (grayscale arrays) with a
                simulated atrophy/lesion patch for at-risk patients
  - speech    : acoustic-style summary features (jitter, shimmer,
                pause ratio, pitch variability, speech rate)
  - motor     : gait/tremor features (stride variability, tremor
                amplitude, reaction time)
  - cognitive : MMSE/MoCA-style subtest scores

Swap `make_dataset()` for a real data loader later - every downstream
module (imaging_model, biomarker_model, fusion_engine) only depends
on the feature/label shapes defined here, not on this file.
----------------------------------------------------------------------
"""

import numpy as np

RNG = np.random.default_rng(42)

IMAGE_SIZE = 64  # keep small: this is a feature-extraction pipeline, not a CNN

SPEECH_FEATURES = ["jitter", "shimmer", "pause_ratio", "pitch_var", "speech_rate"]
MOTOR_FEATURES = ["stride_var", "tremor_amp", "reaction_time_ms", "gait_speed"]
COGNITIVE_FEATURES = ["mmse_score", "moca_score", "recall_score", "attention_score"]
OCULAR_FEATURES = ["saccade_velocity", "fixation_duration_ms", "gaze_deviation", "blink_rate"]


def _make_mri_slice(at_risk: bool) -> np.ndarray:
    """Simulate a grayscale MRI-like slice. At-risk patients get an
    extra low-intensity patch standing in for hippocampal atrophy."""
    base = RNG.normal(loc=0.5, scale=0.08, size=(IMAGE_SIZE, IMAGE_SIZE))
    # simulate brain-like circular mask
    yy, xx = np.mgrid[0:IMAGE_SIZE, 0:IMAGE_SIZE]
    center = IMAGE_SIZE // 2
    mask = (xx - center) ** 2 + (yy - center) ** 2 <= (center - 4) ** 2
    img = np.zeros((IMAGE_SIZE, IMAGE_SIZE))
    img[mask] = base[mask]

    if at_risk:
        # darker patch = simulated atrophy region, placed with some jitter
        px = center + RNG.integers(-10, 10)
        py = center + RNG.integers(-6, 6)
        r = RNG.integers(6, 10)
        yy2, xx2 = np.mgrid[0:IMAGE_SIZE, 0:IMAGE_SIZE]
        patch = (xx2 - px) ** 2 + (yy2 - py) ** 2 <= r ** 2
        img[patch & mask] *= 0.45  # intensity drop

    img = np.clip(img, 0, 1)
    return img.astype(np.float32)


def _make_speech(at_risk: bool) -> dict:
    shift = 1.0 if at_risk else 0.0
    return {
        "jitter": float(RNG.normal(0.4 + 0.5 * shift, 0.1)),
        "shimmer": float(RNG.normal(0.3 + 0.4 * shift, 0.1)),
        "pause_ratio": float(RNG.normal(0.15 + 0.25 * shift, 0.05)),
        "pitch_var": float(RNG.normal(0.5 - 0.2 * shift, 0.1)),
        "speech_rate": float(RNG.normal(3.5 - 0.9 * shift, 0.4)),
    }


def _make_motor(at_risk: bool) -> dict:
    shift = 1.0 if at_risk else 0.0
    return {
        "stride_var": float(RNG.normal(0.12 + 0.2 * shift, 0.04)),
        "tremor_amp": float(RNG.normal(0.2 + 0.5 * shift, 0.08)),
        "reaction_time_ms": float(RNG.normal(280 + 160 * shift, 40)),
        "gait_speed": float(RNG.normal(1.2 - 0.4 * shift, 0.15)),
    }


def _make_cognitive(at_risk: bool) -> dict:
    shift = 1.0 if at_risk else 0.0
    return {
        "mmse_score": float(np.clip(RNG.normal(29 - 6 * shift, 1.5), 0, 30)),
        "moca_score": float(np.clip(RNG.normal(28 - 7 * shift, 1.8), 0, 30)),
        "recall_score": float(np.clip(RNG.normal(9 - 4 * shift, 1.2), 0, 10)),
        "attention_score": float(np.clip(RNG.normal(9 - 3 * shift, 1.0), 0, 10)),
    }


def _make_ocular(at_risk: bool) -> dict:
    shift = 1.0 if at_risk else 0.0
    return {
        "saccade_velocity": float(RNG.normal(350 - 120 * shift, 30)), # deg/sec
        "fixation_duration_ms": float(RNG.normal(220 + 90 * shift, 25)),
        "gaze_deviation": float(RNG.normal(0.8 + 1.2 * shift, 0.3)), # deg error
        "blink_rate": float(RNG.normal(14 + 10 * shift, 3)), # blinks/min
    }


def make_patient(at_risk: bool, patient_id: str) -> dict:
    """Return one synthetic multimodal patient record."""
    return {
        "patient_id": patient_id,
        "label": int(at_risk),
        "imaging": _make_mri_slice(at_risk),
        "speech": _make_speech(at_risk),
        "motor": _make_motor(at_risk),
        "cognitive": _make_cognitive(at_risk),
        "ocular": _make_ocular(at_risk),
    }


def make_dataset(n_per_class: int = 150, seed: int = 42) -> list:
    """Balanced synthetic dataset: n_per_class healthy + n_per_class at-risk."""
    global RNG
    RNG = np.random.default_rng(seed)
    records = []
    for i in range(n_per_class):
        records.append(make_patient(False, f"H{i:04d}"))
    for i in range(n_per_class):
        records.append(make_patient(True, f"R{i:04d}"))
    idx = RNG.permutation(len(records))
    return [records[i] for i in idx]


if __name__ == "__main__":
    ds = make_dataset(5)
    print(f"Generated {len(ds)} synthetic patients")
    print("Example record keys:", list(ds[0].keys()))
    print("Example speech features:", ds[0]["speech"])
