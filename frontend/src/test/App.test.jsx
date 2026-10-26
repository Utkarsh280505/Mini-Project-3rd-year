import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('NeuroEarly AI Frontend App', () => {
  it('renders application brand title', () => {
    render(<App />);
    const elements = screen.getAllByText(/NEUROEARLY/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('opens the patient assessment welcome page from navigation', async () => {
    localStorage.removeItem('token');
    render(<App />);

    const assessmentButtons = await screen.findAllByRole('button', { name: /patient assessment/i });
    fireEvent.click(assessmentButtons[0]);

    expect(await screen.findByRole('heading', { name: /start your screening assessment/i })).toBeInTheDocument();
  });
});
