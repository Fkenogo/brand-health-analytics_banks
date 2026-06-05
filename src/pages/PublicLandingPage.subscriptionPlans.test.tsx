import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { publicDemoModel } from '@/data/publicDemoModel';
import PublicLandingPage from '@/pages/PublicLandingPage';
import type { SubscriptionPlan } from '@/types/subscriptionPlans';

const { listPublicPlansWithFallback } = vi.hoisted(() => ({
  listPublicPlansWithFallback: vi.fn(),
}));

vi.mock('@/services/subscriptionPlanService', () => ({
  subscriptionPlanService: {
    listPublicPlansWithFallback,
  },
}));

const managedPlans: SubscriptionPlan[] = [
  {
    id: 'standard',
    publicName: 'Standard',
    positioningLine: 'Full operating view for subscriber teams',
    benefits: ['Exports enabled', 'AI locked'],
    isActive: true,
    sortOrder: 20,
    featured: true,
    ctaLabel: 'Request Standard Access',
    ctaTarget: '/signup',
    entitlementMapping: { tier: 'standard', aiAddon: false },
    pricing: {
      monthly: { USD: 499, BIF: 2951086, RWF: 732933, UGX: 1850791 },
      annual: { USD: 5240, BIF: 30986403, RWF: 7695797, UGX: 19433306 },
    },
  },
];

describe('PublicLandingPage managed pricing', () => {
  beforeEach(() => {
    listPublicPlansWithFallback.mockReset();
  });

  it('renders admin-managed plans instead of static pricing copy', async () => {
    listPublicPlansWithFallback.mockResolvedValue({ plans: managedPlans, source: 'firestore', fallbackReason: null });

    render(
      <MemoryRouter>
        <PublicLandingPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Standard')).toBeInTheDocument());

    expect(screen.getByText('$499')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Get Started' }).length).toBeGreaterThan(0);
    expect(screen.getByText('Request Standard Access')).toBeInTheDocument();
    expect(screen.queryByText('Pricing values are not displayed on this page because no production pricing table is currently encoded in the codebase.')).not.toBeInTheDocument();
  }, 10000);

  it('switches billing period and currency using managed plan values', async () => {
    listPublicPlansWithFallback.mockResolvedValue({ plans: managedPlans, source: 'firestore', fallbackReason: null });

    render(
      <MemoryRouter>
        <PublicLandingPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('$499')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'annual' }));
    await waitFor(() => expect(screen.getByText('$5,240')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'UGX' }));
    await waitFor(() => expect(screen.getByText('19,433,306 UGX')).toBeInTheDocument());
  });

  it('renders shared illustrative demo metrics instead of duplicated public constants', async () => {
    listPublicPlansWithFallback.mockResolvedValue({ plans: managedPlans, source: 'firestore', fallbackReason: null });

    render(
      <MemoryRouter>
        <PublicLandingPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Standard')).toBeInTheDocument());

    expect(screen.getByText(/not live filtered market data/i)).toBeInTheDocument();
    expect(screen.getByText('Top Second-Choice Competitor')).toBeInTheDocument();
    expect(screen.getAllByText(`${publicDemoModel.executiveSnapshot.multiBankShare}%`).length).toBeGreaterThan(0);
    expect(screen.getAllByText(`${publicDemoModel.brandEdgePreview.currentUsage}%`).length).toBeGreaterThan(0);
    expect(screen.getByText('Loyalty Index')).toBeInTheDocument();
    expect(screen.getByText(publicDemoModel.brandEdgePreview.secondChoicePressureLabel)).toBeInTheDocument();
  });

  it('shows Home and Insights as distinct landing-nav targets', async () => {
    listPublicPlansWithFallback.mockResolvedValue({ plans: managedPlans, source: 'firestore', fallbackReason: null });

    render(
      <MemoryRouter>
        <PublicLandingPage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('Standard')).toBeInTheDocument());

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Insights' })).toHaveAttribute('href', '/insights');
    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login');
    expect(screen.getByText('Executive Snapshot').closest('section')).toHaveAttribute('id', 'insights');
  });

  it('exits loading state and shows fallback plans when live pricing cannot be reached', async () => {
    listPublicPlansWithFallback.mockResolvedValue({
      plans: managedPlans,
      source: 'fallback',
      fallbackReason: 'network stalled',
    });

    render(
      <MemoryRouter>
        <PublicLandingPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Loading subscription plans...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Loading subscription plans...')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Live subscription pricing could not be reached/i)).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('$499')).toBeInTheDocument();
  });
});
