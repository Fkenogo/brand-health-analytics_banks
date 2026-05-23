import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KpiCardAnalysisFooter } from './KpiCardAnalysisFooter';
import type { AwarenessInsightResult } from '@/utils/awarenessInsights';

const mockInsight: AwarenessInsightResult = {
  snapshot: 'Strong awareness snapshot text here.',
  detail: 'SECTION ONE: First section body text.\n\nSECTION TWO: Second section body text.',
};

const defaultProps = {
  insight: mockInsight,
  title: 'Aided Awareness',
};

describe('KpiCardAnalysisFooter', () => {
  it('renders snapshot text', () => {
    render(<KpiCardAnalysisFooter {...defaultProps} />);
    expect(screen.getByText('Strong awareness snapshot text here.')).toBeInTheDocument();
  });

  it('renders "VIEW DETAILED ANALYSIS ▼" button', () => {
    render(<KpiCardAnalysisFooter {...defaultProps} />);
    expect(screen.getByRole('button', { name: /VIEW DETAILED ANALYSIS/i })).toBeInTheDocument();
  });

  it('modal is NOT visible before clicking the button', () => {
    render(<KpiCardAnalysisFooter {...defaultProps} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('modal opens after clicking the button', () => {
    render(<KpiCardAnalysisFooter {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /VIEW DETAILED ANALYSIS/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('modal title is rendered after clicking the button', () => {
    render(<KpiCardAnalysisFooter {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /VIEW DETAILED ANALYSIS/i }));
    expect(screen.getByText('Aided Awareness')).toBeInTheDocument();
  });
});
