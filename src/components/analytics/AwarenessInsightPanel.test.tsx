import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AwarenessInsightPanel } from './AwarenessInsightPanel';

describe('AwarenessInsightPanel', () => {
  it('renders nothing when insight is null', () => {
    const { container } = render(<AwarenessInsightPanel insight={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when insight is empty string', () => {
    const { container } = render(<AwarenessInsightPanel insight="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a details element with the insight text', () => {
    render(<AwarenessInsightPanel insight="Market leader tier." />);
    expect(screen.getByText(/Market leader tier/)).toBeInTheDocument();
    expect(document.querySelector('details')).toBeInTheDocument();
  });

  it('uses default label "Analysis"', () => {
    render(<AwarenessInsightPanel insight="Some insight." />);
    const summary = document.querySelector('summary');
    expect(summary?.textContent).toContain('Analysis');
  });

  it('uses a custom label when provided', () => {
    render(<AwarenessInsightPanel insight="Intent analysis text." label="Intent Analysis" />);
    const summary = document.querySelector('summary');
    expect(summary?.textContent).toContain('Intent Analysis');
  });

  it('renders inside a summary element', () => {
    render(<AwarenessInsightPanel insight="Test." />);
    expect(document.querySelector('summary')).toBeInTheDocument();
  });
});
