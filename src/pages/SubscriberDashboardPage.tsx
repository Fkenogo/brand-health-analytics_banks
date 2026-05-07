import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { BotMessageSquare, ChevronRight, CircleHelp, FileDown, Loader2, Lock, Palette, Send, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { useAuth } from '@/auth/context';
import { hasPermission } from '@/auth/types';
import { ANALYTICS_BASE_TYPES, BANKS, COUNTRY_CHOICES } from '@/constants';
import { AnalyticsMetricValue, CountryCode, SurveyResponse } from '@/types';
import { isIncludedInAnalytics } from '@/utils/survey/respondentInclusion';
import {
  AwarenessMetricKey,
  AwarenessSectionInsightKey,
  MetricInsightContent,
  SectionInsightContent,
  AWARENESS_METRIC_CONTENT,
  AWARENESS_SECTION_INSIGHTS,
} from '@/config/awarenessInsights';
import {
  UsageMetricKey,
  UsageSectionInsightKey,
  USAGE_METRIC_CONTENT,
  USAGE_SECTION_INSIGHTS,
} from '@/config/usageInsights';
import {
  LoyaltyMetricKey,
  LoyaltySectionInsightKey,
  LOYALTY_METRIC_CONTENT,
  LOYALTY_SECTION_INSIGHTS,
} from '@/config/loyaltyInsights';
import {
  MomentumMetricKey,
  MomentumSectionInsightKey,
  MOMENTUM_METRIC_CONTENT,
  MOMENTUM_SECTION_INSIGHTS,
} from '@/config/momentumInsights';
import {
  CompetitiveMetricKey,
  CompetitiveSectionInsightKey,
  COMPETITIVE_METRIC_CONTENT,
  COMPETITIVE_SECTION_INSIGHTS,
} from '@/config/competitiveInsights';
import {
  TrendsMetricKey,
  TrendsSectionInsightKey,
  TRENDS_METRIC_CONTENT,
  TRENDS_SECTION_INSIGHTS,
} from '@/config/trendsInsights';
import {
  DemographicsMetricKey,
  DemographicsSectionInsightKey,
  DEMOGRAPHICS_METRIC_CONTENT,
  DEMOGRAPHICS_SECTION_INSIGHTS,
} from '@/config/demographicsInsights';
import { exportToCSV } from '@/utils/export';
import { getResponses } from '@/utils/storage';
import { responseService } from '@/services/responseService';
import {
  analyticsAggregateService,
  buildAggregateBackedLoyaltySummary,
  buildAggregateBackedMomentumSummary,
  buildUsageAggregateMetrics,
  type DashboardOverviewAggregate,
  type UsageAggregateMetrics,
} from '@/services/analyticsAggregateService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { aiStrategyAdvisorService, compressText, strategyAdvisorLimits, type StrategyAdvisorPayload } from '@/services/aiStrategyAdvisorService';
import { CustomerSwitchingRadar } from '@/components/analytics/CustomerSwitchingRadar';
import { CustomerMigrationMap } from '@/components/analytics/CustomerMigrationMap';
import { AwarenessInsightsReport } from '@/components/analytics/AwarenessInsightsReport';
import { AwarenessInsightPanel } from '@/components/analytics/AwarenessInsightPanel';
import {
  buildAwarenessMetricInsight,
  buildAwarenessFunnelInsight,
  buildAwarenessRankingInsight,
  buildIntentInsight,
} from '@/utils/awarenessInsights';
import { buildAwarenessReportPayload } from '@/services/aiStrategyAdvisorService';
import {
  BankMetrics,
  DemographicSummary,
  MultiBankCompetitionDiagnostics,
  SubscriberFilters,
  TimeWindow,
  TrendForecastDiagnostics,
  TrendPoint,
  UsageDiagnostics,
  DemographicDiagnostics,
  LoyaltyDiagnostics,
  MomentumDiagnostics,
  CompetitiveIntelligenceDiagnostics,
  computeBankMetrics,
  computeCompetitiveRows,
  computeCompetitiveIntelligenceDiagnostics,
  computeDemographicDiagnostics,
  computeDemographics,
  computeIntentSummary,
  computeLoyaltyDiagnostics,
  computeMultiBankCompetitionDiagnostics,
  computeMomentumDiagnostics,
  computeTrendForecastDiagnostics,
  computeUsageDiagnostics,
  computeTrendSeries,
  filterResponsesForDashboard,
  buildUsageToplineMetricsFromRaw,
  createCompareMetric,
  createMetric,
  type UsageToplineMetrics,
} from '@/utils/subscriberDashboard';
import {
  computeBrandEdgeScore,
  describeBrandEdgeScore,
  summarizeBrandEdgeDrivers,
} from '@/utils/brandEdgeScore';
import { computeCustomerSwitchingRadar, type CustomerSwitchingRadarResult } from '@/utils/customerSwitchingRadar';
import { computeCustomerMigrationMap, type CustomerMigrationMapResult } from '@/utils/customerMigrationMap';
import { applyGuardedRendering } from '@/utils/sampleGuards';
import { SampleGuardBadge } from '@/components/ui/SampleGuardBadge';
import { SampleGuardFooter } from '@/components/ui/SampleGuardFooter';

type SubscriberSection =
  | 'overview'
  | 'awareness_consideration'
  | 'usage_behavior'
  | 'loyalty_satisfaction'
  | 'brand_momentum'
  | 'competitive_intelligence'
  | 'demographics'
  | 'trends_forecasts';

const SECTION_LABELS: Array<{ id: SubscriberSection; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'awareness_consideration', label: 'Awareness & Consideration' },
  { id: 'usage_behavior', label: 'Usage & Behavior' },
  { id: 'loyalty_satisfaction', label: 'Loyalty & Satisfaction' },
  { id: 'brand_momentum', label: 'Brand Momentum' },
  { id: 'competitive_intelligence', label: 'Competitive Intelligence' },
  { id: 'demographics', label: 'Demographics' },
  { id: 'trends_forecasts', label: 'Trends & Forecasts' },
];
const FREE_TIER_SECTION_LABELS: Array<{ id: SubscriberSection; label: string }> = [
  { id: 'overview', label: 'Overview' },
];

const SUBSCRIPTION_FEATURE_ROWS: Array<{ feature: string; free: string; standard: string; ai: string }> = [
  { feature: 'Overview', free: '✓', standard: '✓', ai: '✓' },
  { feature: 'Full Reports', free: '✗', standard: '✓', ai: '✓' },
  { feature: 'Export', free: '✗', standard: '✓', ai: '✓' },
  { feature: 'AI Strategy Advisor', free: '✗', standard: '✗', ai: '✓' },
  { feature: 'Executive Strategy Brief', free: '✗', standard: '✗', ai: '✓' },
];

const TIME_WINDOWS: Array<{ id: TimeWindow; label: string }> = [
  { id: 'all', label: 'All data' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
  { id: '12m', label: 'Last 12 months' },
];

const AGE_OPTIONS = ['18-24', '25-34', '35-44', '45-54', '55+'];
const GENDER_OPTIONS = ['male', 'female'];

type DashboardMetricKey =
  | AwarenessMetricKey
  | UsageMetricKey
  | LoyaltyMetricKey
  | MomentumMetricKey
  | CompetitiveMetricKey
  | TrendsMetricKey
  | DemographicsMetricKey;
type DashboardSectionInsightKey =
  | AwarenessSectionInsightKey
  | UsageSectionInsightKey
  | LoyaltySectionInsightKey
  | MomentumSectionInsightKey
  | CompetitiveSectionInsightKey
  | TrendsSectionInsightKey
  | DemographicsSectionInsightKey;

const METRIC_CONTENT: Record<DashboardMetricKey, MetricInsightContent> = {
  ...AWARENESS_METRIC_CONTENT,
  ...USAGE_METRIC_CONTENT,
  ...LOYALTY_METRIC_CONTENT,
  ...MOMENTUM_METRIC_CONTENT,
  ...COMPETITIVE_METRIC_CONTENT,
  ...TRENDS_METRIC_CONTENT,
  ...DEMOGRAPHICS_METRIC_CONTENT,
};

const SECTION_INSIGHT_CONTENT: Record<DashboardSectionInsightKey, SectionInsightContent> = {
  ...AWARENESS_SECTION_INSIGHTS,
  ...USAGE_SECTION_INSIGHTS,
  ...LOYALTY_SECTION_INSIGHTS,
  ...MOMENTUM_SECTION_INSIGHTS,
  ...COMPETITIVE_SECTION_INSIGHTS,
  ...TRENDS_SECTION_INSIGHTS,
  ...DEMOGRAPHICS_SECTION_INSIGHTS,
};

const MetricInfoIcon: React.FC<{ metricKey: DashboardMetricKey }> = ({ metricKey }) => {
  const [open, setOpen] = useState(false);
  const content = METRIC_CONTENT[metricKey];
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="text-slate-500 hover:text-slate-200"
          aria-label={`About ${content.title}`}
        >
          <CircleHelp className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-[70vh] w-80 overflow-y-auto border-white/10 bg-slate-950 text-slate-200"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-slate-300">{content.title}</p>
        <p className="mt-2 text-xs text-slate-300">{content.definition}</p>
        <p className="mt-2 text-xs text-slate-400">{content.formulaPlain}</p>
        {content.interpretationThresholds && content.interpretationThresholds.length > 0 ? (
          <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Interpretation thresholds</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-slate-300">
              {content.interpretationThresholds.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {content.keyInsight ? (
          <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Key insight</p>
            <p className="mt-1 text-xs text-slate-300">{content.keyInsight}</p>
          </div>
        ) : null}
        {content.strategicImplications && content.strategicImplications.length > 0 ? (
          <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Strategic implications</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-slate-300">
              {content.strategicImplications.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
};

const SectionInsightsTrigger: React.FC<{ sectionKey: DashboardSectionInsightKey; ctaLabel?: 'View Insights' | 'Learn More' }> = ({
  sectionKey,
  ctaLabel = 'View Insights',
}) => {
  const content = SECTION_INSIGHT_CONTENT[sectionKey];
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold text-slate-300 hover:border-blue-500"
        >
          {ctaLabel}
        </button>
      </DialogTrigger>
      <DialogContent className="dashboard-insight-modal border-slate-600/30 bg-slate-900/95 text-slate-100 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{content.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 border-l-2 border-blue-400/45 pl-5 text-sm leading-relaxed">
          <div className="rounded-xl bg-slate-800/70 p-4">
            <p className="text-xs font-semibold text-slate-300">Interpretation Thresholds</p>
            <ul className="mt-2 space-y-2.5 text-slate-200">
              {content.interpretationThresholds.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 text-blue-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-slate-800/70 p-4">
            <p className="text-xs font-semibold text-slate-300">Key Insight</p>
            <p className="mt-2 leading-7 text-slate-200">{content.keyInsight}</p>
          </div>
          {content.strategicImplications && content.strategicImplications.length > 0 ? (
            <div className="rounded-xl bg-slate-800/70 p-4">
              <p className="text-xs font-semibold text-slate-300">Strategic Implications</p>
              <ul className="mt-2 space-y-2.5 text-slate-200">
                {content.strategicImplications.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 h-3.5 w-3.5 text-emerald-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

type CardVariant = 'primary' | 'secondary' | 'diagnostic';
type SurfaceMode = 'executive-dark' | 'soft-neutral';
const SURFACE_MODE_STORAGE_KEY = 'subscriber-dashboard-surface-mode';
const ACCENT_PRIMARY = '#4F8CFF';
const ACCENT_POSITIVE = '#059669';
const ACCENT_NEGATIVE = '#F43F5E';
const ACCENT_NEUTRAL = '#94A3B8';

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  const expanded = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;
  const int = Number.parseInt(expanded, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const Sparkline: React.FC<{ values?: Array<number | null | undefined>; accent?: 'blue' | 'green' | 'red' | 'amber' }> = ({ values, accent = 'blue' }) => {
  const series = values || [];
  const validValues = series.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (validValues.length === 0) return null;
  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  const safeRange = max - min || 1;
  const segments: string[] = [];
  const singlePoints: Array<{ x: number; y: number }> = [];
  let currentSegment: string[] = [];

  series.forEach((value, idx) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      const x = (idx / Math.max(series.length - 1, 1)) * 100;
      const y = 100 - ((value - min) / safeRange) * 100;
      currentSegment.push(`${x},${y}`);
      return;
    }

    if (currentSegment.length >= 2) {
      segments.push(currentSegment.join(' '));
    } else if (currentSegment.length === 1) {
      const [x, y] = currentSegment[0].split(',').map(Number);
      singlePoints.push({ x, y });
    }
    currentSegment = [];
  });

  if (currentSegment.length >= 2) {
    segments.push(currentSegment.join(' '));
  } else if (currentSegment.length === 1) {
    const [x, y] = currentSegment[0].split(',').map(Number);
    singlePoints.push({ x, y });
  }

  if (segments.length === 0 && singlePoints.length === 0) return null;
  const strokeColor = accent === 'green'
    ? ACCENT_POSITIVE
    : accent === 'red'
      ? ACCENT_NEGATIVE
      : ACCENT_PRIMARY;
  return (
    <svg viewBox="0 0 100 100" className="h-7 w-20">
      {segments.map((points, idx) => (
        <polyline
          key={`spark-segment-${idx}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      ))}
      {singlePoints.map((point, idx) => (
        <circle key={`spark-point-${idx}`} cx={point.x} cy={point.y} r="4.5" fill={strokeColor} />
      ))}
    </svg>
  );
};

const DeltaBadge: React.FC<{ delta?: number | null }> = ({ delta }) => {
  if (delta === null || delta === undefined || Number.isNaN(delta)) return null;
  const positive = delta > 0;
  const neutral = delta === 0;
  const accent = neutral ? ACCENT_NEUTRAL : positive ? ACCENT_POSITIVE : ACCENT_NEGATIVE;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: accent }}>
      {neutral ? null : positive ? <TrendingUp className="h-3 w-3 motion-safe:animate-[slideInFromBottom_180ms_ease-out]" /> : <TrendingDown className="h-3 w-3 motion-safe:animate-[slideInFromBottom_180ms_ease-out]" />}
      {neutral ? '0.0pp' : `${positive ? '+' : ''}${delta.toFixed(1)}pp`}
    </span>
  );
};

const Card: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  metricKey?: DashboardMetricKey;
  variant?: CardVariant;
  delta?: number | null;
  sparklineValues?: number[];
}> = ({ title, value, subtitle, metricKey, variant = 'secondary', delta, sparklineValues }) => (
  <div
    className={`dashboard-kpi-card border transition-all duration-200 ease-out ${
      variant === 'primary'
        ? 'kpi-card-primary bg-slate-800/70 hover:-translate-y-0.5'
        : variant === 'diagnostic'
          ? 'kpi-card-diagnostic bg-slate-900/40'
          : 'kpi-card-secondary bg-slate-800/55'
    }`}
  >
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <p className={`text-slate-400 uppercase tracking-wide ${variant === 'primary' ? 'text-xs font-semibold' : 'text-xs'}`}>{title}</p>
        {metricKey ? <MetricInfoIcon metricKey={metricKey} /> : null}
      </div>
      <DeltaBadge delta={delta} />
    </div>
    <div className="mt-2 flex items-end justify-between gap-2">
      <p className={`${variant === 'primary' ? 'text-5xl' : variant === 'diagnostic' ? 'text-2xl' : 'text-3xl'} font-bold text-slate-800 transition-all duration-200 motion-safe:animate-[fadeIn_160ms_ease-out]`}>
        {value}
      </p>
      <Sparkline values={sparklineValues} accent={delta && delta < 0 ? 'red' : 'blue'} />
    </div>
    {subtitle ? <p className="mt-1 text-xs text-slate-500 leading-relaxed">{subtitle}</p> : null}
  </div>
);

const MiniBar: React.FC<{ label: string; value: number | null; color?: string }> = ({ label, value, color = 'bg-blue-500' }) => {
  const isMissing = value === null;
  return (
    <div className={`rounded-xl p-2.5 ${isMissing ? 'border border-dashed border-slate-300 bg-slate-50/80' : 'bg-slate-100'}`}>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className={`font-semibold ${isMissing ? 'text-slate-500' : 'text-slate-800'}`}>{isMissing ? 'No data' : `${value}%`}</span>
      </div>
      <div className={`h-2 rounded-full ${isMissing ? 'border border-dashed border-slate-300 bg-slate-50' : 'bg-slate-200'}`}>
        {isMissing ? null : (
          <div
            className="h-2 rounded-full"
            style={{
              width: `${Math.min(Math.max(value, 0), 100)}%`,
              backgroundColor: color.includes('rose') ? ACCENT_NEGATIVE : color.includes('emerald') ? ACCENT_POSITIVE : ACCENT_PRIMARY,
            }}
          />
        )}
      </div>
    </div>
  );
};

const FunnelSteps: React.FC<{ steps: Array<{ label: string; value: number; color: string }> }> = ({ steps }) => (
  <div className="space-y-5">
    <div className="grid gap-3 md:grid-cols-4">
      {steps.map((step, idx) => {
        const previous = idx > 0 ? steps[idx - 1] : null;
        const conversion = previous && previous.value > 0 ? Math.round((step.value / previous.value) * 100) : null;
        const dropOff = previous ? Math.max(previous.value - step.value, 0) : null;
        const stageColors = [ACCENT_PRIMARY, '#6E8DC5', '#85A3D6', ACCENT_POSITIVE];
        const stageColor = step.color.startsWith('#') ? step.color : stageColors[idx % stageColors.length];
        const dropPct = previous && previous.value > 0 ? (dropOff / previous.value) * 100 : 0;
        const dropColor = dropPct >= 25 ? ACCENT_NEGATIVE : ACCENT_NEUTRAL;
        return (
          <div key={step.label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{step.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{step.value}%</p>
            <div className="mt-2 h-1.5 rounded-full bg-slate-200">
              <div
                className="h-1.5 rounded-full transition-all duration-200"
                style={{
                  width: `${Math.min(Math.max(step.value, 0), 100)}%`,
                  background: `linear-gradient(90deg, ${hexToRgba(stageColor, 0.75)}, ${stageColor})`,
                }}
              />
            </div>
            {conversion !== null ? (
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span style={{ color: ACCENT_PRIMARY }}>{conversion}% convert</span>
                <span style={{ color: dropColor }}>{dropOff}% drop</span>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  </div>
);

const ExecutiveHero: React.FC<{
  label: string;
  score: string;
  delta: number | null;
  summary: string;
  rightCards: Array<{ label: string; value: string; tone?: 'positive' | 'negative' | 'neutral' }>;
  tone?: 'default' | 'momentum';
}> = ({ label, score, delta, summary, rightCards, tone = 'default' }) => (
  <div className="grid gap-8 md:grid-cols-3">
    <div className={`rounded-3xl bg-gradient-to-br p-10 text-white md:col-span-2 ${tone === 'momentum' ? 'from-blue-700 to-blue-600' : 'from-blue-600 to-blue-500'}`}>
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">{label}</p>
      <p className="mt-4 text-6xl font-bold">{score}</p>
      <p className="mt-4 text-sm font-medium" style={{ color: delta === null ? '#DBEAFE' : delta > 0 ? '#A7F3D0' : delta < 0 ? '#FECACA' : '#DBEAFE' }}>
        {delta === null ? 'No previous period delta' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}pp vs previous period`}
      </p>
      <p className="mt-3 text-sm text-blue-100">{summary}</p>
    </div>
    <div className="grid gap-6">
      {rightCards.map((item) => (
        <div key={item.label} className="flex h-full flex-col justify-between rounded-2xl bg-white p-5 shadow-xl">
          <p className="text-xs uppercase tracking-wide text-slate-400">{item.label}</p>
          <p
            className="mt-1 text-3xl font-bold"
            style={{ color: item.tone === 'positive' ? ACCENT_POSITIVE : item.tone === 'negative' ? ACCENT_NEGATIVE : '#1E293B' }}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  </div>
);

const deltaText = (value: number | null) => {
  if (value === null) return 'No prior period';
  if (value === 0) return 'No change vs previous period';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}pp vs previous period`;
};

const pctGrowthText = (value: number | null) => {
  if (value === null) return 'No prior period';
  if (value === 0) return '0.0% Versus previous month';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}% Versus previous month`;
};

const pctGrowthValue = (value: number | null) => {
  if (value === null) return '--';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

const formatSignedValue = (value: number | null, suffix = '', digits = 1) => {
  if (value === null) return '--';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}${suffix}`;
};

const formatUnsignedValue = (value: number | null, suffix = '', digits = 1) => {
  if (value === null) return '--';
  return `${value.toFixed(digits)}${suffix}`;
};

const isFiniteMetricValue = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const safeNumber = (value: number | null | undefined, fallback = '--') =>
  isFiniteMetricValue(value) ? String(value) : fallback;

const safeCount = (value: number | null | undefined, fallback = 'No data') =>
  isFiniteMetricValue(value) ? String(value) : fallback;

const safePercent = (value: number | null | undefined, fallback = '--') =>
  isFiniteMetricValue(value) ? `${value}%` : fallback;

const safeSignedPercent = (value: number | null | undefined, fallback = '--') =>
  isFiniteMetricValue(value) ? `${value > 0 ? '+' : ''}${value}%` : fallback;

const safePp = (value: number | null | undefined, fallback = '--') =>
  isFiniteMetricValue(value) ? `${value}pp` : fallback;

const safeSignedPp = (value: number | null | undefined, fallback = '--') =>
  isFiniteMetricValue(value) ? `${value > 0 ? '+' : ''}${value}pp` : fallback;

const safeText = (value: string | number | null | undefined, fallback = 'No data') =>
  value === null || value === undefined || value === '' ? fallback : String(value);

const safeAverageIntent = (value: number | null | undefined, fallback = '--') =>
  isFiniteMetricValue(value) ? value.toFixed(1) : fallback;

const safeRatioPercent = (count: number | null | undefined, base: number | null | undefined, fallback = '--') => {
  if (!isFiniteMetricValue(count) || !isFiniteMetricValue(base) || base <= 0) return fallback;
  return `${Math.round((count / base) * 100)}%`;
};

const EMPTY_COPY = {
  noData: 'No data',
  noDataInSlice: 'No data in this slice.',
  noAwareInSlice: 'No aware respondents in this slice.',
  noCurrentUsersInSlice: 'No current users in this slice.',
  noValidPeriods: 'No valid periods',
  insufficientHistory: 'Insufficient history',
  forecastUnavailable: 'Forecast unavailable',
};

const normalizeStatusReason = (reason: string) => {
  const normalized = reason.replace(/^forecast_blocked:/, '');
  switch (normalized) {
    case 'requires_four_valid_periods':
      return `${EMPTY_COPY.forecastUnavailable}: at least four valid periods are required.`;
    case 'requires_six_valid_periods':
      return `${EMPTY_COPY.forecastUnavailable}: at least six valid periods are required.`;
    case 'series_too_sparse':
      return `${EMPTY_COPY.insufficientHistory}: recent periods are too sparse.`;
    case 'recent_periods_missing':
      return `${EMPTY_COPY.insufficientHistory}: recent periods are missing.`;
    case 'requires_four_regression_points':
      return `${EMPTY_COPY.forecastUnavailable}: regression needs four valid points.`;
    default:
      return normalized.replaceAll('_', ' ');
  }
};

const firstStatusNote = (notes?: string[] | null, fallback = EMPTY_COPY.insufficientHistory) => {
  if (!notes || notes.length === 0) return fallback;
  return normalizeStatusReason(notes[0]);
};

const validPeriodSubtitle = (baseN?: number | null, fallback = EMPTY_COPY.noValidPeriods) => {
  if (!Number.isFinite(baseN as number) || Number(baseN) <= 0) return fallback;
  const count = Number(baseN);
  return `${count} valid period${count === 1 ? '' : 's'}`;
};

const compareSubtitle = (compareBankName: string | null, compareValue: string | number | null | undefined, fallback: string) => {
  if (!compareBankName || compareValue === null || compareValue === undefined || compareValue === '') {
    return fallback;
  }
  return `vs ${compareBankName}: ${compareValue}`;
};

const compareDisplayValue = (metric: AnalyticsMetricValue | null | undefined, formatter?: (value: number | null) => string | number | null) => {
  if (!metric?.compare?.valid) return null;
  const value = metric.compare.value;
  return formatter ? formatter(value) : value;
};

const compareDelta = (metric: AnalyticsMetricValue | null | undefined) =>
  metric?.compare?.valid ? metric.compare.delta : null;

const AI_ADVISOR_PLACEHOLDER_MODE = (import.meta.env.VITE_AI_ADVISOR_PLACEHOLDER ?? 'true') === 'true';
const AI_ADVISOR_PLACEHOLDER_TEXT =
  'AI Strategy Advisor is temporarily unavailable while backend billing is being finalized. You can continue using all dashboard reports. Please check back after upgrade is completed.';

interface AdvisorMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

interface AdvisorSessionState {
  context: StrategyAdvisorPayload | null;
  lastSummary: string;
  followUpsUsed: number;
  lastActivityAt: number;
  startedAt: number;
}

type UpgradeModalMode = 'standard' | 'ai';

const createMessage = (role: AdvisorMessage['role'], content: string): AdvisorMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  role,
  content,
  createdAt: new Date().toISOString(),
});

interface SubscriberDashboardPageProps {
  adminMode?: boolean;
}

const SubscriberDashboardPage: React.FC<SubscriberDashboardPageProps> = ({ adminMode = false }) => {
  const { state, logout } = useAuth();
  const navigate = useNavigate();
  const subscriptionTier = adminMode ? 'standard' : (state.user?.subscription_tier || 'standard');
  const isFreeTier = !adminMode && subscriptionTier === 'free';
  const assignedCountries = adminMode
    ? COUNTRY_CHOICES.map((choice) => choice.value as CountryCode)
    : (state.user?.assignedCountries || []);
  const accessibleCountries = isFreeTier ? assignedCountries.slice(0, 1) : assignedCountries;
  const { country: routeCountry } = useParams<{ country?: string }>();

  const [section, setSection] = useState<SubscriberSection>('overview');
  const [activeCountry, setActiveCountry] = useState<CountryCode | null>(accessibleCountries[0] || null);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [compareBankId, setCompareBankId] = useState<string>('');
  const [ageGroups, setAgeGroups] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('all');
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [rawDataSource, setRawDataSource] = useState<'firestore' | 'local'>('firestore');
  const [rawDataSourceReason, setRawDataSourceReason] = useState<string | null>(null);
  const [overviewAggregate, setOverviewAggregate] = useState<DashboardOverviewAggregate | null>(null);
  const [loadingOverviewAggregate, setLoadingOverviewAggregate] = useState(false);
  const [overviewAggregateReason, setOverviewAggregateReason] = useState<string | null>(null);
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [upgradeModalMode, setUpgradeModalMode] = useState<UpgradeModalMode | null>(null);
  const [advisorMessages, setAdvisorMessages] = useState<AdvisorMessage[]>([]);
  const [advisorQuestion, setAdvisorQuestion] = useState('');
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorError, setAdvisorError] = useState<string | null>(null);
  const [advisorUsage, setAdvisorUsage] = useState({ used: 0, limit: strategyAdvisorLimits.MONTHLY_QUERY_LIMIT });
  const [advisorSession, setAdvisorSession] = useState<AdvisorSessionState>({
    context: null,
    lastSummary: '',
    followUpsUsed: 0,
    lastActivityAt: 0,
    startedAt: 0,
  });
  const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>(() => {
    if (typeof window === 'undefined') return 'executive-dark';
    const storedMode = window.localStorage.getItem(SURFACE_MODE_STORAGE_KEY);
    return storedMode === 'soft-neutral' ? 'soft-neutral' : 'executive-dark';
  });

  const canExport = !isFreeTier && (adminMode ? true : hasPermission(state.user || null, 'reports:export'));
  const exportControlDisabled = !canExport && !isFreeTier;
  const hasAiAddon = !isFreeTier && Boolean(state.user?.subscription_addon_ai);
  const visibleSections = isFreeTier ? FREE_TIER_SECTION_LABELS : SECTION_LABELS;

  useEffect(() => {
    if (routeCountry) {
      const normalized = routeCountry.toLowerCase() as CountryCode;
      if (accessibleCountries.includes(normalized)) {
        setActiveCountry(normalized);
        return;
      }
    }
    if (accessibleCountries.length > 0 && !activeCountry) {
      setActiveCountry(accessibleCountries[0]);
    }
  }, [routeCountry, accessibleCountries, activeCountry]);

  useEffect(() => {
    if (isFreeTier && section !== 'overview') {
      setSection('overview');
    }
  }, [isFreeTier, section]);

  useEffect(() => {
    const loadResponses = async () => {
      if (!activeCountry) {
        setResponses([]);
        return;
      }
      setLoadingResponses(true);
      try {
        const result = await responseService.listDashboardResponsesWithFallback({ country: activeCountry });
        setResponses(result.responses);
        setRawDataSource('firestore');
        setRawDataSourceReason(result.fallbackReason);
      } catch (error) {
        console.warn('[dashboard:data-source] falling back to local responses', {
          adminMode,
          country: activeCountry,
          error: error instanceof Error ? error.message : String(error),
        });
        setResponses(getResponses().filter((response) => {
          const country = (response.country || response.selected_country || null) as CountryCode | null;
          return country === activeCountry;
        }));
        setRawDataSource('local');
        setRawDataSourceReason(error instanceof Error ? error.message : 'Live dashboard response load failed.');
      } finally {
        setLoadingResponses(false);
      }
    };
    loadResponses();
  }, [activeCountry]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SURFACE_MODE_STORAGE_KEY, surfaceMode);
  }, [surfaceMode]);

  const countryBanks = useMemo(
    () => (activeCountry ? BANKS.filter((bank) => bank.country === activeCountry) : []),
    [activeCountry],
  );

  useEffect(() => {
    if (countryBanks.length > 0) {
      setSelectedBankId(countryBanks[0].id);
      setCompareBankId(countryBanks[1]?.id || '');
    }
  }, [countryBanks]);

  useEffect(() => {
    if (!compareBankId) return;
    const compareStillValid = countryBanks.some((bank) => bank.id === compareBankId && bank.id !== selectedBankId);
    if (!compareStillValid) {
      setCompareBankId('');
    }
  }, [compareBankId, countryBanks, selectedBankId]);

  const filters: SubscriberFilters | null = activeCountry && selectedBankId
    ? {
        country: activeCountry,
        bankId: selectedBankId,
        ageGroups,
        genders,
        timeWindow,
      }
    : null;
  const aggregateUnsupportedFilterReason = useMemo(() => {
    const unsupported = [
      ageGroups.length > 0 ? 'ageGroups' : null,
      genders.length > 0 ? 'genders' : null,
    ].filter(Boolean);
    return unsupported.length > 0
      ? `Aggregate does not support active filters: ${unsupported.join(', ')}. Using live-response analytics.`
      : null;
  }, [ageGroups, genders]);
  const canUseOverviewAggregate = Boolean(activeCountry && selectedBankId && !aggregateUnsupportedFilterReason);

  useEffect(() => {
    const loadOverviewAggregate = async () => {
      if (!activeCountry || !selectedBankId || !canUseOverviewAggregate) {
        setOverviewAggregate(null);
        setOverviewAggregateReason(aggregateUnsupportedFilterReason);
        if (activeCountry && selectedBankId && aggregateUnsupportedFilterReason) {
          console.warn('[analytics_aggregate] aggregate_raw_fallback_triggered', {
            event: 'aggregate_raw_fallback_triggered',
            country: activeCountry,
            bankId: selectedBankId,
            timeWindow,
            phase: 'filter',
            failures: ['unsupported_active_filter'],
            reason: aggregateUnsupportedFilterReason,
          });
        }
        return;
      }

      setLoadingOverviewAggregate(true);
      try {
        const result = await analyticsAggregateService.getDashboardOverviewAggregateWithFallback(activeCountry, selectedBankId, timeWindow, {
          ageGroups,
          genders,
        });
        const aggregate = result.aggregate;
        const isUsableAggregate = aggregate
          && aggregate.integrity?.coverageComplete !== false
          && aggregate.integrity?.rebuildStatus !== 'rebuilding';
        setOverviewAggregate(isUsableAggregate ? aggregate : null);
        setOverviewAggregateReason(result.fallbackReason);
      } catch (error) {
        setOverviewAggregate(null);
        setOverviewAggregateReason(error instanceof Error ? error.message : 'Overview aggregate load failed.');
      } finally {
        setLoadingOverviewAggregate(false);
      }
    };

    loadOverviewAggregate();
  }, [activeCountry, selectedBankId, timeWindow, canUseOverviewAggregate, aggregateUnsupportedFilterReason, ageGroups, genders]);

  const scopedResponses = useMemo(() => {
    if (!filters) return [];
    return filterResponsesForDashboard(responses, filters);
  }, [responses, filters]);

  const scopedNoTimeResponses = useMemo(() => {
    if (!activeCountry) return [];
    return responses.filter((response) => {
      const country = (response.country || response.selected_country || null) as CountryCode | null;
      if (!country || country !== activeCountry) return false;
      if (!isIncludedInAnalytics(response)) return false;
      if (ageGroups.length > 0 && (!response.b2_age || !ageGroups.includes(response.b2_age))) return false;
      if (genders.length > 0 && (!response.gender || !genders.includes(response.gender))) return false;
      return true;
    });
  }, [responses, activeCountry, ageGroups, genders]);

  const sampleSize = scopedResponses.length;

  const trend: TrendPoint[] = useMemo(
    () => (selectedBankId ? computeTrendSeries(scopedResponses, selectedBankId, 6) : []),
    [scopedResponses, selectedBankId],
  );
  const trendView: TrendPoint[] = useMemo(
    () => (canUseOverviewAggregate && overviewAggregate
      ? overviewAggregate.monthlyTrend.map((point) => ({
          month: point.month,
          awareness: point.awareness,
          usage: point.usage,
          nps: point.nps,
          topOfMind: point.topOfMind,
          spontaneous: point.spontaneous,
        })) as TrendPoint[]
      : trend),
    [canUseOverviewAggregate, overviewAggregate, trend],
  );

  const selectedMetrics: BankMetrics | null = useMemo(() => {
    if (!selectedBankId) return null;
    const previousAwareness = trend.length > 1 ? (trend[trend.length - 2].awareness ?? 0) : 0;
    return computeBankMetrics(scopedResponses, selectedBankId, previousAwareness);
  }, [scopedResponses, selectedBankId, trend]);

  const awarenessCurrentPrevious = useMemo(() => {
    if (!selectedBankId) return { current: null, previous: null };

    const now = new Date();
    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const currentRange = scopedNoTimeResponses.filter((response) => {
      const ts = new Date(response.timestamp).getTime();
      return Number.isFinite(ts) && ts >= currentStart;
    });
    const previousRange = scopedNoTimeResponses.filter((response) => {
      const ts = new Date(response.timestamp).getTime();
      return Number.isFinite(ts) && ts >= previousStart && ts < currentStart;
    });

    return {
      current: computeBankMetrics(currentRange, selectedBankId, 0),
      previous: computeBankMetrics(previousRange, selectedBankId, 0),
    };
  }, [scopedNoTimeResponses, selectedBankId]);

  const awarenessDeltas = useMemo(() => {
    const current = awarenessCurrentPrevious.current;
    const previous = awarenessCurrentPrevious.previous;
    if (!current || !previous || previous.sample <= 0) {
      return {
        topOfMind: null,
        spontaneous: null,
        awareness: null,
        quality: null,
      };
    }
    return {
      topOfMind: current.topOfMind - previous.topOfMind,
      spontaneous: current.spontaneous - previous.spontaneous,
      awareness: current.aware - previous.aware,
      quality: current.awarenessQuality - previous.awarenessQuality,
    };
  }, [awarenessCurrentPrevious]);

  const selectedMetricsView: BankMetrics | null = useMemo(() => {
    if (!overviewAggregate?.selectedMetrics) return selectedMetrics;
    const aggregateMetrics = overviewAggregate.selectedMetrics;
    return {
      ...(selectedMetrics || {
        bankId: selectedBankId,
        sample: aggregateMetrics.sample,
        aware: 0,
        topOfMind: 0,
        spontaneous: 0,
        aided: 0,
        awarenessQuality: 0,
        everUsed: 0,
        currentUsing: 0,
        preferred: 0,
        trialRate: 0,
        retentionRate: 0,
        preferenceRate: 0,
        lapseRate: 0,
        considerationRate: 0,
        marketPenetration: 0,
        nps: 0,
        promoters: 0,
        passives: 0,
        detractors: 0,
        loyalty: {
          Committed: 0,
          Favors: 0,
          Potential: 0,
          Accessibles: 0,
          Rejectors: 0,
        },
        loyaltyCounts: {
          Committed: 0,
          Favors: 0,
          Potential: 0,
          Accessibles: 0,
          Rejectors: 0,
        },
        loyaltyIndex: 0,
        momentum: 0,
      }),
      sample: aggregateMetrics.sample,
      aware: aggregateMetrics.aware,
      topOfMind: aggregateMetrics.topOfMind,
      spontaneous: aggregateMetrics.spontaneous,
      aided: aggregateMetrics.aided,
      awarenessQuality: aggregateMetrics.awarenessQuality,
      everUsed: aggregateMetrics.everUsed,
      currentUsing: aggregateMetrics.currentUsing,
      preferred: aggregateMetrics.preferred,
      trialRate: aggregateMetrics.trialRate,
      retentionRate: aggregateMetrics.retentionRate,
      preferenceRate: aggregateMetrics.preferenceRate,
      lapseRate: Math.max(0, 100 - aggregateMetrics.retentionRate),
      considerationRate: aggregateMetrics.considerationRate,
      marketPenetration: aggregateMetrics.currentUsing,
      nps: aggregateMetrics.nps,
      promoters: aggregateMetrics.promoters,
      passives: aggregateMetrics.passives,
      detractors: aggregateMetrics.detractors,
      loyalty: {
        Committed: aggregateMetrics.segmentPcts.Committed || 0,
        Favors: aggregateMetrics.segmentPcts.Favors || 0,
        Potential: aggregateMetrics.segmentPcts.Potential || 0,
        Accessibles: aggregateMetrics.segmentPcts.Accessibles || 0,
        Rejectors: aggregateMetrics.segmentPcts.Rejectors || 0,
      },
      loyaltyCounts: {
        Committed: aggregateMetrics.loyaltyCounts.Committed || 0,
        Favors: aggregateMetrics.loyaltyCounts.Favors || 0,
        Potential: aggregateMetrics.loyaltyCounts.Potential || 0,
        Accessibles: aggregateMetrics.loyaltyCounts.Accessibles || 0,
        Rejectors: aggregateMetrics.loyaltyCounts.Rejectors || 0,
      },
      loyaltyIndex: aggregateMetrics.loyaltyIndex,
    };
  }, [overviewAggregate, selectedMetrics, selectedBankId]);

  const awarenessDeltasView = useMemo(() => {
    if (!canUseOverviewAggregate || !overviewAggregate) return awarenessDeltas;
    return {
      topOfMind: overviewAggregate.monthOverMonth.deltas.topOfMind,
      spontaneous: overviewAggregate.monthOverMonth.deltas.spontaneous,
      awareness: overviewAggregate.monthOverMonth.deltas.awareness,
      quality: overviewAggregate.monthOverMonth.deltas.quality,
    };
  }, [canUseOverviewAggregate, overviewAggregate, awarenessDeltas]);

  const awarenessMoMGrowthPct = useMemo(() => {
    const current = awarenessCurrentPrevious.current;
    const previous = awarenessCurrentPrevious.previous;
    if (!current || !previous || previous.sample <= 0 || previous.aware <= 0) return null;
    return ((current.aware - previous.aware) / previous.aware) * 100;
  }, [awarenessCurrentPrevious]);

  const intentSummary = useMemo(
    () => (selectedBankId ? computeIntentSummary(scopedResponses, selectedBankId) : null),
    [scopedResponses, selectedBankId],
  );

  const usageDiagnostics: UsageDiagnostics | null = useMemo(
    () => (activeCountry && selectedBankId ? computeUsageDiagnostics(scopedResponses, activeCountry, selectedBankId) : null),
    [scopedResponses, activeCountry, selectedBankId],
  );

  const compareMetrics: BankMetrics | null = useMemo(
    () => (compareBankId ? computeBankMetrics(scopedResponses, compareBankId, 0) : null),
    [scopedResponses, compareBankId],
  );

  const compareUsageDiagnostics: UsageDiagnostics | null = useMemo(
    () => (activeCountry && compareBankId ? computeUsageDiagnostics(scopedResponses, activeCountry, compareBankId) : null),
    [scopedResponses, activeCountry, compareBankId],
  );

  const usageToplineMetrics: UsageToplineMetrics | UsageAggregateMetrics | null = useMemo(() => {
    const aggregateMetrics = canUseOverviewAggregate
      ? buildUsageAggregateMetrics(overviewAggregate, compareBankId || null)
      : null;
    if (aggregateMetrics) return aggregateMetrics;
    return buildUsageToplineMetricsFromRaw(
      selectedMetricsView,
      usageDiagnostics,
      compareMetrics,
      compareUsageDiagnostics,
      compareBankId || null,
      compareBankId ? countryBanks.find((bank) => bank.id === compareBankId)?.name || compareBankId : null,
    );
  }, [
    canUseOverviewAggregate,
    overviewAggregate,
    compareBankId,
    selectedMetricsView,
    usageDiagnostics,
    compareMetrics,
    compareUsageDiagnostics,
    countryBanks,
  ]);

  const multiBankCompetition: MultiBankCompetitionDiagnostics | null = useMemo(
    () => (selectedBankId
      ? computeMultiBankCompetitionDiagnostics(scopedResponses, selectedBankId, compareBankId || null)
      : null),
    [scopedResponses, selectedBankId, compareBankId],
  );

  const previousMonthResponses = useMemo(() => {
    const now = new Date();
    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    return scopedNoTimeResponses.filter((response) => {
      const ts = new Date(response.timestamp).getTime();
      return Number.isFinite(ts) && ts >= previousStart && ts < currentStart;
    });
  }, [scopedNoTimeResponses]);

  const loyaltyDiagnostics: LoyaltyDiagnostics | null = useMemo(
    () => (selectedBankId ? computeLoyaltyDiagnostics(scopedResponses, selectedBankId, previousMonthResponses) : null),
    [scopedResponses, selectedBankId, previousMonthResponses],
  );
  const aggregateLoyaltySummary = useMemo(
    () => (canUseOverviewAggregate ? buildAggregateBackedLoyaltySummary(overviewAggregate) : null),
    [canUseOverviewAggregate, overviewAggregate],
  );
  const loyaltyDiagnosticsView: LoyaltyDiagnostics | null = useMemo(() => {
    if (!loyaltyDiagnostics && !aggregateLoyaltySummary) return null;
    if (!aggregateLoyaltySummary) return loyaltyDiagnostics;
    return {
      awareCount: aggregateLoyaltySummary.awareCount,
      segmentCounts: aggregateLoyaltySummary.segmentCounts as LoyaltyDiagnostics['segmentCounts'],
      segmentPcts: aggregateLoyaltySummary.segmentPcts as LoyaltyDiagnostics['segmentPcts'],
      loyaltyIndex: aggregateLoyaltySummary.loyaltyIndex,
      nps: aggregateLoyaltySummary.nps,
      movementRows: aggregateLoyaltySummary.movementRows as LoyaltyDiagnostics['movementRows'],
      profileCards: loyaltyDiagnostics?.profileCards || [],
      awareToPotential: aggregateLoyaltySummary.awareToPotential,
      potentialToFavors: aggregateLoyaltySummary.potentialToFavors,
      favorsToCommitted: aggregateLoyaltySummary.favorsToCommitted,
    };
  }, [loyaltyDiagnostics, aggregateLoyaltySummary]);

  const momentumDiagnostics: MomentumDiagnostics | null = useMemo(
    () => (activeCountry && selectedBankId
      ? computeMomentumDiagnostics(scopedResponses, scopedNoTimeResponses, activeCountry, selectedBankId, 6)
      : null),
    [scopedResponses, scopedNoTimeResponses, activeCountry, selectedBankId],
  );
  const aggregateMomentumSummary = useMemo(
    () => (canUseOverviewAggregate ? buildAggregateBackedMomentumSummary(overviewAggregate) : null),
    [canUseOverviewAggregate, overviewAggregate],
  );
  const momentumDiagnosticsView: MomentumDiagnostics | null = useMemo(() => {
    if (!momentumDiagnostics && !aggregateMomentumSummary) return null;
    if (!aggregateMomentumSummary) return momentumDiagnostics;
    if (!momentumDiagnostics) return null;
    return {
      ...momentumDiagnostics,
      score: aggregateMomentumSummary.score,
      status: aggregateMomentumSummary.status,
      strategy: aggregateMomentumSummary.strategy,
      components: aggregateMomentumSummary.components,
    };
  }, [momentumDiagnostics, aggregateMomentumSummary]);

  const competitiveDiagnostics: CompetitiveIntelligenceDiagnostics | null = useMemo(
    () => (activeCountry && selectedBankId
      ? computeCompetitiveIntelligenceDiagnostics(scopedResponses, scopedNoTimeResponses, activeCountry, selectedBankId)
      : null),
    [scopedResponses, scopedNoTimeResponses, activeCountry, selectedBankId],
  );

  const switchingRadar: CustomerSwitchingRadarResult | null = useMemo(
    () => (selectedBankId ? computeCustomerSwitchingRadar(scopedResponses, selectedBankId) : null),
    [scopedResponses, selectedBankId],
  );

  const migrationMap: CustomerMigrationMapResult | null = useMemo(
    () => (selectedBankId ? computeCustomerMigrationMap(scopedResponses, selectedBankId) : null),
    [scopedResponses, selectedBankId],
  );

  const hasObservedWinLoss = competitiveDiagnostics?.winLoss.hasPanelTransitions ?? false;
  const winLossSectionTitle = hasObservedWinLoss ? 'Observed Preference Transitions' : 'Proxy Competitive Balance';
  const winLossSectionSubtitle = hasObservedWinLoss
    ? 'Based on device-linked preferred-bank changes across matched responses.'
    : 'Modeled from multi-bank overlap and market-share deltas. This is directional, not observed customer switching.';
  const winLossPrimaryCardTitle = hasObservedWinLoss ? 'Observed Win Rate' : 'Proxy Balance';
  const winLossModeLabel = hasObservedWinLoss ? 'Observed transitions' : 'Proxy signal';
  const winLossModeSubtitle = hasObservedWinLoss
    ? 'Matched preferred-bank movement across linked responses.'
    : 'Estimated from overlap and share movement rather than observed customer transitions.';

  const trendsDiagnostics: TrendForecastDiagnostics | null = useMemo(
    () => (selectedBankId ? computeTrendForecastDiagnostics(scopedNoTimeResponses, selectedBankId, 12) : null),
    [scopedNoTimeResponses, selectedBankId],
  );

  const awarenessRankRows = useMemo(() => {
    if (canUseOverviewAggregate && overviewAggregate) {
      return overviewAggregate.marketRows;
    }
    if (!activeCountry) return [];
    const bankIds = countryBanks.map((bank) => bank.id);
    const currentRows = computeCompetitiveRows(scopedResponses, activeCountry, bankIds);
    const now = new Date();
    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const previousResponses = scopedNoTimeResponses.filter((response) => {
      const ts = new Date(response.timestamp).getTime();
      return Number.isFinite(ts) && ts >= previousStart && ts < currentStart;
    });
    const previousRows = computeCompetitiveRows(previousResponses, activeCountry, bankIds);
    const previousRank = new Map(previousRows.map((row, idx) => [row.bankId, idx + 1]));

    return currentRows.map((row, idx) => {
      const prior = previousRank.get(row.bankId);
      const movement = prior ? prior - (idx + 1) : null;
      return {
        ...row,
        rank: idx + 1,
        movement,
      };
    });
  }, [canUseOverviewAggregate, overviewAggregate, scopedResponses, scopedNoTimeResponses, activeCountry, countryBanks]);

  const brandEdgeInputs = useMemo(() => {
    const primaryShare = awarenessRankRows.find((row) => row.bankId === selectedBankId)?.marketShare
      || competitiveDiagnostics?.marketStructure.marketRows.find((row) => row.bankId === selectedBankId)?.marketShare
      || 0;
    const switchingRisk = overviewAggregate?.selectedMetrics?.switchingRisk || usageDiagnostics?.churnRate || 0;
    return {
      awareness: selectedMetricsView?.aware || 0,
      usage: selectedMetricsView?.currentUsing || 0,
      loyalty: overviewAggregate?.selectedMetrics?.loyaltyIndex || loyaltyDiagnosticsView?.loyaltyIndex || selectedMetricsView?.loyaltyIndex || 0,
      primaryShare,
      switchingRisk,
    };
  }, [awarenessRankRows, competitiveDiagnostics, selectedBankId, usageDiagnostics, selectedMetricsView, loyaltyDiagnosticsView, overviewAggregate]);

  const brandEdgeScore = useMemo(
    () => overviewAggregate?.selectedMetrics?.brandEdgeScore ?? computeBrandEdgeScore(brandEdgeInputs),
    [overviewAggregate, brandEdgeInputs],
  );
  const brandEdgeLabel = useMemo(() => describeBrandEdgeScore(brandEdgeScore), [brandEdgeScore]);
  const brandEdgeDriverSummary = useMemo(() => summarizeBrandEdgeDrivers(brandEdgeInputs), [brandEdgeInputs]);

  const compareBankName = useMemo(
    () => (compareBankId ? countryBanks.find((bank) => bank.id === compareBankId)?.name || compareBankId : null),
    [countryBanks, compareBankId],
  );
  const metricScopeSignature = useMemo(
    () => [
      activeCountry || 'none',
      timeWindow,
      [...ageGroups].sort().join(',') || 'all-ages',
      [...genders].sort().join(',') || 'all-genders',
    ].join('|'),
    [activeCountry, timeWindow, ageGroups, genders],
  );

  const selectedBankName = useMemo(
    () => countryBanks.find((bank) => bank.id === selectedBankId)?.name || selectedBankId,
    [countryBanks, selectedBankId],
  );

  const compareBrandEdgeInputs = useMemo(() => {
    if (!compareBankId) return null;
    const comparePrimaryShare = awarenessRankRows.find((row) => row.bankId === compareBankId)?.marketShare || 0;
    return {
      awareness: compareMetrics?.aware || 0,
      usage: compareMetrics?.currentUsing || 0,
      loyalty: compareMetrics?.loyaltyIndex || 0,
      primaryShare: comparePrimaryShare,
      switchingRisk: compareUsageDiagnostics?.churnRate || 0,
    };
  }, [compareBankId, awarenessRankRows, compareMetrics, compareUsageDiagnostics]);

  const compareBrandEdgeScore = useMemo(
    () => (compareBrandEdgeInputs ? computeBrandEdgeScore(compareBrandEdgeInputs) : null),
    [compareBrandEdgeInputs],
  );

  const selectedAwarenessRow = useMemo(
    () => awarenessRankRows.find((row) => row.bankId === selectedBankId) || null,
    [awarenessRankRows, selectedBankId],
  );

  const compareAwarenessRow = useMemo(
    () => (compareBankId ? awarenessRankRows.find((row) => row.bankId === compareBankId) || null : null),
    [awarenessRankRows, compareBankId],
  );

  const overviewTopMetrics = useMemo(() => {
    const awarenessMetric = createMetric({
      value: selectedMetricsView?.aware ?? null,
      base_n: selectedMetricsView?.sample ?? sampleSize,
      base_type: ANALYTICS_BASE_TYPES.TOTAL_RESPONSES,
      source: canUseOverviewAggregate && overviewAggregate ? 'aggregate' : 'raw',
      metric_family: 'overview',
      compare_supported: Boolean(compareAwarenessRow),
      compare: compareAwarenessRow ? createCompareMetric(
        createMetric({
          value: selectedMetricsView?.aware ?? null,
          base_n: selectedMetricsView?.sample ?? sampleSize,
          base_type: ANALYTICS_BASE_TYPES.TOTAL_RESPONSES,
          source: canUseOverviewAggregate && overviewAggregate ? 'aggregate' : 'raw',
          metric_family: 'overview',
          scope_signature: metricScopeSignature,
        }),
        createMetric({
          value: compareAwarenessRow.awareness,
          base_n: selectedMetricsView?.sample ?? sampleSize,
          base_type: ANALYTICS_BASE_TYPES.TOTAL_RESPONSES,
          source: 'hybrid',
          metric_family: 'overview',
          scope_signature: metricScopeSignature,
        }),
        { bankId: compareBankId, bankName: compareBankName },
      ) : null,
      scope_signature: metricScopeSignature,
    });
    const currentUsageMetric = createMetric({
      value: selectedMetricsView?.currentUsing ?? null,
      base_n: selectedMetricsView?.sample ?? sampleSize,
      base_type: ANALYTICS_BASE_TYPES.TOTAL_RESPONSES,
      source: canUseOverviewAggregate && overviewAggregate ? 'aggregate' : 'raw',
      metric_family: 'overview',
      compare_supported: Boolean(compareAwarenessRow),
      compare: compareAwarenessRow ? createCompareMetric(
        createMetric({
          value: selectedMetricsView?.currentUsing ?? null,
          base_n: selectedMetricsView?.sample ?? sampleSize,
          base_type: ANALYTICS_BASE_TYPES.TOTAL_RESPONSES,
          source: canUseOverviewAggregate && overviewAggregate ? 'aggregate' : 'raw',
          metric_family: 'overview',
          scope_signature: metricScopeSignature,
        }),
        createMetric({
          value: compareAwarenessRow.currentUsage,
          base_n: selectedMetricsView?.sample ?? sampleSize,
          base_type: ANALYTICS_BASE_TYPES.TOTAL_RESPONSES,
          source: 'hybrid',
          metric_family: 'overview',
          scope_signature: metricScopeSignature,
        }),
        { bankId: compareBankId, bankName: compareBankName },
      ) : null,
      scope_signature: metricScopeSignature,
    });
    const loyaltyMetric = createMetric({
      value: loyaltyDiagnosticsView?.loyaltyIndex ?? null,
      base_n: loyaltyDiagnosticsView?.awareCount ?? selectedMetricsView?.sample ?? sampleSize,
      base_type: ANALYTICS_BASE_TYPES.AWARE_RESPONDENTS,
      source: overviewAggregate?.selectedMetrics ? 'aggregate' : 'raw',
      metric_family: 'loyalty',
      compare_supported: Boolean(compareMetrics),
      compare: compareMetrics ? createCompareMetric(
        createMetric({
          value: loyaltyDiagnosticsView?.loyaltyIndex ?? null,
          base_n: loyaltyDiagnosticsView?.awareCount ?? null,
          base_type: ANALYTICS_BASE_TYPES.AWARE_RESPONDENTS,
          source: overviewAggregate?.selectedMetrics ? 'aggregate' : 'raw',
          metric_family: 'loyalty',
          scope_signature: metricScopeSignature,
        }),
        createMetric({
          value: compareMetrics.loyaltyIndex,
          base_n: compareMetrics.sample,
          base_type: ANALYTICS_BASE_TYPES.AWARE_RESPONDENTS,
          source: 'raw',
          metric_family: 'loyalty',
          scope_signature: metricScopeSignature,
        }),
        { bankId: compareBankId, bankName: compareBankName },
      ) : null,
      scope_signature: metricScopeSignature,
    });
    const npsMetric = createMetric({
      value: selectedMetricsView?.nps ?? null,
      base_n: usageDiagnostics?.everCount ?? null,
      base_type: ANALYTICS_BASE_TYPES.EVER_USED_RESPONDENTS,
      source: canUseOverviewAggregate && overviewAggregate ? 'aggregate' : 'raw',
      metric_family: 'overview',
      compare_supported: Boolean(compareMetrics),
      compare: compareMetrics ? createCompareMetric(
        createMetric({
          value: selectedMetricsView?.nps ?? null,
          base_n: usageDiagnostics?.everCount ?? null,
          base_type: ANALYTICS_BASE_TYPES.EVER_USED_RESPONDENTS,
          source: canUseOverviewAggregate && overviewAggregate ? 'aggregate' : 'raw',
          metric_family: 'overview',
          scope_signature: metricScopeSignature,
        }),
        createMetric({
          value: compareMetrics.nps,
          base_n: compareUsageDiagnostics?.everCount ?? null,
          base_type: ANALYTICS_BASE_TYPES.EVER_USED_RESPONDENTS,
          source: 'raw',
          metric_family: 'overview',
          scope_signature: metricScopeSignature,
        }),
        { bankId: compareBankId, bankName: compareBankName },
      ) : null,
      scope_signature: metricScopeSignature,
    });
    return {
      awareness: awarenessMetric,
      currentUsage: currentUsageMetric,
      loyaltyIndex: loyaltyMetric,
      nps: npsMetric,
    };
  }, [
    selectedMetricsView,
    sampleSize,
    canUseOverviewAggregate,
    overviewAggregate,
    compareAwarenessRow,
    compareBankId,
    compareBankName,
    loyaltyDiagnostics,
    loyaltyDiagnosticsView,
    compareMetrics,
    usageDiagnostics,
    compareUsageDiagnostics,
    metricScopeSignature,
  ]);

  const brandEdgeTrend = useMemo(() => {
    if (canUseOverviewAggregate && overviewAggregate) {
      return overviewAggregate.monthlyTrend.map((point) => ({ month: point.month, score: point.brandEdgeScore }));
    }
    if (!activeCountry || !selectedBankId) return [] as Array<{ month: string; score: number | null }>;
    const now = new Date();
    const points: Array<{ month: string; score: number | null }> = [];
    for (let i = 5; i >= 0; i -= 1) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1).getTime();
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1).getTime();
      const monthResponses = scopedNoTimeResponses.filter((response) => {
        const ts = new Date(response.timestamp).getTime();
        return Number.isFinite(ts) && ts >= start && ts < end;
      });
      if (monthResponses.length === 0) {
        points.push({
          month: new Date(start).toLocaleDateString('en', { month: 'short' }),
          score: null,
        });
        continue;
      }
      const monthMetrics = computeBankMetrics(monthResponses, selectedBankId, 0);
      const monthUsage = computeUsageDiagnostics(monthResponses, activeCountry, selectedBankId);
      const monthCompetitive = computeCompetitiveIntelligenceDiagnostics(monthResponses, monthResponses, activeCountry, selectedBankId);
      const monthPrimaryShare = monthCompetitive.marketStructure.marketRows.find((row) => row.bankId === selectedBankId)?.marketShare || 0;
      points.push({
        month: new Date(start).toLocaleDateString('en', { month: 'short' }),
        score: computeBrandEdgeScore({
          awareness: monthMetrics.aware,
          usage: monthMetrics.currentUsing,
          loyalty: monthMetrics.loyaltyIndex,
          primaryShare: monthPrimaryShare,
          switchingRisk: monthUsage.churnRate,
        }),
      });
    }
    return points;
  }, [activeCountry, selectedBankId, scopedNoTimeResponses]);

  const awarenessShareIndex = useMemo(() => {
    const totalAwareness = awarenessRankRows.reduce((sum, row) => sum + row.awareness, 0);
    if (totalAwareness <= 0 || !selectedMetricsView) return 0;
    return Math.round((selectedMetricsView.aware / totalAwareness) * 100);
  }, [awarenessRankRows, selectedMetricsView]);

  const awarenessDepthScore = useMemo(() => {
    if (!selectedMetricsView) return 0;
    const aidedOnly = Math.max(selectedMetricsView.aided - selectedMetricsView.spontaneous, 0);
    const score = (selectedMetricsView.topOfMind * 3 + selectedMetricsView.spontaneous * 2 + aidedOnly) / 3;
    return Math.round(score);
  }, [selectedMetricsView]);

  const compareAwarenessDepthScore = useMemo(() => {
    if (!compareMetrics) return null;
    const aidedOnly = Math.max(compareMetrics.aided - compareMetrics.spontaneous, 0);
    const score = (compareMetrics.topOfMind * 3 + compareMetrics.spontaneous * 2 + aidedOnly) / 3;
    return Math.round(score);
  }, [compareMetrics]);

  const demographicSummary: DemographicSummary = useMemo(
    () => computeDemographics(scopedResponses),
    [scopedResponses],
  );

  const demographicDiagnostics: DemographicDiagnostics | null = useMemo(
    () => (selectedBankId ? computeDemographicDiagnostics(scopedResponses, selectedBankId) : null),
    [scopedResponses, selectedBankId],
  );

  const guardedAgeRows = useMemo(
    () => applyGuardedRendering(demographicDiagnostics?.ageRows ?? [], 'table'),
    [demographicDiagnostics],
  );
  const guardedGenderRows = useMemo(
    () => applyGuardedRendering(demographicDiagnostics?.genderRows ?? [], 'table'),
    [demographicDiagnostics],
  );
  const guardedEmploymentRows = useMemo(
    () => applyGuardedRendering(demographicDiagnostics?.employmentRows ?? [], 'table'),
    [demographicDiagnostics],
  );
  const guardedEducationRows = useMemo(
    () => applyGuardedRendering(demographicDiagnostics?.educationRows ?? [], 'table'),
    [demographicDiagnostics],
  );
  const guardedOpportunityRows = useMemo(
    () => applyGuardedRendering(demographicDiagnostics?.opportunities ?? [], 'ranking'),
    [demographicDiagnostics],
  );

  const awarenessTopMetrics = useMemo(() => ({
    topOfMind: createMetric({
      value: selectedMetricsView?.topOfMind ?? null,
      base_n: selectedMetricsView?.sample ?? sampleSize,
      base_type: ANALYTICS_BASE_TYPES.TOTAL_RESPONSES,
      source: canUseOverviewAggregate && overviewAggregate ? 'aggregate' : 'raw',
      metric_family: 'awareness',
      compare_supported: Boolean(compareAwarenessRow),
      compare: compareAwarenessRow ? createCompareMetric(
        createMetric({ value: selectedMetricsView?.topOfMind ?? null, base_n: selectedMetricsView?.sample ?? sampleSize, base_type: ANALYTICS_BASE_TYPES.TOTAL_RESPONSES, source: canUseOverviewAggregate && overviewAggregate ? 'aggregate' : 'raw', metric_family: 'awareness', scope_signature: metricScopeSignature }),
        createMetric({ value: compareAwarenessRow.topOfMind, base_n: selectedMetricsView?.sample ?? sampleSize, base_type: ANALYTICS_BASE_TYPES.TOTAL_RESPONSES, source: 'hybrid', metric_family: 'awareness', scope_signature: metricScopeSignature }),
        { bankId: compareBankId, bankName: compareBankName },
      ) : null,
      scope_signature: metricScopeSignature,
    }),
    spontaneous: createMetric({
      value: selectedMetricsView?.spontaneous ?? null,
      base_n: selectedMetricsView?.sample ?? sampleSize,
      base_type: ANALYTICS_BASE_TYPES.TOTAL_RESPONSES,
      source: canUseOverviewAggregate && overviewAggregate ? 'aggregate' : 'raw',
      metric_family: 'awareness',
      compare_supported: Boolean(compareMetrics),
      compare: compareMetrics ? createCompareMetric(
        createMetric({ value: selectedMetricsView?.spontaneous ?? null, base_n: selectedMetricsView?.sample ?? sampleSize, base_type: ANALYTICS_BASE_TYPES.TOTAL_RESPONSES, source: canUseOverviewAggregate && overviewAggregate ? 'aggregate' : 'raw', metric_family: 'awareness', scope_signature: metricScopeSignature }),
        createMetric({ value: compareMetrics.spontaneous, base_n: compareMetrics.sample, base_type: ANALYTICS_BASE_TYPES.TOTAL_RESPONSES, source: 'raw', metric_family: 'awareness', scope_signature: metricScopeSignature }),
        { bankId: compareBankId, bankName: compareBankName },
      ) : null,
      scope_signature: metricScopeSignature,
    }),
    awareness: createMetric({
      value: selectedMetricsView?.aware ?? null,
      base_n: selectedMetricsView?.sample ?? sampleSize,
      base_type: ANALYTICS_BASE_TYPES.TOTAL_RESPONSES,
      source: canUseOverviewAggregate && overviewAggregate ? 'aggregate' : 'raw',
      metric_family: 'awareness',
      compare_supported: Boolean(compareAwarenessRow),
      compare: compareAwarenessRow ? createCompareMetric(
        createMetric({ value: selectedMetricsView?.aware ?? null, base_n: selectedMetricsView?.sample ?? sampleSize, base_type: ANALYTICS_BASE_TYPES.TOTAL_RESPONSES, source: canUseOverviewAggregate && overviewAggregate ? 'aggregate' : 'raw', metric_family: 'awareness', scope_signature: metricScopeSignature }),
        createMetric({ value: compareAwarenessRow.awareness, base_n: selectedMetricsView?.sample ?? sampleSize, base_type: ANALYTICS_BASE_TYPES.TOTAL_RESPONSES, source: 'hybrid', metric_family: 'awareness', scope_signature: metricScopeSignature }),
        { bankId: compareBankId, bankName: compareBankName },
      ) : null,
      scope_signature: metricScopeSignature,
    }),
    quality: createMetric({
      value: selectedMetricsView?.awarenessQuality ?? null,
      base_n: usageDiagnostics?.awareCount ?? null,
      base_type: ANALYTICS_BASE_TYPES.AWARE_RESPONDENTS,
      source: canUseOverviewAggregate && overviewAggregate ? 'aggregate' : 'raw',
      metric_family: 'awareness',
      compare_supported: Boolean(compareMetrics),
      compare: compareMetrics ? createCompareMetric(
        createMetric({ value: selectedMetricsView?.awarenessQuality ?? null, base_n: usageDiagnostics?.awareCount ?? null, base_type: ANALYTICS_BASE_TYPES.AWARE_RESPONDENTS, source: canUseOverviewAggregate && overviewAggregate ? 'aggregate' : 'raw', metric_family: 'awareness', scope_signature: metricScopeSignature }),
        createMetric({ value: compareMetrics.awarenessQuality, base_n: compareUsageDiagnostics?.awareCount ?? null, base_type: ANALYTICS_BASE_TYPES.AWARE_RESPONDENTS, source: 'raw', metric_family: 'awareness', scope_signature: metricScopeSignature }),
        { bankId: compareBankId, bankName: compareBankName },
      ) : null,
      scope_signature: metricScopeSignature,
    }),
  }), [selectedMetricsView, sampleSize, canUseOverviewAggregate, overviewAggregate, compareAwarenessRow, compareMetrics, compareUsageDiagnostics, usageDiagnostics, compareBankId, compareBankName, metricScopeSignature]);

  const loyaltyTopMetrics = useMemo(() => loyaltyDiagnosticsView ? ({
    loyaltyIndex: createMetric({ value: loyaltyDiagnosticsView.loyaltyIndex, base_n: loyaltyDiagnosticsView.awareCount, base_type: ANALYTICS_BASE_TYPES.AWARE_RESPONDENTS, source: overviewAggregate?.selectedMetrics ? 'aggregate' : 'raw', metric_family: 'loyalty', compare_supported: false, scope_signature: metricScopeSignature, notes: ['compare_disabled: loyalty summary compare not normalized in this pass'] }),
    nps: createMetric({ value: loyaltyDiagnosticsView.nps, base_n: usageDiagnostics?.everCount ?? null, base_type: ANALYTICS_BASE_TYPES.EVER_USED_RESPONDENTS, source: canUseOverviewAggregate && overviewAggregate ? 'aggregate' : 'raw', metric_family: 'loyalty', compare_supported: false, scope_signature: metricScopeSignature, notes: ['compare_disabled: loyalty summary compare not normalized in this pass'] }),
    committed: createMetric({ value: loyaltyDiagnosticsView.segmentPcts.Committed, count: loyaltyDiagnosticsView.segmentCounts.Committed, base_n: loyaltyDiagnosticsView.awareCount, base_type: ANALYTICS_BASE_TYPES.AWARE_RESPONDENTS, source: overviewAggregate?.selectedMetrics ? 'aggregate' : 'raw', metric_family: 'loyalty', compare_supported: false, scope_signature: metricScopeSignature }),
    rejectors: createMetric({ value: loyaltyDiagnosticsView.segmentPcts.Rejectors, count: loyaltyDiagnosticsView.segmentCounts.Rejectors, base_n: loyaltyDiagnosticsView.awareCount, base_type: ANALYTICS_BASE_TYPES.AWARE_RESPONDENTS, source: overviewAggregate?.selectedMetrics ? 'aggregate' : 'raw', metric_family: 'loyalty', compare_supported: false, scope_signature: metricScopeSignature }),
  }) : null, [loyaltyDiagnosticsView, overviewAggregate, usageDiagnostics, canUseOverviewAggregate, metricScopeSignature]);

  const momentumTopMetrics = useMemo(() => momentumDiagnosticsView ? ({
    score: createMetric({
      value: momentumDiagnosticsView.score,
      base_n: momentumDiagnosticsView.validTrendPeriods,
      base_type: ANALYTICS_BASE_TYPES.TIME_SERIES_WINDOW,
      source: overviewAggregate?.selectedMetrics ? 'aggregate' : 'raw',
      metric_family: 'momentum',
      compare_supported: false,
      scope_signature: metricScopeSignature,
      notes: ['compare_disabled: momentum summary scores are rolling-window normalized composites', ...momentumDiagnosticsView.notes],
    }),
    awarenessGrowth: createMetric({
      value: momentumDiagnosticsView.components.awarenessGrowth,
      base_n: momentumDiagnosticsView.validTrendPeriods,
      base_type: ANALYTICS_BASE_TYPES.TIME_SERIES_WINDOW,
      source: overviewAggregate?.selectedMetrics ? 'aggregate' : 'raw',
      metric_family: 'momentum',
      compare_supported: false,
      scope_signature: metricScopeSignature,
      notes: ['normalized momentum component', ...momentumDiagnosticsView.notes],
    }),
    consideration: createMetric({
      value: momentumDiagnosticsView.components.consideration,
      base_n: momentumDiagnosticsView.validTrendPeriods,
      base_type: ANALYTICS_BASE_TYPES.TIME_SERIES_WINDOW,
      source: overviewAggregate?.selectedMetrics ? 'aggregate' : 'raw',
      metric_family: 'momentum',
      compare_supported: false,
      scope_signature: metricScopeSignature,
      notes: ['normalized momentum component', ...momentumDiagnosticsView.notes],
    }),
    conversion: createMetric({
      value: momentumDiagnosticsView.components.conversion,
      base_n: momentumDiagnosticsView.validTrendPeriods,
      base_type: ANALYTICS_BASE_TYPES.TIME_SERIES_WINDOW,
      source: overviewAggregate?.selectedMetrics ? 'aggregate' : 'raw',
      metric_family: 'momentum',
      compare_supported: false,
      scope_signature: metricScopeSignature,
      notes: ['normalized momentum component', ...momentumDiagnosticsView.notes],
    }),
    retention: createMetric({
      value: momentumDiagnosticsView.components.retention,
      base_n: momentumDiagnosticsView.validTrendPeriods,
      base_type: ANALYTICS_BASE_TYPES.TIME_SERIES_WINDOW,
      source: overviewAggregate?.selectedMetrics ? 'aggregate' : 'raw',
      metric_family: 'momentum',
      compare_supported: false,
      scope_signature: metricScopeSignature,
      notes: ['normalized momentum component', ...momentumDiagnosticsView.notes],
    }),
    adoption: createMetric({
      value: momentumDiagnosticsView.components.adoption,
      base_n: momentumDiagnosticsView.validTrendPeriods,
      base_type: ANALYTICS_BASE_TYPES.TIME_SERIES_WINDOW,
      source: overviewAggregate?.selectedMetrics ? 'aggregate' : 'raw',
      metric_family: 'momentum',
      compare_supported: false,
      scope_signature: metricScopeSignature,
      notes: ['normalized momentum component', ...momentumDiagnosticsView.notes],
    }),
  }) : null, [momentumDiagnosticsView, metricScopeSignature, overviewAggregate]);

  const competitiveTopMetrics = useMemo(() => competitiveDiagnostics ? ({
    marketShare: createMetric({ value: competitiveDiagnostics.marketStructure.marketRows.find((row) => row.bankId === selectedBankId)?.marketShare ?? null, count: competitiveDiagnostics.marketStructure.marketRows.find((row) => row.bankId === selectedBankId)?.preferredCount ?? null, base_n: sampleSize, base_type: ANALYTICS_BASE_TYPES.TOTAL_RESPONSES, source: 'raw', metric_family: 'competitive', compare_supported: false, scope_signature: metricScopeSignature, notes: ['compare_disabled: competitive summary compare not normalized in this pass'] }),
    hhi: createMetric({ value: competitiveDiagnostics.marketStructure.hhi, base_n: sampleSize, base_type: ANALYTICS_BASE_TYPES.MARKET_TOTAL, source: 'raw', metric_family: 'competitive', compare_supported: false, scope_signature: metricScopeSignature }),
    avgBanksPerCustomer: createMetric({ value: competitiveDiagnostics.customerBehavior.averageBanksPerCustomer, base_n: competitiveDiagnostics.customerBehavior.portfolioComposition.reduce((sum, row) => sum + row.count, 0), base_type: ANALYTICS_BASE_TYPES.CURRENT_USERS, source: 'raw', metric_family: 'competitive', compare_supported: false, scope_signature: metricScopeSignature }),
    multiBankingRate: createMetric({ value: competitiveDiagnostics.customerBehavior.multiBankingRate, base_n: competitiveDiagnostics.customerBehavior.portfolioComposition.reduce((sum, row) => sum + row.count, 0), base_type: ANALYTICS_BASE_TYPES.CURRENT_USERS, source: 'raw', metric_family: 'competitive', compare_supported: false, scope_signature: metricScopeSignature }),
  }) : null, [competitiveDiagnostics, selectedBankId, sampleSize, metricScopeSignature]);

  const demographicsTopMetrics = useMemo(() => demographicDiagnostics ? ({
    sample: createMetric({ value: demographicDiagnostics.sample, base_n: demographicDiagnostics.sample, base_type: ANALYTICS_BASE_TYPES.TOTAL_RESPONSES, source: 'raw', metric_family: 'demographics', scope_signature: metricScopeSignature }),
    topSegment: createMetric({ value: demographicDiagnostics.highValueSegments[0]?.score ?? null, base_n: demographicDiagnostics.sample, base_type: ANALYTICS_BASE_TYPES.SEGMENT_POPULATION, source: 'raw', metric_family: 'demographics', scope_signature: metricScopeSignature }),
    highestGap: createMetric({ value: demographicDiagnostics.opportunities[0]?.usageGap ?? null, base_n: demographicDiagnostics.sample, base_type: ANALYTICS_BASE_TYPES.SEGMENT_POPULATION, source: 'raw', metric_family: 'demographics', scope_signature: metricScopeSignature }),
    avgSegmentMultiBanking: createMetric({ value: demographicDiagnostics.ageRows.length > 0 ? Math.round((demographicDiagnostics.ageRows.reduce((sum, row) => sum + row.multiBankRate, 0) / demographicDiagnostics.ageRows.length) * 10) / 10 : null, base_n: demographicDiagnostics.ageRows.length, base_type: ANALYTICS_BASE_TYPES.SEGMENT_POPULATION, source: 'raw', metric_family: 'demographics', scope_signature: metricScopeSignature }),
  }) : null, [demographicDiagnostics, metricScopeSignature]);

  const trendsTopMetrics = useMemo(() => trendsDiagnostics ? ({
    mom: createMetric({ value: trendsDiagnostics.periodComparisons.momPp, base_n: trendsDiagnostics.validPeriods, base_type: ANALYTICS_BASE_TYPES.TIME_SERIES_WINDOW, source: 'raw', metric_family: 'trends', scope_signature: metricScopeSignature, notes: trendsDiagnostics.forecast.reasons }),
    qoq: createMetric({ value: trendsDiagnostics.periodComparisons.qoqPp, base_n: trendsDiagnostics.validPeriods, base_type: ANALYTICS_BASE_TYPES.TIME_SERIES_WINDOW, source: 'raw', metric_family: 'trends', scope_signature: metricScopeSignature, notes: trendsDiagnostics.forecast.reasons }),
    yoy: createMetric({ value: trendsDiagnostics.periodComparisons.yoyPp, base_n: trendsDiagnostics.validPeriods, base_type: ANALYTICS_BASE_TYPES.TIME_SERIES_WINDOW, source: 'raw', metric_family: 'trends', scope_signature: metricScopeSignature, notes: trendsDiagnostics.forecast.reasons }),
    ytdAverage: createMetric({ value: trendsDiagnostics.periodComparisons.ytdAverage, base_n: trendsDiagnostics.validPeriods, base_type: ANALYTICS_BASE_TYPES.TIME_SERIES_WINDOW, source: 'raw', metric_family: 'trends', scope_signature: metricScopeSignature, notes: trendsDiagnostics.forecast.reasons }),
    cagr: createMetric({ value: trendsDiagnostics.growth.cagrPct, base_n: trendsDiagnostics.validPeriods, base_type: ANALYTICS_BASE_TYPES.TIME_SERIES_WINDOW, source: 'raw', metric_family: 'trends', scope_signature: metricScopeSignature, notes: trendsDiagnostics.forecast.reasons }),
  }) : null, [trendsDiagnostics, metricScopeSignature]);

  const periodLabel = useMemo(() => TIME_WINDOWS.find((window) => window.id === timeWindow)?.label || 'All data', [timeWindow]);
  const hasToplineSample = (canUseOverviewAggregate && (overviewAggregate?.sampleSize ?? 0) > 0) || sampleSize > 0;
  const dashboardSource = canUseOverviewAggregate && overviewAggregate
    ? 'aggregate'
    : rawDataSource === 'firestore'
      ? 'firestore'
      : 'local';
  const dashboardSourceReason = dashboardSource === 'aggregate'
    ? overviewAggregateReason
    : rawDataSourceReason;

  const awarenessPayload = useMemo(() => buildAwarenessReportPayload({
    country: activeCountry ?? '',
    period: periodLabel,
    bankId: selectedBankId,
    bankName: selectedBankName,
    compareBankId: compareBankId || null,
    compareBankName: compareBankName || null,
    filters: {
      selected_brand: selectedBankId,
      compare_brand: compareBankId || null,
      time_window: timeWindow,
    } as Record<string, unknown>,
    sampleSize,
    topOfMind: awarenessTopMetrics.topOfMind.value,
    spontaneous: awarenessTopMetrics.spontaneous.value,
    totalAwareness: awarenessTopMetrics.awareness.value,
    awarenessQuality: awarenessTopMetrics.quality.value,
    shareOfVoice: selectedAwarenessRow?.shareOfVoice ?? null,
    awarenessDepthScore: awarenessDepthScore ?? null,
    awarenessShareIndex: awarenessShareIndex ?? null,
    momGrowthPct: awarenessMoMGrowthPct ?? null,
    funnelAware: selectedMetricsView?.aware ?? null,
    funnelSpontaneous: selectedMetricsView?.spontaneous ?? null,
    funnelTopOfMind: selectedMetricsView?.topOfMind ?? null,
    funnelAided: selectedMetricsView?.aided ?? null,
    intent: intentSummary ? {
      averageIntent: intentSummary.averageIntent,
      highIntentPct: intentSummary.highIntentPct,
      highIntentNonUserPct: intentSummary.highIntentNonUserPct,
      lowIntentCurrentUserCount: intentSummary.lowIntentCurrentUserCount,
      responseBase: intentSummary.responseBase,
    } : null,
    rankings: awarenessRankRows.map((r) => ({
      bankName: r.bankName,
      awareness: r.awareness,
      topOfMind: r.topOfMind,
      rank: r.rank,
    })),
    compareTopOfMind: compareAwarenessRow?.topOfMind ?? null,
    compareAwareness: compareAwarenessRow?.awareness ?? null,
  }), [
    activeCountry, periodLabel, selectedBankId, selectedBankName, compareBankId, compareBankName,
    timeWindow, sampleSize, awarenessTopMetrics, selectedAwarenessRow, awarenessDepthScore,
    awarenessShareIndex, awarenessMoMGrowthPct, selectedMetricsView, intentSummary,
    awarenessRankRows, compareAwarenessRow,
  ]);

  const awarenessMetricInsights = useMemo(() => ({
    topOfMind: buildAwarenessMetricInsight({
      key: 'top_of_mind',
      value: awarenessTopMetrics.topOfMind.value,
      compareValue: compareAwarenessRow?.topOfMind ?? null,
      compareBankName: compareBankName || null,
      sampleSize,
    }),
    spontaneous: buildAwarenessMetricInsight({
      key: 'spontaneous_recall',
      value: awarenessTopMetrics.spontaneous.value,
      sampleSize,
    }),
    totalAwareness: buildAwarenessMetricInsight({
      key: 'total_awareness',
      value: awarenessTopMetrics.awareness.value,
      compareValue: compareAwarenessRow?.awareness ?? null,
      compareBankName: compareBankName || null,
      sampleSize,
    }),
    awarenessQuality: buildAwarenessMetricInsight({
      key: 'awareness_quality',
      value: awarenessTopMetrics.quality.value,
      sampleSize,
    }),
    shareOfVoice: buildAwarenessMetricInsight({
      key: 'share_of_voice',
      value: selectedAwarenessRow?.shareOfVoice ?? null,
      compareValue: compareAwarenessRow?.shareOfVoice ?? null,
      compareBankName: compareBankName || null,
      sampleSize,
    }),
    momGrowth: buildAwarenessMetricInsight({
      key: 'mom_growth',
      value: awarenessMoMGrowthPct,
      sampleSize,
    }),
    awarenessShareIndex: buildAwarenessMetricInsight({
      key: 'awareness_share_index',
      value: awarenessShareIndex,
      sampleSize,
    }),
    awarenessDepthScore: buildAwarenessMetricInsight({
      key: 'awareness_depth_score',
      value: awarenessDepthScore,
      compareValue: compareAwarenessDepthScore,
      compareBankName: compareBankName || null,
      sampleSize,
    }),
  }), [
    awarenessTopMetrics, compareAwarenessRow, compareBankName, sampleSize,
    selectedAwarenessRow, awarenessMoMGrowthPct, awarenessShareIndex,
    awarenessDepthScore, compareAwarenessDepthScore,
  ]);

  const awarenessFunnelInsight = useMemo(() => buildAwarenessFunnelInsight({
    aware: selectedMetricsView?.aware ?? null,
    spontaneous: selectedMetricsView?.spontaneous ?? null,
    topOfMind: selectedMetricsView?.topOfMind ?? null,
    aided: selectedMetricsView?.aided ?? null,
  }), [selectedMetricsView]);

  const awarenessRankingInsight = useMemo(() => buildAwarenessRankingInsight({
    rows: awarenessRankRows.map((r) => ({
      bankId: r.bankId,
      bankName: r.bankName,
      awareness: r.awareness,
      topOfMind: r.topOfMind,
      rank: r.rank,
      movement: r.movement ?? null,
    })),
    selectedBankId,
    sampleSize,
  }), [awarenessRankRows, selectedBankId, sampleSize]);

  const awarenessIntentInsight = useMemo(() => intentSummary ? buildIntentInsight({
    averageIntent: intentSummary.averageIntent,
    highIntentPct: intentSummary.highIntentPct,
    highIntentNonUserPct: intentSummary.highIntentNonUserPct,
    lowIntentCurrentUserCount: intentSummary.lowIntentCurrentUserCount,
    responseBase: intentSummary.responseBase,
  }) : null, [intentSummary]);

  const heroConfig = useMemo(() => {
    switch (section) {
      case 'awareness_consideration':
        return {
          label: 'Awareness Intelligence',
          score: safePercent(selectedMetricsView?.aware),
          delta: compareAwarenessRow && isFiniteMetricValue(selectedMetricsView?.aware)
            ? selectedMetricsView.aware - compareAwarenessRow.awareness
            : awarenessDeltasView.awareness,
          summary: compareBankName
            ? `Awareness trajectory for ${selectedBankName} versus ${compareBankName}.`
            : 'Awareness trajectory and conversion quality for executive tracking.',
          rightCards: [
            {
              label: compareBankName ? `Top of Mind vs ${compareBankName}` : 'Top of Mind',
              value: safePercent(selectedMetricsView?.topOfMind),
              tone: compareAwarenessRow
                ? ((selectedMetricsView?.topOfMind ?? null) !== null && selectedMetricsView!.topOfMind >= compareAwarenessRow.topOfMind ? 'positive' as const : 'negative' as const)
                : (awarenessDeltasView.topOfMind || 0) > 0 ? 'positive' as const : (awarenessDeltasView.topOfMind || 0) < 0 ? 'negative' as const : 'neutral' as const,
            },
            {
              label: compareBankName ? `Spontaneous vs ${compareBankName}` : 'Spontaneous Recall',
              value: safePercent(selectedMetricsView?.spontaneous),
              tone: compareMetrics
                ? ((selectedMetricsView?.spontaneous ?? null) !== null && selectedMetricsView!.spontaneous >= compareMetrics.spontaneous ? 'positive' as const : 'negative' as const)
                : (awarenessDeltasView.spontaneous || 0) > 0 ? 'positive' as const : (awarenessDeltasView.spontaneous || 0) < 0 ? 'negative' as const : 'neutral' as const,
            },
          ],
        };
      case 'usage_behavior':
        return {
          label: 'Usage Intelligence',
          score: safePercent(usageToplineMetrics?.currentUsage.value),
          delta: usageToplineMetrics?.currentUsage.compare?.delta ?? null,
          summary: compareBankName
            ? `Usage funnel efficiency for ${selectedBankName} versus ${compareBankName}.`
            : 'Current usage efficiency and conversion bottlenecks across the funnel.',
          rightCards: [
            {
              label: compareBankName ? `Retention vs ${compareBankName}` : 'Retention',
              value: safePercent(usageToplineMetrics?.retention.value),
              tone: (usageToplineMetrics?.retention.value ?? null) === null ? 'neutral' as const : ((usageToplineMetrics?.retention.value || 0) >= 50 ? 'positive' as const : 'negative' as const),
            },
            {
              label: compareBankName ? `Preference Capture vs ${compareBankName}` : 'Preference Capture',
              value: safePercent(usageToplineMetrics?.preferenceCapture.value),
              tone: 'neutral' as const,
            },
          ],
        };
      case 'loyalty_satisfaction':
        return {
          label: 'Loyalty Intelligence',
          score: safeNumber(loyaltyDiagnosticsView?.loyaltyIndex),
          delta: loyaltyDiagnosticsView?.movementRows.find((row) => row.segment === 'Committed')?.deltaPct ?? null,
          summary: 'Loyalty strength, segment quality, and advocacy risk posture.',
          rightCards: [
            { label: 'NPS', value: safeNumber(loyaltyDiagnosticsView?.nps), tone: loyaltyDiagnosticsView?.nps == null ? 'neutral' as const : ((loyaltyDiagnosticsView?.nps || 0) >= 0 ? 'positive' as const : 'negative' as const) },
            { label: 'Rejectors', value: safePercent(loyaltyDiagnosticsView?.segmentPcts.Rejectors), tone: loyaltyDiagnosticsView?.segmentPcts.Rejectors == null ? 'neutral' as const : ((loyaltyDiagnosticsView?.segmentPcts.Rejectors || 0) > 12 ? 'negative' as const : 'neutral' as const) },
          ],
        };
      case 'brand_momentum':
        return {
          label: 'Momentum Intelligence',
          score: momentumTopMetrics?.score.value === null || momentumTopMetrics?.score.value === undefined ? '--' : `${momentumTopMetrics.score.value}`,
          delta: momentumDiagnosticsView?.velocity ?? null,
          summary: momentumDiagnosticsView?.forecastEligible
            ? 'Forward velocity and momentum durability in current market conditions.'
            : firstStatusNote(momentumTopMetrics?.score.notes, EMPTY_COPY.forecastUnavailable),
          rightCards: [
            { label: 'Velocity', value: formatSignedValue(momentumDiagnosticsView?.velocity ?? null, '', 1), tone: momentumDiagnosticsView?.velocity === null ? 'neutral' as const : (momentumDiagnosticsView.velocity >= 0 ? 'positive' as const : 'negative' as const) },
            { label: 'Volatility', value: momentumDiagnosticsView?.volatilityCv === null ? '--' : `${momentumDiagnosticsView.volatilityCv}%`, tone: (momentumDiagnosticsView?.volatilityCv ?? 0) > 25 ? 'negative' as const : 'neutral' as const },
          ],
          tone: 'momentum' as const,
        };
      case 'competitive_intelligence':
        return {
          label: 'Competitive Intelligence',
          score: safePercent(competitiveDiagnostics?.marketStructure.marketRows.find((row) => row.bankId === selectedBankId)?.marketShare),
          delta: competitiveDiagnostics?.marketStructure.marketRows.find((row) => row.bankId === selectedBankId)?.marketShareDelta ?? null,
          summary: 'Share defense and competitor pressure mapped for strategic response.',
          rightCards: [
            { label: hasObservedWinLoss ? 'Observed Win Rate' : 'Proxy Balance', value: safePercent(competitiveDiagnostics?.winLoss.overallWinRate), tone: competitiveDiagnostics?.winLoss.overallWinRate == null ? 'neutral' as const : ((competitiveDiagnostics?.winLoss.overallWinRate || 0) >= 50 ? 'positive' as const : 'negative' as const) },
            { label: 'HHI', value: safeNumber(competitiveDiagnostics?.marketStructure.hhi), tone: 'neutral' as const },
          ],
        };
      case 'demographics':
        return {
          label: 'Demographic Intelligence',
          score: safeNumber(demographicDiagnostics?.highValueSegments[0]?.score),
          delta: null,
          summary: 'High-value cohort concentration and demographic whitespace opportunity.',
          rightCards: [
            { label: 'Top Segment', value: safeText(demographicDiagnostics?.highValueSegments[0]?.segment, '--'), tone: 'neutral' as const },
            { label: 'Priority Gap', value: safePp(demographicDiagnostics?.opportunities[0]?.usageGap), tone: demographicDiagnostics?.opportunities[0]?.usageGap == null ? 'neutral' as const : ((demographicDiagnostics?.opportunities[0]?.usageGap || 0) > 0 ? 'negative' as const : 'neutral' as const) },
          ],
        };
      case 'trends_forecasts':
        return {
          label: 'Trend Intelligence',
          score: trendsDiagnostics?.forecast.regressionNext == null ? '--' : `${trendsDiagnostics.forecast.regressionNext}%`,
          delta: trendsDiagnostics?.signal.slope ?? null,
          summary: trendsDiagnostics?.forecast.eligible
            ? 'Forecast trajectory, volatility profile, and confidence discipline.'
            : firstStatusNote(trendsTopMetrics?.mom.notes, EMPTY_COPY.forecastUnavailable),
          rightCards: [
            { label: 'CAGR', value: trendsDiagnostics?.growth.cagrPct === null ? '--' : `${trendsDiagnostics.growth.cagrPct}%`, tone: trendsDiagnostics?.growth.cagrPct === null ? 'neutral' as const : (trendsDiagnostics.growth.cagrPct >= 0 ? 'positive' as const : 'negative' as const) },
            { label: 'Stability', value: safeNumber(trendsDiagnostics?.volatility.stabilityScore), tone: trendsDiagnostics?.volatility.stabilityScore == null ? 'neutral' as const : ((trendsDiagnostics?.volatility.stabilityScore || 0) >= 60 ? 'positive' as const : 'negative' as const) },
          ],
        };
      case 'overview':
      default:
        return {
          label: 'BrandEdge Score',
          score: hasToplineSample ? `${brandEdgeScore} / 100` : '--',
          delta: compareBrandEdgeScore === null ? null : brandEdgeScore - compareBrandEdgeScore,
          summary: compareBankName
            ? `${brandEdgeLabel}. Executive composite for ${selectedBankName} versus ${compareBankName}.`
            : `${brandEdgeLabel}. Executive composite of awareness, usage, loyalty, primary share, and switching risk.`,
          rightCards: [
            {
              label: compareBankName ? `Awareness vs ${compareBankName}` : 'Awareness',
              value: safePercent(selectedMetricsView?.aware),
              tone: compareAwarenessRow
                ? ((selectedMetricsView?.aware ?? null) !== null && selectedMetricsView!.aware >= compareAwarenessRow.awareness ? 'positive' as const : 'negative' as const)
                : (awarenessDeltasView.awareness || 0) >= 0 ? 'positive' as const : 'negative' as const,
            },
            {
              label: compareBankName ? `NPS vs ${compareBankName}` : 'NPS',
              value: safeNumber(selectedMetricsView?.nps),
              tone: compareMetrics
                ? ((selectedMetricsView?.nps ?? null) !== null && selectedMetricsView!.nps >= compareMetrics.nps ? 'positive' as const : 'negative' as const)
                : (selectedMetricsView?.nps ?? null) === null ? 'neutral' as const : ((selectedMetricsView?.nps || 0) >= 0 ? 'positive' as const : 'negative' as const),
            },
          ],
          tone: 'default' as const,
        };
    }
  }, [
    section,
    selectedMetricsView,
    awarenessDeltasView,
    usageDiagnostics,
    usageToplineMetrics,
    loyaltyDiagnosticsView,
    momentumDiagnosticsView,
    brandEdgeScore,
    brandEdgeLabel,
    competitiveDiagnostics,
    demographicDiagnostics,
    trendsDiagnostics,
    selectedBankId,
    selectedBankName,
    compareBankName,
    compareMetrics,
    compareAwarenessRow,
    compareBrandEdgeScore,
  ]);

  const advisorContextSnapshot: StrategyAdvisorPayload | null = useMemo(() => {
    if (!activeCountry || !selectedBankId) return null;
    return {
      country: activeCountry,
      period: periodLabel,
      filters: {
        selected_brand: selectedBankId,
        compare_brand: compareBankId || null,
        age_groups: ageGroups,
        genders,
        time_window: timeWindow,
      },
      metrics: {
        sample_size: scopedResponses.length,
        awareness: selectedMetricsView?.aware || 0,
        top_of_mind: selectedMetricsView?.topOfMind || 0,
        current_usage: selectedMetricsView?.currentUsing || 0,
        bumo: selectedMetricsView?.preferred || 0,
        loyalty_index: loyaltyDiagnosticsView?.loyaltyIndex || 0,
        brand_edge_score: brandEdgeScore,
        brand_edge_label: brandEdgeLabel,
        brand_edge_drivers: {
          awareness: brandEdgeInputs.awareness,
          loyalty: brandEdgeInputs.loyalty,
          switching_risk: brandEdgeInputs.switchingRisk,
        },
        momentum_score: momentumDiagnosticsView?.score || 0,
        nps: selectedMetricsView?.nps || 0,
        market_share: competitiveDiagnostics?.marketStructure.marketRows.find((row) => row.bankId === selectedBankId)?.marketShare || 0,
        retention_rate: usageDiagnostics?.retentionRate || 0,
        conversion_rate: usageDiagnostics?.trialRate || 0,
      },
      previous_period: {
        awareness_delta_pp: awarenessDeltasView.awareness,
        top_of_mind_delta_pp: awarenessDeltasView.topOfMind,
        momentum_previous_score: momentumDiagnosticsView?.competitiveRows.find((row) => row.bankId === selectedBankId)?.previousScore || null,
        market_share_delta_pp: competitiveDiagnostics?.marketStructure.marketRows.find((row) => row.bankId === selectedBankId)?.marketShareDelta || null,
      },
      competitors: {
        ranking: competitiveDiagnostics?.marketStructure.marketRows.slice(0, 6).map((row) => ({
          bank: row.bankName,
          market_share: row.marketShare,
          sov: row.shareOfVoice,
          market_share_delta_pp: row.marketShareDelta,
        })) || [],
        momentum: momentumDiagnosticsView?.competitiveRows.slice(0, 6).map((row) => ({
          bank: row.bankName,
          score: row.score,
          growth_rate: row.growthRate,
        })) || [],
      },
      user_query: '',
      last_ai_summary: '',
    } as StrategyAdvisorPayload;
  }, [
    activeCountry,
    selectedBankId,
    periodLabel,
    compareBankId,
    ageGroups,
    genders,
    timeWindow,
    scopedResponses.length,
    selectedMetricsView,
    loyaltyDiagnosticsView,
    momentumDiagnosticsView,
    competitiveDiagnostics,
    usageDiagnostics,
    awarenessDeltasView,
    brandEdgeScore,
    brandEdgeLabel,
    brandEdgeInputs,
  ]);

  useEffect(() => {
    const userId = state.user?.id;
    if (!userId) return;
    let mounted = true;
    aiStrategyAdvisorService.getMonthlyUsage(userId).then((usage) => {
      if (!mounted) return;
      setAdvisorUsage({ used: usage.used, limit: usage.limit });
    }).catch(() => {
      if (!mounted) return;
      setAdvisorUsage({ used: 0, limit: strategyAdvisorLimits.MONTHLY_QUERY_LIMIT });
    });
    return () => {
      mounted = false;
    };
  }, [state.user?.id, advisorContextSnapshot]);

  const bankNameById = useMemo(
    () => new Map(countryBanks.map((bank) => [bank.id, bank.name])),
    [countryBanks],
  );
  const toggleFilter = (value: string, current: string[], setCurrent: React.Dispatch<React.SetStateAction<string[]>>) => {
    setCurrent((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const exportCurrentView = () => {
    if (!canExport) {
      setUpgradeModalMode('standard');
      return;
    }
    const summaryRow = {
      country: activeCountry || 'all',
      period: periodLabel,
      selected_bank_id: selectedBankId,
      selected_bank_name: selectedBankName,
      sample_size: sampleSize,
      brand_edge_score: brandEdgeScore,
      brand_edge_label: brandEdgeLabel,
      awareness_pct: selectedMetricsView?.aware || 0,
      usage_pct: selectedMetricsView?.currentUsing || 0,
      loyalty_index: loyaltyDiagnosticsView?.loyaltyIndex || 0,
      primary_bank_share_pct: brandEdgeInputs.primaryShare,
      switching_risk_pct: brandEdgeInputs.switchingRisk,
      momentum_score: momentumDiagnosticsView?.score || 0,
      nps: selectedMetricsView?.nps || 0,
      brand_edge_driver_summary: brandEdgeDriverSummary,
      brand_edge_trend_6m: brandEdgeTrend.map((point) => `${point.month}:${point.score}`).join(' | '),
    };
    exportToCSV([summaryRow], `subscriber_executive_summary_${activeCountry}_${selectedBankId}`);
  };

  const exportComparisonView = () => {
    if (!canExport) {
      setUpgradeModalMode('standard');
      return;
    }
    const ids = [selectedBankId, compareBankId].filter(Boolean);
    const subset = scopedResponses.filter((response) =>
      ids.some(
        (bankId) =>
          (response.c3_aware_banks || []).includes(bankId) ||
          (response.c4_ever_used || []).includes(bankId) ||
          (response.c5_currently_using || []).includes(bankId) ||
          response.preferred_bank === bankId,
      ),
    );
    exportToCSV(subset, `subscriber_competitive_${activeCountry}`);
  };

  const requestSection = (nextSection: SubscriberSection) => {
    if (isFreeTier && nextSection !== 'overview') {
      setUpgradeModalMode('standard');
      return;
    }
    setSection(nextSection);
  };

  const resetAdvisorSession = () => {
    setAdvisorSession({
      context: null,
      lastSummary: '',
      followUpsUsed: 0,
      lastActivityAt: 0,
      startedAt: 0,
    });
    setAdvisorMessages([]);
    setAdvisorError(null);
  };

  const handleOpenAdvisor = (nextOpen: boolean) => {
    if (!nextOpen) {
      setAdvisorOpen(false);
      return;
    }
    if (!hasAiAddon) {
      setUpgradeModalMode('ai');
      return;
    }
    if (AI_ADVISOR_PLACEHOLDER_MODE) {
      setAdvisorError(AI_ADVISOR_PLACEHOLDER_TEXT);
      setAdvisorMessages((prev) => (prev.length > 0 ? prev : [createMessage('system', AI_ADVISOR_PLACEHOLDER_TEXT)]));
    }
    setAdvisorOpen(true);
  };

  const handleSubmitAdvisorQuestion = async () => {
    if (!state.user?.id) return;
    const question = advisorQuestion.trim();
    if (!question || advisorLoading) return;
    if (!hasAiAddon) {
      setUpgradeModalMode('ai');
      return;
    }
    if (advisorUsage.used >= advisorUsage.limit) {
      setAdvisorError('Monthly strategy query limit reached (100/100).');
      return;
    }
    if (!advisorContextSnapshot) {
      setAdvisorError('No dashboard context available for strategy analysis.');
      return;
    }
    if (AI_ADVISOR_PLACEHOLDER_MODE) {
      setAdvisorMessages((prev) => [...prev, createMessage('user', question), createMessage('system', AI_ADVISOR_PLACEHOLDER_TEXT)]);
      setAdvisorQuestion('');
      setAdvisorError(AI_ADVISOR_PLACEHOLDER_TEXT);
      return;
    }

    const now = Date.now();
    const sessionExpired = advisorSession.lastActivityAt > 0 && (now - advisorSession.lastActivityAt > strategyAdvisorLimits.SESSION_TIMEOUT_MS);
    if (sessionExpired) {
      resetAdvisorSession();
      setAdvisorMessages([createMessage('system', 'Session expired after 20 minutes of inactivity. Start a new strategy session.')]);
      setAdvisorError(null);
    }

    const hasSession = !sessionExpired && advisorSession.context !== null;
    if (hasSession && advisorSession.followUpsUsed >= strategyAdvisorLimits.MAX_FOLLOW_UPS) {
      setAdvisorMessages((prev) => [...prev, createMessage('system', 'Session complete. Start a new strategy session.')]);
      return;
    }

    const userMsg = createMessage('user', question);
    setAdvisorMessages((prev) => [...prev, userMsg]);
    setAdvisorQuestion('');
    setAdvisorLoading(true);
    setAdvisorError(null);

    try {
      const payload: StrategyAdvisorPayload = {
        ...(hasSession ? (advisorSession.context as StrategyAdvisorPayload) : advisorContextSnapshot),
        user_query: question,
        last_ai_summary: hasSession ? advisorSession.lastSummary : '',
      };
      const result = await aiStrategyAdvisorService.queryStrategyAdvisor(state.user.id, payload);
      const usage = await aiStrategyAdvisorService.incrementUsage(state.user.id);
      setAdvisorUsage({ used: usage.used, limit: usage.limit });
      setAdvisorMessages((prev) => [...prev, createMessage('assistant', result.response)]);
      setAdvisorSession({
        context: hasSession ? advisorSession.context : { ...advisorContextSnapshot, user_query: '', last_ai_summary: '' },
        lastSummary: compressText(result.response, 140),
        followUpsUsed: hasSession ? advisorSession.followUpsUsed + 1 : 0,
        lastActivityAt: Date.now(),
        startedAt: hasSession ? advisorSession.startedAt : now,
      });
      if (hasSession && advisorSession.followUpsUsed + 1 >= strategyAdvisorLimits.MAX_FOLLOW_UPS) {
        setAdvisorMessages((prev) => [...prev, createMessage('system', 'Session complete. Start a new strategy session.')]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to generate strategy response.';
      setAdvisorError(message);
    } finally {
      setAdvisorLoading(false);
    }
  };

  const handleDownloadExecutiveBrief = async () => {
    if (!state.user?.id) return;
    const latestAssistant = [...advisorMessages].reverse().find((message) => message.role === 'assistant');
    if (!latestAssistant || !advisorContextSnapshot) {
      setAdvisorError('Generate an AI strategy response before downloading the executive brief.');
      return;
    }
    const now = new Date();
    const entry = {
      userId: state.user.id,
      monthKey: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      title: 'Executive Strategy Brief',
      country: String(advisorContextSnapshot.country),
      period: String(advisorContextSnapshot.period),
      summary: compressText(latestAssistant.content, 45),
      response: latestAssistant.content,
      context: advisorContextSnapshot,
      createdAt: now.toISOString(),
    };
    await aiStrategyAdvisorService.saveExecutiveBrief(entry);
    const html = aiStrategyAdvisorService.createPrintableBriefHtml(entry);
    const briefWindow = window.open('', '_blank', 'noopener,noreferrer,width=1024,height=900');
    if (briefWindow) {
      briefWindow.document.open();
      briefWindow.document.write(html);
      briefWindow.document.close();
      setTimeout(() => {
        briefWindow.focus();
        briefWindow.print();
      }, 300);
    }
  };

  const handleExit = () => {
    logout();
    navigate(adminMode ? '/admin/login' : '/login', { replace: true });
  };

  if (!adminMode && state.user?.status !== 'active') {
    return <Navigate to="/dashboard/pending" replace />;
  }

  if (!activeCountry) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-8">
          <p className="text-sm text-slate-300">No country access assigned yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="executive-dashboard min-h-screen text-white" data-surface-mode={surfaceMode}>
      <header className="border-b border-slate-600/40 bg-slate-800/80 px-6 py-6 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-slate-500">{adminMode ? 'Admin Console' : 'Subscriber Dashboard'}</p>
            <h1 className="text-3xl font-semibold tracking-tight">Brand Health Tracking</h1>
              <p className="mt-1 text-sm text-slate-400">
                Data source: {dashboardSource === 'aggregate'
                  ? 'Live Firestore aggregate'
                  : dashboardSource === 'firestore'
                    ? 'Live Firestore responses'
                    : 'Local fallback responses'}
              </p>
              {dashboardSource === 'aggregate' ? (
                <p className="mt-1 text-xs text-slate-500">
                  Aggregate is the primary source for overview metrics. Some deep-dive diagnostics remain live-response derived.
                </p>
              ) : null}
              {dashboardSourceReason ? (
              <p className="mt-1 text-xs text-amber-300">
                {dashboardSource === 'aggregate' && overviewAggregateReason
                  ? `Aggregate callable fallback: ${overviewAggregateReason}`
                  : `Fallback reason: ${dashboardSourceReason}`}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSurfaceMode((prev) => (prev === 'executive-dark' ? 'soft-neutral' : 'executive-dark'))}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-blue-500"
            >
              <Palette className="h-3.5 w-3.5" />
              {surfaceMode === 'executive-dark' ? 'Soft Neutral Mode' : 'Dark Executive Mode'}
            </button>
            {adminMode ? (
              <>
                <button
                  onClick={() => navigate('/survey')}
                  className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-blue-500"
                >
                  Survey Access
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-blue-500">
                      Admin Modules
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>Admin Management</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => navigate('/admin/subscribers')}>Subscribers</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate('/admin/subscriptions')}>Subscription Management</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate('/admin/users')}>User Management</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate('/admin/unrecognized')}>Recognition Exceptions</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate('/admin/questionnaires')}>Questionnaires</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate('/admin/panels')}>Panels</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate('/admin/reports')}>Reports</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate('/admin/aliases')}>Aliases</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate('/admin/raffles')}>Raffles</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : null}
            <button
              onClick={handleExit}
              className="rounded-2xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-blue-500"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-filter-shell">
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">Country</p>
              <select
                value={activeCountry}
                onChange={(event) => setActiveCountry(event.target.value as CountryCode)}
                disabled={isFreeTier}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
              >
                {accessibleCountries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">Brand</p>
              <select
                value={selectedBankId}
                onChange={(event) => setSelectedBankId(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
              >
                {countryBanks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">Compare brand</p>
              <select
                value={compareBankId}
                onChange={(event) => setCompareBankId(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
              >
                <option value="">No comparison</option>
                {countryBanks.filter((bank) => bank.id !== selectedBankId).map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">Time period</p>
              <select
                value={timeWindow}
                onChange={(event) => setTimeWindow(event.target.value as TimeWindow)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
              >
                {TIME_WINDOWS.map((window) => (
                  <option key={window.id} value={window.id}>
                    {window.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
                <button
                  onClick={exportCurrentView}
                  disabled={exportControlDisabled}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide disabled:opacity-50"
                >
                Export view
              </button>
                <button
                  onClick={exportComparisonView}
                  disabled={exportControlDisabled}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-sm disabled:opacity-50"
                >
                Export compare
              </button>
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">Age filters</p>
              <div className="flex flex-wrap gap-2">
                {AGE_OPTIONS.map((age) => (
                  <button
                    key={age}
                    onClick={() => toggleFilter(age, ageGroups, setAgeGroups)}
                    className={`rounded-full border px-3 py-1 text-xs ${ageGroups.includes(age) ? 'border-blue-500 bg-blue-500/20 text-blue-200' : 'border-white/10 text-slate-300'}`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">Gender filters</p>
              <div className="flex flex-wrap gap-2">
                {GENDER_OPTIONS.map((gender) => (
                  <button
                    key={gender}
                    onClick={() => toggleFilter(gender, genders, setGenders)}
                    className={`rounded-full border px-3 py-1 text-xs uppercase ${genders.includes(gender) ? 'border-blue-500 bg-blue-500/20 text-blue-200' : 'border-white/10 text-slate-300'}`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-shell dashboard-shell-spaced">
          <Tabs value={section} onValueChange={(value) => requestSection(value as SubscriberSection)}>
            <TabsList className="dashboard-tablist flex flex-wrap gap-2">
              {visibleSections.map((item) => (
                <TabsTrigger
                  key={item.id}
                  value={item.id}
                  className="dashboard-tab-trigger rounded-xl border border-slate-500/35 bg-slate-700/35 px-4 py-2 text-[12px] font-semibold text-slate-300 shadow-sm transition-all duration-150 hover:bg-slate-600/45 hover:text-white data-[state=active]:!border-white/90 data-[state=active]:!bg-white data-[state=active]:!text-slate-900"
                >
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-8">
              <ExecutiveHero
                label={heroConfig.label}
                score={heroConfig.score}
                delta={heroConfig.delta}
                summary={heroConfig.summary}
                rightCards={heroConfig.rightCards}
                tone={heroConfig.tone}
              />
            </div>

            <TabsContent value="overview" className="dashboard-tab-panel motion-safe:animate-[fadeIn_160ms_ease-out]">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card
                  title="BrandEdge Score"
                  variant="primary"
                  value={hasToplineSample ? `${brandEdgeScore} / 100` : '--'}
                  subtitle={compareSubtitle(compareBankName, compareBrandEdgeScore === null ? null : `${compareBrandEdgeScore} / 100`, hasToplineSample ? brandEdgeLabel : EMPTY_COPY.noDataInSlice)}
                  delta={compareBrandEdgeScore === null ? null : brandEdgeScore - compareBrandEdgeScore}
                  sparklineValues={brandEdgeTrend.map((point) => point.score)}
                />
                <Card
                  title="Awareness"
                  variant="primary"
                  value={safePercent(overviewTopMetrics.awareness.value)}
                  subtitle={compareSubtitle(compareBankName, compareDisplayValue(overviewTopMetrics.awareness, (value) => safePercent(value)), safePercent(selectedMetricsView?.topOfMind, EMPTY_COPY.noData) === EMPTY_COPY.noData ? EMPTY_COPY.noDataInSlice : `${safePercent(selectedMetricsView?.topOfMind)} top of mind`)}
                  delta={compareDelta(overviewTopMetrics.awareness) ?? awarenessDeltasView.awareness}
                  sparklineValues={trendView.map((point) => point.awareness)}
                />
                <Card
                  title="Current Usage"
                  variant="primary"
                  value={safePercent(overviewTopMetrics.currentUsage.value)}
                  subtitle={compareSubtitle(compareBankName, compareDisplayValue(overviewTopMetrics.currentUsage, (value) => safePercent(value)), safePercent(selectedMetricsView?.preferred, EMPTY_COPY.noData) === EMPTY_COPY.noData ? EMPTY_COPY.noDataInSlice : `${safePercent(selectedMetricsView?.preferred)} preferred (BUMO)`)}
                  delta={compareDelta(overviewTopMetrics.currentUsage)}
                  sparklineValues={trendView.map((point) => point.usage)}
                />
                <Card
                  title="Loyalty Index"
                  variant="primary"
                  value={safeNumber(overviewTopMetrics.loyaltyIndex.value)}
                  subtitle={compareSubtitle(compareBankName, compareDisplayValue(overviewTopMetrics.loyaltyIndex, (value) => safeNumber(value)), safePercent(loyaltyDiagnosticsView?.segmentPcts.Committed, EMPTY_COPY.noData) === EMPTY_COPY.noData ? EMPTY_COPY.noAwareInSlice : `${safePercent(loyaltyDiagnosticsView?.segmentPcts.Committed)} committed`)}
                  delta={compareDelta(overviewTopMetrics.loyaltyIndex)}
                />
                <Card title="Momentum" variant="primary" value={safeNumber(momentumDiagnosticsView?.score)} subtitle={momentumDiagnosticsView?.status || EMPTY_COPY.noDataInSlice} delta={momentumDiagnosticsView?.velocity ?? null} sparklineValues={momentumDiagnosticsView?.trends.map((point) => point.score)} />
                <Card
                  title="NPS"
                  variant="primary"
                  value={safeNumber(overviewTopMetrics.nps.value)}
                  subtitle={compareSubtitle(compareBankName, compareDisplayValue(overviewTopMetrics.nps), 'Promoters minus detractors')}
                  delta={compareDelta(overviewTopMetrics.nps)}
                  sparklineValues={trendView.map((point) => point.nps)}
                />
                <Card title="Sample Size" variant="secondary" value={`N=${canUseOverviewAggregate && overviewAggregate ? overviewAggregate.sampleSize : sampleSize}`} subtitle={canUseOverviewAggregate && overviewAggregate ? 'Aggregated respondents' : 'Filtered respondents'} />
              </div>
              {hasAiAddon ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">What drives this score?</p>
                  <p className="mt-2 text-sm text-slate-300">{brandEdgeDriverSummary}</p>
                </div>
              ) : null}

              <div className="mt-6 dashboard-section">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Executive Summary Snapshot</h3>
                  <button
                    type="button"
                    onClick={exportCurrentView}
                    disabled={exportControlDisabled}
                    className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:border-blue-500 disabled:opacity-50"
                  >
                    Export Summary
                  </button>
                </div>
                <div className="mt-4 overflow-auto">
                  <table className="w-full text-xs text-slate-300">
                    <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                      <tr>
                        <th className="py-2 pr-2">Module</th>
                        <th className="py-2 pr-2">Headline KPI</th>
                        <th className="py-2 pr-2">Signal</th>
                        <th className="py-2 pr-2">Immediate Focus</th>
                        <th className="py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-white/5">
                        <td className="py-2 pr-2">Awareness & Consideration</td>
                        <td className="py-2 pr-2">{isFiniteMetricValue(selectedMetricsView?.aware) ? `${safePercent(selectedMetricsView?.aware)} awareness` : EMPTY_COPY.noData}</td>
                        <td className="py-2 pr-2">{deltaText(awarenessDeltasView.awareness)}</td>
                        <td className="py-2 pr-2">Increase top-of-mind conversion from the awareness base</td>
                        <td className="py-2">
                          <button type="button" onClick={() => requestSection('awareness_consideration')} className="text-blue-300 hover:text-blue-200">View Report</button>
                        </td>
                      </tr>
                      <tr className="border-t border-white/5">
                        <td className="py-2 pr-2">Usage & Behavior</td>
                        <td className="py-2 pr-2">{isFiniteMetricValue(usageDiagnostics?.retentionRate) ? `${safePercent(usageDiagnostics?.retentionRate)} retention` : EMPTY_COPY.noData}</td>
                        <td className="py-2 pr-2">Highest friction: {safeText(usageDiagnostics?.highestFrictionStage, EMPTY_COPY.noData)}</td>
                        <td className="py-2 pr-2">Reduce drop-off at the highest-friction stage</td>
                        <td className="py-2">
                          <button type="button" onClick={() => requestSection('usage_behavior')} className="text-blue-300 hover:text-blue-200">View Report</button>
                        </td>
                      </tr>
                      <tr className="border-t border-white/5">
                        <td className="py-2 pr-2">Loyalty & Satisfaction</td>
                        <td className="py-2 pr-2">{isFiniteMetricValue(loyaltyDiagnosticsView?.loyaltyIndex) ? `Index ${safeNumber(loyaltyDiagnosticsView?.loyaltyIndex)}` : EMPTY_COPY.noData}</td>
                        <td className="py-2 pr-2">{isFiniteMetricValue(loyaltyDiagnosticsView?.segmentPcts.Rejectors) ? `${safePercent(loyaltyDiagnosticsView?.segmentPcts.Rejectors)} rejectors` : EMPTY_COPY.noData}</td>
                        <td className="py-2 pr-2">Increase committed share by converting potential and favors; reduce rejectors</td>
                        <td className="py-2">
                          <button type="button" onClick={() => requestSection('loyalty_satisfaction')} className="text-blue-300 hover:text-blue-200">View Report</button>
                        </td>
                      </tr>
                      <tr className="border-t border-white/5">
                        <td className="py-2 pr-2">Brand Momentum</td>
                        <td className="py-2 pr-2">{safeNumber(momentumDiagnosticsView?.score, EMPTY_COPY.noData)}</td>
                        <td className="py-2 pr-2">{safeText(momentumDiagnosticsView?.velocityLabel, EMPTY_COPY.noData)}</td>
                        <td className="py-2 pr-2">Prioritize the highest-ROI momentum driver gap</td>
                        <td className="py-2">
                          <button type="button" onClick={() => requestSection('brand_momentum')} className="text-blue-300 hover:text-blue-200">View Report</button>
                        </td>
                      </tr>
                      <tr className="border-t border-white/5">
                        <td className="py-2 pr-2">Competitive Intelligence</td>
                        <td className="py-2 pr-2">{isFiniteMetricValue(competitiveDiagnostics?.marketStructure.marketRows.find((row) => row.bankId === selectedBankId)?.marketShare) ? `${safePercent(competitiveDiagnostics?.marketStructure.marketRows.find((row) => row.bankId === selectedBankId)?.marketShare)} market share` : EMPTY_COPY.noData}</td>
                        <td className="py-2 pr-2">{isFiniteMetricValue(competitiveDiagnostics?.winLoss.overallWinRate) ? `${hasObservedWinLoss ? 'Observed Win Rate' : 'Proxy Balance'} ${safePercent(competitiveDiagnostics?.winLoss.overallWinRate)}` : EMPTY_COPY.noData}</td>
                        <td className="py-2 pr-2">Respond to the strongest competitive risk signal</td>
                        <td className="py-2">
                          <button type="button" onClick={() => requestSection('competitive_intelligence')} className="text-blue-300 hover:text-blue-200">View Report</button>
                        </td>
                      </tr>
                      <tr className="border-t border-white/5">
                        <td className="py-2 pr-2">Demographics</td>
                        <td className="py-2 pr-2">{safeText(demographicDiagnostics?.highValueSegments[0]?.dimension, '--')}: {safeText(demographicDiagnostics?.highValueSegments[0]?.segment, '--')}</td>
                        <td className="py-2 pr-2">{demographicDiagnostics?.opportunities[0]?.priority ? `${safeText(demographicDiagnostics?.opportunities[0]?.priority)} priority gap` : EMPTY_COPY.noData}</td>
                        <td className="py-2 pr-2">Target cohorts with the largest usage gap and strongest potential</td>
                        <td className="py-2">
                          <button type="button" onClick={() => requestSection('demographics')} className="text-blue-300 hover:text-blue-200">View Report</button>
                        </td>
                      </tr>
                      <tr className="border-t border-white/5">
                        <td className="py-2 pr-2">Trends & Forecasts</td>
                        <td className="py-2 pr-2">{trendsDiagnostics?.forecast.regressionNext == null ? '--' : `${trendsDiagnostics.forecast.regressionNext}%`} next forecast</td>
                        <td className="py-2 pr-2">{trendsDiagnostics?.signal.isSignificantSignal ? 'Significant trend signal' : 'No significant signal'}</td>
                        <td className="py-2 pr-2">Act on stable trend signals and monitor volatility risk</td>
                        <td className="py-2">
                          <button type="button" onClick={() => requestSection('trends_forecasts')} className="text-blue-300 hover:text-blue-200">View Report</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="dashboard-section">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Cross-Module Health Indicators</h3>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Card variant="diagnostic" title="Funnel Health" value={safeText(usageDiagnostics?.positionLabel, EMPTY_COPY.noData)} subtitle={safeText(usageDiagnostics?.funnelHealthDiagnosis, 'No usage diagnosis')} />
                    <Card variant="diagnostic" title="Top Risk Signal" value={safeText(competitiveDiagnostics?.threats.rows[0]?.competitorBankName, EMPTY_COPY.noData)} subtitle={safeText(competitiveDiagnostics?.threats.rows[0]?.threatLevel, 'No risk signal')} />
                    <Card variant="diagnostic" title="Forecast Confidence" value={trendsDiagnostics?.forecast.confidenceLow === null || trendsDiagnostics?.forecast.confidenceHigh === null ? EMPTY_COPY.forecastUnavailable : `${trendsDiagnostics?.forecast.confidenceLow}% - ${trendsDiagnostics?.forecast.confidenceHigh}%`} subtitle="95% confidence range" />
                    <Card variant="diagnostic" title="Primary Gap Cohort" value={safeText(demographicDiagnostics?.opportunities[0]?.segment, EMPTY_COPY.noData)} subtitle={demographicDiagnostics?.opportunities[0] ? `${safeText(demographicDiagnostics?.opportunities[0]?.dimension, EMPTY_COPY.noData)} | ${safePp(demographicDiagnostics?.opportunities[0]?.usageGap)}` : EMPTY_COPY.noDataInSlice} />
                  </div>
                </div>
                <details className="dashboard-section dashboard-collapsible" open>
                  <summary>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Key Highlights</h3>
                  </summary>
                  <div className="dashboard-collapsible-body mt-4 space-y-2 text-xs text-slate-300">
                    {(trendsDiagnostics?.highlights || []).slice(0, 4).map((item) => (
                      <div key={item} className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                        {item}
                      </div>
                    ))}
                    {((trendsDiagnostics?.highlights || []).length === 0) ? (
                      <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
                        Highlights will appear when valid trend data is available.
                      </div>
                    ) : null}
                  </div>
                </details>
              </div>
            </TabsContent>

            <TabsContent value="awareness_consideration" className="dashboard-tab-panel motion-safe:animate-[fadeIn_160ms_ease-out]">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <Card title="Top of Mind" metricKey="top_of_mind" variant="primary" value={safePercent(awarenessTopMetrics.topOfMind.value)} subtitle={compareSubtitle(compareBankName, compareDisplayValue(awarenessTopMetrics.topOfMind, (value) => safePercent(value)), deltaText(awarenessDeltasView.topOfMind))} delta={compareDelta(awarenessTopMetrics.topOfMind) ?? awarenessDeltasView.topOfMind} sparklineValues={trendView.map((point) => point.topOfMind ?? null)} />
                  <AwarenessInsightPanel insight={awarenessMetricInsights.topOfMind} />
                </div>
                <div>
                  <Card title="Spontaneous Recall" metricKey="spontaneous_recall" variant="primary" value={safePercent(awarenessTopMetrics.spontaneous.value)} subtitle={compareSubtitle(compareBankName, compareDisplayValue(awarenessTopMetrics.spontaneous, (value) => safePercent(value)), deltaText(awarenessDeltasView.spontaneous))} delta={compareDelta(awarenessTopMetrics.spontaneous) ?? awarenessDeltasView.spontaneous} sparklineValues={trendView.map((point) => point.spontaneous ?? null)} />
                  <AwarenessInsightPanel insight={awarenessMetricInsights.spontaneous} />
                </div>
                <div>
                  <Card title="Total Awareness" metricKey="total_awareness" variant="primary" value={safePercent(awarenessTopMetrics.awareness.value)} subtitle={compareSubtitle(compareBankName, compareDisplayValue(awarenessTopMetrics.awareness, (value) => safePercent(value)), deltaText(awarenessDeltasView.awareness))} delta={compareDelta(awarenessTopMetrics.awareness) ?? awarenessDeltasView.awareness} sparklineValues={trendView.map((point) => point.awareness)} />
                  <AwarenessInsightPanel insight={awarenessMetricInsights.totalAwareness} />
                </div>
                <div>
                  <Card title="Awareness Quality" metricKey="awareness_quality" variant="primary" value={safePercent(awarenessTopMetrics.quality.value)} subtitle={compareSubtitle(compareBankName, compareDisplayValue(awarenessTopMetrics.quality, (value) => safePercent(value)), `Top-of-Mind / aware · ${deltaText(awarenessDeltasView.quality)}`)} delta={compareDelta(awarenessTopMetrics.quality) ?? awarenessDeltasView.quality} />
                  <AwarenessInsightPanel insight={awarenessMetricInsights.awarenessQuality} />
                </div>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <div>
                  <Card title="Share of Voice" metricKey="share_of_voice" value={safePercent(selectedAwarenessRow?.shareOfVoice)} subtitle={compareSubtitle(compareBankName, compareAwarenessRow ? safePercent(compareAwarenessRow.shareOfVoice) : null, 'Top-of-Mind share in market')} delta={compareAwarenessRow && isFiniteMetricValue(selectedAwarenessRow?.shareOfVoice) ? selectedAwarenessRow.shareOfVoice - compareAwarenessRow.shareOfVoice : null} />
                  <AwarenessInsightPanel insight={awarenessMetricInsights.shareOfVoice} />
                </div>
                <div>
                  <Card title="MoM Growth" metricKey="mom_growth" value={pctGrowthValue(awarenessMoMGrowthPct)} subtitle={pctGrowthText(awarenessMoMGrowthPct)} />
                  <AwarenessInsightPanel insight={awarenessMetricInsights.momGrowth} />
                </div>
                <div>
                  <Card title="Awareness Share Index" metricKey="awareness_share_index" value={`${awarenessShareIndex}%`} subtitle="Your awareness / total market awareness" />
                  <AwarenessInsightPanel insight={awarenessMetricInsights.awarenessShareIndex} />
                </div>
                <div>
                  <Card title="Awareness Depth Score" metricKey="awareness_depth_score" value={`${awarenessDepthScore}/100`} subtitle={compareSubtitle(compareBankName, compareAwarenessDepthScore === null ? null : `${compareAwarenessDepthScore}/100`, 'Weighted: ToM×3 + Spontaneous×2 + AidedOnly×1')} delta={compareAwarenessDepthScore === null ? null : awarenessDepthScore - compareAwarenessDepthScore} />
                  <AwarenessInsightPanel insight={awarenessMetricInsights.awarenessDepthScore} />
                </div>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="dashboard-section">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Awareness Funnel</h3>
                    <SectionInsightsTrigger sectionKey="awareness_analysis" ctaLabel="View Insights" />
                  </div>
                  <div className="mt-4">
                    <FunnelSteps
                      steps={[
                        { label: 'Aware', value: selectedMetricsView?.aware || 0, color: ACCENT_PRIMARY },
                        { label: 'Spontaneous', value: selectedMetricsView?.spontaneous || 0, color: '#6A78A8' },
                        { label: 'Top of Mind', value: selectedMetricsView?.topOfMind || 0, color: '#4B8A93' },
                        { label: 'Aided', value: selectedMetricsView?.aided || 0, color: '#4B8A93' },
                      ]}
                    />
                  </div>
                  <AwarenessInsightPanel insight={awarenessFunnelInsight} label="Funnel Analysis" />
                </div>
                <div className="dashboard-section">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Brand Rankings</h3>
                    <SectionInsightsTrigger sectionKey="brand_rankings" ctaLabel="View Insights" />
                  </div>
                  <div className="mt-4 overflow-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                        <tr>
                          <th className="py-2 pr-2">Rank</th>
                          <th className="py-2 pr-2">Bank</th>
                          <th className="py-2 pr-2">Awareness</th>
                          <th className="py-2 pr-2">Top of Mind</th>
                          <th className="py-2">Movement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {awarenessRankRows.map((row, idx) => (
                          <tr key={row.bankId} className={`border-t border-white/5 ${idx === 0 ? 'ranking-top-row' : ''} ${row.bankId === selectedBankId ? 'ranking-selected-row' : ''}`}>
                            <td className="py-2 pr-2 font-semibold">{row.rank}</td>
                            <td className={`py-2 pr-2 ${row.bankId === selectedBankId ? 'font-semibold' : ''}`}>{row.bankName}</td>
                            <td className="py-2 pr-2">{row.awareness}%</td>
                            <td className="py-2 pr-2">{row.topOfMind}%</td>
                            <td className="py-2">
                              {row.movement === null ? '-' : row.movement > 0 ? <span style={{ color: ACCENT_POSITIVE }}>↑ {row.movement}</span> : row.movement < 0 ? <span style={{ color: ACCENT_NEGATIVE }}>↓ {Math.abs(row.movement)}</span> : <span style={{ color: ACCENT_NEUTRAL }}>→ 0</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <AwarenessInsightPanel insight={awarenessRankingInsight} label="Rankings Analysis" />
                </div>
              </div>
              <div className="mt-6 dashboard-section">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Future Intent & Consideration</h3>
                  <SectionInsightsTrigger sectionKey="future_intent_consideration" ctaLabel="View Insights" />
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-4">
                  <Card title="Average Intent (0-10)" metricKey="avg_intent" value={intentSummary && intentSummary.responseBase > 0 ? safeAverageIntent(intentSummary.averageIntent) : '--'} subtitle={intentSummary && intentSummary.responseBase > 0 ? 'Future intent score' : EMPTY_COPY.noAwareInSlice} />
                  <Card title="High Intent (7-10)" metricKey="future_consideration_rate" value={intentSummary && intentSummary.responseBase > 0 ? safePercent(intentSummary.highIntentPct) : '--'} subtitle={intentSummary && intentSummary.responseBase > 0 ? `Base: ${safeCount(intentSummary.responseBase)} aware respondents` : EMPTY_COPY.noAwareInSlice} />
                  <Card title="High Intent Non-Users" metricKey="high_intent_non_users" value={intentSummary && intentSummary.responseBase > 0 ? safePercent(intentSummary.highIntentNonUserPct) : '--'} subtitle={intentSummary && intentSummary.responseBase > 0 ? `${safeCount(intentSummary.highIntentNonUserCount)} respondents` : EMPTY_COPY.noAwareInSlice} />
                  <Card title="At-Risk Current Users" metricKey="at_risk_current_users" value={intentSummary && intentSummary.responseBase > 0 ? safeCount(intentSummary.lowIntentCurrentUserCount) : '--'} subtitle={intentSummary && intentSummary.responseBase > 0 ? 'Current users with intent <=6' : EMPTY_COPY.noAwareInSlice} />
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-5">
                  <MiniBar label="Very High (9-10)" value={intentSummary && intentSummary.responseBase > 0 ? intentSummary.veryHighPct : null} color="bg-emerald-500" />
                  <MiniBar label="High (7-8)" value={intentSummary && intentSummary.responseBase > 0 ? intentSummary.highPct : null} color="bg-blue-500" />
                  <MiniBar label="Medium (5-6)" value={intentSummary && intentSummary.responseBase > 0 ? intentSummary.mediumPct : null} color="bg-amber-500" />
                  <MiniBar label="Low (3-4)" value={intentSummary && intentSummary.responseBase > 0 ? intentSummary.lowPct : null} color="bg-orange-500" />
                  <MiniBar label="Very Low (0-2)" value={intentSummary && intentSummary.responseBase > 0 ? intentSummary.veryLowPct : null} color="bg-rose-500" />
                </div>
                <AwarenessInsightPanel insight={awarenessIntentInsight} label="Intent Analysis" />
              </div>
              {adminMode && (
                <div className="mt-6 border-t border-white/5 pt-6">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">AI Analysis (Admin)</p>
                  <AwarenessInsightsReport awarenessPayload={awarenessPayload} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="usage_behavior" className="dashboard-tab-panel motion-safe:animate-[fadeIn_160ms_ease-out]">
              {usageDiagnostics ? (
                <>
                  <div className="grid gap-4 md:grid-cols-5">
                    <Card
                      title="Ever Used"
                      metricKey="ever_used"
                      variant="primary"
                      value={safePercent(usageToplineMetrics?.everUsed.value)}
                      subtitle={compareSubtitle(compareBankName, usageToplineMetrics?.everUsed.compare ? safePercent(usageToplineMetrics.everUsed.compare.value) : null, isFiniteMetricValue(usageToplineMetrics?.everUsed.count) ? `${safeCount(usageToplineMetrics?.everUsed.count)} respondents` : EMPTY_COPY.noDataInSlice)}
                      delta={usageToplineMetrics?.everUsed.compare?.delta ?? null}
                    />
                    <Card
                      title="Current Usage"
                      metricKey="current_usage"
                      variant="primary"
                      value={safePercent(usageToplineMetrics?.currentUsage.value)}
                      subtitle={compareSubtitle(compareBankName, usageToplineMetrics?.currentUsage.compare ? safePercent(usageToplineMetrics.currentUsage.compare.value) : null, isFiniteMetricValue(usageToplineMetrics?.currentUsage.count) ? `${safeCount(usageToplineMetrics?.currentUsage.count)} respondents` : EMPTY_COPY.noDataInSlice)}
                      delta={usageToplineMetrics?.currentUsage.compare?.delta ?? null}
                    />
                    <Card
                      title="Preferred"
                      metricKey="bumo"
                      variant="primary"
                      value={safePercent(usageToplineMetrics?.preferred.value)}
                      subtitle={compareSubtitle(compareBankName, usageToplineMetrics?.preferred.compare ? safePercent(usageToplineMetrics.preferred.compare.value) : null, isFiniteMetricValue(usageToplineMetrics?.preferred.count) ? `${safeCount(usageToplineMetrics?.preferred.count)} respondents` : EMPTY_COPY.noDataInSlice)}
                      delta={usageToplineMetrics?.preferred.compare?.delta ?? null}
                    />
                    <Card
                      title="Consideration"
                      metricKey="future_consideration_rate"
                      variant="primary"
                      value={safePercent(usageToplineMetrics?.consideration.value)}
                      subtitle={isFiniteMetricValue(usageToplineMetrics?.consideration.base_n) ? `Base: ${safeCount(usageToplineMetrics?.consideration.base_n)} aware respondents` : EMPTY_COPY.noAwareInSlice}
                    />
                    <Card
                      title="Trial Rate"
                      metricKey="trial_rate"
                      variant="primary"
                      value={safePercent(usageToplineMetrics?.trialRate.value)}
                      subtitle={compareSubtitle(compareBankName, usageToplineMetrics?.trialRate.compare ? safePercent(usageToplineMetrics.trialRate.compare.value) : null, 'Aware to ever-used conversion')}
                      delta={usageToplineMetrics?.trialRate.compare?.delta ?? null}
                    />
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-4">
                    <Card
                      title="Retention"
                      metricKey="retention_rate"
                      value={safePercent(usageToplineMetrics?.retention.value)}
                      subtitle={compareSubtitle(compareBankName, usageToplineMetrics?.retention.compare ? safePercent(usageToplineMetrics.retention.compare.value) : null, 'Current / ever used')}
                      delta={usageToplineMetrics?.retention.compare?.delta ?? null}
                    />
                    <Card
                      title="Churn"
                      metricKey="churn_rate"
                      value={safePercent(usageToplineMetrics?.churn.value)}
                      subtitle={compareSubtitle(compareBankName, usageToplineMetrics?.churn.compare ? safePercent(usageToplineMetrics.churn.compare.value) : null, '100 - retention')}
                      delta={usageToplineMetrics?.churn.compare?.delta ?? null}
                    />
                    <Card
                      title="Preference Capture"
                      metricKey="preference_rate"
                      value={safePercent(usageToplineMetrics?.preferenceCapture.value)}
                      subtitle={compareSubtitle(compareBankName, usageToplineMetrics?.preferenceCapture.compare ? safePercent(usageToplineMetrics.preferenceCapture.compare.value) : null, 'Preferred / current users')}
                      delta={usageToplineMetrics?.preferenceCapture.compare?.delta ?? null}
                    />
                    <Card title="Multi-Banking" metricKey="multi_banking_rate" value={`${usageDiagnostics.multiBankingPct}%`} subtitle={`Average banks per user: ${usageDiagnostics.avgBanksPerUser}`} />
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className={`dashboard-section ${(trendsDiagnostics.volatility.label || '').toLowerCase().includes('high') ? 'dashboard-risk-warning' : ''}`}>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Usage Funnel</h3>
                        <SectionInsightsTrigger sectionKey="usage_funnel" ctaLabel="View Insights" />
                      </div>
                      <div className="mt-4">
                        {usageDiagnostics.awareCount > 0 ? (
                          <FunnelSteps
                            steps={[
                              { label: 'Aware', value: 100, color: ACCENT_PRIMARY },
                              { label: 'Ever Used', value: usageDiagnostics.trialRate, color: '#6A78A8' },
                              { label: 'Current', value: usageDiagnostics.currentUsageRate, color: '#4B8A93' },
                              { label: 'Preferred', value: usageDiagnostics.bumoPenetration, color: '#4B8A93' },
                            ]}
                          />
                        ) : (
                          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-6 text-sm text-slate-500">
                            {EMPTY_COPY.noAwareInSlice}
                          </div>
                        )}
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        Counts: Aware {safeCount(usageDiagnostics.awareCount)} {'->'} Ever {safeCount(usageDiagnostics.everCount)} {'->'} Current {safeCount(usageDiagnostics.currentCount)} {'->'} Preferred {safeCount(usageDiagnostics.preferredCount)}
                      </p>
                    </div>

                    <div className="dashboard-section">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Usage Conversion Chain</h3>
                        <SectionInsightsTrigger sectionKey="conversion_chain" ctaLabel="View Insights" />
                      </div>
                      <div className="mt-4 space-y-3">
                        <MiniBar label="Trial conversion" value={usageDiagnostics.trialRate} color="bg-violet-500" />
                        <MiniBar label="Retention" value={usageDiagnostics.retentionRate} color="bg-emerald-500" />
                        <MiniBar label="Churn" value={usageDiagnostics.churnRate} color="bg-rose-500" />
                        <MiniBar label="Preference capture" value={usageDiagnostics.preferenceRate} color="bg-amber-500" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="dashboard-section">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Multiple Banking Analysis</h3>
                        <SectionInsightsTrigger sectionKey="multi_banking_overlap" ctaLabel="View Insights" />
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <Card title="Average Banks per User" metricKey="avg_banks_per_user" value={usageDiagnostics.currentCount > 0 ? safeNumber(usageDiagnostics.avgBanksPerUser) : '--'} subtitle={usageDiagnostics.currentCount > 0 ? 'Among your current users' : EMPTY_COPY.noCurrentUsersInSlice} />
                        <Card title="Primary in Multi-Bankers" value={usageDiagnostics.currentCount > 0 ? safePercent(usageDiagnostics.primaryPositionInMultiPct) : '--'} subtitle={usageDiagnostics.currentCount > 0 ? 'Your BUMO share among users with 2+ banks' : EMPTY_COPY.noCurrentUsersInSlice} />
                      </div>
                      <div className="mt-4 space-y-3">
                        <MiniBar label="Single-bankers" value={usageDiagnostics.currentCount > 0 ? usageDiagnostics.singleBankerPct : null} color="bg-blue-500" />
                        <MiniBar label="Dual-bankers" value={usageDiagnostics.currentCount > 0 ? usageDiagnostics.dualBankerPct : null} color="bg-violet-500" />
                        <MiniBar label="3+ bank users" value={usageDiagnostics.currentCount > 0 ? usageDiagnostics.multiBankerPct : null} color="bg-cyan-500" />
                      </div>
                    </div>

                    <div className="dashboard-section">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Competitive Overlap Analysis</h3>
                      <div className="mt-4 overflow-auto">
                        <table className="w-full text-xs text-slate-300">
                          <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                            <tr>
                              <th className="py-2 pr-2">Competitor</th>
                              <th className="py-2 pr-2">Overlap Users</th>
                              <th className="py-2">Overlap %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usageDiagnostics.overlapRows.length > 0 ? usageDiagnostics.overlapRows.map((row) => (
                              <tr key={row.bankId} className="border-t border-white/5">
                                <td className="py-2 pr-2">{row.bankName}</td>
                                <td className="py-2 pr-2">{row.overlapCount}</td>
                                <td className="py-2">{row.overlapPct}%</td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan={3} className="py-3 text-slate-500">No overlap data in this slice.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 dashboard-section">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Multi-Bank Competition</h3>
                    <p className="mt-2 text-xs text-slate-500">
                      Base: {safeCount(multiBankCompetition?.multiBankBase, '--')} respondents with 2+ active banks.
                      {multiBankCompetition?.lowSample ? ' Sample is small; interpret with caution.' : ''}
                    </p>
                    {multiBankCompetition && multiBankCompetition.multiBankBase > 0 ? (
                      <>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{multiBankCompetition.selected.bankName}</p>
                            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                              <div>
                                <p className="text-lg font-black text-white">{multiBankCompetition.selected.multiBankUsageShare}%</p>
                                <p className="text-[10px] uppercase tracking-widest text-slate-500">Usage Share</p>
                              </div>
                              <div>
                                <p className="text-lg font-black text-white">{multiBankCompetition.selected.multiBankPreferredShare}%</p>
                                <p className="text-[10px] uppercase tracking-widest text-slate-500">Preferred Share</p>
                              </div>
                              <div>
                                <p className="text-lg font-black text-white">{multiBankCompetition.selected.multiBankCommittedShare}%</p>
                                <p className="text-[10px] uppercase tracking-widest text-slate-500">Committed Share</p>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                            {multiBankCompetition.compare ? (
                              <>
                                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{multiBankCompetition.compare.bankName}</p>
                                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                                  <div>
                                    <p className="text-lg font-black text-white">{multiBankCompetition.compare.multiBankUsageShare}%</p>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-500">Usage Share</p>
                                  </div>
                                  <div>
                                    <p className="text-lg font-black text-white">{multiBankCompetition.compare.multiBankPreferredShare}%</p>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-500">Preferred Share</p>
                                  </div>
                                  <div>
                                    <p className="text-lg font-black text-white">{multiBankCompetition.compare.multiBankCommittedShare}%</p>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-500">Committed Share</p>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <p className="text-xs text-slate-500">Select a comparison brand to view side-by-side multi-bank shares.</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Second-Choice Bank Share</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Base: {multiBankCompetition.secondChoiceBase} multi-bank respondents using {selectedBankName} but preferring another bank.
                          </p>
                          <div className="mt-4 overflow-auto">
                            <table className="w-full text-xs text-slate-300">
                              <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                                <tr>
                                  <th className="py-2 pr-2">Rank</th>
                                  <th className="py-2 pr-2">Preferred Competitor</th>
                                  <th className="py-2 pr-2">Respondents</th>
                                  <th className="py-2">Share</th>
                                </tr>
                              </thead>
                              <tbody>
                                {multiBankCompetition.secondChoiceRows.length > 0 ? multiBankCompetition.secondChoiceRows.map((row, index) => (
                                  <tr key={row.bankId} className="border-t border-white/5">
                                    <td className="py-2 pr-2 font-semibold">{index + 1}</td>
                                    <td className="py-2 pr-2">{row.bankName}</td>
                                    <td className="py-2 pr-2">{row.count}</td>
                                    <td className="py-2">{row.share}%</td>
                                  </tr>
                                )) : (
                                  <tr>
                                    <td colSpan={4} className="py-3 text-slate-500">No second-choice competitor data in this slice.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-xs text-slate-500">
                        No multi-bank comparison data in this slice.
                      </div>
                    )}
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="dashboard-section">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Usage-Based Segmentation</h3>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <Card title="Non-Triers" value={safeCount(usageDiagnostics.nonTriersCount)} subtitle={`${safeRatioPercent(usageDiagnostics.nonTriersCount, usageDiagnostics.awareCount)} of aware`} />
                        <Card title="Lapsed Users" value={safeCount(usageDiagnostics.lapsedUsersCount)} subtitle={`${safeRatioPercent(usageDiagnostics.lapsedUsersCount, usageDiagnostics.everCount)} of ever-used`} />
                        <Card title="Secondary Users" value={safeCount(usageDiagnostics.secondaryUsersCount)} subtitle={`${safeRatioPercent(usageDiagnostics.secondaryUsersCount, usageDiagnostics.currentCount)} of current`} />
                        <Card title="Primary Users (BUMO)" value={safeCount(usageDiagnostics.primaryUsersCount)} subtitle={usageDiagnostics.currentCount > 0 ? `${safePercent(usageDiagnostics.preferenceRate)} preference rate` : EMPTY_COPY.noCurrentUsersInSlice} />
                      </div>
                    </div>

                    <div className="dashboard-section">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Drop-Off Analysis & Friction</h3>
                        <SectionInsightsTrigger sectionKey="dropoff_friction" ctaLabel="View Insights" />
                      </div>
                      <div className="mt-4 overflow-auto">
                        <table className="w-full text-xs text-slate-300">
                          <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                            <tr>
                              <th className="py-2 pr-2">Stage</th>
                              <th className="py-2 pr-2">Drop-off %</th>
                              <th className="py-2 pr-2">Lost</th>
                              <th className="py-2 pr-2">Friction</th>
                              <th className="py-2">Diagnosis</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usageDiagnostics.dropoffStages.map((stage) => (
                              <tr key={stage.stage} className="border-t border-white/5">
                                <td className="py-2 pr-2">{stage.stage}</td>
                                <td className="py-2 pr-2">{stage.dropoffPct}%</td>
                                <td className="py-2 pr-2">{stage.lostCount}</td>
                                <td className="py-2 pr-2">{stage.frictionScore}</td>
                                <td className="py-2">{stage.diagnosis}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="dashboard-section">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Funnel Health Diagnosis</h3>
                        <SectionInsightsTrigger sectionKey="competitive_growth" ctaLabel="View Insights" />
                      </div>
                      <p className="mt-4 text-sm text-slate-300">{usageDiagnostics.funnelHealthDiagnosis}</p>
                      <p className="mt-2 text-xs text-slate-500">Highest friction stage: {safeText(usageDiagnostics.highestFrictionStage, 'No diagnosed stage')}</p>
                    </div>

                    <div className="dashboard-section">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Competitive Usage Insights</h3>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <Card title="Position Matrix" metricKey="position_matrix" value={safeText(usageDiagnostics.positionLabel, '--')} subtitle={`Usage median ${safePercent(usageDiagnostics.usageMedian)} · Retention median ${safePercent(usageDiagnostics.retentionMedian)}`} />
                        <Card title="Growth Opportunity" metricKey="growth_opportunity" value={safeText(usageDiagnostics.opportunities[0]?.name, 'No data')} subtitle={usageDiagnostics.opportunities[0] ? `${safeCount(usageDiagnostics.opportunities[0]?.size)} respondents` : 'No sized opportunity in this slice'} />
                      </div>
                      <div className="mt-4 overflow-auto">
                        <table className="w-full text-xs text-slate-300">
                          <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                            <tr>
                              <th className="py-2 pr-2">Opportunity</th>
                              <th className="py-2 pr-2">Size</th>
                              <th className="py-2 pr-2">Scope Percentage</th>
                              <th className="py-2">Action Focus</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usageDiagnostics.opportunities.map((row) => (
                              <tr key={row.name} className="border-t border-white/5">
                                <td className="py-2 pr-2">{row.name}</td>
                                <td className="py-2 pr-2">{row.size}</td>
                                <td className="py-2 pr-2">{row.pct}%</td>
                                <td className="py-2">{row.note}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="dashboard-section dashboard-diagnostic">
                  No usage data in this slice.
                </div>
              )}
            </TabsContent>

            <TabsContent value="loyalty_satisfaction" className="dashboard-tab-panel motion-safe:animate-[fadeIn_160ms_ease-out]">
              {loyaltyDiagnostics ? (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card title="Loyalty Index" metricKey="loyalty_index" variant="primary" value={safeNumber(loyaltyTopMetrics?.loyaltyIndex.value)} subtitle="0-100 weighted index" />
                    <Card title="NPS" metricKey="nps_loyalty" variant="primary" value={safeNumber(loyaltyTopMetrics?.nps.value)} subtitle={`${safePercent(selectedMetricsView?.promoters, EMPTY_COPY.noData)} promoters · ${safePercent(selectedMetricsView?.detractors, EMPTY_COPY.noData)} detractors`} sparklineValues={trendView.map((point) => point.nps)} />
                    <Card title="Committed" metricKey="segment_committed" variant="primary" value={safePercent(loyaltyTopMetrics?.committed.value)} subtitle={isFiniteMetricValue(loyaltyTopMetrics?.committed.count) ? `${safeCount(loyaltyTopMetrics?.committed.count)} respondents` : EMPTY_COPY.noAwareInSlice} />
                    <Card title="Rejectors" metricKey="segment_rejectors" variant="primary" value={safePercent(loyaltyTopMetrics?.rejectors.value)} subtitle={isFiniteMetricValue(loyaltyTopMetrics?.rejectors.count) ? `${safeCount(loyaltyTopMetrics?.rejectors.count)} respondents` : EMPTY_COPY.noAwareInSlice} />
                  </div>

                  <div className="mt-4 dashboard-section">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Loyalty Segmentation Analysis</h3>
                      <SectionInsightsTrigger sectionKey="loyalty_segmentation" ctaLabel="View Insights" />
                    </div>
                    <div className="mt-6 grid gap-4 md:grid-cols-5">
                      <Card title="Committed" metricKey="segment_committed" value={loyaltyDiagnostics.awareCount > 0 ? safePercent(loyaltyDiagnostics.segmentPcts.Committed) : '--'} subtitle={loyaltyDiagnostics.awareCount > 0 ? 'Highest loyalty and advocacy' : EMPTY_COPY.noAwareInSlice} />
                      <Card title="Favors" metricKey="segment_favors" value={loyaltyDiagnostics.awareCount > 0 ? safePercent(loyaltyDiagnostics.segmentPcts.Favors) : '--'} subtitle={loyaltyDiagnostics.awareCount > 0 ? 'Good loyalty, not fully committed' : EMPTY_COPY.noAwareInSlice} />
                      <Card title="Potential" metricKey="segment_potential" value={loyaltyDiagnostics.awareCount > 0 ? safePercent(loyaltyDiagnostics.segmentPcts.Potential) : '--'} subtitle={loyaltyDiagnostics.awareCount > 0 ? 'High opportunity pipeline' : EMPTY_COPY.noAwareInSlice} />
                      <Card title="Accessibles" metricKey="segment_accessibles" value={loyaltyDiagnostics.awareCount > 0 ? safePercent(loyaltyDiagnostics.segmentPcts.Accessibles) : '--'} subtitle={loyaltyDiagnostics.awareCount > 0 ? 'Neutral/open audience' : EMPTY_COPY.noAwareInSlice} />
                      <Card title="Rejectors" metricKey="segment_rejectors" value={loyaltyDiagnostics.awareCount > 0 ? safePercent(loyaltyDiagnostics.segmentPcts.Rejectors) : '--'} subtitle={loyaltyDiagnostics.awareCount > 0 ? 'Active resistance to adoption' : EMPTY_COPY.noAwareInSlice} />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="dashboard-section">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Segmentation Decision Tree</h3>
                        <SectionInsightsTrigger sectionKey="decision_tree" ctaLabel="View Insights" />
                      </div>
                      <div className="mt-4 space-y-3">
                        <MiniBar label="Current users -> Committed/Favors path" value={loyaltyDiagnostics.awareCount > 0 ? Math.round((loyaltyDiagnostics.segmentCounts.Committed + loyaltyDiagnostics.segmentCounts.Favors) * 100 / loyaltyDiagnostics.awareCount) : null} color="bg-blue-500" />
                        <MiniBar label="Non-current -> Potential/Accessible/Rejector path" value={loyaltyDiagnostics.awareCount > 0 ? Math.round((loyaltyDiagnostics.segmentCounts.Potential + loyaltyDiagnostics.segmentCounts.Accessibles + loyaltyDiagnostics.segmentCounts.Rejectors) * 100 / loyaltyDiagnostics.awareCount) : null} color="bg-violet-500" />
                        <MiniBar label="Committed capture among aware" value={loyaltyDiagnostics.awareCount > 0 ? loyaltyDiagnostics.segmentPcts.Committed : null} color="bg-emerald-500" />
                        <MiniBar label="Rejector pressure among aware" value={loyaltyDiagnostics.awareCount > 0 ? loyaltyDiagnostics.segmentPcts.Rejectors : null} color="bg-rose-500" />
                      </div>
                    </div>

                    <div className="dashboard-section">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Segment Movement Tracker</h3>
                        <SectionInsightsTrigger sectionKey="movement_tracker" ctaLabel="View Insights" />
                      </div>
                      <div className="mt-4 overflow-auto">
                        <table className="w-full text-xs text-slate-300">
                          <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                            <tr>
                              <th className="py-2 pr-2">Segment</th>
                              <th className="py-2 pr-2">Previous</th>
                              <th className="py-2 pr-2">Current</th>
                              <th className="py-2">Delta</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loyaltyDiagnostics.movementRows.length > 0 ? loyaltyDiagnostics.movementRows.map((row) => (
                              <tr key={row.segment} className="border-t border-white/5">
                                <td className="py-2 pr-2">{row.segment}</td>
                                <td className="py-2 pr-2">{safePercent(row.previousPct)}</td>
                                <td className="py-2 pr-2">{safePercent(row.currentPct)}</td>
                                <td className="py-2">{safeSignedPercent(row.deltaPct)}</td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan={4} className="py-3 text-slate-500">No movement data in this slice.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 dashboard-section">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Segment Profile Cards</h3>
                      <SectionInsightsTrigger sectionKey="segment_profiles" ctaLabel="View Insights" />
                    </div>
                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                      {loyaltyDiagnostics.profileCards.map((profile) => (
                          <div key={profile.segment} className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                            <div className="flex items-center gap-1">
                              <p className="text-xs font-bold uppercase tracking-widest text-slate-300">{profile.segment}</p>
                              <MetricInfoIcon metricKey={`segment_${profile.segment.toLowerCase()}` as DashboardMetricKey} />
                            </div>
                          <p className="mt-2 text-2xl font-black text-white">{loyaltyDiagnostics.awareCount > 0 ? safePercent(profile.pct) : '--'}</p>
                          <p className="text-xs text-slate-500">{loyaltyDiagnostics.awareCount > 0 ? `${safeCount(profile.count)} respondents` : EMPTY_COPY.noAwareInSlice}</p>
                          <div className="mt-3 space-y-1 text-xs text-slate-300">
                            <p>Average NPS: {safeNumber(profile.avgNps)}</p>
                            <p>Average Intent: {safeNumber(profile.avgIntent)}</p>
                            <p>Top Age: {safeText(profile.topAge)}</p>
                            <p>Top Gender: {safeText(profile.topGender)}</p>
                            <p>Multi-Bank: {safePercent(profile.multiBankPct)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 dashboard-section">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Conversion Funnel to Loyalty</h3>
                      <SectionInsightsTrigger sectionKey="loyalty_conversion" ctaLabel="View Insights" />
                    </div>
                    <div className="mt-6 grid gap-4 md:grid-cols-4">
                      <Card title="Aware" value={loyaltyDiagnostics.awareCount > 0 ? '100%' : '--'} subtitle={loyaltyDiagnostics.awareCount > 0 ? `${safeCount(loyaltyDiagnostics.awareCount)} aware respondents` : EMPTY_COPY.noAwareInSlice} />
                      <Card title="Potential" metricKey="segment_potential" value={loyaltyDiagnostics.awareCount > 0 ? safePercent(loyaltyDiagnostics.segmentPcts.Potential) : '--'} subtitle={loyaltyDiagnostics.awareCount > 0 ? `${safeCount(loyaltyDiagnostics.segmentCounts.Potential)} respondents` : EMPTY_COPY.noAwareInSlice} />
                      <Card title="Favors" metricKey="segment_favors" value={loyaltyDiagnostics.awareCount > 0 ? safePercent(loyaltyDiagnostics.segmentPcts.Favors) : '--'} subtitle={loyaltyDiagnostics.awareCount > 0 ? `${safeCount(loyaltyDiagnostics.segmentCounts.Favors)} respondents` : EMPTY_COPY.noAwareInSlice} />
                      <Card title="Committed" metricKey="segment_committed" value={loyaltyDiagnostics.awareCount > 0 ? safePercent(loyaltyDiagnostics.segmentPcts.Committed) : '--'} subtitle={loyaltyDiagnostics.awareCount > 0 ? `${safeCount(loyaltyDiagnostics.segmentCounts.Committed)} respondents` : EMPTY_COPY.noAwareInSlice} />
                    </div>
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      <Card title="Aware -> Potential" metricKey="loyalty_conversion_funnel" value={loyaltyDiagnostics.awareCount > 0 ? safePercent(loyaltyDiagnostics.awareToPotential) : '--'} subtitle={loyaltyDiagnostics.awareCount > 0 ? 'Conversion rate' : EMPTY_COPY.noAwareInSlice} />
                      <Card title="Potential -> Favors" metricKey="loyalty_conversion_funnel" value={loyaltyDiagnostics.segmentCounts.Potential > 0 ? safePercent(loyaltyDiagnostics.potentialToFavors) : '--'} subtitle={loyaltyDiagnostics.segmentCounts.Potential > 0 ? 'Conversion rate' : 'No potential respondents in this slice.'} />
                      <Card title="Favors -> Committed" metricKey="loyalty_conversion_funnel" value={loyaltyDiagnostics.segmentCounts.Favors > 0 ? safePercent(loyaltyDiagnostics.favorsToCommitted) : '--'} subtitle={loyaltyDiagnostics.segmentCounts.Favors > 0 ? 'Conversion rate' : 'No favoring respondents in this slice.'} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="dashboard-section dashboard-diagnostic">
                  No loyalty data in this slice.
                </div>
              )}
            </TabsContent>

            <TabsContent value="brand_momentum" className="dashboard-tab-panel motion-safe:animate-[fadeIn_160ms_ease-out]">
              {momentumDiagnostics ? (
                <>
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                    <Card
                      title="Momentum Score"
                      metricKey="momentum_score"
                      variant="primary"
                      value={momentumTopMetrics?.score.value ?? '--'}
                      subtitle={`${momentumDiagnostics.status} · ${momentumDiagnostics.strategy}${momentumTopMetrics?.score.base_n ? ` · ${validPeriodSubtitle(momentumTopMetrics.score.base_n)}` : ''}`}
                      delta={momentumDiagnostics.velocity}
                      sparklineValues={momentumDiagnostics.trends.map((point) => point.score)}
                    />
                    <Card
                      title="Awareness Growth Score"
                      metricKey="awareness_growth_score"
                      variant="primary"
                      value={momentumTopMetrics?.awarenessGrowth.value ?? '--'}
                      subtitle={momentumTopMetrics?.awarenessGrowth.base_n && momentumTopMetrics.awarenessGrowth.base_n < 4
                        ? firstStatusNote(momentumTopMetrics.awarenessGrowth.notes)
                        : `Normalized period growth · ${validPeriodSubtitle(momentumTopMetrics?.awarenessGrowth.base_n)}`}
                    />
                    <Card
                      title="Consideration"
                      metricKey="consideration_rate_momentum"
                      variant="primary"
                      value={momentumTopMetrics?.consideration.value === null ? '--' : `${momentumTopMetrics?.consideration.value}%`}
                      subtitle={momentumTopMetrics?.consideration.base_n && momentumTopMetrics.consideration.base_n < 4
                        ? firstStatusNote(momentumTopMetrics.consideration.notes)
                        : 'Pipeline strength'}
                    />
                    <Card
                      title="Conversion"
                      metricKey="conversion_rate_momentum"
                      variant="primary"
                      value={momentumTopMetrics?.conversion.value === null ? '--' : `${momentumTopMetrics?.conversion.value}%`}
                      subtitle={momentumTopMetrics?.conversion.base_n && momentumTopMetrics.conversion.base_n < 4
                        ? firstStatusNote(momentumTopMetrics.conversion.notes)
                        : 'Aware -> Ever used'}
                    />
                    <Card
                      title="Retention"
                      metricKey="retention_rate_momentum"
                      value={momentumTopMetrics?.retention.value === null ? '--' : `${momentumTopMetrics?.retention.value}%`}
                      subtitle={momentumTopMetrics?.retention.base_n && momentumTopMetrics.retention.base_n < 4
                        ? firstStatusNote(momentumTopMetrics.retention.notes)
                        : 'Ever used -> Current'}
                    />
                    <Card
                      title="Adoption"
                      metricKey="adoption_rate_momentum"
                      value={momentumTopMetrics?.adoption.value === null ? '--' : `${momentumTopMetrics?.adoption.value}%`}
                      subtitle={momentumTopMetrics?.adoption.base_n && momentumTopMetrics.adoption.base_n < 4
                        ? firstStatusNote(momentumTopMetrics.adoption.notes)
                        : 'Current -> Preferred'}
                    />
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="dashboard-section">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Momentum Drivers Analysis</h3>
                        <SectionInsightsTrigger sectionKey="momentum_drivers" ctaLabel="View Insights" />
                      </div>
                      <div className="mt-4 overflow-auto">
                        <table className="w-full text-xs text-slate-300">
                          <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                            <tr>
                              <th className="py-2 pr-2">Component</th>
                              <th className="py-2 pr-2">Weight</th>
                              <th className="py-2 pr-2">Score</th>
                              <th className="py-2 pr-2">Contribution</th>
                              <th className="py-2">% of Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {momentumDiagnostics.contributions.map((row) => (
                              <tr key={row.key} className="border-t border-white/5">
                                <td className="py-2 pr-2">{row.label}</td>
                                <td className="py-2 pr-2">{row.weightPct}%</td>
                                <td className="py-2 pr-2">{row.score}</td>
                                <td className="py-2 pr-2">{row.contribution}</td>
                                <td className="py-2">{row.shareOfTotal}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="dashboard-section">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Scenario Sensitivity</h3>
                        <SectionInsightsTrigger sectionKey="momentum_drivers" ctaLabel="View Insights" />
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Modeled scenario outputs showing which momentum levers move the score most in this framework.
                      </p>
                      <div className="mt-4 overflow-auto">
                        <table className="w-full text-xs text-slate-300">
                          <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                            <tr>
                              <th className="py-2 pr-2">Component</th>
                              <th className="py-2 pr-2">+10 Gain</th>
                              <th className="py-2 pr-2">Gap to 90</th>
                              <th className="py-2 pr-2">Priority</th>
                              <th className="py-2">Difficulty</th>
                            </tr>
                          </thead>
                          <tbody>
                            {momentumDiagnostics.priorities.map((priority) => {
                              const sensitivity = momentumDiagnostics.sensitivity.find((item) => item.key === priority.key);
                              return (
                                <tr key={priority.key} className="border-t border-white/5">
                                  <td className="py-2 pr-2">{priority.label}</td>
                                  <td className="py-2 pr-2">{sensitivity?.momentumGain ?? 0}</td>
                                  <td className="py-2 pr-2">{priority.gapToExcellence}</td>
                                  <td className="py-2 pr-2">{priority.priorityScore}</td>
                                  <td className="py-2">{priority.difficulty}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="dashboard-section">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Momentum Trends</h3>
                        <SectionInsightsTrigger sectionKey="momentum_trends" ctaLabel="View Insights" />
                      </div>
                      <div className="mt-4 space-y-3">
                        {momentumDiagnostics.trends.map((point) => (
                          <MiniBar
                            key={point.month}
                            label={`${point.month} (${point.delta === null ? 'No delta' : `${point.delta > 0 ? '+' : ''}${point.delta}`})`}
                            value={point.score}
                            color="bg-indigo-500"
                          />
                        ))}
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <Card title="Velocity" metricKey="momentum_velocity" value={formatSignedValue(momentumDiagnostics.velocity, '', 1)} subtitle={momentumDiagnostics.velocity === null ? `${EMPTY_COPY.insufficientHistory} for velocity` : momentumDiagnostics.velocityLabel} />
                        <Card title="Volatility" metricKey="volatility_score" value={momentumDiagnostics.volatilityCv === null ? '--' : `${momentumDiagnostics.volatilityCv}%`} subtitle={momentumDiagnostics.volatilityLabel} />
                        <Card
                          title="Trajectory (3M)"
                          metricKey="trajectory_forecast"
                          value={momentumDiagnostics.forecast[momentumDiagnostics.forecast.length - 1]?.projectedScore ?? '--'}
                          subtitle={momentumDiagnostics.forecastEligible
                            ? `${momentumDiagnostics.forecast[0]?.month || ''} to ${momentumDiagnostics.forecast[momentumDiagnostics.forecast.length - 1]?.month || ''}`
                            : firstStatusNote(momentumTopMetrics?.score.notes, EMPTY_COPY.forecastUnavailable)}
                        />
                      </div>
                    </div>

                    <details className="dashboard-section dashboard-collapsible" open>
                      <summary>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Momentum Trajectory Forecast</h3>
                      </summary>
                      <div className="dashboard-collapsible-body mt-4 grid gap-3 md:grid-cols-3">
                        {momentumDiagnostics.forecast.map((point) => (
                          <div key={point.month} className="rounded-xl border border-white/10 bg-slate-900/40 p-3 text-center">
                            <p className="text-xs text-slate-400">{point.month}</p>
                            <p className="mt-1 text-2xl font-black text-white">{point.projectedScore ?? '--'}</p>
                            <p className="text-[11px] text-slate-500">{point.projectedScore === null ? EMPTY_COPY.forecastUnavailable : 'Projected momentum'}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>

                  <div className="mt-6 dashboard-section">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Competitive Momentum Analysis</h3>
                      <SectionInsightsTrigger sectionKey="competitive_momentum" ctaLabel="View Insights" />
                    </div>
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      <Card title="Relative Rank" metricKey="relative_momentum" value={`#${momentumDiagnostics.selectedRank}`} subtitle={`Gap to Leader: ${momentumDiagnostics.gapToLeader}`} />
                      <Card title="Current Momentum Score" metricKey="momentum_score" value={momentumDiagnostics.score} subtitle={selectedBankName} />
                      <Card
                        title="Selected Growth Rate"
                        metricKey="relative_momentum"
                        value={momentumDiagnostics.competitiveRows.find((row) => row.bankId === selectedBankId)?.growthRate === null ? '--' : `${momentumDiagnostics.competitiveRows.find((row) => row.bankId === selectedBankId)?.growthRate}%`}
                        subtitle="Versus previous month"
                      />
                    </div>
                    <div className="mt-4 overflow-auto">
                      <table className="w-full text-xs text-slate-300">
                        <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                          <tr>
                            <th className="py-2 pr-2">Bank</th>
                            <th className="py-2 pr-2">Momentum</th>
                            <th className="py-2 pr-2">Previous</th>
                            <th className="py-2 pr-2">Delta</th>
                            <th className="py-2 pr-2">Growth Rate</th>
                            <th className="py-2 pr-2">Awareness Growth</th>
                            <th className="py-2 pr-2">Consideration</th>
                            <th className="py-2 pr-2">Conversion</th>
                            <th className="py-2 pr-2">Retention</th>
                            <th className="py-2">Adoption</th>
                          </tr>
                        </thead>
                        <tbody>
                          {momentumDiagnostics.competitiveRows.map((row) => (
                            <tr key={row.bankId} className="border-t border-white/5">
                              <td className="py-2 pr-2">{row.bankName}</td>
                              <td className="py-2 pr-2">{row.score}</td>
                              <td className="py-2 pr-2">{row.previousScore}</td>
                              <td className="py-2 pr-2">{row.delta > 0 ? '+' : ''}{row.delta}</td>
                              <td className="py-2 pr-2">{row.growthRate === null ? '-' : `${row.growthRate > 0 ? '+' : ''}${row.growthRate}%`}</td>
                              <td className="py-2 pr-2">{row.components.awarenessGrowth}</td>
                              <td className="py-2 pr-2">{row.components.consideration}%</td>
                              <td className="py-2 pr-2">{row.components.conversion}%</td>
                              <td className="py-2 pr-2">{row.components.retention}%</td>
                              <td className="py-2">{row.components.adoption}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="dashboard-section dashboard-diagnostic">
                  No momentum data in this slice.
                </div>
              )}
            </TabsContent>

            <TabsContent value="competitive_intelligence" className="dashboard-tab-panel motion-safe:animate-[fadeIn_160ms_ease-out]">
              {competitiveDiagnostics ? (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card
                      title="Market Share"
                      metricKey="market_share"
                      value={safePercent(competitiveTopMetrics?.marketShare.value)}
                      subtitle={selectedBankName}
                    />
                    <Card
                      title="Market Concentration (HHI)"
                      metricKey="market_concentration"
                      value={safeNumber(competitiveTopMetrics?.hhi.value)}
                      subtitle={competitiveDiagnostics.marketStructure.concentrationLabel}
                    />
                    <Card
                      title="Average Banks per Customer"
                      metricKey="avg_banks_per_customer_ci"
                      value={safeNumber(competitiveTopMetrics?.avgBanksPerCustomer.value)}
                      subtitle="Active banking customers"
                    />
                    <Card
                      title="Multi-Banking Rate"
                      metricKey="multi_banking_rate_ci"
                      value={safePercent(competitiveTopMetrics?.multiBankingRate.value)}
                      subtitle="Customers using 2+ banks"
                    />
                  </div>

                  <div className="mt-6 dashboard-section">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Market Structure Analysis</h3>
                      <SectionInsightsTrigger sectionKey="market_structure_ci" ctaLabel="View Insights" />
                    </div>
                    <div className="mt-4 overflow-auto">
                      <table className="w-full text-xs text-slate-300">
                        <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                          <tr>
                            <th className="py-2 pr-2">Bank</th>
                            <th className="py-2 pr-2">Preferred Count</th>
                            <th className="py-2 pr-2">Market Share</th>
                            <th className="py-2 pr-2">Market Share Trend</th>
                            <th className="py-2 pr-2">Share of Voice</th>
                            <th className="py-2">SOV vs. Share</th>
                          </tr>
                        </thead>
                        <tbody>
                          {competitiveDiagnostics.marketStructure.marketRows.map((row) => (
                            <tr key={row.bankId} className="border-t border-white/5">
                              <td className="py-2 pr-2">{row.bankName}</td>
                              <td className="py-2 pr-2">{row.preferredCount}</td>
                              <td className="py-2 pr-2">{row.marketShare}%</td>
                              <td className="py-2 pr-2">{row.marketShareDelta > 0 ? '+' : ''}{row.marketShareDelta}pp</td>
                              <td className="py-2 pr-2">{row.shareOfVoice}%</td>
                              <td className="py-2">{row.sovVsShareGap > 0 ? '+' : ''}{row.sovVsShareGap}pp</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="dashboard-section">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Customer Behavior</h3>
                        <SectionInsightsTrigger sectionKey="customer_behavior_ci" ctaLabel="View Insights" />
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        {competitiveDiagnostics.customerBehavior.portfolioComposition.map((row) => (
                          <Card key={row.label} title={row.label} value={`${row.pct}%`} subtitle={`${row.count} customers`} />
                        ))}
                      </div>
                      <div className="mt-4 overflow-auto">
                        <table className="w-full text-xs text-slate-300">
                          <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                            <tr>
                              <th className="py-2 pr-2">Competitive Overlap</th>
                              <th className="py-2 pr-2">Users</th>
                              <th className="py-2">Overlap %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {competitiveDiagnostics.customerBehavior.overlapRows.length > 0 ? competitiveDiagnostics.customerBehavior.overlapRows.map((row) => (
                              <tr key={row.bankId} className="border-t border-white/5">
                                <td className="py-2 pr-2">{row.bankName}</td>
                                <td className="py-2 pr-2">{row.overlapCount}</td>
                                <td className="py-2">{row.overlapPct}%</td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan={3} className="py-2 text-slate-500">No overlap data in this slice.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="dashboard-section">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Competitive Analysis</h3>
                        <SectionInsightsTrigger sectionKey="competitive_analysis_ci" ctaLabel="View Insights" />
                      </div>
                      <div className="mt-4 overflow-auto">
                        <table className="w-full text-xs text-slate-300">
                          <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                            <tr>
                              <th className="py-2 pr-2">Bank</th>
                              <th className="py-2 pr-2">Overlap</th>
                              <th className="py-2 pr-2">Type</th>
                              <th className="py-2 pr-2">Position</th>
                              <th className="py-2">Tier</th>
                            </tr>
                          </thead>
                          <tbody>
                            {competitiveDiagnostics.competitiveAnalysis.positioningRows.map((row) => {
                              const set = competitiveDiagnostics.competitiveAnalysis.directCompetitors.find((item) => item.bankId === row.bankId);
                              return (
                                <tr key={row.bankId} className="border-t border-white/5">
                                  <td className="py-2 pr-2">{row.bankName}</td>
                                  <td className="py-2 pr-2">{safePercent(set?.overlapPct)}</td>
                                  <td className="py-2 pr-2">{safeText(set?.competitorType, 'Indirect')}</td>
                                  <td className="py-2 pr-2">{row.position}</td>
                                  <td className="py-2">{row.tier}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {switchingRadar && (
                    <div className="mt-6">
                      <CustomerSwitchingRadar
                        metrics={switchingRadar}
                        title="Multi-Bank Competitive Pressure"
                        subtitle="Among customers who actively use your bank and at least one competitor, this highlights where secondary preference is strongest."
                        resolveCompetitorLabel={(competitor) => bankNameById.get(competitor) || competitor}
                      />
                    </div>
                  )}

                  {migrationMap && (
                    <div className="mt-6">
                      <CustomerMigrationMap
                        metrics={migrationMap}
                        resolveCompetitorLabel={(competitor) => bankNameById.get(competitor) || competitor}
                      />
                    </div>
                  )}

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    {adminMode ? (
                      <div className="dashboard-section">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Share of Wallet Analysis</h3>
                          <SectionInsightsTrigger sectionKey="share_wallet_ci" ctaLabel="View Insights" />
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          Internal-only proxy view. Wallet share is estimated from current-bank overlap, not directly observed spending share.
                        </p>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <Card title="Estimated Wallet Share" metricKey="wallet_share_estimation" value={`${competitiveDiagnostics.shareOfWallet.estimatedWalletShare}%`} subtitle="Selected bank wallet capture" />
                          <Card title="Top Wallet Competitor" metricKey="wallet_share_estimation" value={safeText(competitiveDiagnostics.shareOfWallet.byCompetitor[0]?.bankName, 'No data')} subtitle={competitiveDiagnostics.shareOfWallet.byCompetitor[0] ? `${safePercent(competitiveDiagnostics.shareOfWallet.byCompetitor[0]?.estimatedWalletShare)} estimated share` : 'No competitor estimate in this slice'} />
                        </div>
                        <div className="mt-4 overflow-auto">
                          <table className="w-full text-xs text-slate-300">
                            <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                              <tr>
                                <th className="py-2 pr-2">Competitor</th>
                                <th className="py-2">Estimated Wallet Share</th>
                              </tr>
                            </thead>
                            <tbody>
                              {competitiveDiagnostics.shareOfWallet.byCompetitor.map((row) => (
                                <tr key={row.bankId} className="border-t border-white/5">
                                  <td className="py-2 pr-2">{row.bankName}</td>
                                  <td className="py-2">{row.estimatedWalletShare}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}

                    <div className="dashboard-section">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">{winLossSectionTitle}</h3>
                        <SectionInsightsTrigger sectionKey="win_loss_ci" ctaLabel="View Insights" />
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{winLossSectionSubtitle}</p>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <Card title={winLossPrimaryCardTitle} metricKey="win_rate_ci" value={`${competitiveDiagnostics.winLoss.overallWinRate}%`} subtitle={hasObservedWinLoss ? 'Across measured competitor transitions' : 'Across modeled competitor pressure signals'} />
                        <Card title="Evidence Mode" value={winLossModeLabel} subtitle={winLossModeSubtitle} />
                      </div>
                      <div className="mt-4 overflow-auto">
                        <table className="w-full text-xs text-slate-300">
                          <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                            <tr>
                              <th className="py-2 pr-2">Competitor</th>
                              <th className="py-2 pr-2">{hasObservedWinLoss ? 'Observed Gains' : 'Estimated Gains'}</th>
                              <th className="py-2 pr-2">{hasObservedWinLoss ? 'Observed Losses' : 'Estimated Losses'}</th>
                              <th className="py-2 pr-2">{hasObservedWinLoss ? 'Net' : 'Net Signal'}</th>
                              <th className="py-2">{hasObservedWinLoss ? 'Win Rate' : 'Balance'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {competitiveDiagnostics.winLoss.rows.map((row) => (
                              <tr key={row.competitorBankId} className="border-t border-white/5">
                                <td className="py-2 pr-2">{row.competitorBankName}</td>
                                <td className="py-2 pr-2">{row.gainedFrom}</td>
                                <td className="py-2 pr-2">{row.lostTo}</td>
                                <td className="py-2 pr-2">{row.net > 0 ? '+' : ''}{row.net}</td>
                                <td className="py-2">{row.winRate}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="dashboard-section">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Strengths & Weaknesses</h3>
                        <SectionInsightsTrigger sectionKey="strengths_weaknesses_ci" ctaLabel="View Insights" />
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <Card title="Relative Strength Index" metricKey="relative_strength_index" value={competitiveDiagnostics.strengthsWeaknesses.relativeStrengthIndex} subtitle="Average relative score vs market" />
                        <Card title="Largest Gap" value={safeText([...competitiveDiagnostics.strengthsWeaknesses.relativeRows].sort((a, b) => a.relativeStrength - b.relativeStrength)[0]?.metric, 'No data')} subtitle="Lowest relative metric" />
                      </div>
                      <div className="mt-4 overflow-auto">
                        <table className="w-full text-xs text-slate-300">
                          <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                            <tr>
                              <th className="py-2 pr-2">Metric</th>
                              <th className="py-2 pr-2">You</th>
                              <th className="py-2 pr-2">Market Average</th>
                              <th className="py-2 pr-2">Relative</th>
                              <th className="py-2">Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {competitiveDiagnostics.strengthsWeaknesses.relativeRows.map((row) => (
                              <tr key={row.metric} className="border-t border-white/5">
                                <td className="py-2 pr-2">{row.metric}</td>
                                <td className="py-2 pr-2">{row.yourValue}</td>
                                <td className="py-2 pr-2">{row.marketAvg}</td>
                                <td className="py-2 pr-2">{row.relativeStrength > 0 ? '+' : ''}{row.relativeStrength}%</td>
                                <td className="py-2">{row.strengthType}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="dashboard-section">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Whitespace Opportunities</h3>
                        <SectionInsightsTrigger sectionKey="white_space_ci" ctaLabel="View Insights" />
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Age gaps</p>
                          <div className="mt-2 overflow-auto">
                            <table className="w-full text-xs text-slate-300">
                              <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                                <tr>
                                  <th className="py-2 pr-2">Segment</th>
                                  <th className="py-2 pr-2">Gap</th>
                                  <th className="py-2">Opportunity</th>
                                </tr>
                              </thead>
                              <tbody>
                                {competitiveDiagnostics.whiteSpace.ageRows.map((row) => (
                                  <tr key={`age-${row.segment}`} className="border-t border-white/5">
                                    <td className="py-2 pr-2">{row.segment}</td>
                                    <td className="py-2 pr-2">{row.gap > 0 ? '+' : ''}{row.gap}pp</td>
                                    <td className="py-2">{row.opportunity}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Gender gaps</p>
                          <div className="mt-2 overflow-auto">
                            <table className="w-full text-xs text-slate-300">
                              <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                                <tr>
                                  <th className="py-2 pr-2">Segment</th>
                                  <th className="py-2 pr-2">Gap</th>
                                  <th className="py-2">Opportunity</th>
                                </tr>
                              </thead>
                              <tbody>
                                {competitiveDiagnostics.whiteSpace.genderRows.map((row) => (
                                  <tr key={`gender-${row.segment}`} className="border-t border-white/5">
                                    <td className="py-2 pr-2">{row.segment}</td>
                                    <td className="py-2 pr-2">{row.gap > 0 ? '+' : ''}{row.gap}pp</td>
                                    <td className="py-2">{row.opportunity}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 dashboard-section">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Competitive Risk Signals</h3>
                      <SectionInsightsTrigger sectionKey="threat_assessment_ci" ctaLabel="View Insights" />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Heuristic risk signals built from overlap, share movement, and visibility pressure. These are warning indicators, not direct observations of customer loss.
                    </p>
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <div className="overflow-auto">
                        <table className="w-full text-xs text-slate-300">
                          <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                            <tr>
                              <th className="py-2 pr-2">Competitor</th>
                              <th className="py-2 pr-2">Likelihood</th>
                              <th className="py-2 pr-2">Impact</th>
                              <th className="py-2">Risk Level</th>
                            </tr>
                          </thead>
                          <tbody>
                            {competitiveDiagnostics.threats.rows.map((row) => (
                              <tr key={row.competitorBankId} className="border-t border-white/5">
                                <td className="py-2 pr-2">{row.competitorBankName}</td>
                                <td className="py-2 pr-2">{row.likelihoodScore}</td>
                                <td className="py-2 pr-2">{row.impactScore}</td>
                                <td className="py-2">{row.threatLevel}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="overflow-auto">
                        <table className="w-full text-xs text-slate-300">
                          <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                            <tr>
                              <th className="py-2 pr-2">Risk Indicator</th>
                              <th className="py-2 pr-2">Status</th>
                              <th className="py-2">Alert</th>
                            </tr>
                          </thead>
                          <tbody>
                            {competitiveDiagnostics.threats.indicators.map((item) => (
                              <tr key={item.label} className="border-t border-white/5">
                                <td className="py-2 pr-2">{item.label}</td>
                                <td className="py-2 pr-2">{item.status}</td>
                                <td className="py-2">
                                  <span className={item.alert === 'Red' ? 'text-rose-400' : item.alert === 'Yellow' ? 'text-slate-500' : 'text-emerald-400'}>
                                    {item.alert}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="dashboard-section dashboard-diagnostic">
                  No competitive data in this slice.
                </div>
              )}
            </TabsContent>

            <TabsContent value="demographics" className="dashboard-tab-panel motion-safe:animate-[fadeIn_160ms_ease-out]">
              {demographicDiagnostics ? (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card title="Sample" value={`N=${safeCount(demographicsTopMetrics?.sample.value ?? demographicDiagnostics.sample, '0')}`} subtitle="Filtered respondents" />
                    <Card
                      title="Top High-Value Segment"
                      value={`${safeText(demographicDiagnostics.highValueSegments[0]?.dimension, '-')}: ${safeText(demographicDiagnostics.highValueSegments[0]?.segment, '-')}`}
                      subtitle={demographicDiagnostics.highValueSegments[0] ? `Score ${safeNumber(demographicsTopMetrics?.topSegment.value ?? demographicDiagnostics.highValueSegments[0]?.score)}` : 'No high-value segment data in this slice.'}
                    />
                    <Card
                      title="Highest Priority Gap"
                      metricKey="demo_gap_score"
                      value={`${safeText(demographicDiagnostics.opportunities[0]?.dimension, '-')}: ${safeText(demographicDiagnostics.opportunities[0]?.segment, '-')}`}
                      subtitle={demographicDiagnostics.opportunities[0] ? `${safePp(demographicsTopMetrics?.highestGap.value ?? demographicDiagnostics.opportunities[0]?.usageGap)} vs best` : 'No priority gap data in this slice.'}
                    />
                    <Card
                      title="Average Segment Multi-Banking"
                      metricKey="demo_multi_banking"
                      value={safePercent(demographicsTopMetrics?.avgSegmentMultiBanking.value)}
                      subtitle={demographicDiagnostics.ageRows.length > 0 ? 'Across age cohorts' : 'No age cohort data in this slice.'}
                    />
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="dashboard-section">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Demographic Profile Overview</h3>
                        <SectionInsightsTrigger sectionKey="demographics_overview" ctaLabel="View Insights" />
                      </div>
                      <div className="mt-4 space-y-3">
                        {demographicSummary.age.map((item) => (
                          <MiniBar key={`age-share-${item.label}`} label={`Age ${item.label}`} value={item.value} color="bg-blue-500" />
                        ))}
                        {demographicSummary.gender.map((item) => (
                          <MiniBar key={`gender-share-${item.label}`} label={`Gender ${item.label}`} value={item.value} color="bg-violet-500" />
                        ))}
                      </div>
                    </div>

                    <div className="dashboard-section">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Employment & Education Distribution</h3>
                      <div className="mt-4 space-y-3">
                        {demographicSummary.employment.map((item) => (
                          <MiniBar key={`employment-share-${item.label}`} label={`Employment ${item.label.replaceAll('_', ' ')}`} value={item.value} color="bg-emerald-500" />
                        ))}
                        {demographicSummary.education.map((item) => (
                          <MiniBar key={`education-share-${item.label}`} label={`Education ${item.label.replaceAll('_', ' ')}`} value={item.value} color="bg-amber-500" />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 dashboard-section">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Cohort Comparison (Age & Gender)</h3>
                      <SectionInsightsTrigger sectionKey="cohort_comparison" ctaLabel="View Insights" />
                    </div>
                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                      <div className="overflow-auto">
                        <table className="w-full text-xs text-slate-300">
                          <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                            <tr>
                              <th className="py-2 pr-2">Age</th>
                              <th className="py-2 pr-2">Size</th>
                              <th className="py-2 pr-2">Aware</th>
                              <th className="py-2 pr-2">Current</th>
                              <th className="py-2 pr-2">BUMO</th>
                              <th className="py-2 pr-2">NPS</th>
                              <th className="py-2">Intent</th>
                            </tr>
                          </thead>
                          <tbody>
                            {guardedAgeRows.length > 0 ? guardedAgeRows.map(({ data: row, dimmed, suppressMetrics }) => (
                              <tr key={`age-row-${row.segment}`} className={`border-t border-white/5${dimmed ? ' opacity-40' : ''}`}>
                                <td className="py-2 pr-2">
                                  <span className="flex items-center gap-1.5">
                                    {row.segment}
                                    <SampleGuardBadge guard={row.guard} />
                                  </span>
                                </td>
                                <td className="py-2 pr-2">{safePercent(row.samplePct)}</td>
                                <td className="py-2 pr-2">{suppressMetrics ? '—' : safePercent(row.awareness)}</td>
                                <td className="py-2 pr-2">{suppressMetrics ? '—' : safePercent(row.currentUsage)}</td>
                                <td className="py-2 pr-2">{suppressMetrics ? '—' : safePercent(row.preferred)}</td>
                                <td className="py-2 pr-2">{suppressMetrics ? '—' : safeNumber(row.nps)}</td>
                                <td className="py-2">{suppressMetrics ? '—' : safeAverageIntent(row.avgIntent)}</td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan={7} className="py-3 text-slate-500">No age cohort data in this slice.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="overflow-auto">
                        <table className="w-full text-xs text-slate-300">
                          <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                            <tr>
                              <th className="py-2 pr-2">Gender</th>
                              <th className="py-2 pr-2">Size</th>
                              <th className="py-2 pr-2">Aware</th>
                              <th className="py-2 pr-2">Current</th>
                              <th className="py-2 pr-2">BUMO</th>
                              <th className="py-2 pr-2">NPS</th>
                              <th className="py-2">Multi-Bank</th>
                            </tr>
                          </thead>
                          <tbody>
                            {guardedGenderRows.length > 0 ? guardedGenderRows.map(({ data: row, dimmed, suppressMetrics }) => (
                              <tr key={`gender-row-${row.segment}`} className={`border-t border-white/5${dimmed ? ' opacity-40' : ''}`}>
                                <td className="py-2 pr-2">
                                  <span className="flex items-center gap-1.5">
                                    {row.segment}
                                    <SampleGuardBadge guard={row.guard} />
                                  </span>
                                </td>
                                <td className="py-2 pr-2">{safePercent(row.samplePct)}</td>
                                <td className="py-2 pr-2">{suppressMetrics ? '—' : safePercent(row.awareness)}</td>
                                <td className="py-2 pr-2">{suppressMetrics ? '—' : safePercent(row.currentUsage)}</td>
                                <td className="py-2 pr-2">{suppressMetrics ? '—' : safePercent(row.preferred)}</td>
                                <td className="py-2 pr-2">{suppressMetrics ? '—' : safeNumber(row.nps)}</td>
                                <td className="py-2">{suppressMetrics ? '—' : safePercent(row.multiBankRate)}</td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan={7} className="py-3 text-slate-500">No gender cohort data in this slice.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="dashboard-section">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Cohort Comparison (Employment & Education)</h3>
                      <div className="mt-6 grid gap-4 lg:grid-cols-2">
                        <div className="overflow-auto">
                          <table className="w-full text-xs text-slate-300">
                            <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                              <tr>
                                <th className="py-2 pr-2">Employment</th>
                                <th className="py-2 pr-2">Current</th>
                                <th className="py-2 pr-2">BUMO</th>
                                <th className="py-2">NPS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {guardedEmploymentRows.length > 0 ? guardedEmploymentRows.map(({ data: row, dimmed, suppressMetrics }) => (
                                <tr key={`employment-row-${row.segment}`} className={`border-t border-white/5${dimmed ? ' opacity-40' : ''}`}>
                                  <td className="py-2 pr-2">
                                    <span className="flex items-center gap-1.5">
                                      {row.segment}
                                      <SampleGuardBadge guard={row.guard} />
                                    </span>
                                  </td>
                                  <td className="py-2 pr-2">{suppressMetrics ? '—' : safePercent(row.currentUsage)}</td>
                                  <td className="py-2 pr-2">{suppressMetrics ? '—' : safePercent(row.preferred)}</td>
                                  <td className="py-2">{suppressMetrics ? '—' : safeNumber(row.nps)}</td>
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan={4} className="py-3 text-slate-500">No employment cohort data in this slice.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        <div className="overflow-auto">
                          <table className="w-full text-xs text-slate-300">
                            <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                              <tr>
                                <th className="py-2 pr-2">Education</th>
                                <th className="py-2 pr-2">Current</th>
                                <th className="py-2 pr-2">BUMO</th>
                                <th className="py-2">NPS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {guardedEducationRows.length > 0 ? guardedEducationRows.map(({ data: row, dimmed, suppressMetrics }) => (
                                <tr key={`education-row-${row.segment}`} className={`border-t border-white/5${dimmed ? ' opacity-40' : ''}`}>
                                  <td className="py-2 pr-2">
                                    <span className="flex items-center gap-1.5">
                                      {row.segment}
                                      <SampleGuardBadge guard={row.guard} />
                                    </span>
                                  </td>
                                  <td className="py-2 pr-2">{suppressMetrics ? '—' : safePercent(row.currentUsage)}</td>
                                  <td className="py-2 pr-2">{suppressMetrics ? '—' : safePercent(row.preferred)}</td>
                                  <td className="py-2">{suppressMetrics ? '—' : safeNumber(row.nps)}</td>
                                </tr>
                              )) : (
                                <tr>
                                  <td colSpan={4} className="py-3 text-slate-500">No education cohort data in this slice.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="dashboard-section">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Demographic Gap & Opportunity Diagnostics</h3>
                        <SectionInsightsTrigger sectionKey="demographic_opportunities" ctaLabel="View Insights" />
                      </div>
                      <div className="mt-4 overflow-auto">
                        <table className="w-full text-xs text-slate-300">
                          <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                            <tr>
                              <th className="py-2 pr-2">Dimension</th>
                              <th className="py-2 pr-2">Segment</th>
                              <th className="py-2 pr-2">Usage</th>
                              <th className="py-2 pr-2">Gap</th>
                              <th className="py-2 pr-2">NPS</th>
                              <th className="py-2">Priority</th>
                            </tr>
                          </thead>
                          <tbody>
                            {guardedOpportunityRows.length > 0 ? guardedOpportunityRows.map(({ data: row }) => (
                              <tr key={`${row.dimension}-${row.segment}`} className="border-t border-white/5">
                                <td className="py-2 pr-2 capitalize">{row.dimension}</td>
                                <td className="py-2 pr-2">{row.segment}</td>
                                <td className="py-2 pr-2">{safePercent(row.currentUsage)}</td>
                                <td className="py-2 pr-2">{safePp(row.usageGap)}</td>
                                <td className="py-2 pr-2">{safeNumber(row.nps)}</td>
                                <td className="py-2">{row.priority}</td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan={6} className="py-3 text-slate-500">No demographic opportunity data in this slice.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                        <SampleGuardFooter
                          removedCount={(demographicDiagnostics?.opportunities.length ?? 0) - guardedOpportunityRows.length}
                          context="ranking"
                        />
                      </div>
                      <div className="mt-4">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">High-Value Segments</p>
                        <div className="mt-2 grid gap-2">
                          {demographicDiagnostics.highValueSegments.length > 0 ? demographicDiagnostics.highValueSegments.map((row) => (
                            <div key={`${row.dimension}-${row.segment}`} className="rounded-xl border border-white/10 bg-slate-900/50 p-2 text-xs text-slate-300">
                              {row.dimension}: {row.segment} | score {safeNumber(row.score)} | preferred {safePercent(row.preferred)} | NPS {safeNumber(row.nps)}
                            </div>
                          )) : (
                            <div className="rounded-xl border border-dashed border-white/10 bg-slate-900/40 p-2 text-xs text-slate-500">
                              No high-value segment data in this slice.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="dashboard-section dashboard-diagnostic">
                  No demographic data in this slice.
                </div>
              )}
            </TabsContent>

            <TabsContent value="trends_forecasts" className="dashboard-tab-panel motion-safe:animate-[fadeIn_160ms_ease-out]">
              {trendsDiagnostics ? (
                <>
                  <div className="grid gap-4 md:grid-cols-5">
                    <Card
                      title="MoM Change"
                      metricKey="mom_change"
                      value={formatSignedValue(trendsTopMetrics?.mom.value ?? null, 'pp', 1)}
                      subtitle={trendsDiagnostics.periodComparisons.momPct === null ? EMPTY_COPY.insufficientHistory : `${trendsDiagnostics.periodComparisons.momPct > 0 ? '+' : ''}${trendsDiagnostics.periodComparisons.momPct}%`}
                    />
                    <Card
                      title="QoQ Change"
                      metricKey="qoq_change"
                      value={formatSignedValue(trendsTopMetrics?.qoq.value ?? null, 'pp', 1)}
                      subtitle={trendsDiagnostics.periodComparisons.qoqPct === null ? EMPTY_COPY.insufficientHistory : `${trendsDiagnostics.periodComparisons.qoqPct > 0 ? '+' : ''}${trendsDiagnostics.periodComparisons.qoqPct}%`}
                    />
                    <Card
                      title="YoY Change"
                      metricKey="yoy_change"
                      value={formatSignedValue(trendsTopMetrics?.yoy.value ?? null, 'pp', 1)}
                      subtitle={trendsDiagnostics.periodComparisons.yoyPct === null ? EMPTY_COPY.insufficientHistory : `${trendsDiagnostics.periodComparisons.yoyPct > 0 ? '+' : ''}${trendsDiagnostics.periodComparisons.yoyPct}%`}
                    />
                    <Card title="YTD Average" metricKey="ytd_average" value={trendsTopMetrics?.ytdAverage.value === null ? '--' : `${trendsTopMetrics.ytdAverage.value}%`} subtitle={trendsTopMetrics?.ytdAverage.base_n ? `Awareness average across ${validPeriodSubtitle(trendsTopMetrics.ytdAverage.base_n)}` : EMPTY_COPY.noValidPeriods} />
                    <Card title="CAGR" metricKey="cagr_trend" value={trendsTopMetrics?.cagr.value === null ? '--' : `${trendsTopMetrics?.cagr.value}%`} subtitle={trendsTopMetrics?.cagr.value === null ? EMPTY_COPY.insufficientHistory : 'Annualized growth rate'} />
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="dashboard-section">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Trend Period Analysis</h3>
                        <SectionInsightsTrigger sectionKey="trend_period_analysis" ctaLabel="View Insights" />
                      </div>
                      <div className="mt-4 space-y-3">
                        {trendsDiagnostics.monthly.map((point) => (
                          <MiniBar key={`trend-month-${point.month}`} label={`${point.month} awareness`} value={point.awareness} color="bg-blue-500" />
                        ))}
                      </div>
                    </div>

                    <div className="dashboard-section">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">BrandEdge Score Over Time</h3>
                      </div>
                      <div className="mt-4 space-y-3">
                        {brandEdgeTrend.map((point) => (
                          <MiniBar key={`brandedge-trend-${point.month}`} label={`${point.month} score`} value={point.score} color="bg-emerald-500" />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="dashboard-section">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Volatility & Pattern Diagnostics</h3>
                        <SectionInsightsTrigger sectionKey="volatility_patterns" ctaLabel="View Insights" />
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <Card
                          title="Volatility (CV)"
                          metricKey="volatility_cv"
                          value={`${trendsDiagnostics.volatility.cv}%`}
                          subtitle={trendsDiagnostics.volatility.label}
                        />
                        <Card title="Stability Score" metricKey="stability_score" value={trendsDiagnostics.volatility.stabilityScore} subtitle={`${trendsDiagnostics.volatility.reversals} directional reversals`} />
                        <Card title="Range" value={`${trendsDiagnostics.volatility.range}pp`} subtitle={`Std Dev ${trendsDiagnostics.volatility.stdDev}`} />
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <Card title="Seasonal Index (Current Month)" value={trendsDiagnostics.seasonality.currentMonthIndex === null ? '--' : trendsDiagnostics.seasonality.currentMonthIndex} subtitle="100 = average month" />
                        <Card title="Strongest Month" value={trendsDiagnostics.seasonality.strongestMonth || '--'} subtitle="Highest seasonal index" />
                        <Card title="Weakest Month" value={trendsDiagnostics.seasonality.weakestMonth || '--'} subtitle="Lowest seasonal index" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="dashboard-section">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Forecast Methods</h3>
                        <SectionInsightsTrigger sectionKey="forecast_methods" ctaLabel="View Insights" />
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <Card title="Simple MA (Next)" value={trendsDiagnostics.forecast.smaNext === null ? '--' : `${trendsDiagnostics.forecast.smaNext}%`} subtitle={trendsDiagnostics.forecast.smaNext === null ? EMPTY_COPY.forecastUnavailable : '3-month moving average'} />
                        <Card title="Weighted MA (Next)" value={trendsDiagnostics.forecast.wmaNext === null ? '--' : `${trendsDiagnostics.forecast.wmaNext}%`} subtitle={trendsDiagnostics.forecast.wmaNext === null ? EMPTY_COPY.forecastUnavailable : 'Weights 0.2, 0.3, 0.5'} />
                        <Card title="Regression (Next)" metricKey="forecast_regression" value={trendsDiagnostics.forecast.regressionNext === null ? '--' : `${trendsDiagnostics.forecast.regressionNext}%`} subtitle={trendsDiagnostics.forecast.regressionR2 === null ? firstStatusNote(trendsTopMetrics?.mom.notes, EMPTY_COPY.forecastUnavailable) : `R² ${trendsDiagnostics.forecast.regressionR2}`} />
                        <Card title="Exponential Smoothing (Next)" value={trendsDiagnostics.forecast.expSmoothingNext === null ? '--' : `${trendsDiagnostics.forecast.expSmoothingNext}%`} subtitle={trendsDiagnostics.forecast.expSmoothingNext === null ? EMPTY_COPY.forecastUnavailable : 'Alpha 0.3'} />
                        <Card title="Seasonal Forecast (Next)" value={trendsDiagnostics.forecast.seasonalAdjustedNext === null ? '--' : `${trendsDiagnostics.forecast.seasonalAdjustedNext}%`} subtitle={trendsDiagnostics.forecast.seasonalAdjustedNext === null ? EMPTY_COPY.forecastUnavailable : 'Regression × seasonal index'} />
                        <Card title="Confidence Band (95%)" metricKey="forecast_confidence" value={trendsDiagnostics.forecast.confidenceLow === null || trendsDiagnostics.forecast.confidenceHigh === null ? '--' : `${trendsDiagnostics.forecast.confidenceLow}% to ${trendsDiagnostics.forecast.confidenceHigh}%`} subtitle={trendsDiagnostics.forecast.confidenceLow === null || trendsDiagnostics.forecast.confidenceHigh === null ? EMPTY_COPY.forecastUnavailable : 'Forecast uncertainty range'} />
                      </div>
                    </div>

                    <div className="dashboard-section">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Signal vs Noise</h3>
                        <SectionInsightsTrigger sectionKey="signal_noise" ctaLabel="View Insights" />
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <Card
                          title="Trend Slope"
                          metricKey="trend_signal"
                          value={trendsDiagnostics.signal.slope === null ? '--' : `${trendsDiagnostics.signal.slope}pp / month`}
                          subtitle="Linear trend slope"
                        />
                        <Card title="Signal Status" metricKey="trend_signal" value={trendsDiagnostics.signal.isSignificantSignal ? 'Signal' : 'No strong signal'} subtitle="Based on volatility threshold" />
                        <Card title="Average Growth" value={trendsDiagnostics.growth.averageGrowthPct === null ? '--' : `${trendsDiagnostics.growth.averageGrowthPct}%`} subtitle={trendsDiagnostics.growth.exponentialSignal ? 'Accelerating pattern detected' : 'No exponential acceleration'} />
                      </div>
                      <p className="mt-4 text-sm text-slate-300">{trendsDiagnostics.signal.diagnosis}</p>
                    </div>
                  </div>

                  <div className="mt-6 dashboard-section">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Actionable Highlights</h3>
                      <SectionInsightsTrigger sectionKey="forecast_methods" ctaLabel="View Insights" />
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {trendsDiagnostics.highlights.map((item) => (
                        <div key={item} className="rounded-xl border border-white/10 bg-slate-900/50 p-3 text-sm text-slate-300">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="dashboard-section dashboard-diagnostic">
                  Trends and forecasts are unavailable for the current filter scope.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {loadingResponses ? <p className="mt-4 text-sm text-slate-400">Loading live responses…</p> : null}
      </main>

      <button
        type="button"
        onClick={() => handleOpenAdvisor(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-xl shadow-blue-950/60 hover:bg-blue-500"
      >
        <BotMessageSquare className="h-4 w-4" />
        Ask Strategy Advisor
      </button>

      <Sheet open={advisorOpen} onOpenChange={handleOpenAdvisor}>
        <SheetContent side="right" className="w-full overflow-hidden border-white/10 bg-slate-950 p-0 text-white sm:max-w-xl">
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b border-white/10 px-5 py-4 text-left">
              <SheetTitle className="flex items-center gap-2 text-base text-white">
                <Sparkles className="h-4 w-4 text-blue-300" />
                AI Strategy Advisor
              </SheetTitle>
              <SheetDescription className="text-xs text-slate-400">
                Executive-level structured insight
              </SheetDescription>
              <p className="text-[11px] uppercase tracking-widest text-slate-400">
                {advisorUsage.used} / {advisorUsage.limit} Strategy Queries Used
              </p>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {advisorMessages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/40 p-4 text-sm text-slate-300">
                  Ask a strategy question about current dashboard performance. The advisor uses the current country, period, filters, and module metrics.
                </div>
              ) : null}
              <div className="space-y-3">
                {advisorMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-2xl p-3 text-sm ${
                      message.role === 'user'
                        ? 'ml-8 border border-blue-500/30 bg-blue-500/10 text-blue-100'
                        : message.role === 'assistant'
                          ? 'mr-8 border border-white/10 bg-slate-900/60 text-slate-200'
                          : 'border border-slate-300 bg-slate-100 text-slate-600'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 px-5 py-4">
              {AI_ADVISOR_PLACEHOLDER_MODE ? (
                <div className="mb-3 rounded-xl border border-slate-300 bg-slate-100 p-3 text-xs text-slate-600">
                  {AI_ADVISOR_PLACEHOLDER_TEXT}
                </div>
              ) : null}
              {advisorError ? <p className="mb-2 text-xs text-rose-300">{advisorError}</p> : null}
              <div className="flex items-end gap-2">
                <textarea
                  value={advisorQuestion}
                  onChange={(event) => setAdvisorQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void handleSubmitAdvisorQuestion();
                    }
                  }}
                  rows={3}
                  placeholder={
                    AI_ADVISOR_PLACEHOLDER_MODE
                      ? 'AI Advisor is temporarily unavailable. Upgrade pending.'
                      : 'Ask about performance, risks, priorities, or competitor position...'
                  }
                  disabled={AI_ADVISOR_PLACEHOLDER_MODE}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => void handleSubmitAdvisorQuestion()}
                  disabled={AI_ADVISOR_PLACEHOLDER_MODE || advisorLoading || !advisorQuestion.trim() || advisorUsage.used >= advisorUsage.limit}
                  className="rounded-2xl bg-blue-600 p-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Send strategy query"
                >
                  {advisorLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadExecutiveBrief()}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-200 hover:border-blue-500"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  Download Executive Strategy Brief
                </button>
                <button
                  type="button"
                  onClick={resetAdvisorSession}
                  className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:border-blue-500"
                >
                  Start New Session
                </button>
              </div>
              <p className="mt-2 text-[10px] text-slate-500">
                Session limits: max 5 follow-up questions, 20-minute inactivity timeout, and 800-word response cap.
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={upgradeModalMode !== null} onOpenChange={(open) => setUpgradeModalMode(open ? upgradeModalMode : null)}>
        <DialogContent className="border-white/10 bg-slate-950 text-slate-100 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm uppercase tracking-widest">
              <Lock className="h-4 w-4 text-slate-500" />
              {upgradeModalMode === 'ai' ? 'Activate AI Strategy Advisor Add-On' : 'Upgrade Subscription'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-300">
            {upgradeModalMode === 'ai'
              ? 'AI Strategy Advisor is available only with the AI Strategy Advisor Add-On on top of Standard.'
              : 'This feature is restricted on the Free tier. Upgrade to Standard or add the AI add-on as needed.'}
          </p>
          <div className="mt-2 overflow-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-slate-900/60 text-[10px] uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-3 py-2">Feature</th>
                  <th className="px-3 py-2">Free</th>
                  <th className="px-3 py-2">Standard</th>
                  <th className="px-3 py-2">AI Add-On</th>
                </tr>
              </thead>
              <tbody>
                {SUBSCRIPTION_FEATURE_ROWS.map((row) => (
                  <tr key={row.feature} className="border-t border-white/10">
                    <td className="px-3 py-2">{row.feature}</td>
                    <td className="px-3 py-2">{row.free}</td>
                    <td className="px-3 py-2">{row.standard}</td>
                    <td className="px-3 py-2">{row.ai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setUpgradeModalMode(null);
              }}
              className="rounded-full border border-blue-500/40 bg-blue-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-blue-200 hover:border-blue-400"
            >
              Upgrade to Standard
            </button>
            <button
              type="button"
              onClick={() => {
                setUpgradeModalMode(null);
              }}
              className="rounded-full border border-slate-400/40 bg-slate-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-slate-200 hover:border-slate-300"
            >
              Add AI Strategy Advisor
            </button>
            <button
              type="button"
              onClick={() => setUpgradeModalMode(null)}
              className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-slate-300 hover:border-blue-500"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriberDashboardPage;
