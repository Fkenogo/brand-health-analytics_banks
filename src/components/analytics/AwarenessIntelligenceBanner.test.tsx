import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AwarenessIntelligenceBanner } from './AwarenessIntelligenceBanner';
import type { AwarenessInsightResult } from '@/utils/awarenessInsights';

const mockSummary: AwarenessInsightResult = {
  snapshot: 'Awareness pattern: Salience Leader. Strong top-of-mind and high awareness quality position this brand as a salience leader.',
  detail: 'AWARENESS PATTERN — SALIENCE LEADER: Strong top-of-mind...\n\nSTRATEGIC FOCUS: Defend the position.',
};

describe('AwarenessIntelligenceBanner', () => {
  it('extracts and renders the pattern name from snapshot', () => {
    render(
      <AwarenessIntelligenceBanner
        moduleSummary={mockSummary}
        totalAwareness={72}
        topOfMind={12}
        awarenessQuality={16.7}
        country="burundi"
        sampleSize={147}
      />
    );
    expect(screen.getByText(/Salience Leader/i)).toBeInTheDocument();
  });

  it('renders takeaway text (snapshot without the pattern prefix)', () => {
    render(
      <AwarenessIntelligenceBanner
        moduleSummary={mockSummary}
        totalAwareness={72}
        topOfMind={12}
        awarenessQuality={16.7}
        country="burundi"
        sampleSize={147}
      />
    );
    expect(screen.getByText(/Strong top-of-mind and high awareness quality/i)).toBeInTheDocument();
  });

  it('renders totalAwareness value', () => {
    render(
      <AwarenessIntelligenceBanner
        moduleSummary={mockSummary}
        totalAwareness={72}
        topOfMind={12}
        awarenessQuality={16.7}
        country="burundi"
        sampleSize={147}
      />
    );
    expect(screen.getByText('72%')).toBeInTheDocument();
  });

  it('renders topOfMind value', () => {
    render(
      <AwarenessIntelligenceBanner
        moduleSummary={mockSummary}
        totalAwareness={72}
        topOfMind={12}
        awarenessQuality={16.7}
        country="burundi"
        sampleSize={147}
      />
    );
    expect(screen.getByText('12%')).toBeInTheDocument();
  });

  it('renders em dash for null metric values', () => {
    render(
      <AwarenessIntelligenceBanner
        moduleSummary={mockSummary}
        totalAwareness={null}
        topOfMind={null}
        awarenessQuality={null}
        country="burundi"
        sampleSize={147}
      />
    );
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it('renders country and sampleSize', () => {
    render(
      <AwarenessIntelligenceBanner
        moduleSummary={mockSummary}
        totalAwareness={72}
        topOfMind={12}
        awarenessQuality={16.7}
        country="burundi"
        sampleSize={147}
      />
    );
    expect(screen.getByText(/burundi/i)).toBeInTheDocument();
    expect(screen.getByText(/147/)).toBeInTheDocument();
  });

  it('renders metric cards even when moduleSummary is null', () => {
    render(
      <AwarenessIntelligenceBanner
        moduleSummary={null}
        totalAwareness={72}
        topOfMind={12}
        awarenessQuality={16.7}
        country="burundi"
        sampleSize={147}
      />
    );
    expect(screen.getByText('72%')).toBeInTheDocument();
    expect(screen.queryByText(/Salience Leader/i)).toBeNull();
  });
});
