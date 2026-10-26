import { afterEach, describe, expect, it, vi } from 'vitest';
import { exportClinicalReport } from '../services/reportExporter';

describe('exportClinicalReport', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('exports provenance and does not invent a score for demo-only inputs', () => {
    vi.useFakeTimers();
    const write = vi.fn();
    const print = vi.fn();
    vi.spyOn(window, 'open').mockReturnValue({
      document: { write: write, close: vi.fn() },
      focus: vi.fn(),
      print
    });

    exportClinicalReport({
      riskReport: {
        fusedRiskScore: null,
        riskBand: 'Not generated',
        modalitySources: {
          imaging: 'simulated',
          speech: 'simulated',
          motor: 'not_provided',
          ocular: 'simulated',
          cognitive: 'simulated'
        }
      }
    });
    vi.advanceTimersByTime(400);

    const html = write.mock.calls[0][0];
    expect(html).toContain('DEMO MODE - No screening score available');
    expect(html).not.toContain('NaN%');
    expect(html).toContain('<td style="font-weight: 700;">simulated</td>');
    expect(html).toContain('<td style="font-weight: 700;">not provided</td>');
    expect(print).toHaveBeenCalledOnce();
  });
});
