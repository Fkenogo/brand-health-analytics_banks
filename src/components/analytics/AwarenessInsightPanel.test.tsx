import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AwarenessInsightPanel } from './AwarenessInsightPanel';
import type { AwarenessInsightResult } from '@/utils/awarenessInsights';

const mockInsight: AwarenessInsightResult = {
  snapshot: 'Market leader in first-recall — this brand anchors the category.',
  detail: 'MARKET INTERPRETATION: At 35.0%, this brand commands first-recall dominance.\n\nSTRATEGIC IMPLICATION: The priority shifts from growing top-of-mind to defending and deepening it.',
};

describe('AwarenessInsightPanel', () => {
  it('renders nothing when insight is null', () => {
    const { container } = render(<AwarenessInsightPanel insight={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows snapshot text without any click', () => {
    render(<AwarenessInsightPanel insight={mockInsight} />);
    expect(screen.getByText(mockInsight.snapshot)).toBeInTheDocument();
  });

  it('shows FULL ANALYSIS button by default', () => {
    render(<AwarenessInsightPanel insight={mockInsight} />);
    expect(screen.getByRole('button', { name: /FULL ANALYSIS/i })).toBeInTheDocument();
  });

  it('opens modal with detail content when button is clicked', () => {
    render(<AwarenessInsightPanel insight={mockInsight} />);
    fireEvent.click(screen.getByRole('button', { name: /FULL ANALYSIS/i }));
    expect(screen.getByText(/STRATEGIC IMPLICATION/i)).toBeInTheDocument();
  });

  it('button label stays FULL ANALYSIS after clicking (modal pattern, no toggle)', () => {
    render(<AwarenessInsightPanel insight={mockInsight} />);
    fireEvent.click(screen.getByRole('button', { name: /FULL ANALYSIS/i }));
    expect(screen.getByRole('button', { name: /FULL ANALYSIS/i })).toBeInTheDocument();
  });

  it('renders the definition line when definition prop is provided', () => {
    render(<AwarenessInsightPanel insight={mockInsight} definition="The first brand recalled without prompting." />);
    expect(screen.getByText(/The first brand recalled without prompting/i)).toBeInTheDocument();
  });

  it('does not render the definition line when definition prop is absent', () => {
    render(<AwarenessInsightPanel insight={mockInsight} />);
    expect(screen.queryByText(/What this measures/i)).toBeNull();
  });
});
