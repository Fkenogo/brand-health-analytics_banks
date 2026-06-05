import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoyaltyBanner } from './LoyaltyBanner';
import type { AwarenessInsightResult } from '@/utils/awarenessInsights';

const mockSummary: AwarenessInsightResult = {
  snapshot: 'Equity Bank holds a solid loyalty position (index 62/100) with moderate advocacy (NPS +22). Growing the committed base is the primary commercial lever.',
  detail: 'LOYALTY POSITION: Index of 62 sits in the solid tier.\n\nCUSTOMER MIX: Committed at 18%, Favors at 22%.',
};

const defaultProps = {
  moduleSummary: mockSummary,
  loyaltyIndex: 62,
  nps: 22,
  committedPct: 18,
  positionLabel: 'SOLID BASE',
  sampleSize: 500,
};

describe('LoyaltyBanner', () => {
  it('renders the position label chip', () => {
    render(<LoyaltyBanner {...defaultProps} />);
    expect(screen.getByText('SOLID BASE')).toBeInTheDocument();
  });

  it('renders the N= sample size', () => {
    render(<LoyaltyBanner {...defaultProps} />);
    expect(screen.getByText('SOLID BASE · N=500')).toBeInTheDocument();
  });

  it('renders the Loyalty Overview label', () => {
    render(<LoyaltyBanner {...defaultProps} />);
    expect(screen.getByText('Loyalty Overview')).toBeInTheDocument();
  });

  it('renders the snapshot takeaway text', () => {
    render(<LoyaltyBanner {...defaultProps} />);
    expect(screen.getByText(mockSummary.snapshot)).toBeInTheDocument();
  });

  it('renders the Loyalty Index stat box', () => {
    render(<LoyaltyBanner {...defaultProps} />);
    expect(screen.getByText('Loyalty Index')).toBeInTheDocument();
    expect(screen.getByText('62')).toBeInTheDocument();
  });

  it('renders the NPS stat box with sign', () => {
    render(<LoyaltyBanner {...defaultProps} />);
    expect(screen.getByText('NPS')).toBeInTheDocument();
    expect(screen.getByText('+22')).toBeInTheDocument();
  });

  it('renders the Committed stat box with percentage', () => {
    render(<LoyaltyBanner {...defaultProps} />);
    expect(screen.getByText('Committed')).toBeInTheDocument();
    expect(screen.getByText('18%')).toBeInTheDocument();
  });

  it('shows fallback chip when positionLabel is N/A', () => {
    render(<LoyaltyBanner {...defaultProps} positionLabel="N/A" />);
    expect(screen.getByText('LOYALTY')).toBeInTheDocument();
  });

  it('shows fallback text when moduleSummary is null', () => {
    render(<LoyaltyBanner {...defaultProps} moduleSummary={null} />);
    expect(screen.getByText('No loyalty data available for this selection.')).toBeInTheDocument();
  });

  it('shows em-dash for null loyalty index', () => {
    render(<LoyaltyBanner {...defaultProps} loyaltyIndex={null} />);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('renders negative NPS with minus sign', () => {
    render(<LoyaltyBanner {...defaultProps} nps={-8} />);
    expect(screen.getByText('-8')).toBeInTheDocument();
  });
});
