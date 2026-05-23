import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InsightModal } from './InsightModal';
import type { AwarenessInsightResult } from '@/utils/awarenessInsights';

const mockInsight: AwarenessInsightResult = {
  snapshot: 'Strong awareness snapshot text here.',
  detail: 'SECTION ONE: First section body text.\n\nSECTION TWO: Second section body text.',
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  insight: mockInsight,
  title: 'Aided Awareness',
};

describe('InsightModal', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <InsightModal {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders title when isOpen is true', () => {
    render(<InsightModal {...defaultProps} />);
    expect(screen.getByText('Aided Awareness')).toBeInTheDocument();
  });

  it('renders workspace label', () => {
    render(<InsightModal {...defaultProps} />);
    expect(screen.getByText('Executive Intelligence Workspace')).toBeInTheDocument();
  });

  it('renders "Executive Takeaway" and snapshot text', () => {
    render(<InsightModal {...defaultProps} />);
    expect(screen.getByText('Executive Takeaway')).toBeInTheDocument();
    expect(screen.getByText('Strong awareness snapshot text here.')).toBeInTheDocument();
  });

  it('renders section headings from detail', () => {
    render(<InsightModal {...defaultProps} />);
    expect(screen.getByText('SECTION ONE')).toBeInTheDocument();
    expect(screen.getByText('SECTION TWO')).toBeInTheDocument();
  });

  it('calls onClose when ✕ button is clicked', () => {
    const onClose = vi.fn();
    render(<InsightModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Close analysis/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders definition strip when definition prop provided', () => {
    render(
      <InsightModal {...defaultProps} definition="Percentage of respondents who recognise the brand." />
    );
    expect(screen.getByText(/What this measures:/i)).toBeInTheDocument();
    expect(screen.getByText(/Percentage of respondents who recognise the brand\./i)).toBeInTheDocument();
  });

  it('does not render definition strip when no definition prop provided', () => {
    render(<InsightModal {...defaultProps} />);
    expect(screen.queryByText(/What this measures:/i)).toBeNull();
  });

  it('click outside backdrop calls onClose', () => {
    const onClose = vi.fn();
    render(<InsightModal {...defaultProps} onClose={onClose} />);
    // Portal renders into document.body — the backdrop is the dialog's parent element
    const backdrop = screen.getByRole('dialog').parentElement as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
