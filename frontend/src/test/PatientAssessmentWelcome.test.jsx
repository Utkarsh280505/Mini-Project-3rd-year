import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PatientAssessmentWelcome from '../pages/PatientAssessmentWelcome';

describe('PatientAssessmentWelcome', () => {
  it('describes the assessment and asks the user to sign in before starting', () => {
    const onStart = vi.fn();
    render(<PatientAssessmentWelcome onStart={onStart} />);

    expect(screen.getByRole('heading', { name: /start your screening assessment/i })).toBeInTheDocument();
    expect(screen.getByText(/speech, movement, eye-tracking, cognitive, and imaging activities/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /sign in or create an account/i }));

    expect(onStart).toHaveBeenCalledOnce();
  });
});
