import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getSelectedBankSwitchingRadar } from '@/data/publicDemoModel';
import DemoDashboardPage from '@/pages/DemoDashboardPage';

vi.mock('@/components/analytics/CustomerSwitchingRadar', () => ({
  CustomerSwitchingRadar: ({
    metrics,
    title,
    subtitle,
    headerRight,
  }: {
    metrics: {
      selectedBankId: string;
      multiBankUsingSelectedBase: number;
      secondChoiceBase: number;
      lowSample: boolean;
      competitors: Array<{ competitor: string; switchingPressureScore: number }>;
    };
    title?: string;
    subtitle?: string;
    headerRight?: React.ReactNode;
  }) => (
    <section>
      <h2>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
      {headerRight}
      <p>Selected bank: {metrics.selectedBankId}</p>
      <p>Selected-bank multi-bank base: {metrics.multiBankUsingSelectedBase}</p>
      <p>Second-choice base: {metrics.secondChoiceBase}</p>
      {metrics.lowSample ? <p>Low sample warning shown</p> : null}
      <ul>
        {metrics.competitors.map((row) => (
          <li key={row.competitor}>{row.competitor}: {row.switchingPressureScore}</li>
        ))}
      </ul>
    </section>
  ),
}));

describe('DemoDashboardPage', () => {
  it('renders a coherent shared demo model for headline and overview modules', () => {
    render(
      <MemoryRouter>
        <DemoDashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/not live firestore data/i)).toBeInTheDocument();
    expect(screen.getAllByText('41').length).toBeGreaterThan(0);
    expect(screen.getByText('Competitive pressure')).toBeInTheDocument();
    expect(screen.getAllByText('KCB').length).toBeGreaterThan(0);
    expect(screen.getAllByText('27%').length).toBeGreaterThan(0);
    expect(screen.getByText('Loyalty Index')).toBeInTheDocument();
    expect(screen.getByText('Illustrative momentum signal: +4.2 points over the preview window.')).toBeInTheDocument();
  });

  it('updates the selector-driven radar consistently for BK, KCB, and NCBA', () => {
    render(
      <MemoryRouter>
        <DemoDashboardPage />
      </MemoryRouter>,
    );

    const bkMetrics = getSelectedBankSwitchingRadar('BK');
    expect(screen.getByText(`Selected bank: ${bkMetrics.selectedBankId}`)).toBeInTheDocument();
    expect(screen.getByText(`Selected-bank multi-bank base: ${bkMetrics.multiBankUsingSelectedBase}`)).toBeInTheDocument();
    expect(screen.getByText(`Second-choice base: ${bkMetrics.secondChoiceBase}`)).toBeInTheDocument();
    expect(screen.getByText(`${bkMetrics.competitors[0].competitor}: ${bkMetrics.competitors[0].switchingPressureScore}`)).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'KCB' } });
    const kcbMetrics = getSelectedBankSwitchingRadar('KCB');
    expect(screen.getByText(`Selected bank: ${kcbMetrics.selectedBankId}`)).toBeInTheDocument();
    expect(screen.getByText(`Selected-bank multi-bank base: ${kcbMetrics.multiBankUsingSelectedBase}`)).toBeInTheDocument();
    expect(screen.getByText(`Second-choice base: ${kcbMetrics.secondChoiceBase}`)).toBeInTheDocument();
    expect(screen.getByText(`${kcbMetrics.competitors[0].competitor}: ${kcbMetrics.competitors[0].switchingPressureScore}`)).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'NCBA' } });
    const ncbaMetrics = getSelectedBankSwitchingRadar('NCBA');
    expect(screen.getByText(`Selected bank: ${ncbaMetrics.selectedBankId}`)).toBeInTheDocument();
    expect(screen.getByText(`Selected-bank multi-bank base: ${ncbaMetrics.multiBankUsingSelectedBase}`)).toBeInTheDocument();
    expect(screen.getByText(`Second-choice base: ${ncbaMetrics.secondChoiceBase}`)).toBeInTheDocument();
    expect(screen.getByText(`${ncbaMetrics.competitors[0].competitor}: ${ncbaMetrics.competitors[0].switchingPressureScore}`)).toBeInTheDocument();
    expect(screen.getByText('Low sample warning shown')).toBeInTheDocument();
  });
});
