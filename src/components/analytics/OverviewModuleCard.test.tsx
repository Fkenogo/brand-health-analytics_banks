import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OverviewModuleCard } from './OverviewModuleCard';

const baseProps = {
  title: 'Awareness & Consideration',
  metric: '72%',
  metricLabel: 'awareness',
  statusLabel: 'Strong reach',
  statusTone: 'positive' as const,
  snapshot: 'The brand reaches 72% of the market with strong top-of-mind recall.',
  onOpen: vi.fn(),
};

describe('OverviewModuleCard', () => {
  it('renders module title, metric, and status label', () => {
    render(<OverviewModuleCard {...baseProps} />);
    expect(screen.getByText('Awareness & Consideration')).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
    expect(screen.getByText('awareness')).toBeInTheDocument();
    expect(screen.getByText('Strong reach')).toBeInTheDocument();
  });

  it('strips a leading "Label: " prefix from snapshot text', () => {
    render(
      <OverviewModuleCard
        {...baseProps}
        snapshot="Leaky Bucket: Acquisition is working but retention is failing."
      />,
    );
    expect(screen.getByText(/Acquisition is working but retention is failing/)).toBeInTheDocument();
    expect(screen.queryByText(/Leaky Bucket/)).not.toBeInTheDocument();
  });

  it('capitalises the first character after prefix stripping', () => {
    render(
      <OverviewModuleCard
        {...baseProps}
        snapshot="Leaky Bucket: trial conversion is strong but retention is weak."
      />,
    );
    // "trial conversion..." should be capitalised to "Trial conversion..."
    expect(screen.getByText(/^Trial conversion is strong/)).toBeInTheDocument();
  });

  it('capitalises first character when there is no prefix to strip', () => {
    render(
      <OverviewModuleCard
        {...baseProps}
        snapshot="the brand reaches a large share of the market."
      />,
    );
    expect(screen.getByText(/^The brand reaches/)).toBeInTheDocument();
  });

  it('truncates long snapshot text and adds ellipsis', () => {
    const long = 'A '.repeat(100); // 200 chars
    render(<OverviewModuleCard {...baseProps} snapshot={long} />);
    const text = screen.getByText(/…/);
    expect(text).toBeInTheDocument();
  });

  it('shows fallback text when snapshot is null', () => {
    render(<OverviewModuleCard {...baseProps} snapshot={null} />);
    expect(screen.getByText('No summary available yet.')).toBeInTheDocument();
  });

  it('calls onOpen when the action button is clicked', () => {
    const onOpen = vi.fn();
    render(<OverviewModuleCard {...baseProps} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: /open report/i }));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('applies positive badge classes for positive tone', () => {
    const { container } = render(<OverviewModuleCard {...baseProps} statusTone="positive" />);
    const badge = container.querySelector('.bg-emerald-50');
    expect(badge).toBeTruthy();
  });

  it('applies negative badge classes for negative tone', () => {
    render(
      <OverviewModuleCard
        {...baseProps}
        statusTone="negative"
        statusLabel="Needs attention"
      />,
    );
    expect(screen.getByText('Needs attention').className).toContain('bg-rose-50');
  });

  it('applies neutral badge classes for neutral tone', () => {
    render(
      <OverviewModuleCard
        {...baseProps}
        statusTone="neutral"
        statusLabel="Steady"
      />,
    );
    expect(screen.getByText('Steady').className).toContain('bg-[#F9FAFB]');
  });

  it('renders correctly with empty metricLabel', () => {
    render(<OverviewModuleCard {...baseProps} metricLabel="" />);
    // Should render without crashing; metric value still present
    expect(screen.getByText('72%')).toBeInTheDocument();
  });

  it('renders correctly when metric is double-dash placeholder', () => {
    render(<OverviewModuleCard {...baseProps} metric="--" />);
    expect(screen.getByText('--')).toBeInTheDocument();
  });

  it('shows Highest Priority badge when priorityBadge is "Highest Priority"', () => {
    render(<OverviewModuleCard {...baseProps} priorityBadge="Highest Priority" />);
    expect(screen.getByText('Highest Priority')).toBeInTheDocument();
  });

  it('shows Priority badge when priorityBadge is "Priority"', () => {
    render(<OverviewModuleCard {...baseProps} priorityBadge="Priority" />);
    expect(screen.getByText('Priority')).toBeInTheDocument();
  });

  it('does not render a visible badge when priorityBadge is "Monitor"', () => {
    render(<OverviewModuleCard {...baseProps} priorityBadge="Monitor" />);
    expect(screen.queryByText('Monitor')).not.toBeInTheDocument();
  });

  it('does not render a badge when priorityBadge is null', () => {
    render(<OverviewModuleCard {...baseProps} priorityBadge={null} />);
    expect(screen.queryByText('Highest Priority')).not.toBeInTheDocument();
    expect(screen.queryByText('Priority')).not.toBeInTheDocument();
  });

  it('does not render a badge when priorityBadge is omitted', () => {
    render(<OverviewModuleCard {...baseProps} />);
    expect(screen.queryByText('Highest Priority')).not.toBeInTheDocument();
  });
});
