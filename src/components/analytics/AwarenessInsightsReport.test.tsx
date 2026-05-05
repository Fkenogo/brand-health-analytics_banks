import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('@/auth/context', () => ({
  useAuth: () => ({ state: { user: { uid: 'user123' } } }),
}));

vi.mock('@/services/aiStrategyAdvisorService', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/services/aiStrategyAdvisorService')>();
  return {
    ...mod,
    generateAwarenessReport: vi.fn(),
  };
});

import { generateAwarenessReport } from '@/services/aiStrategyAdvisorService';
import { AwarenessInsightsReport } from './AwarenessInsightsReport';
import type { AwarenessReportPayload } from '@/services/aiStrategyAdvisorService';

const MOCK_PAYLOAD: AwarenessReportPayload = {
  reportType: 'awareness_consideration',
  methodologyVersion: '1.0',
  country: 'rwanda',
  period: 'All data',
  bankId: 'BK_RW',
  bankName: 'Bank of Kigali',
  compareBankId: null,
  compareBankName: null,
  filters: {},
  sampleSize: 50,
  metrics: {
    topOfMind: 35, spontaneous: 45, totalAwareness: 80, awarenessQuality: 43,
    shareOfVoice: 28, awarenessDepthScore: 55, awarenessShareIndex: 32, momGrowthPct: 2.5,
  },
  funnel: { aware: 80, spontaneous: 45, topOfMind: 35, aided: 20 },
  intent: null,
  rankings: [{ bankName: 'Bank of Kigali', awareness: 80, topOfMind: 35, rank: 1 }],
  compareMetrics: null,
};

const MOCK_RESPONSE = '## Market Awareness Position\n- Strong ToM\n## Awareness Funnel\n- Wide\n## Competitive Landscape\n- Leader\n## Future Consideration\n- High intent\n## Strategic Implications\n- Defend position';

describe('AwarenessInsightsReport — idle state', () => {
  it('shows Generate Insights button and no report body', () => {
    render(<AwarenessInsightsReport awarenessPayload={MOCK_PAYLOAD} />);
    expect(screen.getByRole('button', { name: /generate insights/i })).toBeInTheDocument();
    expect(screen.queryByText(/market awareness position/i)).not.toBeInTheDocument();
  });
});

describe('AwarenessInsightsReport — loading state', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('disables button and shows spinner while loading', async () => {
    vi.mocked(generateAwarenessReport).mockImplementation(() => new Promise(() => {}));
    render(<AwarenessInsightsReport awarenessPayload={MOCK_PAYLOAD} />);
    fireEvent.click(screen.getByRole('button', { name: /generate insights/i }));
    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled());
    expect(screen.getByTestId('awareness-spinner')).toBeInTheDocument();
  });
});

describe('AwarenessInsightsReport — generated state', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows all 5 required section headings after generation', async () => {
    vi.mocked(generateAwarenessReport).mockResolvedValue({
      response: MOCK_RESPONSE,
      generatedAt: '2026-05-04T10:00:00Z',
      fromCache: false,
    });
    render(<AwarenessInsightsReport awarenessPayload={MOCK_PAYLOAD} />);
    fireEvent.click(screen.getByRole('button', { name: /generate insights/i }));
    await waitFor(() => expect(screen.getByText('Market Awareness Position')).toBeInTheDocument());
    expect(screen.getByText('Awareness Funnel')).toBeInTheDocument();
    expect(screen.getByText('Competitive Landscape')).toBeInTheDocument();
    expect(screen.getByText('Future Consideration')).toBeInTheDocument();
    expect(screen.getByText('Strategic Implications')).toBeInTheDocument();
  });

  it('shows Refresh Insights button after generation', async () => {
    vi.mocked(generateAwarenessReport).mockResolvedValue({
      response: MOCK_RESPONSE, generatedAt: '2026-05-04T10:00:00Z', fromCache: false,
    });
    render(<AwarenessInsightsReport awarenessPayload={MOCK_PAYLOAD} />);
    fireEvent.click(screen.getByRole('button', { name: /generate insights/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /refresh insights/i })).toBeInTheDocument());
  });

  it('shows bank name in context row after generation', async () => {
    vi.mocked(generateAwarenessReport).mockResolvedValue({
      response: MOCK_RESPONSE, generatedAt: '2026-05-04T10:00:00Z', fromCache: false,
    });
    render(<AwarenessInsightsReport awarenessPayload={MOCK_PAYLOAD} />);
    fireEvent.click(screen.getByRole('button', { name: /generate insights/i }));
    await waitFor(() => expect(screen.getByText(/bank of kigali/i)).toBeInTheDocument());
    expect(screen.getByText(/generated:/i)).toBeInTheDocument();
  });
});

describe('AwarenessInsightsReport — stale state', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows stale banner when payload context changes after generation', async () => {
    vi.mocked(generateAwarenessReport).mockResolvedValue({
      response: MOCK_RESPONSE, generatedAt: '2026-05-04T10:00:00Z', fromCache: false,
    });
    const { rerender } = render(<AwarenessInsightsReport awarenessPayload={MOCK_PAYLOAD} />);
    fireEvent.click(screen.getByRole('button', { name: /generate insights/i }));
    await waitFor(() => expect(screen.getByText('Market Awareness Position')).toBeInTheDocument());

    // Change context (different bankId triggers a new hash)
    const changedPayload = { ...MOCK_PAYLOAD, bankId: 'EQ_RW', bankName: 'Equity Bank' };
    rerender(<AwarenessInsightsReport awarenessPayload={changedPayload} />);
    expect(screen.getByText(/context changed/i)).toBeInTheDocument();
  });

  it('report body remains visible when stale', async () => {
    vi.mocked(generateAwarenessReport).mockResolvedValue({
      response: MOCK_RESPONSE, generatedAt: '2026-05-04T10:00:00Z', fromCache: false,
    });
    const { rerender } = render(<AwarenessInsightsReport awarenessPayload={MOCK_PAYLOAD} />);
    fireEvent.click(screen.getByRole('button', { name: /generate insights/i }));
    await waitFor(() => expect(screen.getByText('Market Awareness Position')).toBeInTheDocument());

    rerender(<AwarenessInsightsReport awarenessPayload={{ ...MOCK_PAYLOAD, bankId: 'EQ_RW', bankName: 'Equity Bank' }} />);
    // Report body still visible
    expect(screen.getByText('Market Awareness Position')).toBeInTheDocument();
  });
});

describe('AwarenessInsightsReport — error states', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows rate-limited message with no retry button', async () => {
    vi.mocked(generateAwarenessReport).mockRejectedValue(
      Object.assign(new Error('limit'), { code: 'rate-limited' }),
    );
    render(<AwarenessInsightsReport awarenessPayload={MOCK_PAYLOAD} />);
    fireEvent.click(screen.getByRole('button', { name: /generate insights/i }));
    await waitFor(() => expect(screen.getByText(/monthly insight limit/i)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('shows insufficient-data message with no retry button', async () => {
    vi.mocked(generateAwarenessReport).mockRejectedValue(
      Object.assign(new Error('no data'), { code: 'insufficient-data' }),
    );
    render(<AwarenessInsightsReport awarenessPayload={MOCK_PAYLOAD} />);
    fireEvent.click(screen.getByRole('button', { name: /generate insights/i }));
    await waitFor(() => expect(screen.getByText(/not enough data/i)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });

  it('shows generation-failed message with retry button', async () => {
    vi.mocked(generateAwarenessReport).mockRejectedValue(
      Object.assign(new Error('fail'), { code: 'generation-failed' }),
    );
    render(<AwarenessInsightsReport awarenessPayload={MOCK_PAYLOAD} />);
    fireEvent.click(screen.getByRole('button', { name: /generate insights/i }));
    await waitFor(() => expect(screen.getByText(/report generation failed/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('Generate Insights button is visible again after an error', async () => {
    vi.mocked(generateAwarenessReport).mockRejectedValue(
      Object.assign(new Error('fail'), { code: 'generation-failed' }),
    );
    render(<AwarenessInsightsReport awarenessPayload={MOCK_PAYLOAD} />);
    fireEvent.click(screen.getByRole('button', { name: /generate insights/i }));
    await waitFor(() => expect(screen.getByText(/report generation failed/i)).toBeInTheDocument());
    // After error, main button label should revert to "Generate Insights"
    expect(screen.getByRole('button', { name: /generate insights/i })).toBeInTheDocument();
  });
});
