import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../services/apiClient';
import ClinicianDashboard from '../pages/ClinicianDashboard';

vi.mock('../services/apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

vi.mock('../components/NeuroBrain3D', () => ({
  default: () => null
}));

describe('ClinicianDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockImplementation((path) => {
      if (path === '/patients') {
        return Promise.resolve({
          data: [{ id: 1, user: { name: 'Demo Patient' }, age: 55, gender: 'Not specified', sessions: [] }]
        });
      }
      if (path === '/sessions/session-id') {
        return Promise.resolve({
          data: {
            id: 'session-id',
            status: 'CAPTURING',
            modalityData: [{
              id: 'measurement-id',
              modality: 'motor',
              source: 'collected',
              rawDataJson: JSON.stringify({ instrument: 'External gait sensor' }),
              featureVectorJson: JSON.stringify({ gait_speed: 1.1 }),
              createdAt: '2026-01-01T00:00:00.000Z'
            }]
          }
        });
      }
      throw new Error(`Unexpected GET request: ${path}`);
    });
    apiClient.post.mockImplementation((path) => {
      if (path === '/sessions') {
        return Promise.resolve({ data: { id: 'session-id' } });
      }
      if (path === '/assessments/clinical-measurements') {
        return Promise.resolve({ data: { notice: 'saved' } });
      }
      throw new Error(`Unexpected POST request: ${path}`);
    });
  });

  it('submits a sourced motor value as collected and displays it without a score', async () => {
    render(<ClinicianDashboard />);

    fireEvent.change(await screen.findByLabelText('Source instrument, device, or report'), {
      target: { value: 'External gait sensor' }
    });
    fireEvent.change(screen.getByLabelText('Gait speed (m/s)'), { target: { value: '1.1' } });
    fireEvent.click(screen.getByRole('button', { name: /save unscored measurement/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/assessments/clinical-measurements', {
        sessionId: 'session-id',
        modality: 'motor',
        instrument: 'External gait sensor',
        record: { gait_speed: 1.1 }
      });
    });
    expect(await screen.findByText(/collected only — not analyzed or scored/i)).toBeInTheDocument();
    expect(screen.getByText(/no model analysis or risk score was generated/i)).toBeInTheDocument();
  });
});
