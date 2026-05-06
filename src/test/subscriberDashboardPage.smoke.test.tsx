import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const authState = { user: null as any };

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);

vi.mock('@/auth/context', () => ({
  useAuth: () => ({
    state: authState,
    logout: vi.fn(),
  }),
}));

vi.mock('@/services/responseService', () => ({
  responseService: {
    listResponses: vi.fn().mockResolvedValue([]),
    listDashboardResponsesWithFallback: vi.fn().mockResolvedValue({ responses: [], source: 'callable', fallbackReason: null }),
  },
}));

vi.mock('@/services/analyticsAggregateService', () => ({
  analyticsAggregateService: {
    getDashboardOverviewAggregate: vi.fn().mockResolvedValue(null),
    getDashboardOverviewAggregateWithFallback: vi.fn().mockResolvedValue({ aggregate: null, source: 'callable', fallbackReason: null }),
  },
  buildAggregateBackedLoyaltySummary: vi.fn().mockReturnValue(null),
  buildAggregateBackedMomentumSummary: vi.fn().mockReturnValue(null),
  buildUsageAggregateMetrics: vi.fn().mockReturnValue(null),
}));

vi.mock('@/services/aiStrategyAdvisorService', () => ({
  aiStrategyAdvisorService: {
    getMonthlyUsage: vi.fn().mockResolvedValue({ used: 0, limit: 10 }),
  },
  compressText: (value: string) => value,
  strategyAdvisorLimits: {
    MONTHLY_QUERY_LIMIT: 10,
    SESSION_FOLLOW_UP_LIMIT: 5,
  },
  buildAwarenessReportPayload: vi.fn().mockReturnValue({ reportType: 'awareness_consideration', sampleSize: 0, metrics: {}, funnel: {}, rankings: [], filters: {}, methodologyVersion: '1.0', country: '', period: '', bankId: '', bankName: '', compareBankId: null, compareBankName: null, intent: null, compareMetrics: null }),
}));

vi.mock('@/components/analytics/AwarenessInsightsReport', () => ({
  AwarenessInsightsReport: () => null,
}));

vi.mock('@/components/analytics/CustomerSwitchingRadar', () => ({
  CustomerSwitchingRadar: ({ title, subtitle }: { title?: string; subtitle?: string }) => (
    <section>
      <h2>{title || 'Competitive Pressure Among Multi-Bank Users'}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
    </section>
  ),
}));

vi.mock('@/components/analytics/CustomerMigrationMap', () => ({
  CustomerMigrationMap: () => (
    <section>
      <h2>Preference Drift Among Current Users</h2>
    </section>
  ),
}));

const makeTimestamp = (monthsAgo: number) => {
  const date = new Date();
  date.setDate(15);
  date.setMonth(date.getMonth() - monthsAgo);
  return date.toISOString();
};

const makeResponse = ({
  monthsAgo,
  aware = true,
  ever = true,
  current = true,
  preferred = false,
  nps = 8,
}: {
  monthsAgo: number;
  aware?: boolean;
  ever?: boolean;
  current?: boolean;
  preferred?: boolean;
  nps?: number;
}) => ({
  timestamp: makeTimestamp(monthsAgo),
  selected_country: 'rwanda',
  c1_recognized_bank_id: aware ? 'BK_RW' : 'OTHER_RW',
  c2_recognized_bank_ids: [],
  c3_aware_banks: aware ? ['BK_RW'] : ['OTHER_RW'],
  c4_ever_used: ever ? ['BK_RW'] : [],
  c5_currently_using: current ? ['BK_RW'] : [],
  preferred_bank: preferred ? 'BK_RW' : 'OTHER_RW',
  d2_future_intent: { BK_RW: aware ? 8 : 2 },
  d3_relevance: aware ? ['BK_RW'] : [],
  c9_would_consider: aware ? ['BK_RW'] : [],
  d7_nps: { BK_RW: nps },
  committed_bank: preferred ? 'BK_RW' : undefined,
});

describe('SubscriberDashboardPage', () => {
  beforeEach(() => {
    vi.resetModules();
    authState.user = null;
  });

  it('renders in admin mode without hitting a TDZ crash', async () => {
    const { default: SubscriberDashboardPage } = await import('@/pages/SubscriberDashboardPage');

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin/dashboard" element={<SubscriberDashboardPage adminMode />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText('BrandEdge Score').length).toBeGreaterThan(0);
    });
  }, 15000);

  it('renders safe empty-state messaging across deep analytics surfaces', async () => {
    const { default: SubscriberDashboardPage } = await import('@/pages/SubscriberDashboardPage');

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin/dashboard" element={<SubscriberDashboardPage adminMode />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText('BrandEdge Score').length).toBeGreaterThan(0);
    });

    const usageTab = screen.getByRole('tab', { name: 'Usage & Behavior' });
    fireEvent.mouseDown(usageTab);
    fireEvent.click(usageTab);
    await waitFor(() => {
      expect(usageTab).toHaveAttribute('data-state', 'active');
    });
    expect(screen.getAllByText('No data').length).toBeGreaterThan(0);

    const loyaltyTab = screen.getByRole('tab', { name: 'Loyalty & Satisfaction' });
    fireEvent.mouseDown(loyaltyTab);
    fireEvent.click(loyaltyTab);
    await waitFor(() => {
      expect(loyaltyTab).toHaveAttribute('data-state', 'active');
    });
    expect(screen.getByText('Loyalty Segmentation Analysis')).toBeInTheDocument();

    const demographicsTab = screen.getByRole('tab', { name: 'Demographics' });
    fireEvent.mouseDown(demographicsTab);
    fireEvent.click(demographicsTab);
    await waitFor(() => {
      expect(demographicsTab).toHaveAttribute('data-state', 'active');
    });
    expect(screen.getAllByText('No age cohort data in this slice.').length).toBeGreaterThan(0);
  });

  it('renders sparse time-series states as no-data and forecast unavailable instead of zero', async () => {
    const responseModule = await import('@/services/responseService');
    vi.mocked(responseModule.responseService.listResponses).mockResolvedValue([
      makeResponse({ monthsAgo: 0 }),
      makeResponse({ monthsAgo: 2 }),
    ] as never[]);

    const { default: SubscriberDashboardPage } = await import('@/pages/SubscriberDashboardPage');

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin/dashboard" element={<SubscriberDashboardPage adminMode />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText('BrandEdge Score').length).toBeGreaterThan(0);
    });

    const momentumTab = screen.getByRole('tab', { name: 'Brand Momentum' });
    fireEvent.mouseDown(momentumTab);
    fireEvent.click(momentumTab);
    await waitFor(() => {
      expect(momentumTab).toHaveAttribute('data-state', 'active');
    });
    expect(screen.getAllByText('No data').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Forecast unavailable').length).toBeGreaterThan(0);

    const trendsTab = screen.getByRole('tab', { name: 'Trends & Forecasts' });
    fireEvent.mouseDown(trendsTab);
    fireEvent.click(trendsTab);
    await waitFor(() => {
      expect(trendsTab).toHaveAttribute('data-state', 'active');
    });
    expect(screen.getAllByText('No data').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Forecast unavailable').length).toBeGreaterThan(0);
  });

});
