import { render, screen } from '@testing-library/react';
import { BrandHealthTab } from './BrandHealthTab';
import { DashboardMetrics, NPSDriver } from '@/utils/api';
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Zap: () => <div data-testid="icon-zap" />,
  Target: () => <div data-testid="icon-target" />,
  TrendingUp: () => <div data-testid="icon-trending-up" />,
  TrendingDown: () => <div data-testid="icon-trending-down" />,
  BarChart3: () => <div data-testid="icon-bar-chart" />,
  ArrowRight: () => <div data-testid="icon-arrow-right" />,
  Lightbulb: () => <div data-testid="icon-lightbulb" />,
  AlertTriangle: () => <div data-testid="icon-alert-triangle" />
}));

const mockDashboardData: DashboardMetrics = {
    bank_id: 'bank-a',
    metrics: {
        topOfMind: { value: 20, rank: 1, change: 0 },
        spontaneous: { value: 40, rank: 1, change: 0 },
        totalAwareness: { value: 80, rank: 1, change: 0 },
        awarenessQuality: { value: 25 },
        nps: { value: 45, rank: 1, change: 5, p: 60, pass: 25, d: 15 },
        momentum: {
            value: 75,
            rank: 1, change: 10,
            awareness: 80, consideration: 60, everUsed: 50, current: 40, preferred: 30,
            conversion: 62, retention: 80, adoption: 75
        },
        consideration: { value: 60, rank: 1, change: 0 },
        loyalty: { committed: 30, favors: 20, potential: 10, rejectors: 5, accessibles: 35 },
        snapshot: { 
            aware: 80, notAware: 20, triers: 50, nonTriers: 30, current: 40, lapsers: 10, bumo: 30, nonBumo: 10,
            nps: { nonTriers: 0, lapsers: 0, nonBumo: 0, bumo: 0 }
        }
    },
    sampleSize: 100,
    timestamp: '2023-01-01'
};

const mockNpsDrivers: NPSDriver[] = [
    { attribute: 'Digital Trust', performance: 80, importance: 0.9, impact: 'positive', rank: 1 },
    { attribute: 'Service Speed', performance: 40, importance: 0.8, impact: 'negative', rank: 2 }
];

describe('BrandHealthTab', () => {
    it('should render the component title', () => {
        render(
            <BrandHealthTab
                dashboardData={mockDashboardData}
                trendData={[]}
                competitorData={[]}
                npsDrivers={mockNpsDrivers}
                selectedBankName="Bank A"
            />
        );
        expect(screen.getByText('Brand Health & Momentum')).toBeInTheDocument();
        expect(screen.getByText(/Comprehensive analysis of Bank A/i)).toBeInTheDocument();
    });

    it('should display Momentum Score correctly', () => {
        render(
            <BrandHealthTab
                dashboardData={mockDashboardData}
                trendData={[]}
                competitorData={[]}
                npsDrivers={mockNpsDrivers}
                selectedBankName="Bank A"
            />
        );
        expect(screen.getByText('75')).toBeInTheDocument(); // Momentum calculation
        expect(screen.getByText('+10% vs last month')).toBeInTheDocument();
    });

    it('should display NPS Score correctly', () => {
        render(
            <BrandHealthTab
                dashboardData={mockDashboardData}
                trendData={[]}
                competitorData={[]}
                npsDrivers={mockNpsDrivers}
                selectedBankName="Bank A"
            />
        );
        expect(screen.getByText('+45')).toBeInTheDocument(); // NPS Score
    });

    it('should display Strategic Insights correctly', () => {
        render(
            <BrandHealthTab
                dashboardData={mockDashboardData}
                trendData={[]}
                competitorData={[]}
                npsDrivers={mockNpsDrivers}
                selectedBankName="Bank A"
            />
        );
        // Momentum > 60 -> "Strong brand momentum"
        // NPS > 30 -> "NPS is healthy"
        expect(screen.getByText(/Strong brand momentum/i)).toBeInTheDocument();
        expect(screen.getByText(/NPS is healthy/i)).toBeInTheDocument();
    });

    it('should show critical fixes for low performing important drivers', () => {
         render(
            <BrandHealthTab
                dashboardData={mockDashboardData}
                trendData={[]}
                competitorData={[]}
                npsDrivers={mockNpsDrivers}
                selectedBankName="Bank A"
            />
        );
        // "Service Speed" has perf 40 (<60) and importance 0.8 (>=0.7) -> Should be flagged
        expect(screen.getByText('Critical Fixes Needed')).toBeInTheDocument();
        const serviceSpeedElements = screen.getAllByText(/Service Speed/i);
        expect(serviceSpeedElements.length).toBeGreaterThan(0);
    });
});
