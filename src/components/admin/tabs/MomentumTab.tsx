import React from 'react';
import { DashboardMetrics, TrendData, CompetitorData } from '@/utils/api';
import { Zap, TrendingUp, TrendingDown, ArrowRight, Target, Lightbulb } from 'lucide-react';

interface MomentumTabProps {
  dashboardData: DashboardMetrics | null;
  trendData: TrendData[];
  competitorData: CompetitorData[];
  selectedBankName: string;
}

export const MomentumTab: React.FC<MomentumTabProps> = ({
  dashboardData,
  trendData,
  competitorData,
  selectedBankName
}) => {
  const metrics = dashboardData?.metrics;
  const momentum = metrics?.momentum;

  // Momentum stages for horizontal funnel
  const stages = [
    { label: 'Awareness', value: momentum?.awareness || 0, color: '#3B82F6' },
    { label: 'Consideration', value: momentum?.consideration || 0, color: '#8B5CF6' },
    { label: 'Ever Used', value: momentum?.everUsed || 0, color: '#A855F7' },
    { label: 'Current', value: momentum?.current || 0, color: '#22C55E' },
    { label: 'Preferred', value: momentum?.preferred || 0, color: '#F59E0B' },
  ];

  // Calculate momentum score components
  const momentumComponents = [
    { label: 'Conversion', value: momentum?.conversion || 0, desc: 'Aware → Ever Used' },
    { label: 'Retention', value: momentum?.retention || 0, desc: 'Ever Used → Current' },
    { label: 'Adoption', value: momentum?.adoption || 0, desc: 'Current → Preferred' },
  ];

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-2">
          <Zap size={24} className="text-primary" />
          <h2 className="text-xl lg:text-2xl font-black text-foreground">Brand Momentum</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Marketing efficiency and brand trajectory for {selectedBankName}
        </p>
      </div>

      {/* Main Momentum Score */}
      <div className="glass-card p-8 rounded-2xl text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full mb-4">
          <Target size={14} className="text-primary" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Momentum Score</span>
        </div>
        <div className="text-7xl font-black text-foreground mb-4">
          {momentum?.value || 0}
          <span className="text-3xl text-muted-foreground">%</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-emerald-500">
          <TrendingUp size={18} />
          <span className="text-sm font-bold">+{momentum?.change || 0}% from last period</span>
        </div>
        <div className="mt-6 text-xs text-muted-foreground">
          Rank #{momentum?.rank || '-'} in market • Average of conversion, retention & adoption rates
        </div>
      </div>

      {/* Momentum Journey Funnel */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-base font-bold text-foreground mb-6">Customer Journey Stages</h3>
        
        {/* Horizontal funnel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4">
          {stages.map((stage, idx) => (
            <React.Fragment key={stage.label}>
              <div className="flex-1 min-w-[120px]">
                <div 
                  className="h-20 rounded-xl flex flex-col items-center justify-center transition-all duration-500"
                  style={{ backgroundColor: stage.color }}
                >
                  <span className="text-2xl font-black text-white">{stage.value}%</span>
                  <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{stage.label}</span>
                </div>
              </div>
              {idx < stages.length - 1 && (
                <div className="flex-shrink-0">
                  <ArrowRight size={20} className="text-muted-foreground" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Stage-to-stage conversion rates */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          {stages.slice(0, -1).map((stage, idx) => {
            const nextStage = stages[idx + 1];
            const convRate = stage.value > 0 ? Math.round((nextStage.value / stage.value) * 100) : 0;
            return (
              <div key={idx} className="text-center">
                <div className="text-lg font-black text-foreground">{convRate}%</div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-widest">
                  {stage.label.slice(0, 4)} → {nextStage.label.slice(0, 4)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Momentum Components */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {momentumComponents.map((comp, idx) => (
          <div key={comp.label} className="glass-card p-6 rounded-2xl">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-sm font-bold text-foreground">{comp.label}</h4>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-black ${
                comp.value >= 60 ? 'bg-emerald-500' : comp.value >= 40 ? 'bg-yellow-500' : 'bg-destructive'
              }`}>
                {comp.value}
              </div>
            </div>
            
            <div className="relative h-4 bg-secondary/50 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full rounded-full transition-all duration-1000"
                style={{ 
                  width: `${comp.value}%`,
                  background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))`
                }}
              />
            </div>
            
            <p className="text-xs text-muted-foreground">{comp.desc}</p>
          </div>
        ))}
      </div>

      {/* Momentum Trend */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-base font-bold text-foreground mb-6">Momentum Trend (6 months)</h3>
        
        <div className="grid grid-cols-6 gap-4">
          {trendData.map((d, i) => {
            const momentumVal = Math.round((d.awareness * 0.3 + d.nps * 0.4 + d.usage * 0.3));
            return (
              <div key={i} className="text-center">
                <div className="relative h-32 bg-secondary/30 rounded-xl overflow-hidden mb-2">
                  <div 
                    className="absolute bottom-0 w-full rounded-t-lg transition-all duration-700"
                    style={{ 
                      height: `${momentumVal}%`,
                      background: `linear-gradient(to top, hsl(var(--primary)), hsl(var(--primary) / 0.4))`
                    }}
                  />
                  <div className="absolute inset-0 flex items-end justify-center pb-2">
                    <span className="text-sm font-black text-white">{momentumVal}%</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-muted-foreground">{d.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Competitor Momentum Comparison */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-base font-bold text-foreground mb-6">Market Momentum Comparison</h3>
        
        <div className="space-y-4">
          {competitorData.slice(0, 6).map((bank, idx) => {
            const bankMomentum = Math.round((bank.total * 0.4 + bank.consideration * 0.6) / 2);
            const isSelected = bank.name === selectedBankName;
            return (
              <div key={bank.id} className={`flex items-center gap-4 ${isSelected ? 'opacity-100' : 'opacity-70'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                  idx === 0 ? 'bg-yellow-500 text-black' : 'bg-secondary text-muted-foreground'
                }`}>
                  {idx + 1}
                </div>
                <span className={`w-32 text-sm truncate ${isSelected ? 'font-black text-primary' : 'font-medium text-foreground'}`}>
                  {bank.name}
                </span>
                <div className="flex-1 h-8 bg-secondary/30 rounded-lg overflow-hidden">
                  <div 
                    className={`h-full rounded-lg transition-all duration-700 flex items-center px-3 ${isSelected ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                    style={{ width: `${bankMomentum}%` }}
                  >
                    <span className="text-xs font-black text-white">{bankMomentum}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insight Card */}
      <div className="glass-card p-6 rounded-2xl border-l-4 border-l-accent bg-accent/5">
        <div className="flex items-start gap-4">
          <Lightbulb size={20} className="text-accent flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-foreground mb-2">Momentum Insight</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {(momentum?.value || 0) >= 50 
                ? `Strong brand momentum of ${momentum?.value}% indicates efficient marketing ROI. Focus on maintaining conversion rates while expanding awareness.`
                : `Brand momentum of ${momentum?.value}% suggests room for improvement. Prioritize ${
                    (momentum?.conversion || 0) < 50 ? 'conversion strategies' : 
                    (momentum?.retention || 0) < 50 ? 'customer retention' : 'adoption programs'
                  } to boost overall momentum.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
