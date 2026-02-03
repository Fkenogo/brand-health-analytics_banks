import React from 'react';
import { DashboardMetrics, CompetitorData, TrendData } from '@/utils/api';
import { Eye, TrendingUp, TrendingDown, BarChart3, Target, Lightbulb } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AwarenessTabProps {
  dashboardData: DashboardMetrics | null;
  competitorData: CompetitorData[];
  trendData: TrendData[];
  selectedBankName: string;
}

export const AwarenessTab: React.FC<AwarenessTabProps> = ({
  dashboardData,
  competitorData,
  trendData,
  selectedBankName
}) => {
  const metrics = dashboardData?.metrics;
  
  // Awareness funnel stages
  const funnelStages = [
    { label: 'Total Awareness', value: metrics?.totalAwareness.value || 0, color: '#3B82F6' },
    { label: 'Top-of-Mind', value: metrics?.topOfMind.value || 0, color: '#8B5CF6' },
    { label: 'Awareness Quality', value: metrics?.awarenessQuality.value || 0, color: '#22C55E' },
  ];

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-2">
          <Eye size={24} className="text-primary" />
          <h2 className="text-xl lg:text-2xl font-black text-foreground">Awareness Analysis</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Brand recognition and recall metrics for {selectedBankName}
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-medium text-muted-foreground">Total Awareness</span>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${
              metrics?.totalAwareness.rank === 1 ? 'bg-emerald-500 text-white' : 'bg-secondary text-foreground border border-border'
            }`}>
              #{metrics?.totalAwareness.rank || '-'}
            </div>
          </div>
          <div className="text-4xl font-black text-foreground mb-2">{metrics?.totalAwareness.value || 0}%</div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
            <TrendingUp size={14}/>
            {metrics?.totalAwareness.change || 0}% vs last period
          </div>
        </div>
        
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-medium text-muted-foreground">Top-of-Mind</span>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${
              metrics?.topOfMind.rank === 1 ? 'bg-emerald-500 text-white' : 'bg-secondary text-foreground border border-border'
            }`}>
              #{metrics?.topOfMind.rank || '-'}
            </div>
          </div>
          <div className="text-4xl font-black text-foreground mb-2">{metrics?.topOfMind.value || 0}%</div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
            <TrendingUp size={14}/>
            {metrics?.topOfMind.change || 0}% first mention recall
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-medium text-muted-foreground">Awareness Quality</span>
            <Target size={16} className="text-primary" />
          </div>
          <div className="text-4xl font-black text-foreground mb-2">{metrics?.awarenessQuality.value || 0}%</div>
          <div className="text-xs text-muted-foreground">
            Top-of-Mind / Total Awareness ratio
          </div>
        </div>
      </div>

      {/* Awareness Funnel */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-base font-bold text-foreground mb-6 flex items-center gap-2">
          <BarChart3 size={18} className="text-primary" />
          Awareness Funnel
        </h3>
        <div className="space-y-4">
          {funnelStages.map((stage, idx) => (
            <div key={stage.label} className="relative">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-muted-foreground">{stage.label}</span>
                <span className="text-lg font-black text-foreground">{stage.value}%</span>
              </div>
              <div className="h-10 bg-secondary/30 rounded-lg overflow-hidden">
                <div 
                  className="h-full rounded-lg transition-all duration-1000 flex items-center justify-end pr-4"
                  style={{ 
                    width: `${Math.max(stage.value, 10)}%`, 
                    backgroundColor: stage.color,
                    opacity: 1 - (idx * 0.15)
                  }}
                >
                  <span className="text-xs font-bold text-white">{stage.value}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trend Over Time */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-base font-bold text-foreground mb-6">Awareness Trend (6 months)</h3>
        <div className="flex items-end gap-3 h-40">
          {trendData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className="w-full rounded-t-lg transition-all duration-700"
                style={{ 
                  height: `${(d.awareness / 100) * 140}px`,
                  background: `linear-gradient(to top, hsl(var(--primary)), hsl(var(--primary) / 0.6))`
                }}
              />
              <span className="text-[10px] font-bold text-muted-foreground">{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Competitor Comparison */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            Awareness Ranking
          </h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-secondary/30">
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-12">#</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bank</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Total Awareness</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Top-of-Mind</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitorData.slice(0, 8).map((bank, idx) => (
              <TableRow key={bank.id} className="border-b border-border hover:bg-secondary/30">
                <TableCell>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? 'bg-yellow-500 text-black' : 
                    idx === 1 ? 'bg-slate-400 text-white' : 
                    idx === 2 ? 'bg-amber-700 text-white' : 
                    'bg-secondary text-muted-foreground'
                  }`}>
                    {idx + 1}
                  </div>
                </TableCell>
                <TableCell className="font-bold text-foreground">{bank.name}</TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-black text-foreground">{bank.total}%</span>
                    <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${bank.total}%` }}/>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-lg font-black text-accent">{bank.tom}%</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Insight Card */}
      <div className="glass-card p-6 rounded-2xl border-l-4 border-l-primary bg-primary/5">
        <div className="flex items-start gap-4">
          <Lightbulb size={20} className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-foreground mb-2">Awareness Insight</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {selectedBankName} has {metrics?.awarenessQuality.value || 0}% awareness quality ratio. 
              {(metrics?.awarenessQuality.value || 0) >= 30 
                ? " Strong top-of-mind presence indicates effective brand positioning."
                : " Consider increasing brand visibility campaigns to improve first-mention recall."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
