import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  Lightbulb, 
  AlertTriangle, 
  Activity, 
  Users, 
  Target as TargetIcon 
} from 'lucide-react';
import { 
  DashboardMetrics, 
  TrendData, 
  NPSDriver
} from '@/utils/api';
import { UI_STRINGS } from '@/constants';
import { CountryCode, Language } from '@/types';
import { getResponses } from '@/utils/storage';

interface OverviewTabProps {
  dashboardData: DashboardMetrics | null;
  trendData: TrendData[];
  npsDrivers: NPSDriver[];
  activeCountry: CountryCode;
  lang: Language;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  dashboardData,
  trendData,
  npsDrivers,
  activeCountry,
  lang
}) => {
  const s = UI_STRINGS.admin;

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

  const demographics = calculateDemographics();

  // KPI Card Component
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

  // Brand Health Trends Chart
  const BrandHealthTrends = () => (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-base font-bold text-foreground">Brand Health Trends</h3>
        <span className="text-xs text-muted-foreground">6 months</span>
      </div>
      
      {['Awareness', 'Nps', 'Usage'].map((metric) => {
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
      committed: 0,
      favors: 0,
      potential: 0,
      rejectors: 0,
      accessibles: 0
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
                  style={{ width: `${Math.max(seg.value || 0, 8)}%`, backgroundColor: seg.color }}
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
                      backgroundColor: ageColors[idx % ageColors.length] 
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

  return (
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
  );
};
