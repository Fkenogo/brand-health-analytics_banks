import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SectionAnalysisBlock } from './SectionAnalysisBlock';
import type { AwarenessInsightResult } from '@/utils/awarenessInsights';

const mockInsight: AwarenessInsightResult = {
  snapshot: 'The funnel reveals a conversion gap between awareness and salience.',
  detail: [
    'FUNNEL PROFILE: The aware base converts at 50% to spontaneous recall.',
    'MARKET CONTEXT: The brand reaches consumers but lacks active recall.',
    'COMPETITIVE POSITION: Category leaders convert 50-60% spontaneously.',
    'CONSUMER SIGNAL: Most consumers recognise but do not recall first.',
    'OPPORTUNITY/RISK: Risk — passive awareness decays faster.',
    'STRATEGIC PRIORITY: Shift investment from reach to distinctiveness.',
  ].join('\n\n'),
};

describe('SectionAnalysisBlock', () => {
  it('renders nothing when insight is null', () => {
    const { container } = render(
      <SectionAnalysisBlock title="Funnel Analysis" insight={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the title', () => {
    render(<SectionAnalysisBlock title="Funnel Analysis" insight={mockInsight} />);
    expect(screen.getByText(/Funnel Analysis/i)).toBeInTheDocument();
  });

  it('renders snapshot text in collapsed state', () => {
    render(<SectionAnalysisBlock title="Funnel Analysis" insight={mockInsight} />);
    expect(screen.getByText(mockInsight.snapshot)).toBeInTheDocument();
  });

  it('shows VIEW DETAILED ANALYSIS button in collapsed state', () => {
    render(<SectionAnalysisBlock title="Funnel Analysis" insight={mockInsight} />);
    expect(screen.getByRole('button', { name: /VIEW DETAILED ANALYSIS/i })).toBeInTheDocument();
  });

  it('does not show section headings before expanding', () => {
    render(<SectionAnalysisBlock title="Funnel Analysis" insight={mockInsight} />);
    expect(screen.queryByText('FUNNEL PROFILE')).toBeNull();
  });

  it('opens modal with section headings after clicking expand', () => {
    render(<SectionAnalysisBlock title="Funnel Analysis" insight={mockInsight} />);
    fireEvent.click(screen.getByRole('button', { name: /VIEW DETAILED ANALYSIS/i }));
    expect(screen.getByText('FUNNEL PROFILE')).toBeInTheDocument();
    expect(screen.getByText('MARKET CONTEXT')).toBeInTheDocument();
    expect(screen.getByText('COMPETITIVE POSITION')).toBeInTheDocument();
  });

  it('button label stays VIEW DETAILED ANALYSIS after clicking (modal pattern, no toggle)', () => {
    render(<SectionAnalysisBlock title="Funnel Analysis" insight={mockInsight} />);
    fireEvent.click(screen.getByRole('button', { name: /VIEW DETAILED ANALYSIS/i }));
    expect(screen.getByRole('button', { name: /VIEW DETAILED ANALYSIS/i })).toBeInTheDocument();
  });

  it('modal closes and hides section grid when close button is clicked', () => {
    render(<SectionAnalysisBlock title="Funnel Analysis" insight={mockInsight} />);
    fireEvent.click(screen.getByRole('button', { name: /VIEW DETAILED ANALYSIS/i }));
    expect(screen.getByText('FUNNEL PROFILE')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Close analysis/i }));
    expect(screen.queryByText('FUNNEL PROFILE')).toBeNull();
  });

  it('renders OPPORTUNITY/RISK heading correctly (slash in name)', () => {
    render(<SectionAnalysisBlock title="Funnel Analysis" insight={mockInsight} />);
    fireEvent.click(screen.getByRole('button', { name: /VIEW DETAILED ANALYSIS/i }));
    expect(screen.getByText('OPPORTUNITY/RISK')).toBeInTheDocument();
  });
});
