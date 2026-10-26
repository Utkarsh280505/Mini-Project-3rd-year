import unittest

from fusion_engine import FusionRiskEngine


class StubClassifier:
    def __init__(self):
        self.calls = 0

    def predict_proba(self, features):
        self.calls += 1
        return [[0.2, 0.8]]


class FusionRiskEngineTests(unittest.TestCase):
    def setUp(self):
        self.engine = FusionRiskEngine()
        self.engine._fitted = True
        self.engine.clf = StubClassifier()

    def test_partial_scores_use_only_available_modalities(self):
        result = self.engine.fuse({'speech': 0.2, 'cognitive': 0.8})

        self.assertEqual(result['fused_risk_score'], 0.5)
        self.assertEqual(result['modalities_used'], ['speech', 'cognitive'])
        self.assertEqual(result['modality_scores'], {'speech': 0.2, 'cognitive': 0.8})
        self.assertEqual(result['fusion_method'], 'mean_available_modalities')
        self.assertEqual(self.engine.clf.calls, 0)

    def test_complete_scores_keep_the_trained_fusion_model(self):
        scores = {
            'imaging': 0.1,
            'speech': 0.2,
            'motor': 0.3,
            'cognitive': 0.4,
            'ocular': 0.5,
        }
        result = self.engine.fuse(scores)

        self.assertEqual(result['fused_risk_score'], 0.8)
        self.assertEqual(result['fusion_method'], 'trained_meta_model')
        self.assertEqual(self.engine.clf.calls, 1)

    def test_empty_scores_are_rejected(self):
        with self.assertRaisesRegex(ValueError, 'At least one modality score is required'):
            self.engine.fuse({})

    def test_out_of_range_scores_are_rejected(self):
        with self.assertRaisesRegex(ValueError, 'between 0 and 1'):
            self.engine.fuse({'speech': 1.1})


if __name__ == '__main__':
    unittest.main()
