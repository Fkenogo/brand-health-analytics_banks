import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsageIntelligenceBanner } from './UsageIntelligenceBanner';
import type { AwarenessInsightResult } from '@/utils/awarenessInsights';

const mockSummary: AwarenessInsightResult = {
  snapshot: 'Leaky Bucket pattern: High acquisition but low retention — the bank is winning new customers but failing to keep them engaged after onboarding.',
  detail: 'USAGE PATTERN — LEAKY BUCKET: High acquisition but low retention...\n\nSTRATEGIC FOCUS: Improve onboarding and early engagement.',
};

describe('UsageIntelligenceBanner', () => {
  it('renders without crashing when moduleSummary is null', () => {
    render(
      <UsageIntelligenceBanner
        moduleSummary={null}
        retentionRate={null}
        bumoPenetration={null}
        multiBankingPct={null}
        positionLabel="N/A"
        sampleSize={200}
      />
    );
    // Fallback tag shows "USAGE INTELLIGENCE" (all-caps), center header shows "Usage Intelligence"
    expect(screen.getByText('USAGE INTELLIGENCE')).toBeInTheDocument();
  });

  it('renders stat labels: Retention Rate, Preferred Bank Rate, Multi-Banking', () => {
    render(
      <UsageIntelligenceBanner
        moduleSummary={null}
        retentionRate={null}
        bumoPenetration={null}
        multiBankingPct={null}
        positionLabel="N/A"
        sampleSize={200}
      />
    );
    expect(screen.getByText(/Retention Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Preferred Bank Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Multi-Banking/i)).toBeInTheDocument();
  });

  it('renders formatted retention rate (72.5 → "72.5%")', () => {
    render(
      <UsageIntelligenceBanner
        moduleSummary={mockSummary}
        retentionRate={72.5}
        bumoPenetration={45.0}
        multiBankingPct={30.0}
        positionLabel="Uganda"
        sampleSize={300}
      />
    );
    expect(screen.getByText('72.5%')).toBeInTheDocument();
  });

  it('renders formatted bumoPenetration (45.0 → "45%")', () => {
    render(
      <UsageIntelligenceBanner
        moduleSummary={mockSummary}
        retentionRate={72.5}
        bumoPenetration={45.0}
        multiBankingPct={30.0}
        positionLabel="Uganda"
        sampleSize={300}
      />
    );
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('shows "—" for null retentionRate', () => {
    render(
      <UsageIntelligenceBanner
        moduleSummary={null}
        retentionRate={null}
        bumoPenetration={null}
        multiBankingPct={null}
        positionLabel="Uganda"
        sampleSize={300}
      />
    );
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the snapshot takeaway text when moduleSummary has a snapshot', () => {
    render(
      <UsageIntelligenceBanner
        moduleSummary={mockSummary}
        retentionRate={72.5}
        bumoPenetration={45.0}
        multiBankingPct={30.0}
        positionLabel="Uganda"
        sampleSize={300}
      />
    );
    expect(screen.getByText(/High acquisition but low retention/i)).toBeInTheDocument();
  });

  it('shows pattern tag text when snapshot has a recognisable pattern', () => {
    render(
      <UsageIntelligenceBanner
        moduleSummary={mockSummary}
        retentionRate={72.5}
        bumoPenetration={45.0}
        multiBankingPct={30.0}
        positionLabel="Uganda"
        sampleSize={300}
      />
    );
    expect(screen.getByText(/Leaky Bucket pattern/i)).toBeInTheDocument();
  });

  it('shows fallback tag "USAGE INTELLIGENCE" when moduleSummary is null', () => {
    render(
      <UsageIntelligenceBanner
        moduleSummary={null}
        retentionRate={null}
        bumoPenetration={null}
        multiBankingPct={null}
        positionLabel="N/A"
        sampleSize={200}
      />
    );
    // Exact all-caps match for fallback tag (distinct from center header "Usage Intelligence")
    expect(screen.getByText('USAGE INTELLIGENCE')).toBeInTheDocument();
  });

  it('shows N= and sampleSize in the output', () => {
    render(
      <UsageIntelligenceBanner
        moduleSummary={null}
        retentionRate={null}
        bumoPenetration={null}
        multiBankingPct={null}
        positionLabel="N/A"
        sampleSize={150}
      />
    );
    expect(screen.getByText(/150/)).toBeInTheDocument();
    expect(screen.getByText(/N=/)).toBeInTheDocument();
  });

  it('shows positionLabel when it is not "N/A"', () => {
    render(
      <UsageIntelligenceBanner
        moduleSummary={null}
        retentionRate={null}
        bumoPenetration={null}
        multiBankingPct={null}
        positionLabel="Kenya"
        sampleSize={250}
      />
    );
    expect(screen.getByText(/Kenya/i)).toBeInTheDocument();
  });

  it('does NOT show "N/A" as a standalone label when positionLabel is "N/A"', () => {
    render(
      <UsageIntelligenceBanner
        moduleSummary={null}
        retentionRate={null}
        bumoPenetration={null}
        multiBankingPct={null}
        positionLabel="N/A"
        sampleSize={200}
      />
    );
    // The location label should just be "N=200", not contain "N/A"
    expect(screen.queryByText('N/A')).toBeNull();
  });
});
