const axios = require('axios');

const ML_ENGINE_URL = process.env.ML_ENGINE_URL || 'http://localhost:5001';

class MLEngineService {
  static async checkHealth() {
    try {
      const response = await axios.get(`${ML_ENGINE_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('ML Engine health check failed:', error.message);
      return { status: 'offline', error: error.message };
    }
  }

  static async analyzeBiomarker(modality, record) {
    try {
      const response = await axios.post(`${ML_ENGINE_URL}/biomarker/analyze`, {
        modality,
        record
      });
      return response.data;
    } catch (error) {
      console.error(`ML Engine biomarker/analyze failed for ${modality}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.error || `Biomarker analysis failed for ${modality}`);
    }
  }

  static async analyzeImaging(imageMatrix) {
    try {
      const response = await axios.post(`${ML_ENGINE_URL}/imaging/analyze`, {
        image: imageMatrix
      });
      return response.data;
    } catch (error) {
      console.error('ML Engine imaging/analyze failed:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Imaging analysis failed');
    }
  }

  static async generateHeatmap(imageMatrix) {
    try {
      const response = await axios.post(`${ML_ENGINE_URL}/imaging/heatmap`, {
        image: imageMatrix
      });
      return response.data; // { heatmap_png_base64: "...", grid_shape: [...] }
    } catch (error) {
      console.error('ML Engine imaging/heatmap failed:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Heatmap generation failed');
    }
  }

  static async analyzeFusion(modalityScores) {
    try {
      const response = await axios.post(`${ML_ENGINE_URL}/fusion/analyze`, {
        modality_scores: modalityScores
      });
      return response.data;
    } catch (error) {
      console.error('ML Engine fusion/analyze failed:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Fusion analysis failed');
    }
  }

  static async assessFull(payload) {
    try {
      const response = await axios.post(`${ML_ENGINE_URL}/assess/full`, payload);
      return response.data;
    } catch (error) {
      console.error('ML Engine assess/full failed:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Full assessment failed');
    }
  }
}

module.exports = MLEngineService;
