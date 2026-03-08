import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { BotMessageSquare, ChevronRight, CircleHelp, FileDown, Loader2, Lock, Palette, Send, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { useAuth } from '@/auth/context';
import { hasPermission } from '@/auth/types';
import { BANKS, COUNTRY_CHOICES } from '@/constants';
import { CountryCode, SurveyResponse } from '@/types';
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
import {
  BankMetrics,
  DemographicSummary,
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
  computeMomentumDiagnostics,
  computeTrendForecastDiagnostics,
  computeUsageDiagnostics,
  computeTrendSeries,
  filterResponsesForDashboard,
} from '@/utils/subscriberDashboard';

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

const Sparkline: React.FC<{ values?: number[]; accent?: 'blue' | 'green' | 'red' | 'amber' }> = ({ values, accent = 'blue' }) => {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const safeRange = max - min || 1;
  const points = values.map((value, idx) => {
    const x = (idx / Math.max(values.length - 1, 1)) * 100;
    const y = 100 - ((value - min) / safeRange) * 100;
    return `${x},${y}`;
  }).join(' ');
  const strokeColor = accent === 'green'
    ? ACCENT_POSITIVE
    : accent === 'red'
      ? ACCENT_NEGATIVE
      : ACCENT_PRIMARY;
  return (
    <svg viewBox="0 0 100 100" className="h-7 w-20">
      <polyline fill="none" stroke={strokeColor} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" points={points} />
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

const MiniBar: React.FC<{ label: string; value: number; color?: string }> = ({ label, value, color = 'bg-blue-500' }) => (
  <div className="rounded-xl bg-slate-100 p-2.5">
    <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
      <span>{label}</span>
      <span className="font-semibold text-slate-800">{value}%</span>
    </div>
    <div className="h-2 rounded-full bg-slate-200">
      <div
        className="h-2 rounded-full"
        style={{
          width: `${Math.min(Math.max(value, 0), 100)}%`,
          backgroundColor: color.includes('rose') ? ACCENT_NEGATIVE : color.includes('emerald') ? ACCENT_POSITIVE : ACCENT_PRIMARY,
        }}
      />
    </div>
  </div>
);

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
  const [dataSource, setDataSource] = useState<'firestore' | 'local'>('firestore');
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
      setLoadingResponses(true);
      try {
        const live = await responseService.listResponses();
        setResponses(live);
        setDataSource('firestore');
      } catch {
        setResponses(getResponses());
        setDataSource('local');
      } finally {
        setLoadingResponses(false);
      }
    };
    loadResponses();
  }, []);

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
      setCompareBankId(countryBanks[1]?.id || countryBanks[0].id);
    }
  }, [countryBanks]);

  const filters: SubscriberFilters | null = activeCountry && selectedBankId
    ? {
        country: activeCountry,
        bankId: selectedBankId,
        ageGroups,
        genders,
        timeWindow,
      }
    : null;

  const scopedResponses = useMemo(() => {
    if (!filters) return [];
    return filterResponsesForDashboard(responses, filters);
  }, [responses, filters]);

  const scopedNoTimeResponses = useMemo(() => {
    if (!activeCountry) return [];
    return responses.filter((response) => {
      const country = (response.selected_country || response.country || null) as CountryCode | null;
      if (!country || country !== activeCountry) return false;
      if (ageGroups.length > 0 && (!response.b2_age || !ageGroups.includes(response.b2_age))) return false;
      if (genders.length > 0 && (!response.gender || !genders.includes(response.gender))) return false;
      return true;
    });
  }, [responses, activeCountry, ageGroups, genders]);

  const trend: TrendPoint[] = useMemo(
    () => (selectedBankId ? computeTrendSeries(scopedResponses, selectedBankId, 6) : []),
    [scopedResponses, selectedBankId],
  );

  const selectedMetrics: BankMetrics | null = useMemo(() => {
    if (!selectedBankId) return null;
    const previousAwareness = trend.length > 1 ? trend[trend.length - 2].awareness : 0;
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

  const momentumDiagnostics: MomentumDiagnostics | null = useMemo(
    () => (activeCountry && selectedBankId
      ? computeMomentumDiagnostics(scopedResponses, scopedNoTimeResponses, activeCountry, selectedBankId, 6)
      : null),
    [scopedResponses, scopedNoTimeResponses, activeCountry, selectedBankId],
  );

  const competitiveDiagnostics: CompetitiveIntelligenceDiagnostics | null = useMemo(
    () => (activeCountry && selectedBankId
      ? computeCompetitiveIntelligenceDiagnostics(scopedResponses, scopedNoTimeResponses, activeCountry, selectedBankId)
      : null),
    [scopedResponses, scopedNoTimeResponses, activeCountry, selectedBankId],
  );

  const trendsDiagnostics: TrendForecastDiagnostics | null = useMemo(
    () => (selectedBankId ? computeTrendForecastDiagnostics(scopedNoTimeResponses, selectedBankId, 12) : null),
    [scopedNoTimeResponses, selectedBankId],
  );

  const awarenessRankRows = useMemo(() => {
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
  }, [scopedResponses, scopedNoTimeResponses, activeCountry, countryBanks]);

  const selectedAwarenessRow = useMemo(
    () => awarenessRankRows.find((row) => row.bankId === selectedBankId) || null,
    [awarenessRankRows, selectedBankId],
  );

  const awarenessShareIndex = useMemo(() => {
    const totalAwareness = awarenessRankRows.reduce((sum, row) => sum + row.awareness, 0);
    if (totalAwareness <= 0 || !selectedMetrics) return 0;
    return Math.round((selectedMetrics.aware / totalAwareness) * 100);
  }, [awarenessRankRows, selectedMetrics]);

  const awarenessDepthScore = useMemo(() => {
    if (!selectedMetrics) return 0;
    const aidedOnly = Math.max(selectedMetrics.aided - selectedMetrics.spontaneous, 0);
    const score = (selectedMetrics.topOfMind * 3 + selectedMetrics.spontaneous * 2 + aidedOnly) / 3;
    return Math.round(score);
  }, [selectedMetrics]);

  const demographicSummary: DemographicSummary = useMemo(
    () => computeDemographics(scopedResponses),
    [scopedResponses],
  );

  const demographicDiagnostics: DemographicDiagnostics | null = useMemo(
    () => (selectedBankId ? computeDemographicDiagnostics(scopedResponses, selectedBankId) : null),
    [scopedResponses, selectedBankId],
  );

  const periodLabel = useMemo(() => TIME_WINDOWS.find((window) => window.id === timeWindow)?.label || 'All data', [timeWindow]);

  const heroConfig = useMemo(() => {
    switch (section) {
      case 'awareness_consideration':
        return {
          label: 'Awareness Intelligence',
          score: `${selectedMetrics?.aware || 0}%`,
          delta: awarenessDeltas.awareness,
          summary: 'Awareness trajectory and conversion quality for executive tracking.',
          rightCards: [
            { label: 'Top of Mind', value: `${selectedMetrics?.topOfMind || 0}%`, tone: (awarenessDeltas.topOfMind || 0) > 0 ? 'positive' as const : (awarenessDeltas.topOfMind || 0) < 0 ? 'negative' as const : 'neutral' as const },
            { label: 'Spontaneous Recall', value: `${selectedMetrics?.spontaneous || 0}%`, tone: (awarenessDeltas.spontaneous || 0) > 0 ? 'positive' as const : (awarenessDeltas.spontaneous || 0) < 0 ? 'negative' as const : 'neutral' as const },
          ],
        };
      case 'usage_behavior':
        return {
          label: 'Usage Intelligence',
          score: `${usageDiagnostics?.currentUsageRate || 0}%`,
          delta: null,
          summary: 'Current usage efficiency and conversion bottlenecks across the funnel.',
          rightCards: [
            { label: 'Retention', value: `${usageDiagnostics?.retentionRate || 0}%`, tone: (usageDiagnostics?.retentionRate || 0) >= 50 ? 'positive' as const : 'negative' as const },
            { label: 'BUMO', value: `${usageDiagnostics?.bumoPenetration || 0}%`, tone: 'neutral' as const },
          ],
        };
      case 'loyalty_satisfaction':
        return {
          label: 'Loyalty Intelligence',
          score: `${loyaltyDiagnostics?.loyaltyIndex || 0}`,
          delta: loyaltyDiagnostics?.movementRows.find((row) => row.segment === 'Committed')?.deltaPct ?? null,
          summary: 'Loyalty strength, segment quality, and advocacy risk posture.',
          rightCards: [
            { label: 'NPS', value: `${loyaltyDiagnostics?.nps || 0}`, tone: (loyaltyDiagnostics?.nps || 0) >= 0 ? 'positive' as const : 'negative' as const },
            { label: 'Rejectors', value: `${loyaltyDiagnostics?.segmentPcts.Rejectors || 0}%`, tone: (loyaltyDiagnostics?.segmentPcts.Rejectors || 0) > 12 ? 'negative' as const : 'neutral' as const },
          ],
        };
      case 'brand_momentum':
        return {
          label: 'Momentum Intelligence',
          score: `${momentumDiagnostics?.score || 0}`,
          delta: momentumDiagnostics?.velocity ?? null,
          summary: 'Forward velocity and momentum durability in current market conditions.',
          rightCards: [
            { label: 'Velocity', value: `${momentumDiagnostics?.velocity > 0 ? '+' : ''}${momentumDiagnostics?.velocity || 0}`, tone: (momentumDiagnostics?.velocity || 0) >= 0 ? 'positive' as const : 'negative' as const },
            { label: 'Volatility', value: `${momentumDiagnostics?.volatilityCv || 0}%`, tone: (momentumDiagnostics?.volatilityCv || 0) > 25 ? 'negative' as const : 'neutral' as const },
          ],
          tone: 'momentum' as const,
        };
      case 'competitive_intelligence':
        return {
          label: 'Competitive Intelligence',
          score: `${competitiveDiagnostics?.marketStructure.marketRows.find((row) => row.bankId === selectedBankId)?.marketShare || 0}%`,
          delta: competitiveDiagnostics?.marketStructure.marketRows.find((row) => row.bankId === selectedBankId)?.marketShareDelta ?? null,
          summary: 'Share defense and competitor pressure mapped for strategic response.',
          rightCards: [
            { label: 'Win Rate', value: `${competitiveDiagnostics?.winLoss.overallWinRate || 0}%`, tone: (competitiveDiagnostics?.winLoss.overallWinRate || 0) >= 50 ? 'positive' as const : 'negative' as const },
            { label: 'HHI', value: `${competitiveDiagnostics?.marketStructure.hhi || 0}`, tone: 'neutral' as const },
          ],
        };
      case 'demographics':
        return {
          label: 'Demographic Intelligence',
          score: `${demographicDiagnostics?.highValueSegments[0]?.score || 0}`,
          delta: null,
          summary: 'High-value cohort concentration and demographic whitespace opportunity.',
          rightCards: [
            { label: 'Top Segment', value: `${demographicDiagnostics?.highValueSegments[0]?.segment || '--'}`, tone: 'neutral' as const },
            { label: 'Priority Gap', value: `${demographicDiagnostics?.opportunities[0]?.usageGap || 0}pp`, tone: (demographicDiagnostics?.opportunities[0]?.usageGap || 0) > 0 ? 'negative' as const : 'neutral' as const },
          ],
        };
      case 'trends_forecasts':
        return {
          label: 'Trend Intelligence',
          score: `${trendsDiagnostics?.forecast.regressionNext || 0}%`,
          delta: trendsDiagnostics?.signal.slope ?? null,
          summary: 'Forecast trajectory, volatility profile, and confidence discipline.',
          rightCards: [
            { label: 'CAGR', value: `${trendsDiagnostics?.growth.cagrPct === null ? '--' : `${trendsDiagnostics.growth.cagrPct}%`}`, tone: (trendsDiagnostics?.growth.cagrPct || 0) >= 0 ? 'positive' as const : 'negative' as const },
            { label: 'Stability', value: `${trendsDiagnostics?.volatility.stabilityScore || 0}`, tone: (trendsDiagnostics?.volatility.stabilityScore || 0) >= 60 ? 'positive' as const : 'negative' as const },
          ],
        };
      case 'overview':
      default:
        return {
          label: 'Composite Brand Health Index',
          score: `${momentumDiagnostics?.score || 0}`,
          delta: momentumDiagnostics?.velocity ?? null,
          summary: 'Executive composite of awareness, usage, loyalty, and momentum signals.',
          rightCards: [
            { label: 'Awareness', value: `${selectedMetrics?.aware || 0}%`, tone: (awarenessDeltas.awareness || 0) >= 0 ? 'positive' as const : 'negative' as const },
            { label: 'NPS', value: `${selectedMetrics?.nps || 0}`, tone: (selectedMetrics?.nps || 0) >= 0 ? 'positive' as const : 'negative' as const },
          ],
          tone: 'default' as const,
        };
    }
  }, [
    section,
    selectedMetrics,
    awarenessDeltas,
    usageDiagnostics,
    loyaltyDiagnostics,
    momentumDiagnostics,
    competitiveDiagnostics,
    demographicDiagnostics,
    trendsDiagnostics,
    selectedBankId,
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
        awareness: selectedMetrics?.aware || 0,
        top_of_mind: selectedMetrics?.topOfMind || 0,
        current_usage: selectedMetrics?.currentUsing || 0,
        bumo: selectedMetrics?.preferred || 0,
        loyalty_index: loyaltyDiagnostics?.loyaltyIndex || 0,
        momentum_score: momentumDiagnostics?.score || 0,
        nps: selectedMetrics?.nps || 0,
        market_share: competitiveDiagnostics?.marketStructure.marketRows.find((row) => row.bankId === selectedBankId)?.marketShare || 0,
        retention_rate: usageDiagnostics?.retentionRate || 0,
        conversion_rate: usageDiagnostics?.trialRate || 0,
      },
      previous_period: {
        awareness_delta_pp: awarenessDeltas.awareness,
        top_of_mind_delta_pp: awarenessDeltas.topOfMind,
        momentum_previous_score: momentumDiagnostics?.competitiveRows.find((row) => row.bankId === selectedBankId)?.previousScore || null,
        market_share_delta_pp: competitiveDiagnostics?.marketStructure.marketRows.find((row) => row.bankId === selectedBankId)?.marketShareDelta || null,
      },
      competitors: {
        ranking: competitiveDiagnostics?.marketStructure.marketRows.slice(0, 6).map((row) => ({
          bank: row.bankName,
          market_share: row.marketShare,
          sov: row.shareOfVoice,
          market_share_delta_pp: row.marketShareDelta,
        })) || [],
        momentum: momentumDiagnostics?.competitiveRows.slice(0, 6).map((row) => ({
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
    selectedMetrics,
    loyaltyDiagnostics,
    momentumDiagnostics,
    competitiveDiagnostics,
    usageDiagnostics,
    awarenessDeltas,
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

  const sampleSize = scopedResponses.length;

  const selectedBankName = countryBanks.find((bank) => bank.id === selectedBankId)?.name || selectedBankId;
  const toggleFilter = (value: string, current: string[], setCurrent: React.Dispatch<React.SetStateAction<string[]>>) => {
    setCurrent((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const exportCurrentView = () => {
    if (!canExport) {
      setUpgradeModalMode('standard');
      return;
    }
    exportToCSV(scopedResponses, `subscriber_dashboard_${activeCountry}_${selectedBankId}`);
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
          response.c6_main_bank === bankId,
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
              Data source: {dataSource === 'firestore' ? 'Live Firestore responses' : 'Local fallback responses'}
            </p>
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
                  onClick={() => navigate(`/admin/survey/${activeCountry}`)}
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
                <Card title="Awareness" variant="primary" value={`${selectedMetrics?.aware || 0}%`} subtitle={`${selectedMetrics?.topOfMind || 0}% top of mind`} delta={awarenessDeltas.awareness} sparklineValues={trend.map((point) => point.awareness)} />
                <Card title="Current Usage" variant="primary" value={`${selectedMetrics?.currentUsing || 0}%`} subtitle={`${selectedMetrics?.preferred || 0}% preferred (BUMO)`} sparklineValues={trend.map((point) => point.current)} />
                <Card title="Loyalty Index" variant="primary" value={loyaltyDiagnostics?.loyaltyIndex || 0} subtitle={`${loyaltyDiagnostics?.segmentPcts.Committed || 0}% committed`} />
                <Card title="Momentum" variant="primary" value={momentumDiagnostics?.score || 0} subtitle={momentumDiagnostics?.status || 'No momentum data available'} delta={momentumDiagnostics?.velocity ?? null} sparklineValues={momentumDiagnostics?.trends.map((point) => point.score)} />
                <Card title="NPS" variant="primary" value={selectedMetrics?.nps || 0} subtitle="Promoters minus detractors" sparklineValues={trend.map((point) => point.nps)} />
                <Card title="Sample Size" variant="secondary" value={`N=${sampleSize}`} subtitle="Filtered respondents" />
              </div>

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
                        <td className="py-2 pr-2">{selectedMetrics?.aware || 0}% awareness</td>
                        <td className="py-2 pr-2">{deltaText(awarenessDeltas.awareness)}</td>
                        <td className="py-2 pr-2">Increase top-of-mind conversion from the awareness base</td>
                        <td className="py-2">
                          <button type="button" onClick={() => requestSection('awareness_consideration')} className="text-blue-300 hover:text-blue-200">View Report</button>
                        </td>
                      </tr>
                      <tr className="border-t border-white/5">
                        <td className="py-2 pr-2">Usage & Behavior</td>
                        <td className="py-2 pr-2">{usageDiagnostics?.retentionRate || 0}% retention</td>
                        <td className="py-2 pr-2">Highest friction: {usageDiagnostics?.highestFrictionStage || 'N/A'}</td>
                        <td className="py-2 pr-2">Reduce drop-off at the highest-friction stage</td>
                        <td className="py-2">
                          <button type="button" onClick={() => requestSection('usage_behavior')} className="text-blue-300 hover:text-blue-200">View Report</button>
                        </td>
                      </tr>
                      <tr className="border-t border-white/5">
                        <td className="py-2 pr-2">Loyalty & Satisfaction</td>
                        <td className="py-2 pr-2">Index {loyaltyDiagnostics?.loyaltyIndex || 0}</td>
                        <td className="py-2 pr-2">{loyaltyDiagnostics?.segmentPcts.Rejectors || 0}% rejectors</td>
                        <td className="py-2 pr-2">Increase committed share by converting potential and favors; reduce rejectors</td>
                        <td className="py-2">
                          <button type="button" onClick={() => requestSection('loyalty_satisfaction')} className="text-blue-300 hover:text-blue-200">View Report</button>
                        </td>
                      </tr>
                      <tr className="border-t border-white/5">
                        <td className="py-2 pr-2">Brand Momentum</td>
                        <td className="py-2 pr-2">{momentumDiagnostics?.score || 0}</td>
                        <td className="py-2 pr-2">{momentumDiagnostics?.velocityLabel || 'N/A'}</td>
                        <td className="py-2 pr-2">Prioritize the highest-ROI momentum driver gap</td>
                        <td className="py-2">
                          <button type="button" onClick={() => requestSection('brand_momentum')} className="text-blue-300 hover:text-blue-200">View Report</button>
                        </td>
                      </tr>
                      <tr className="border-t border-white/5">
                        <td className="py-2 pr-2">Competitive Intelligence</td>
                        <td className="py-2 pr-2">{competitiveDiagnostics?.marketStructure.marketRows.find((row) => row.bankId === selectedBankId)?.marketShare || 0}% market share</td>
                        <td className="py-2 pr-2">Win Rate {competitiveDiagnostics?.winLoss.overallWinRate || 0}%</td>
                        <td className="py-2 pr-2">Defend against the highest-likelihood competitor threat</td>
                        <td className="py-2">
                          <button type="button" onClick={() => requestSection('competitive_intelligence')} className="text-blue-300 hover:text-blue-200">View Report</button>
                        </td>
                      </tr>
                      <tr className="border-t border-white/5">
                        <td className="py-2 pr-2">Demographics</td>
                        <td className="py-2 pr-2">{demographicDiagnostics?.highValueSegments[0]?.dimension || '-'}: {demographicDiagnostics?.highValueSegments[0]?.segment || '-'}</td>
                        <td className="py-2 pr-2">{demographicDiagnostics?.opportunities[0]?.priority || 'N/A'} priority gap</td>
                        <td className="py-2 pr-2">Target cohorts with the largest usage gap and strongest potential</td>
                        <td className="py-2">
                          <button type="button" onClick={() => requestSection('demographics')} className="text-blue-300 hover:text-blue-200">View Report</button>
                        </td>
                      </tr>
                      <tr className="border-t border-white/5">
                        <td className="py-2 pr-2">Trends & Forecasts</td>
                        <td className="py-2 pr-2">{trendsDiagnostics?.forecast.regressionNext || 0}% next forecast</td>
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
                    <Card variant="diagnostic" title="Funnel Health" value={usageDiagnostics?.positionLabel || 'N/A'} subtitle={usageDiagnostics?.funnelHealthDiagnosis || 'No usage diagnosis'} />
                    <Card variant="diagnostic" title="Top Threat" value={competitiveDiagnostics?.threats.rows[0]?.competitorBankName || 'N/A'} subtitle={competitiveDiagnostics?.threats.rows[0]?.threatLevel || 'No threat score'} />
                    <Card variant="diagnostic" title="Forecast Confidence" value={trendsDiagnostics?.forecast.confidenceLow === null || trendsDiagnostics?.forecast.confidenceHigh === null ? 'N/A' : `${trendsDiagnostics?.forecast.confidenceLow}% - ${trendsDiagnostics?.forecast.confidenceHigh}%`} subtitle="95% confidence range" />
                    <Card variant="diagnostic" title="Primary Gap Cohort" value={demographicDiagnostics?.opportunities[0]?.segment || 'N/A'} subtitle={`${demographicDiagnostics?.opportunities[0]?.dimension || 'N/A'} | ${demographicDiagnostics?.opportunities[0]?.usageGap || 0}pp`} />
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
                        Highlights will populate when enough trend data is available.
                      </div>
                    ) : null}
                  </div>
                </details>
              </div>
            </TabsContent>

            <TabsContent value="awareness_consideration" className="dashboard-tab-panel motion-safe:animate-[fadeIn_160ms_ease-out]">
              <div className="grid gap-4 md:grid-cols-4">
                <Card title="Top of Mind" metricKey="top_of_mind" variant="primary" value={`${selectedMetrics?.topOfMind || 0}%`} subtitle={deltaText(awarenessDeltas.topOfMind)} delta={awarenessDeltas.topOfMind} sparklineValues={trend.map((point) => point.topOfMind)} />
                <Card title="Spontaneous Recall" metricKey="spontaneous_recall" variant="primary" value={`${selectedMetrics?.spontaneous || 0}%`} subtitle={deltaText(awarenessDeltas.spontaneous)} delta={awarenessDeltas.spontaneous} sparklineValues={trend.map((point) => point.spontaneous)} />
                <Card title="Total Awareness" metricKey="total_awareness" variant="primary" value={`${selectedMetrics?.aware || 0}%`} subtitle={deltaText(awarenessDeltas.awareness)} delta={awarenessDeltas.awareness} sparklineValues={trend.map((point) => point.awareness)} />
                <Card title="Awareness Quality" metricKey="awareness_quality" variant="primary" value={`${selectedMetrics?.awarenessQuality || 0}%`} subtitle={`Top-of-Mind / aware · ${deltaText(awarenessDeltas.quality)}`} delta={awarenessDeltas.quality} />
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <Card title="Share of Voice" metricKey="share_of_voice" value={`${selectedAwarenessRow?.shareOfVoice || 0}%`} subtitle="Top-of-Mind share in market" />
                <Card title="MoM Growth" metricKey="mom_growth" value={pctGrowthValue(awarenessMoMGrowthPct)} subtitle={pctGrowthText(awarenessMoMGrowthPct)} />
                <Card title="Awareness Share Index" metricKey="awareness_share_index" value={`${awarenessShareIndex}%`} subtitle="Your awareness / total market awareness" />
                <Card title="Awareness Depth Score" metricKey="awareness_depth_score" value={`${awarenessDepthScore}/100`} subtitle="Weighted: ToM×3 + Spontaneous×2 + AidedOnly×1" />
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
                        { label: 'Aware', value: selectedMetrics?.aware || 0, color: ACCENT_PRIMARY },
                        { label: 'Spontaneous', value: selectedMetrics?.spontaneous || 0, color: '#6A78A8' },
                        { label: 'Top of Mind', value: selectedMetrics?.topOfMind || 0, color: '#4B8A93' },
                        { label: 'Aided', value: selectedMetrics?.aided || 0, color: '#4B8A93' },
                      ]}
                    />
                  </div>
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
                </div>
              </div>
              <div className="mt-6 dashboard-section">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Future Intent & Consideration</h3>
                  <SectionInsightsTrigger sectionKey="future_intent_consideration" ctaLabel="View Insights" />
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-4">
                  <Card title="Average Intent (0-10)" metricKey="avg_intent" value={intentSummary?.averageIntent || 0} subtitle="Future intent score" />
                  <Card title="High Intent (7-10)" metricKey="future_consideration_rate" value={`${intentSummary?.highIntentPct || 0}%`} subtitle={`Base: ${intentSummary?.responseBase || 0} aware respondents`} />
                  <Card title="High Intent Non-Users" metricKey="high_intent_non_users" value={`${intentSummary?.highIntentNonUserPct || 0}%`} subtitle={`${intentSummary?.highIntentNonUserCount || 0} respondents`} />
                  <Card title="At-Risk Current Users" metricKey="at_risk_current_users" value={intentSummary?.lowIntentCurrentUserCount || 0} subtitle="Current users with intent <=6" />
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-5">
                  <MiniBar label="Very High (9-10)" value={intentSummary?.veryHighPct || 0} color="bg-emerald-500" />
                  <MiniBar label="High (7-8)" value={intentSummary?.highPct || 0} color="bg-blue-500" />
                  <MiniBar label="Medium (5-6)" value={intentSummary?.mediumPct || 0} color="bg-amber-500" />
                  <MiniBar label="Low (3-4)" value={intentSummary?.lowPct || 0} color="bg-orange-500" />
                  <MiniBar label="Very Low (0-2)" value={intentSummary?.veryLowPct || 0} color="bg-rose-500" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="usage_behavior" className="dashboard-tab-panel motion-safe:animate-[fadeIn_160ms_ease-out]">
              {usageDiagnostics ? (
                <>
                  <div className="grid gap-4 md:grid-cols-5">
                    <Card title="Ever Used" metricKey="ever_used" variant="primary" value={`${usageDiagnostics.trialRate}%`} subtitle={`${usageDiagnostics.everCount} respondents`} />
                    <Card title="Current Usage" metricKey="current_usage" variant="primary" value={`${usageDiagnostics.currentUsageRate}%`} subtitle={`${usageDiagnostics.currentCount} respondents`} />
                    <Card title="BUMO" metricKey="bumo" variant="primary" value={`${usageDiagnostics.bumoPenetration}%`} subtitle={`${usageDiagnostics.preferredCount} respondents`} />
                    <Card title="Trial Rate" metricKey="trial_rate" variant="primary" value={`${usageDiagnostics.trialRate}%`} subtitle="Aware to ever-used conversion" />
                    <Card title="Lapsed Usage" metricKey="lapsed_usage" value={`${usageDiagnostics.lapseRate}%`} subtitle={`${usageDiagnostics.lapsedUsersCount} lapsed users`} />
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-4">
                    <Card title="Retention" metricKey="retention_rate" value={`${usageDiagnostics.retentionRate}%`} subtitle="Current / ever used" />
                    <Card title="Churn" metricKey="churn_rate" value={`${usageDiagnostics.churnRate}%`} subtitle="100 - retention" />
                    <Card title="Preference Capture" metricKey="preference_rate" value={`${usageDiagnostics.preferenceRate}%`} subtitle="Preferred / current users" />
                    <Card title="Multi-Banking" metricKey="multi_banking_rate" value={`${usageDiagnostics.multiBankingPct}%`} subtitle={`Average banks per user: ${usageDiagnostics.avgBanksPerUser}`} />
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className={`dashboard-section ${(trendsDiagnostics.volatility.label || '').toLowerCase().includes('high') ? 'dashboard-risk-warning' : ''}`}>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Usage Funnel</h3>
                        <SectionInsightsTrigger sectionKey="usage_funnel" ctaLabel="View Insights" />
                      </div>
                      <div className="mt-4">
                        <FunnelSteps
                          steps={[
                            { label: 'Aware', value: 100, color: ACCENT_PRIMARY },
                            { label: 'Ever Used', value: usageDiagnostics.trialRate, color: '#6A78A8' },
                            { label: 'Current', value: usageDiagnostics.currentUsageRate, color: '#4B8A93' },
                            { label: 'Preferred', value: usageDiagnostics.bumoPenetration, color: '#4B8A93' },
                          ]}
                        />
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        Counts: Aware {usageDiagnostics.awareCount} {'->'} Ever {usageDiagnostics.everCount} {'->'} Current {usageDiagnostics.currentCount} {'->'} Preferred {usageDiagnostics.preferredCount}
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
                        <Card title="Average Banks per User" metricKey="avg_banks_per_user" value={usageDiagnostics.avgBanksPerUser} subtitle="Among your current users" />
                        <Card title="Primary in Multi-Bankers" value={`${usageDiagnostics.primaryPositionInMultiPct}%`} subtitle="Your BUMO share among users with 2+ banks" />
                      </div>
                      <div className="mt-4 space-y-3">
                        <MiniBar label="Single-bankers" value={usageDiagnostics.singleBankerPct} color="bg-blue-500" />
                        <MiniBar label="Dual-bankers" value={usageDiagnostics.dualBankerPct} color="bg-violet-500" />
                        <MiniBar label="3+ bank users" value={usageDiagnostics.multiBankerPct} color="bg-cyan-500" />
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
                                <td colSpan={3} className="py-3 text-slate-500">No overlap detected in current filter scope.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="dashboard-section">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Usage-Based Segmentation</h3>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <Card title="Non-Triers" value={usageDiagnostics.nonTriersCount} subtitle={`${Math.round((usageDiagnostics.nonTriersCount / Math.max(usageDiagnostics.awareCount, 1)) * 100)}% of aware`} />
                        <Card title="Lapsed Users" value={usageDiagnostics.lapsedUsersCount} subtitle={`${Math.round((usageDiagnostics.lapsedUsersCount / Math.max(usageDiagnostics.everCount, 1)) * 100)}% of ever-used`} />
                        <Card title="Secondary Users" value={usageDiagnostics.secondaryUsersCount} subtitle={`${Math.round((usageDiagnostics.secondaryUsersCount / Math.max(usageDiagnostics.currentCount, 1)) * 100)}% of current`} />
                        <Card title="Primary Users (BUMO)" value={usageDiagnostics.primaryUsersCount} subtitle={`${usageDiagnostics.preferenceRate}% preference rate`} />
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
                      <p className="mt-2 text-xs text-slate-500">Highest friction stage: {usageDiagnostics.highestFrictionStage}</p>
                    </div>

                    <div className="dashboard-section">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Competitive Usage Insights</h3>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <Card title="Position Matrix" metricKey="position_matrix" value={usageDiagnostics.positionLabel} subtitle={`Usage median ${usageDiagnostics.usageMedian}% · Retention median ${usageDiagnostics.retentionMedian}%`} />
                        <Card title="Growth Opportunity" metricKey="growth_opportunity" value={usageDiagnostics.opportunities[0]?.name || 'None'} subtitle={`${usageDiagnostics.opportunities[0]?.size || 0} respondents`} />
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
                  Usage diagnostics unavailable for the current filter scope.
                </div>
              )}
            </TabsContent>

            <TabsContent value="loyalty_satisfaction" className="dashboard-tab-panel motion-safe:animate-[fadeIn_160ms_ease-out]">
              {loyaltyDiagnostics ? (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card title="Loyalty Index" metricKey="loyalty_index" variant="primary" value={loyaltyDiagnostics.loyaltyIndex} subtitle="0-100 weighted index" />
                    <Card title="NPS" metricKey="nps_loyalty" variant="primary" value={loyaltyDiagnostics.nps} subtitle={`${selectedMetrics?.promoters || 0}% promoters · ${selectedMetrics?.detractors || 0}% detractors`} sparklineValues={trend.map((point) => point.nps)} />
                    <Card title="Committed" metricKey="segment_committed" variant="primary" value={`${loyaltyDiagnostics.segmentPcts.Committed}%`} subtitle={`${loyaltyDiagnostics.segmentCounts.Committed} respondents`} />
                    <Card title="Rejectors" metricKey="segment_rejectors" variant="primary" value={`${loyaltyDiagnostics.segmentPcts.Rejectors}%`} subtitle={`${loyaltyDiagnostics.segmentCounts.Rejectors} respondents`} />
                  </div>

                  <div className="mt-4 dashboard-section">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Loyalty Segmentation Analysis</h3>
                      <SectionInsightsTrigger sectionKey="loyalty_segmentation" ctaLabel="View Insights" />
                    </div>
                    <div className="mt-6 grid gap-4 md:grid-cols-5">
                      <Card title="Committed" metricKey="segment_committed" value={`${loyaltyDiagnostics.segmentPcts.Committed}%`} subtitle="Highest loyalty and advocacy" />
                      <Card title="Favors" metricKey="segment_favors" value={`${loyaltyDiagnostics.segmentPcts.Favors}%`} subtitle="Good loyalty, not fully committed" />
                      <Card title="Potential" metricKey="segment_potential" value={`${loyaltyDiagnostics.segmentPcts.Potential}%`} subtitle="High opportunity pipeline" />
                      <Card title="Accessibles" metricKey="segment_accessibles" value={`${loyaltyDiagnostics.segmentPcts.Accessibles}%`} subtitle="Neutral/open audience" />
                      <Card title="Rejectors" metricKey="segment_rejectors" value={`${loyaltyDiagnostics.segmentPcts.Rejectors}%`} subtitle="Active resistance to adoption" />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="dashboard-section">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Segmentation Decision Tree</h3>
                        <SectionInsightsTrigger sectionKey="decision_tree" ctaLabel="View Insights" />
                      </div>
                      <div className="mt-4 space-y-3">
                        <MiniBar label="Current users -> Committed/Favors path" value={Math.round((loyaltyDiagnostics.segmentCounts.Committed + loyaltyDiagnostics.segmentCounts.Favors) * 100 / Math.max(loyaltyDiagnostics.awareCount, 1))} color="bg-blue-500" />
                        <MiniBar label="Non-current -> Potential/Accessible/Rejector path" value={Math.round((loyaltyDiagnostics.segmentCounts.Potential + loyaltyDiagnostics.segmentCounts.Accessibles + loyaltyDiagnostics.segmentCounts.Rejectors) * 100 / Math.max(loyaltyDiagnostics.awareCount, 1))} color="bg-violet-500" />
                        <MiniBar label="Committed capture among aware" value={loyaltyDiagnostics.segmentPcts.Committed} color="bg-emerald-500" />
                        <MiniBar label="Rejector pressure among aware" value={loyaltyDiagnostics.segmentPcts.Rejectors} color="bg-rose-500" />
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
                            {loyaltyDiagnostics.movementRows.map((row) => (
                              <tr key={row.segment} className="border-t border-white/5">
                                <td className="py-2 pr-2">{row.segment}</td>
                                <td className="py-2 pr-2">{row.previousPct}%</td>
                                <td className="py-2 pr-2">{row.currentPct}%</td>
                                <td className="py-2">{row.deltaPct > 0 ? '+' : ''}{row.deltaPct}%</td>
                              </tr>
                            ))}
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
                          <p className="mt-2 text-2xl font-black text-white">{profile.pct}%</p>
                          <p className="text-xs text-slate-500">{profile.count} respondents</p>
                          <div className="mt-3 space-y-1 text-xs text-slate-300">
                            <p>Average NPS: {profile.avgNps}</p>
                            <p>Average Intent: {profile.avgIntent}</p>
                            <p>Top Age: {profile.topAge}</p>
                            <p>Top Gender: {profile.topGender}</p>
                            <p>Multi-Bank: {profile.multiBankPct}%</p>
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
                      <Card title="Aware" value="100%" subtitle={`${loyaltyDiagnostics.awareCount} aware respondents`} />
                      <Card title="Potential" metricKey="segment_potential" value={`${loyaltyDiagnostics.segmentPcts.Potential}%`} subtitle={`${loyaltyDiagnostics.segmentCounts.Potential} respondents`} />
                      <Card title="Favors" metricKey="segment_favors" value={`${loyaltyDiagnostics.segmentPcts.Favors}%`} subtitle={`${loyaltyDiagnostics.segmentCounts.Favors} respondents`} />
                      <Card title="Committed" metricKey="segment_committed" value={`${loyaltyDiagnostics.segmentPcts.Committed}%`} subtitle={`${loyaltyDiagnostics.segmentCounts.Committed} respondents`} />
                    </div>
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      <Card title="Aware -> Potential" metricKey="loyalty_conversion_funnel" value={`${loyaltyDiagnostics.awareToPotential}%`} subtitle="Conversion rate" />
                      <Card title="Potential -> Favors" metricKey="loyalty_conversion_funnel" value={`${loyaltyDiagnostics.potentialToFavors}%`} subtitle="Conversion rate" />
                      <Card title="Favors -> Committed" metricKey="loyalty_conversion_funnel" value={`${loyaltyDiagnostics.favorsToCommitted}%`} subtitle="Conversion rate" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="dashboard-section dashboard-diagnostic">
                  Loyalty diagnostics unavailable for the current filter scope.
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
                      value={momentumDiagnostics.score}
                      subtitle={`${momentumDiagnostics.status} · ${momentumDiagnostics.strategy}`}
                      delta={momentumDiagnostics.velocity}
                      sparklineValues={momentumDiagnostics.trends.map((point) => point.score)}
                    />
                    <Card
                      title="Awareness Growth Score"
                      metricKey="awareness_growth_score"
                      variant="primary"
                      value={momentumDiagnostics.components.awarenessGrowth}
                      subtitle="Normalized period growth"
                    />
                    <Card
                      title="Consideration"
                      metricKey="consideration_rate_momentum"
                      variant="primary"
                      value={`${momentumDiagnostics.components.consideration}%`}
                      subtitle="Pipeline strength"
                    />
                    <Card
                      title="Conversion"
                      metricKey="conversion_rate_momentum"
                      variant="primary"
                      value={`${momentumDiagnostics.components.conversion}%`}
                      subtitle="Aware -> Ever used"
                    />
                    <Card
                      title="Retention"
                      metricKey="retention_rate_momentum"
                      value={`${momentumDiagnostics.components.retention}%`}
                      subtitle="Ever used -> Current"
                    />
                    <Card
                      title="Adoption"
                      metricKey="adoption_rate_momentum"
                      value={`${momentumDiagnostics.components.adoption}%`}
                      subtitle="Current -> Preferred"
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
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Sensitivity & Investment Prioritization</h3>
                        <SectionInsightsTrigger sectionKey="momentum_drivers" ctaLabel="View Insights" />
                      </div>
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
                          <MiniBar key={point.month} label={`${point.month} (${point.delta === null ? '-' : `${point.delta > 0 ? '+' : ''}${point.delta}`})`} value={point.score} color="bg-indigo-500" />
                        ))}
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <Card title="Velocity" metricKey="momentum_velocity" value={`${momentumDiagnostics.velocity > 0 ? '+' : ''}${momentumDiagnostics.velocity}`} subtitle={momentumDiagnostics.velocityLabel} />
                        <Card title="Volatility" metricKey="volatility_score" value={`${momentumDiagnostics.volatilityCv}%`} subtitle={momentumDiagnostics.volatilityLabel} />
                        <Card
                          title="Trajectory (3M)"
                          metricKey="trajectory_forecast"
                          value={momentumDiagnostics.forecast[momentumDiagnostics.forecast.length - 1]?.projectedScore || 0}
                          subtitle={`${momentumDiagnostics.forecast[0]?.month || ''} to ${momentumDiagnostics.forecast[momentumDiagnostics.forecast.length - 1]?.month || ''}`}
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
                            <p className="mt-1 text-2xl font-black text-white">{point.projectedScore}</p>
                            <p className="text-[11px] text-slate-500">Projected momentum</p>
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
                        value={`${momentumDiagnostics.competitiveRows.find((row) => row.bankId === selectedBankId)?.growthRate ?? 0}%`}
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
                  Momentum diagnostics unavailable for the current filter scope.
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
                      value={`${competitiveDiagnostics.marketStructure.marketRows.find((row) => row.bankId === selectedBankId)?.marketShare || 0}%`}
                      subtitle={selectedBankName}
                    />
                    <Card
                      title="Market Concentration (HHI)"
                      metricKey="market_concentration"
                      value={competitiveDiagnostics.marketStructure.hhi}
                      subtitle={competitiveDiagnostics.marketStructure.concentrationLabel}
                    />
                    <Card
                      title="Average Banks per Customer"
                      metricKey="avg_banks_per_customer_ci"
                      value={competitiveDiagnostics.customerBehavior.averageBanksPerCustomer}
                      subtitle="Active banking customers"
                    />
                    <Card
                      title="Multi-Banking Rate"
                      metricKey="multi_banking_rate_ci"
                      value={`${competitiveDiagnostics.customerBehavior.multiBankingRate}%`}
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
                                <td colSpan={3} className="py-2 text-slate-500">No overlap detected in current scope.</td>
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
                                  <td className="py-2 pr-2">{set?.overlapPct ?? 0}%</td>
                                  <td className="py-2 pr-2">{set?.competitorType ?? 'Indirect'}</td>
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

                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="dashboard-section">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Share of Wallet Analysis</h3>
                        <SectionInsightsTrigger sectionKey="share_wallet_ci" ctaLabel="View Insights" />
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <Card title="Estimated Wallet Share" metricKey="wallet_share_estimation" value={`${competitiveDiagnostics.shareOfWallet.estimatedWalletShare}%`} subtitle="Selected bank wallet capture" />
                        <Card title="Top Wallet Competitor" metricKey="wallet_share_estimation" value={competitiveDiagnostics.shareOfWallet.byCompetitor[0]?.bankName || 'None'} subtitle={`${competitiveDiagnostics.shareOfWallet.byCompetitor[0]?.estimatedWalletShare || 0}% estimated share`} />
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

                    <div className="dashboard-section">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Win/Loss Analysis</h3>
                        <SectionInsightsTrigger sectionKey="win_loss_ci" ctaLabel="View Insights" />
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <Card title="Overall Win Rate" metricKey="win_rate_ci" value={`${competitiveDiagnostics.winLoss.overallWinRate}%`} subtitle="Across mapped competitors" />
                        <Card title="Data Mode" value={competitiveDiagnostics.winLoss.hasPanelTransitions ? 'Observed transitions' : 'Trend proxy'} subtitle={competitiveDiagnostics.winLoss.hasPanelTransitions ? 'Device-linked preferred-bank movement' : 'Built from overlap + share deltas'} />
                      </div>
                      <div className="mt-4 overflow-auto">
                        <table className="w-full text-xs text-slate-300">
                          <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                            <tr>
                              <th className="py-2 pr-2">Competitor</th>
                              <th className="py-2 pr-2">Gained</th>
                              <th className="py-2 pr-2">Lost</th>
                              <th className="py-2 pr-2">Net</th>
                              <th className="py-2">Win Rate</th>
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
                        <Card title="Largest Gap" value={[...competitiveDiagnostics.strengthsWeaknesses.relativeRows].sort((a, b) => a.relativeStrength - b.relativeStrength)[0]?.metric || 'N/A'} subtitle="Lowest relative metric" />
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
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">White Space Opportunities</h3>
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
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Threat Assessment</h3>
                      <SectionInsightsTrigger sectionKey="threat_assessment_ci" ctaLabel="View Insights" />
                    </div>
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <div className="overflow-auto">
                        <table className="w-full text-xs text-slate-300">
                          <thead className="text-[10px] uppercase tracking-widest text-slate-500">
                            <tr>
                              <th className="py-2 pr-2">Competitor</th>
                              <th className="py-2 pr-2">Likelihood</th>
                              <th className="py-2 pr-2">Impact</th>
                              <th className="py-2">Threat Level</th>
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
                              <th className="py-2 pr-2">Threat Indicator</th>
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
                  Competitive diagnostics unavailable for the current filter scope.
                </div>
              )}
            </TabsContent>

            <TabsContent value="demographics" className="dashboard-tab-panel motion-safe:animate-[fadeIn_160ms_ease-out]">
              {demographicDiagnostics ? (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card title="Sample" value={`N=${demographicDiagnostics.sample}`} subtitle="Filtered respondents" />
                    <Card
                      title="Top High-Value Segment"
                      value={`${demographicDiagnostics.highValueSegments[0]?.dimension || '-'}: ${demographicDiagnostics.highValueSegments[0]?.segment || '-'}`}
                      subtitle={`Score ${demographicDiagnostics.highValueSegments[0]?.score || 0}`}
                    />
                    <Card
                      title="Highest Priority Gap"
                      metricKey="demo_gap_score"
                      value={`${demographicDiagnostics.opportunities[0]?.dimension || '-'}: ${demographicDiagnostics.opportunities[0]?.segment || '-'}`}
                      subtitle={`${demographicDiagnostics.opportunities[0]?.usageGap || 0}pp vs best`}
                    />
                    <Card
                      title="Average Segment Multi-Banking"
                      metricKey="demo_multi_banking"
                      value={`${Math.round((demographicDiagnostics.ageRows.reduce((sum, row) => sum + row.multiBankRate, 0) / Math.max(demographicDiagnostics.ageRows.length, 1)) * 10) / 10}%`}
                      subtitle="Across age cohorts"
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
                            {demographicDiagnostics.ageRows.map((row) => (
                              <tr key={`age-row-${row.segment}`} className="border-t border-white/5">
                                <td className="py-2 pr-2">{row.segment}</td>
                                <td className="py-2 pr-2">{row.samplePct}%</td>
                                <td className="py-2 pr-2">{row.awareness}%</td>
                                <td className="py-2 pr-2">{row.currentUsage}%</td>
                                <td className="py-2 pr-2">{row.preferred}%</td>
                                <td className="py-2 pr-2">{row.nps}</td>
                                <td className="py-2">{row.avgIntent}</td>
                              </tr>
                            ))}
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
                            {demographicDiagnostics.genderRows.map((row) => (
                              <tr key={`gender-row-${row.segment}`} className="border-t border-white/5">
                                <td className="py-2 pr-2">{row.segment}</td>
                                <td className="py-2 pr-2">{row.samplePct}%</td>
                                <td className="py-2 pr-2">{row.awareness}%</td>
                                <td className="py-2 pr-2">{row.currentUsage}%</td>
                                <td className="py-2 pr-2">{row.preferred}%</td>
                                <td className="py-2 pr-2">{row.nps}</td>
                                <td className="py-2">{row.multiBankRate}%</td>
                              </tr>
                            ))}
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
                              {demographicDiagnostics.employmentRows.map((row) => (
                                <tr key={`employment-row-${row.segment}`} className="border-t border-white/5">
                                  <td className="py-2 pr-2">{row.segment}</td>
                                  <td className="py-2 pr-2">{row.currentUsage}%</td>
                                  <td className="py-2 pr-2">{row.preferred}%</td>
                                  <td className="py-2">{row.nps}</td>
                                </tr>
                              ))}
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
                              {demographicDiagnostics.educationRows.map((row) => (
                                <tr key={`education-row-${row.segment}`} className="border-t border-white/5">
                                  <td className="py-2 pr-2">{row.segment}</td>
                                  <td className="py-2 pr-2">{row.currentUsage}%</td>
                                  <td className="py-2 pr-2">{row.preferred}%</td>
                                  <td className="py-2">{row.nps}</td>
                                </tr>
                              ))}
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
                            {demographicDiagnostics.opportunities.map((row) => (
                              <tr key={`${row.dimension}-${row.segment}`} className="border-t border-white/5">
                                <td className="py-2 pr-2 capitalize">{row.dimension}</td>
                                <td className="py-2 pr-2">{row.segment}</td>
                                <td className="py-2 pr-2">{row.currentUsage}%</td>
                                <td className="py-2 pr-2">{row.usageGap}pp</td>
                                <td className="py-2 pr-2">{row.nps}</td>
                                <td className="py-2">{row.priority}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">High-Value Segments</p>
                        <div className="mt-2 grid gap-2">
                          {demographicDiagnostics.highValueSegments.map((row) => (
                            <div key={`${row.dimension}-${row.segment}`} className="rounded-xl border border-white/10 bg-slate-900/50 p-2 text-xs text-slate-300">
                              {row.dimension}: {row.segment} | score {row.score} | preferred {row.preferred}% | NPS {row.nps}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="dashboard-section dashboard-diagnostic">
                  Demographic diagnostics unavailable for the current filter scope.
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
                      value={trendsDiagnostics.periodComparisons.momPp === null ? '--' : `${trendsDiagnostics.periodComparisons.momPp > 0 ? '+' : ''}${trendsDiagnostics.periodComparisons.momPp}pp`}
                      subtitle={trendsDiagnostics.periodComparisons.momPct === null ? 'No prior month available' : `${trendsDiagnostics.periodComparisons.momPct > 0 ? '+' : ''}${trendsDiagnostics.periodComparisons.momPct}%`}
                    />
                    <Card
                      title="QoQ Change"
                      metricKey="qoq_change"
                      value={trendsDiagnostics.periodComparisons.qoqPp === null ? '--' : `${trendsDiagnostics.periodComparisons.qoqPp > 0 ? '+' : ''}${trendsDiagnostics.periodComparisons.qoqPp}pp`}
                      subtitle={trendsDiagnostics.periodComparisons.qoqPct === null ? 'Requires two full quarters' : `${trendsDiagnostics.periodComparisons.qoqPct > 0 ? '+' : ''}${trendsDiagnostics.periodComparisons.qoqPct}%`}
                    />
                    <Card
                      title="YoY Change"
                      metricKey="yoy_change"
                      value={trendsDiagnostics.periodComparisons.yoyPp === null ? '--' : `${trendsDiagnostics.periodComparisons.yoyPp > 0 ? '+' : ''}${trendsDiagnostics.periodComparisons.yoyPp}pp`}
                      subtitle={trendsDiagnostics.periodComparisons.yoyPct === null ? 'Requires twelve months' : `${trendsDiagnostics.periodComparisons.yoyPct > 0 ? '+' : ''}${trendsDiagnostics.periodComparisons.yoyPct}%`}
                    />
                    <Card title="YTD Average" metricKey="ytd_average" value={`${trendsDiagnostics.periodComparisons.ytdAverage}%`} subtitle="Awareness average across trend window" />
                    <Card title="CAGR" metricKey="cagr_trend" value={trendsDiagnostics.growth.cagrPct === null ? '--' : `${trendsDiagnostics.growth.cagrPct}%`} subtitle="Annualized growth rate" />
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
                        <Card title="Simple MA (Next)" value={trendsDiagnostics.forecast.smaNext === null ? '--' : `${trendsDiagnostics.forecast.smaNext}%`} subtitle="3-month moving average" />
                        <Card title="Weighted MA (Next)" value={trendsDiagnostics.forecast.wmaNext === null ? '--' : `${trendsDiagnostics.forecast.wmaNext}%`} subtitle="Weights 0.2, 0.3, 0.5" />
                        <Card title="Regression (Next)" metricKey="forecast_regression" value={trendsDiagnostics.forecast.regressionNext === null ? '--' : `${trendsDiagnostics.forecast.regressionNext}%`} subtitle={trendsDiagnostics.forecast.regressionR2 === null ? 'Insufficient fit data' : `R² ${trendsDiagnostics.forecast.regressionR2}`} />
                        <Card title="Exponential Smoothing (Next)" value={trendsDiagnostics.forecast.expSmoothingNext === null ? '--' : `${trendsDiagnostics.forecast.expSmoothingNext}%`} subtitle="Alpha 0.3" />
                        <Card title="Seasonal Forecast (Next)" value={trendsDiagnostics.forecast.seasonalAdjustedNext === null ? '--' : `${trendsDiagnostics.forecast.seasonalAdjustedNext}%`} subtitle="Regression × seasonal index" />
                        <Card title="Confidence Band (95%)" metricKey="forecast_confidence" value={trendsDiagnostics.forecast.confidenceLow === null || trendsDiagnostics.forecast.confidenceHigh === null ? '--' : `${trendsDiagnostics.forecast.confidenceLow}% to ${trendsDiagnostics.forecast.confidenceHigh}%`} subtitle="Forecast uncertainty range" />
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
                          value={`${trendsDiagnostics.signal.slope}pp / month`}
                          subtitle="Linear trend slope"
                        />
                        <Card title="Signal Status" metricKey="trend_signal" value={trendsDiagnostics.signal.isSignificantSignal ? 'Signal' : 'No strong signal'} subtitle="Based on volatility threshold" />
                        <Card title="Average Growth" value={`${trendsDiagnostics.growth.averageGrowthPct}%`} subtitle={trendsDiagnostics.growth.exponentialSignal ? 'Accelerating pattern detected' : 'No exponential acceleration'} />
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
