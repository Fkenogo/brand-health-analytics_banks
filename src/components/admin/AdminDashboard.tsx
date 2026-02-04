import React, { useState, useEffect, useCallback } from 'react';
import { getResponses } from '@/utils/storage';
import { exportToCSV } from '@/utils/export';
import { CountryCode, Language } from '@/types';
import { fetchDashboardMetrics, fetchNPSDrivers, fetchTrendData, fetchCompetitorData, DashboardMetrics, NPSDriver, TrendData, CompetitorData } from '@/utils/api';
import { 
  ArrowLeft, Globe, Loader2, Lock, TrendingUp, TrendingDown, Target as TargetIcon, 
  Activity, Users, Languages, Share2, ChevronDown,
  CheckCircle, Lightbulb, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BANKS, COUNTRY_THEMES, COUNTRY_CHOICES, UI_STRINGS } from '@/constants';
import { AwarenessTab, UsageTab, MomentumTab, LoyaltyTab, SnapshotTab, NPSDriversTab } from './tabs';
import { DashboardFilters, FilterState, ComparisonState } from './DashboardFilters';
import { ComparisonView } from './ComparisonView';

interface AdminDashboardProps {
  onBack: () => void;
  lang: Language;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, lang: initialLang }) => {
  const [lang, setLang] = useState<Language>(initialLang);
  const [activeCountry, setActiveCountry] = useState<CountryCode>('rwanda');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [currentTab, setCurrentTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(null);
  const [npsDrivers, setNpsDrivers] = useState<NPSDriver[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [competitorData, setCompetitorData] = useState<CompetitorData[]>([]);
  
  // Filters state
  const [filters, setFilters] = useState<FilterState>({ ageGroups: [], genders: [], timePeriod: 'all' });
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Comparison state
  const [comparison, setComparison] = useState<ComparisonState>({ enabled: false, compareWithBankId: null });
  const [compareBankData, setCompareBankData] = useState<DashboardMetrics | null>(null);

  const theme = COUNTRY_THEMES[activeCountry];
  const s = UI_STRINGS.admin;

  const toggleLang = () => setLang(l => l === 'en' ? 'rw' : l === 'rw' ? 'fr' : 'en');

  useEffect(() => {
    const cb = BANKS.filter(b => b.country === activeCountry);
    if (cb.length > 0) setSelectedBankId(cb[0].id);
  }, [activeCountry]);

  const load = useCallback(async () => {
    if (!selectedBankId) return;
    setLoading(true);
    
    const filterParams = {
      country: activeCountry,
      ageGroups: filters.ageGroups.length > 0 ? filters.ageGroups : undefined,
      genders: filters.genders.length > 0 ? filters.genders : undefined,
      timePeriod: filters.timePeriod !== 'all' ? filters.timePeriod : undefined
    };
    
    const promises: Promise<any>[] = [
      fetchDashboardMetrics(selectedBankId, filterParams),
      fetchNPSDrivers(selectedBankId),
      fetchTrendData(selectedBankId),
      fetchCompetitorData(activeCountry)
    ];
    
    // If comparison is enabled, also fetch comparison bank data
    if (comparison.enabled && comparison.compareWithBankId) {
      promises.push(fetchDashboardMetrics(comparison.compareWithBankId, filterParams));
    }
    
    const results = await Promise.all(promises);
    setDashboardData(results[0]);
    setNpsDrivers(results[1]);
    setTrendData(results[2]);
    setCompetitorData(results[3]);
    
    if (comparison.enabled && comparison.compareWithBankId && results[4]) {
      setCompareBankData(results[4]);
    } else {
      setCompareBankData(null);
    }
    
    setLoading(false);
  }, [selectedBankId, activeCountry, filters, comparison]);

  useEffect(() => { if (isAuthenticated) load(); }, [isAuthenticated, load]);

  // Calculate demographics from responses
  const calculateDemographics = () => {
    const responses = getResponses().filter(r => r.selected_country === activeCountry);
    const total = responses.length || 1;
    
    // Age distribution
    const ageGroups = {
      '18-24': responses.filter(r => r.b2_age === '18-24').length,
      '25-34': responses.filter(r => r.b2_age === '25-34').length,
      '35-44': responses.filter(r => r.b2_age === '35-44').length,
      '45-54': responses.filter(r => r.b2_age === '45-54').length,
      '55+': responses.filter(r => r.b2_age === '55+').length,
    };
    
    // Gender distribution
    const male = responses.filter(r => r.gender === 'male').length;
    const female = responses.filter(r => r.gender === 'female').length;
    
    return {
      age: Object.entries(ageGroups).map(([range, count]) => ({
        range,
        percentage: Math.round((count / total) * 100)
      })),
      gender: {
        male: Math.round((male / total) * 100),
        female: Math.round((female / total) * 100)
      }
    };
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-card p-10 rounded-[40px] w-full max-w-md text-center">
          <Lock size={48} className="text-primary mx-auto mb-6" />
          <h1 className="text-2xl font-black mb-2 text-foreground">{s.authTitle[lang]}</h1>
          <p className="text-muted-foreground mb-8 uppercase text-[10px] tracking-widest">{s.authDesc[lang]}</p>
          <form onSubmit={(e) => { e.preventDefault(); if(password==='admin2026') setIsAuthenticated(true); else setAuthError(true); }}>
            <input 
              type="password" 
              value={password} 
              onChange={e => { setPassword(e.target.value); setAuthError(false); }} 
              className={`w-full h-14 bg-secondary/50 border rounded-2xl mb-4 px-6 outline-none text-foreground ${authError ? 'border-destructive' : 'border-border'}`} 
            />
            <button type="submit" className="w-full h-14 bg-primary rounded-2xl font-black uppercase text-sm tracking-widest text-primary-foreground">{s.authBtn[lang]}</button>
          </form>
          <button onClick={onBack} className="mt-6 text-[10px] font-black uppercase opacity-40 text-foreground">{UI_STRINGS.back[lang]}</button>
        </div>
      </div>
    );
  }

  // KPI Card Component with trends
  const KpiCard = ({ 
    title, 
    value, 
    rank, 
    change, 
    changeLabel, 
    isPositive = true 
  }: { 
    title: string; 
    value: string | number; 
    rank?: number; 
    change?: number;
    changeLabel?: string;
    isPositive?: boolean;
  }) => (
    <div className="glass-card p-5 rounded-2xl relative overflow-hidden">
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        {rank && (
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${
            rank === 1 ? 'bg-emerald-500 text-white' : 'bg-secondary text-foreground border border-border'
          }`}>
            #{rank}
          </div>
        )}
      </div>
      <div className="text-4xl font-black text-foreground mb-2">{value}</div>
      {change !== undefined && (
        <div className={`flex items-center gap-1.5 text-xs font-medium ${isPositive ? 'text-emerald-500' : 'text-destructive'}`}>
          {isPositive ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
          {change}%
          {changeLabel && <span className="text-muted-foreground ml-1">{changeLabel}</span>}
        </div>
      )}
    </div>
  );

  // Brand Health Trends Chart (mini bar chart)
  const BrandHealthTrends = () => (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-base font-bold text-foreground">Brand Health Trends</h3>
        <span className="text-xs text-muted-foreground">6 months</span>
      </div>
      
      {['Awareness', 'Nps', 'Usage'].map((metric, idx) => {
        const values = trendData.map(d => 
          metric === 'Awareness' ? d.awareness : metric === 'Nps' ? d.nps : d.usage
        );
        const currentValue = values[values.length - 1] || 0;
        
        return (
          <div key={metric} className="mb-5 last:mb-0">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">{metric}</span>
              <span className="text-sm font-bold text-foreground">{currentValue}%</span>
            </div>
            <div className="flex gap-1.5">
              {trendData.map((d, i) => {
                const val = metric === 'Awareness' ? d.awareness : metric === 'Nps' ? d.nps : d.usage;
                const maxVal = Math.max(...values, 100);
                const height = (val / maxVal) * 100;
                return (
                  <div 
                    key={i} 
                    className="flex-1 h-10 rounded-md relative overflow-hidden"
                    style={{ 
                      background: `linear-gradient(to top, hsl(var(--primary)) ${height}%, hsl(var(--accent) / 0.3) ${height}%)`
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  // NPS Distribution Component
  const NPSDistribution = () => {
    const { p, pass, d } = dashboardData?.metrics.nps || { p: 41, pass: 30, d: 29 };
    const total = p + pass + d || 1;
    const promoters = Math.round((p / total) * 100);
    const passives = Math.round((pass / total) * 100);
    const detractors = Math.round((d / total) * 100);
    
    return (
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-base font-bold text-foreground mb-6">NPS Distribution</h3>
        
        {/* Segmented bar */}
        <div className="flex h-8 rounded-lg overflow-hidden mb-4">
          <div 
            className="h-full transition-all duration-500" 
            style={{ width: `${promoters}%`, backgroundColor: '#22C55E' }}
          />
          <div 
            className="h-full transition-all duration-500" 
            style={{ width: `${passives}%`, backgroundColor: '#FACC15' }}
          />
          <div 
            className="h-full transition-all duration-500" 
            style={{ width: `${detractors}%`, backgroundColor: '#EF4444' }}
          />
        </div>
        
        {/* Labels */}
        <div className="flex justify-between text-center">
          <div className="flex-1">
            <div className="text-2xl font-black text-emerald-500">{promoters}%</div>
            <div className="text-xs text-muted-foreground">Promoters (9-10)</div>
          </div>
          <div className="flex-1">
            <div className="text-2xl font-black text-yellow-500">{passives}%</div>
            <div className="text-xs text-muted-foreground">Passives (7-8)</div>
          </div>
          <div className="flex-1">
            <div className="text-2xl font-black text-destructive">{detractors}%</div>
            <div className="text-xs text-muted-foreground">Detractors (0-6)</div>
          </div>
        </div>
      </div>
    );
  };

  // Loyalty Pyramid Component
  const LoyaltyPyramid = () => {
    const loyalty = dashboardData?.metrics.loyalty || {
      committed: 6,
      favors: 26,
      potential: 32,
      rejectors: 5,
      accessibles: 31
    };

    const segments = [
      { label: 'Committed', value: loyalty.committed, color: '#EF4444' },
      { label: 'Favors', value: loyalty.favors, color: '#64748B' },
      { label: 'Potential', value: loyalty.potential, color: '#F59E0B' },
      { label: 'Rejectors', value: loyalty.rejectors, color: '#EF4444' },
      { label: 'Accessibles', value: loyalty.accessibles, color: '#A855F7' },
    ];

    return (
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-base font-bold text-primary mb-6">Loyalty Pyramid</h3>
        <div className="space-y-4">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground w-24">{seg.label}</span>
              <div className="flex-1 h-7 bg-secondary/30 rounded-md overflow-hidden relative">
                <div 
                  className="h-full rounded-md flex items-center px-3 transition-all duration-700"
                  style={{ width: `${Math.max(seg.value, 8)}%`, backgroundColor: seg.color }}
                >
                  <span className="text-xs font-bold text-white">{seg.value}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Customer Demographics Component
  const CustomerDemographics = () => {
    const demographics = calculateDemographics();
    
    const ageColors = ['#A855F7', '#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6'];
    
    return (
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-base font-bold text-primary mb-6">Customer Demographics</h3>
        
        {/* Age Distribution */}
        <div className="mb-6">
          <h4 className="text-sm text-muted-foreground mb-4">Age Distribution</h4>
          <div className="space-y-3">
            {demographics.age.map((item, idx) => (
              <div key={item.range} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-12">{item.range}</span>
                <div className="flex-1 h-6 bg-secondary/30 rounded-md overflow-hidden relative">
                  <div 
                    className="h-full rounded-md flex items-center px-2 transition-all duration-700"
                    style={{ 
                      width: `${Math.max(item.percentage, 6)}%`, 
                      backgroundColor: ageColors[idx] 
                    }}
                  >
                    <span className="text-[10px] font-bold text-white">{item.percentage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Gender Split */}
        <div>
          <h4 className="text-sm text-muted-foreground mb-4">Gender Split</h4>
          <div className="flex justify-around text-center">
            <div>
              <div className="text-3xl font-black text-primary">{demographics.gender.male}%</div>
              <div className="text-xs text-muted-foreground">Male</div>
            </div>
            <div>
              <div className="text-3xl font-black text-accent">{demographics.gender.female}%</div>
              <div className="text-xs text-muted-foreground">Female</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Strategic Insights Component
  const StrategicInsights = () => {
    const nps = dashboardData?.metrics.nps.value || 0;
    const potential = dashboardData?.metrics.loyalty.potential || 0;
    const retention = dashboardData?.metrics.momentum.retention || 0;
    
    const insights = [
      {
        icon: CheckCircle,
        title: 'Strong NPS Performance',
        description: `Your NPS of ${nps} ranks #${dashboardData?.metrics.nps.rank || 2} in the market. Leverage promoters for referral campaigns.`,
        color: 'border-emerald-500/30 bg-emerald-500/5',
        iconColor: 'text-emerald-500'
      },
      {
        icon: Lightbulb,
        title: 'Large Potential Segment',
        description: `${potential}% are interested but uncommitted. Focus on conversion strategies.`,
        color: 'border-yellow-500/30 bg-yellow-500/5',
        iconColor: 'text-yellow-500'
      },
      {
        icon: AlertTriangle,
        title: 'Retention Below Market',
        description: `Your ${retention}% retention trails competitors. Improve customer experience.`,
        color: 'border-destructive/30 bg-destructive/5',
        iconColor: 'text-destructive'
      }
    ];

    return (
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-base font-bold text-primary mb-6">Strategic Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((insight, idx) => (
            <div 
              key={idx} 
              className={`p-4 rounded-xl border ${insight.color}`}
            >
              <insight.icon size={20} className={`${insight.iconColor} mb-3`} />
              <h4 className="text-sm font-bold text-foreground mb-2">{insight.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Competitor Analysis Table Component
  const CompetitorAnalysisTable = () => {
    const getTrendIcon = (trend: number) => {
      if (trend > 0) return <ArrowUpRight size={14} className="text-emerald-500" />;
      if (trend < 0) return <ArrowDownRight size={14} className="text-destructive" />;
      return <Minus size={14} className="text-muted-foreground" />;
    };

    const getNpsColor = (nps: number) => {
      if (nps >= 50) return 'text-emerald-500';
      if (nps >= 0) return 'text-yellow-500';
      return 'text-destructive';
    };

    return (
      <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        {/* Summary Header */}
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl lg:text-2xl font-black text-foreground mb-2">
                Competitive Analysis
              </h2>
              <p className="text-sm text-muted-foreground">
                Comparative overview of all {competitorData.length} banks in {theme.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-[9px] font-black uppercase text-muted-foreground tracking-widest bg-secondary/50 px-4 py-1.5 rounded-full border border-border">
                {competitorData.length} Banks
              </div>
              <div className="text-[9px] font-black uppercase text-muted-foreground tracking-widest bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20 text-emerald-500">
                Live Data
              </div>
            </div>
          </div>
        </div>

        {/* Main Comparison Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-secondary/30">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-12">
                    #
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground min-w-[180px]">
                    Bank
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">
                    Top of Mind
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">
                    Total Awareness
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">
                    NPS
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">
                    Consideration
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">
                    Trend
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitorData.map((bank, idx) => {
                  const isSelected = bank.id === selectedBankId;
                  return (
                    <TableRow 
                      key={bank.id}
                      className={`border-b border-border transition-all cursor-pointer hover:bg-secondary/30 ${
                        isSelected ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                      }`}
                      onClick={() => setSelectedBankId(bank.id)}
                    >
                      <TableCell className="font-black text-muted-foreground">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                          idx === 0 ? 'bg-yellow-500 text-black' : 
                          idx === 1 ? 'bg-slate-400 text-white' : 
                          idx === 2 ? 'bg-amber-700 text-white' : 
                          'bg-secondary text-muted-foreground'
                        }`}>
                          {idx + 1}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-2 h-8 rounded-full" 
                            style={{ 
                              backgroundColor: isSelected ? 'hsl(var(--primary))' : 
                                idx % 4 === 0 ? '#3B82F6' : 
                                idx % 4 === 1 ? '#22C55E' : 
                                idx % 4 === 2 ? '#F59E0B' : '#8B5CF6'
                            }}
                          />
                          <span className={`font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                            {bank.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-black text-foreground">{bank.tom}%</span>
                          <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden mt-1">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${bank.tom}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-lg font-black text-foreground">{bank.total}%</span>
                          <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden mt-1">
                            <div 
                              className="h-full bg-accent rounded-full transition-all duration-500"
                              style={{ width: `${bank.total}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`text-lg font-black ${getNpsColor(bank.nps)}`}>
                          {bank.nps > 0 ? '+' : ''}{bank.nps}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-lg font-black text-foreground">{bank.consideration}%</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {getTrendIcon(bank.trend)}
                          <span className={`text-sm font-bold ${
                            bank.trend > 0 ? 'text-emerald-500' : 
                            bank.trend < 0 ? 'text-destructive' : 'text-muted-foreground'
                          }`}>
                            {bank.trend > 0 ? '+' : ''}{bank.trend.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Loyalty Breakdown Table */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-3">
            <Activity size={20} className="text-primary" />
            Loyalty Segment Distribution
          </h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-secondary/30">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground min-w-[180px]">
                    Bank
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-primary">Committed</span>
                      <span className="text-[8px] text-muted-foreground font-normal">Exclusive</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-indigo-500">Favors</span>
                      <span className="text-[8px] text-muted-foreground font-normal">Preference</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-yellow-500">Potential</span>
                      <span className="text-[8px] text-muted-foreground font-normal">Considering</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-destructive">Rejectors</span>
                      <span className="text-[8px] text-muted-foreground font-normal">Never</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-slate-500">Accessibles</span>
                      <span className="text-[8px] text-muted-foreground font-normal">Unaware</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitorData.slice(0, 10).map((bank) => {
                  const isSelected = bank.id === selectedBankId;
                  return (
                    <TableRow 
                      key={bank.id}
                      className={`border-b border-border transition-all cursor-pointer hover:bg-secondary/30 ${
                        isSelected ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => setSelectedBankId(bank.id)}
                    >
                      <TableCell>
                        <span className={`font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {bank.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-primary">{bank.loyalty.committed}%</span>
                          <div className="w-12 h-1 bg-secondary rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${bank.loyalty.committed * 5}%` }}/>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-indigo-500">{bank.loyalty.favors}%</span>
                          <div className="w-12 h-1 bg-secondary rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${bank.loyalty.favors * 2}%` }}/>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-yellow-500">{bank.loyalty.potential}%</span>
                          <div className="w-12 h-1 bg-secondary rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${bank.loyalty.potential * 2}%` }}/>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-destructive">{bank.loyalty.rejectors}%</span>
                          <div className="w-12 h-1 bg-secondary rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-destructive rounded-full" style={{ width: `${bank.loyalty.rejectors * 5}%` }}/>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-black text-slate-500">{bank.loyalty.accessibles}%</span>
                          <div className="w-12 h-1 bg-secondary rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-slate-500 rounded-full" style={{ width: `${bank.loyalty.accessibles * 2}%` }}/>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Market Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-5 rounded-2xl">
            <div className="text-xs font-medium text-muted-foreground mb-2">Market Leader</div>
            <div className="text-xl font-black text-foreground">{competitorData[0]?.name || '-'}</div>
            <div className="text-sm text-emerald-500 font-bold mt-1">
              {competitorData[0]?.total || 0}% Total Awareness
            </div>
          </div>
          <div className="glass-card p-5 rounded-2xl">
            <div className="text-xs font-medium text-muted-foreground mb-2">Highest NPS</div>
            <div className="text-xl font-black text-foreground">
              {[...competitorData].sort((a, b) => b.nps - a.nps)[0]?.name || '-'}
            </div>
            <div className="text-sm text-emerald-500 font-bold mt-1">
              +{[...competitorData].sort((a, b) => b.nps - a.nps)[0]?.nps || 0} NPS
            </div>
          </div>
          <div className="glass-card p-5 rounded-2xl">
            <div className="text-xs font-medium text-muted-foreground mb-2">Most Considered</div>
            <div className="text-xl font-black text-foreground">
              {[...competitorData].sort((a, b) => b.consideration - a.consideration)[0]?.name || '-'}
            </div>
            <div className="text-sm text-accent font-bold mt-1">
              {[...competitorData].sort((a, b) => b.consideration - a.consideration)[0]?.consideration || 0}% Consideration
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="px-6 lg:px-10 py-8 lg:py-10 bg-background/80 backdrop-blur-2xl sticky top-0 z-50 border-b border-border">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 lg:mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">LIVE DASHBOARD</span>
            </div>
            <h1 className="text-3xl lg:text-5xl font-black tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {s.dashboardTitle[lang]}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground font-medium">
              <span className="text-foreground font-bold">{theme.name} {s.industry[lang]}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5"><Globe size={14}/> {s.updatedLabel[lang]} 2 hours ago</span>
              
              <div className="relative ml-0 lg:ml-4 inline-block group">
                <select 
                  value={activeCountry} 
                  onChange={(e) => setActiveCountry(e.target.value as CountryCode)}
                  className="bg-secondary/50 border border-border rounded-lg px-3 py-1 text-xs font-bold text-foreground appearance-none pr-8 cursor-pointer hover:bg-secondary transition-all"
                >
                  {COUNTRY_CHOICES.map(c => (
                    <option key={c.value} value={c.value}>{c.label[lang]}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" size={14} />
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={toggleLang} className="px-5 py-3 glass-card rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] border-border hover:bg-secondary/50 transition-all">
              <Languages size={14}/> {lang.toUpperCase()}
            </button>
            <DashboardFilters 
              filters={filters}
              onFiltersChange={setFilters}
              comparison={comparison}
              onComparisonChange={setComparison}
              activeCountry={activeCountry}
              selectedBankId={selectedBankId}
              isOpen={filtersOpen}
              onToggle={() => setFiltersOpen(!filtersOpen)}
            />
            <button 
              onClick={() => exportToCSV(getResponses().filter(r => r.selected_country === activeCountry))} 
              className="px-6 lg:px-8 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] shadow-lg shadow-primary/30 active:scale-95 transition-all"
            >
              <Share2 size={14}/> {s.exportReport[lang]}
            </button>
            <button onClick={onBack} className="p-3 bg-destructive/10 text-destructive rounded-2xl border border-destructive/20 hover:bg-destructive/20 transition-all">
              <ArrowLeft />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {filtersOpen && (
          <div className="mt-6">
            <DashboardFilters 
              filters={filters}
              onFiltersChange={setFilters}
              comparison={comparison}
              onComparisonChange={setComparison}
              activeCountry={activeCountry}
              selectedBankId={selectedBankId}
              isOpen={filtersOpen}
              onToggle={() => setFiltersOpen(false)}
            />
          </div>
        )}

        <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 lg:-mx-10 px-6 lg:px-10">
          {BANKS.filter(b => b.country === activeCountry).map((b, i) => (
            <button 
              key={b.id} 
              onClick={() => setSelectedBankId(b.id)} 
              className={`flex-shrink-0 min-w-[160px] lg:min-w-[180px] h-14 lg:h-16 rounded-2xl text-left px-4 lg:px-6 relative transition-all duration-300 group ${
                selectedBankId === b.id 
                  ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02] z-10' 
                  : 'bg-card border border-border text-foreground hover:bg-secondary/50'
              }`}
            >
              <div className="flex items-center gap-3 relative z-10">
                {selectedBankId !== b.id && (
                  <div className="absolute -left-4 lg:-left-6 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full" 
                       style={{ backgroundColor: i % 4 === 0 ? '#3B82F6' : i % 4 === 1 ? '#FACC15' : i % 4 === 2 ? '#22C55E' : '#A78BFA' }} 
                  />
                )}
                <span className="text-xs lg:text-sm font-black tracking-tight">{b.name.split(' (')[0]}</span>
              </div>
              {selectedBankId !== b.id && (
                 <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-border to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          ))}
        </div>

        <nav className="flex gap-6 lg:gap-10 mt-8 lg:mt-10 border-b border-border overflow-x-auto -mx-6 lg:-mx-10 px-6 lg:px-10">
          {(Object.keys(s.tabs) as Array<keyof typeof s.tabs>).map(key => (
            <button 
              key={key} 
              onClick={() => setCurrentTab(key)} 
              className={`pb-4 lg:pb-5 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.15em] lg:tracking-[0.2em] relative transition-all whitespace-nowrap ${currentTab === key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'}`}
            >
              {s.tabs[key][lang]}
              {currentTab === key && (
                <div className="absolute bottom-0 inset-x-0 h-1 bg-primary rounded-t-full shadow-[0_0_12px_hsl(var(--primary)/0.6)]" />
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="px-6 lg:px-10 pt-8 lg:pt-10">
        {loading ? (
          <div className="py-40 lg:py-60 text-center">
            <Loader2 size={48} className="animate-spin mx-auto text-primary mb-6" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Syncing Intelligence...</span>
          </div>
        ) : comparison.enabled && compareBankData ? (
          <ComparisonView
            bankAData={dashboardData}
            bankBData={compareBankData}
            bankAName={BANKS.find(b => b.id === selectedBankId)?.name.split(' (')[0] || ''}
            bankBName={BANKS.find(b => b.id === comparison.compareWithBankId)?.name.split(' (')[0] || ''}
          />
        ) : currentTab === 'competitive' ? (
          <CompetitorAnalysisTable />
        ) : currentTab === 'awareness' ? (
          <AwarenessTab 
            dashboardData={dashboardData}
            competitorData={competitorData}
            trendData={trendData}
            selectedBankName={BANKS.find(b => b.id === selectedBankId)?.name.split(' (')[0] || ''}
          />
        ) : currentTab === 'usage' ? (
          <UsageTab 
            dashboardData={dashboardData}
            competitorData={competitorData}
            selectedBankName={BANKS.find(b => b.id === selectedBankId)?.name.split(' (')[0] || ''}
          />
        ) : currentTab === 'momentum' ? (
          <MomentumTab 
            dashboardData={dashboardData}
            trendData={trendData}
            competitorData={competitorData}
            selectedBankName={BANKS.find(b => b.id === selectedBankId)?.name.split(' (')[0] || ''}
          />
        ) : currentTab === 'loyalty' ? (
          <LoyaltyTab 
            dashboardData={dashboardData}
            competitorData={competitorData}
            selectedBankName={BANKS.find(b => b.id === selectedBankId)?.name.split(' (')[0] || ''}
          />
        ) : currentTab === 'snapshot' ? (
          <SnapshotTab 
            dashboardData={dashboardData}
            selectedBankName={BANKS.find(b => b.id === selectedBankId)?.name.split(' (')[0] || ''}
            sampleSize={dashboardData?.sampleSize || 0}
          />
        ) : currentTab === 'nps' ? (
          <NPSDriversTab 
            dashboardData={dashboardData}
            npsDrivers={npsDrivers}
            selectedBankName={BANKS.find(b => b.id === selectedBankId)?.name.split(' (')[0] || ''}
          />
        ) : (
          <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
              <KpiCard 
                title="Top-of-Mind Awareness" 
                value={`${dashboardData?.metrics.topOfMind.value}%`} 
                rank={dashboardData?.metrics.topOfMind.rank}
                change={dashboardData?.metrics.topOfMind.change}
                changeLabel="First mention recall"
              />
              <KpiCard 
                title="Net Promoter Score" 
                value={dashboardData?.metrics.nps.value ?? 0} 
                rank={dashboardData?.metrics.nps.rank}
                change={2}
                changeLabel="Customer advocacy"
                isPositive={false}
              />
              <KpiCard 
                title="Brand Momentum" 
                value={`${dashboardData?.metrics.momentum.value}%`} 
                rank={dashboardData?.metrics.momentum.rank}
                change={2.1}
                changeLabel="Marketing efficiency"
              />
              <KpiCard 
                title="Future Consideration" 
                value={`${dashboardData?.metrics.consideration.value}%`} 
                rank={dashboardData?.metrics.consideration.rank}
                change={5}
                changeLabel="Purchase intent"
              />
            </div>

            {/* Brand Health Trends + NPS Distribution */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-6">
              <BrandHealthTrends />
              <NPSDistribution />
            </div>

            {/* Loyalty Pyramid + Customer Demographics */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-6">
              <LoyaltyPyramid />
              <CustomerDemographics />
            </div>

            {/* Strategic Insights */}
            <StrategicInsights />

            {/* Priority Matrix + Audience Profile */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-6">
              <div className="glass-card p-6 lg:p-10 rounded-[32px] lg:rounded-[40px] border-border shadow-2xl">
                <div className="flex justify-between items-center mb-8 lg:mb-10">
                  <h3 className="text-lg lg:text-xl font-black flex items-center gap-3 text-foreground"><TargetIcon size={20} className="text-primary" /> {s.priorityMatrix[lang]}</h3>
                  <div className="text-[9px] font-black uppercase text-muted-foreground tracking-widest bg-secondary/50 px-4 py-1.5 rounded-full border border-border">Q4 Data</div>
                </div>
                
                <div className="relative aspect-square border-l-2 border-b-2 border-border/50 m-4 lg:m-6">
                  <span className="absolute -left-10 lg:-left-14 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] lg:text-[10px] font-black uppercase text-muted-foreground tracking-widest whitespace-nowrap">{s.impVsPerf[lang].split(' vs ')[1]}</span>
                  <span className="absolute -bottom-8 lg:-bottom-10 left-1/2 -translate-x-1/2 text-[9px] lg:text-[10px] font-black uppercase text-muted-foreground tracking-widest">{s.impVsPerf[lang].split(' vs ')[0]}</span>
                  
                  <div className="absolute top-4 right-4 text-[8px] lg:text-[9px] font-black uppercase opacity-40 text-muted-foreground">{s.quadrants.maintain[lang]}</div>
                  <div className="absolute top-4 left-4 text-[8px] lg:text-[9px] font-black uppercase opacity-60 text-emerald-500">{s.quadrants.opportunity[lang]}</div>
                  <div className="absolute bottom-4 left-4 text-[8px] lg:text-[9px] font-black uppercase opacity-40 text-muted-foreground">{s.quadrants.low[lang]}</div>
                  <div className="absolute bottom-4 right-4 text-[8px] lg:text-[9px] font-black uppercase opacity-60 text-destructive">{s.quadrants.critical[lang]}</div>
                  
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-[1px] bg-border/30" />
                    <div className="h-full w-[1px] bg-border/30 absolute" />
                  </div>

                  {npsDrivers.map((d, i) => (
                    <div key={i} className={`absolute w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 flex items-center justify-center text-[9px] lg:text-[10px] font-black transition-all cursor-default hover:scale-110 ${d.impact === 'positive' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]'}`} style={{left: `${d.importance * 100}%`, bottom: `${d.performance}%`, transform: 'translate(-50%, 50%)'}}>
                      {i+1}
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6 lg:p-10 rounded-[32px] lg:rounded-[40px] border-border shadow-2xl">
                <h3 className="text-lg lg:text-xl font-black mb-8 lg:mb-10 flex items-center gap-3 text-foreground"><Activity size={20} className="text-primary" /> {s.loyaltyDist[lang]}</h3>
                <div className="space-y-6 lg:space-y-8">
                   {Object.entries(dashboardData?.metrics.loyalty || {}).map(([key, val], idx) => (
                     <div key={key} className="group">
                        <div className="flex justify-between items-center text-[9px] lg:text-[10px] font-black uppercase mb-2 lg:mb-3 text-muted-foreground group-hover:text-foreground transition-colors">
                          <span className="tracking-widest">{key}</span>
                          <span className="text-foreground">{val}%</span>
                        </div>
                        <div className="h-2 lg:h-2.5 bg-secondary/50 rounded-full overflow-hidden border border-border">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_hsl(var(--primary)/0.3)]" 
                            style={{
                              width: `${val}%`, 
                              backgroundColor: idx === 0 ? '#3B82F6' : idx === 1 ? '#6366F1' : idx === 2 ? '#8B5CF6' : idx === 3 ? '#F59E0B' : '#64748B'
                            }} 
                          />
                        </div>
                     </div>
                   ))}
                </div>

                <div className="mt-10 lg:mt-14 p-6 lg:p-8 bg-primary/5 border border-primary/10 rounded-2xl lg:rounded-3xl">
                   <div className="flex items-start gap-4">
                      <Users size={24} className="text-primary flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-black text-foreground mb-2">{s.audienceProf[lang]}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">Sample size N={dashboardData?.sampleSize} respondents. Data weighted based on national demographic census 2024.</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
