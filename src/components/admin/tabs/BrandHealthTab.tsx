import React from 'react';
import { DashboardMetrics, TrendData, CompetitorData, NPSDriver } from '@/utils/api';
import { Zap, TrendingUp, TrendingDown, ArrowRight, Target, Lightbulb, BarChart3, AlertTriangle, CheckCircle } from 'lucide-react';
import { FunnelChart } from '@/components/ui/charts/FunnelChart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BrandHealthTabProps {
  dashboardData: DashboardMetrics | null;
  trendData: TrendData[];
  competitorData: CompetitorData[];
  npsDrivers: NPSDriver[];
  selectedBankName: string;
}

export const BrandHealthTab: React.FC<BrandHealthTabProps> = ({
  dashboardData,
  trendData,
  competitorData,
  npsDrivers,
  selectedBankName
}) => {
  const metrics = dashboardData?.metrics;
  const momentum = metrics?.momentum;
  const nps = metrics?.nps || { value: 0, rank: 0, change: 0, p: 30, pass: 40, d: 30 };

  // --- Momentum Data Preparation ---
  // Momentum stages for horizontal funnel (UI only, data is strictly from props)
  const momentumStages = [
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

  // --- NPS Data Preparation ---
  const totalNps = (nps.p + nps.pass + nps.d) || 1;
  const promotersPct = Math.round((nps.p / totalNps) * 100);
  const passivesPct = Math.round((nps.pass / totalNps) * 100);
  const detractorsPct = Math.round((nps.d / totalNps) * 100);

  const priorityDrivers = npsDrivers.filter(d => d.importance >= 0.7 && d.performance < 60);
  const strengthDrivers = npsDrivers.filter(d => d.importance >= 0.7 && d.performance >= 60);

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-2">
          <Zap size={24} className="text-primary" />
          <h2 className="text-xl lg:text-2xl font-black text-foreground">Brand Health & Momentum</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Comprehensive analysis of {selectedBankName}'s market strength, momentum, and customer sentiment.
        </p>
      </div>

      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Momentum Score Card */}
        <div className="glass-card p-8 rounded-2xl text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
             <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full mb-4">
                <Target size={14} className="text-primary" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Momentum Score</span>
             </div>
            <div className="text-7xl font-black text-foreground mb-4">
            {momentum?.value || 0}
            <span className="text-3xl text-muted-foreground">/100</span>
            </div>
            <div className={`flex items-center justify-center gap-2 ${momentum?.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {momentum?.change >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            <span className="text-sm font-bold">{momentum?.change >= 0 ? '+' : ''}{momentum?.change}% vs last month</span>
            </div>
             <div className="mt-6 text-xs text-muted-foreground">
             Weighted composite of growth, conversion, and retention
            </div>
        </div>

        {/* NPS Score Card */}
        <div className="glass-card p-8 rounded-2xl text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-yellow-500" />
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full mb-4">
            <BarChart3 size={14} className="text-emerald-500" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Net Promoter Score</span>
            </div>
            <div className={`text-7xl font-black mb-4 ${nps.value >= 50 ? 'text-emerald-500' : nps.value >= 0 ? 'text-yellow-500' : 'text-destructive'}`}>
            {nps.value > 0 ? '+' : ''}{Math.round(nps.value)}
            </div>
             <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <span className="text-sm">Promoters: {promotersPct}% • Detractors: {detractorsPct}%</span>
            </div>
            <div className="mt-6 text-xs text-muted-foreground">
             Based on likelihood to recommend
            </div>
        </div>
      </div>

      {/* Momentum Logic Section */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-base font-bold text-foreground mb-6">Momentum Drivers (Funnel Efficiency)</h3>
        
        {/* Horizontal funnel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4">
          {momentumStages.map((stage, idx) => (
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
              {idx < momentumStages.length - 1 && (
                <div className="flex-shrink-0">
                  <ArrowRight size={20} className="text-muted-foreground" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Momentum Components Bars */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {momentumComponents.map((comp) => (
                <div key={comp.label} className="glass-card p-5 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-bold text-foreground">{comp.label} Rate</h4>
                    <span className={`text-sm font-black ${comp.value >= 50 ? 'text-emerald-500' : 'text-yellow-500'}`}>{comp.value}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden mb-2">
                    <div 
                        className={`h-full rounded-full ${comp.value >= 50 ? 'bg-emerald-500' : 'bg-yellow-500'}`} 
                        style={{ width: `${comp.value}%` }} 
                    />
                </div>
                <p className="text-[10px] text-muted-foreground">{comp.desc}</p>
                </div>
            ))}
        </div>
      </div>

      {/* NPS Deep Dive Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* NPS Distribution */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-base font-bold text-foreground mb-6">NPS Distribution</h3>
            
            <div className="flex h-16 rounded-xl overflow-hidden mb-6">
            <div 
                className="h-full transition-all duration-500 flex items-center justify-center bg-emerald-500" 
                style={{ width: `${promotersPct}%` }}
            >
                {promotersPct > 10 && <span className="text-lg font-black text-white">{promotersPct}%</span>}
            </div>
            <div 
                className="h-full transition-all duration-500 flex items-center justify-center bg-yellow-500" 
                style={{ width: `${passivesPct}%` }}
            >
                 {passivesPct > 10 && <span className="text-lg font-black text-black">{passivesPct}%</span>}
            </div>
            <div 
                className="h-full transition-all duration-500 flex items-center justify-center bg-destructive" 
                style={{ width: `${detractorsPct}%` }}
            >
                 {detractorsPct > 10 && <span className="text-lg font-black text-white">{detractorsPct}%</span>}
            </div>
            </div>
            
            <div className="flex justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" /> Promoters (9-10)
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" /> Passives (7-8)
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive" /> Detractors (0-6)
                </div>
            </div>
          </div>

          {/* Strategic Insight */}
          <div className="glass-card p-6 rounded-2xl border-l-4 border-l-emerald-500 bg-emerald-500/5">
            <div className="flex items-start gap-4">
            <Lightbulb size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
                <h4 className="text-sm font-bold text-foreground mb-2">Strategic Insight</h4>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                {(momentum?.value || 0) >= 60 
                    ? `Strong brand momentum driven by high ${(momentum?.retention || 0) > (momentum?.conversion || 0) ? 'retention' : 'conversion'}. ` 
                    : `Momentum is slowing. Focus on ${(momentum?.conversion || 0) < 40 ? 'improving trial rates' : 'customer retention measures'}. `}
                {nps.value >= 30 
                    ? `NPS is healthy. Leverage promoters for referrals.` 
                    : `NPS indicates friction in customer experience. Address detractor pain points.`}
                </p>
                
                {priorityDrivers.length > 0 && (
                    <div className="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                        <div className="flex items-center gap-2 mb-2 text-destructive">
                            <AlertTriangle size={14} />
                            <span className="text-xs font-bold uppercase">Critical Fixes Needed</span>
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                            {priorityDrivers.slice(0, 3).map(d => (
                                <li key={d.attribute}>Improve <b>{d.attribute}</b> (Perf: {d.performance}%)</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            </div>
          </div>
      </div>
        
      {/* NPS Drivers Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-base font-bold text-foreground">Key Performance Drivers</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-secondary/30">
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Attribute</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Performance</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Importance</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Impact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {npsDrivers.slice(0, 5).map((driver) => (
                <TableRow key={driver.attribute} className="border-b border-border hover:bg-secondary/30">
                  <TableCell className="font-bold text-foreground">{driver.attribute}</TableCell>
                  <TableCell className="text-center">
                    <span className={`font-black ${driver.performance >= 60 ? 'text-emerald-500' : 'text-yellow-500'}`}>
                        {driver.performance}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-medium text-muted-foreground">
                    {Math.round(driver.importance * 100)}%
                  </TableCell>
                  <TableCell className="text-center">
                    {driver.impact === 'positive' ? (
                      <div className="inline-flex items-center gap-1 text-emerald-500">
                        <TrendingUp size={14} />
                        <span className="text-xs font-bold">Positive</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 text-destructive">
                        <TrendingDown size={14} />
                        <span className="text-xs font-bold">Negative</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

    </div>
  );
};
