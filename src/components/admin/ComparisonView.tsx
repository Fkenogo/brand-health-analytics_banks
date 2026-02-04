import React from 'react';
import { DashboardMetrics } from '@/utils/api';
import { TrendingUp, TrendingDown, Minus, ArrowRight, GitCompare } from 'lucide-react';

interface ComparisonViewProps {
  bankAData: DashboardMetrics | null;
  bankBData: DashboardMetrics | null;
  bankAName: string;
  bankBName: string;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  bankAData,
  bankBData,
  bankAName,
  bankBName
}) => {
  const metricsA = bankAData?.metrics;
  const metricsB = bankBData?.metrics;

  const getDiffIndicator = (valueA: number, valueB: number) => {
    const diff = valueA - valueB;
    if (diff > 0) return { icon: TrendingUp, color: 'text-emerald-500', text: `+${diff}` };
    if (diff < 0) return { icon: TrendingDown, color: 'text-destructive', text: `${diff}` };
    return { icon: Minus, color: 'text-muted-foreground', text: '0' };
  };

  const ComparisonMetric = ({ 
    label, 
    valueA, 
    valueB, 
    suffix = '%',
    colorA = 'text-primary',
    colorB = 'text-accent'
  }: { 
    label: string; 
    valueA: number; 
    valueB: number; 
    suffix?: string;
    colorA?: string;
    colorB?: string;
  }) => {
    const diff = getDiffIndicator(valueA, valueB);
    const DiffIcon = diff.icon;
    
    return (
      <div className="glass-card p-4 rounded-xl">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{label}</div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-center">
            <div className={`text-2xl font-black ${colorA}`}>{valueA}{suffix}</div>
            <div className="text-[9px] text-muted-foreground mt-1 truncate">{bankAName}</div>
          </div>
          <div className="flex flex-col items-center px-2">
            <DiffIcon size={16} className={diff.color} />
            <span className={`text-xs font-bold ${diff.color}`}>{diff.text}</span>
          </div>
          <div className="flex-1 text-center">
            <div className={`text-2xl font-black ${colorB}`}>{valueB}{suffix}</div>
            <div className="text-[9px] text-muted-foreground mt-1 truncate">{bankBName}</div>
          </div>
        </div>
      </div>
    );
  };

  const ComparisonBar = ({ 
    label, 
    valueA, 
    valueB,
    colorA = 'bg-primary',
    colorB = 'bg-accent'
  }: { 
    label: string; 
    valueA: number; 
    valueB: number;
    colorA?: string;
    colorB?: string;
  }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="flex items-center gap-4 text-xs font-bold">
          <span className="text-primary">{valueA}%</span>
          <span className="text-muted-foreground">vs</span>
          <span className="text-accent">{valueB}%</span>
        </div>
      </div>
      <div className="relative h-6 bg-secondary/30 rounded-lg overflow-hidden">
        <div 
          className={`absolute left-0 top-0 h-full ${colorA} transition-all duration-700 rounded-l-lg`}
          style={{ width: `${valueA / 2}%` }}
        />
        <div 
          className={`absolute right-0 top-0 h-full ${colorB} transition-all duration-700 rounded-r-lg`}
          style={{ width: `${valueB / 2}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-0.5 h-4 bg-foreground/20 rounded-full" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
      {/* Comparison Header */}
      <div className="glass-card p-6 rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 border-l-4 border-l-primary">
        <div className="flex items-center gap-3 mb-3">
          <GitCompare size={20} className="text-primary" />
          <h2 className="text-lg font-black text-foreground">Side-by-Side Comparison</h2>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="px-3 py-1 bg-primary/20 text-primary font-bold rounded-full">{bankAName}</span>
          <ArrowRight size={16} className="text-muted-foreground" />
          <span className="px-3 py-1 bg-accent/20 text-accent font-bold rounded-full">{bankBName}</span>
        </div>
      </div>

      {/* Key Metrics Comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ComparisonMetric 
          label="Top-of-Mind" 
          valueA={metricsA?.topOfMind.value || 0} 
          valueB={metricsB?.topOfMind.value || 0}
        />
        <ComparisonMetric 
          label="Total Awareness" 
          valueA={metricsA?.totalAwareness.value || 0} 
          valueB={metricsB?.totalAwareness.value || 0}
        />
        <ComparisonMetric 
          label="NPS Score" 
          valueA={metricsA?.nps.value || 0} 
          valueB={metricsB?.nps.value || 0}
          suffix=""
        />
        <ComparisonMetric 
          label="Consideration" 
          valueA={metricsA?.consideration.value || 0} 
          valueB={metricsB?.consideration.value || 0}
        />
      </div>

      {/* Momentum Comparison */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-base font-bold text-foreground mb-6">Momentum Stages</h3>
        <ComparisonBar 
          label="Awareness" 
          valueA={metricsA?.momentum.awareness || 0} 
          valueB={metricsB?.momentum.awareness || 0}
        />
        <ComparisonBar 
          label="Consideration" 
          valueA={metricsA?.momentum.consideration || 0} 
          valueB={metricsB?.momentum.consideration || 0}
        />
        <ComparisonBar 
          label="Ever Used" 
          valueA={metricsA?.momentum.everUsed || 0} 
          valueB={metricsB?.momentum.everUsed || 0}
        />
        <ComparisonBar 
          label="Currently Using" 
          valueA={metricsA?.momentum.current || 0} 
          valueB={metricsB?.momentum.current || 0}
        />
        <ComparisonBar 
          label="Preferred Bank" 
          valueA={metricsA?.momentum.preferred || 0} 
          valueB={metricsB?.momentum.preferred || 0}
        />
      </div>

      {/* Conversion Metrics Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ComparisonMetric 
          label="Conversion Rate" 
          valueA={metricsA?.momentum.conversion || 0} 
          valueB={metricsB?.momentum.conversion || 0}
        />
        <ComparisonMetric 
          label="Retention Rate" 
          valueA={metricsA?.momentum.retention || 0} 
          valueB={metricsB?.momentum.retention || 0}
        />
        <ComparisonMetric 
          label="Adoption Rate" 
          valueA={metricsA?.momentum.adoption || 0} 
          valueB={metricsB?.momentum.adoption || 0}
        />
      </div>

      {/* Loyalty Comparison */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-base font-bold text-foreground mb-6">Loyalty Segments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bank A Loyalty */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm font-bold text-foreground">{bankAName}</span>
            </div>
            <div className="space-y-2">
              {Object.entries(metricsA?.loyalty || {}).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-24 capitalize">{key}</span>
                  <div className="flex-1 h-4 bg-secondary/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-700"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-foreground w-10 text-right">{value}%</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Bank B Loyalty */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-sm font-bold text-foreground">{bankBName}</span>
            </div>
            <div className="space-y-2">
              {Object.entries(metricsB?.loyalty || {}).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-24 capitalize">{key}</span>
                  <div className="flex-1 h-4 bg-secondary/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent rounded-full transition-all duration-700"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-foreground w-10 text-right">{value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* NPS Distribution Comparison */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-base font-bold text-foreground mb-6">NPS Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bank A NPS */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-sm font-bold text-foreground">{bankAName}</span>
              <span className="text-lg font-black text-primary ml-auto">NPS: {metricsA?.nps.value || 0}</span>
            </div>
            <div className="flex h-6 rounded-lg overflow-hidden">
              <div className="bg-emerald-500 transition-all" style={{ width: `${metricsA?.nps.p || 30}%` }} />
              <div className="bg-yellow-500 transition-all" style={{ width: `${metricsA?.nps.pass || 40}%` }} />
              <div className="bg-destructive transition-all" style={{ width: `${metricsA?.nps.d || 30}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span>Promoters: {metricsA?.nps.p || 30}%</span>
              <span>Passives: {metricsA?.nps.pass || 40}%</span>
              <span>Detractors: {metricsA?.nps.d || 30}%</span>
            </div>
          </div>
          
          {/* Bank B NPS */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-sm font-bold text-foreground">{bankBName}</span>
              <span className="text-lg font-black text-accent ml-auto">NPS: {metricsB?.nps.value || 0}</span>
            </div>
            <div className="flex h-6 rounded-lg overflow-hidden">
              <div className="bg-emerald-500 transition-all" style={{ width: `${metricsB?.nps.p || 30}%` }} />
              <div className="bg-yellow-500 transition-all" style={{ width: `${metricsB?.nps.pass || 40}%` }} />
              <div className="bg-destructive transition-all" style={{ width: `${metricsB?.nps.d || 30}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span>Promoters: {metricsB?.nps.p || 30}%</span>
              <span>Passives: {metricsB?.nps.pass || 40}%</span>
              <span>Detractors: {metricsB?.nps.d || 30}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="glass-card p-6 rounded-2xl border-l-4 border-l-emerald-500 bg-emerald-500/5">
        <h4 className="text-sm font-bold text-foreground mb-3">Comparison Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-black text-primary">{bankAName}</div>
            <div className="text-xs text-muted-foreground">leads in</div>
            <div className="text-lg font-bold text-foreground">
              {[
                (metricsA?.topOfMind.value || 0) > (metricsB?.topOfMind.value || 0) ? 1 : 0,
                (metricsA?.nps.value || 0) > (metricsB?.nps.value || 0) ? 1 : 0,
                (metricsA?.momentum.value || 0) > (metricsB?.momentum.value || 0) ? 1 : 0,
                (metricsA?.consideration.value || 0) > (metricsB?.consideration.value || 0) ? 1 : 0,
              ].reduce((a, b) => a + b, 0)} / 4
            </div>
            <div className="text-[10px] text-muted-foreground">metrics</div>
          </div>
          <div>
            <div className="text-2xl font-black text-accent">{bankBName}</div>
            <div className="text-xs text-muted-foreground">leads in</div>
            <div className="text-lg font-bold text-foreground">
              {[
                (metricsB?.topOfMind.value || 0) > (metricsA?.topOfMind.value || 0) ? 1 : 0,
                (metricsB?.nps.value || 0) > (metricsA?.nps.value || 0) ? 1 : 0,
                (metricsB?.momentum.value || 0) > (metricsA?.momentum.value || 0) ? 1 : 0,
                (metricsB?.consideration.value || 0) > (metricsA?.consideration.value || 0) ? 1 : 0,
              ].reduce((a, b) => a + b, 0)} / 4
            </div>
            <div className="text-[10px] text-muted-foreground">metrics</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Awareness Gap</div>
            <div className={`text-2xl font-black ${
              (metricsA?.totalAwareness.value || 0) > (metricsB?.totalAwareness.value || 0) ? 'text-primary' : 'text-accent'
            }`}>
              {Math.abs((metricsA?.totalAwareness.value || 0) - (metricsB?.totalAwareness.value || 0))}%
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">NPS Gap</div>
            <div className={`text-2xl font-black ${
              (metricsA?.nps.value || 0) > (metricsB?.nps.value || 0) ? 'text-primary' : 'text-accent'
            }`}>
              {Math.abs((metricsA?.nps.value || 0) - (metricsB?.nps.value || 0))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
