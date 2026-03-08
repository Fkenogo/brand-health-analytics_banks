import React from 'react';
import { DashboardMetrics, CompetitorData, TrendData } from '@/utils/api';
import { Eye, TrendingUp, BarChart3, Target, Lightbulb, Trophy, Zap } from 'lucide-react';
import { FunnelChart } from '@/components/ui/charts/FunnelChart';
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
  
  // Awareness Funnel Data for Chart
  const funnelData = [
    { 
      name: 'Total Awareness', 
      value: metrics?.momentum.awareness || 0,
      fill: '#3B82F6',
    },
    { 
      name: 'Ever Used', 
      value: metrics?.momentum.everUsed || 0,
      fill: '#8B5CF6',
    },
    { 
      name: 'Currently Using', 
      value: metrics?.momentum.current || 0,
      fill: '#EC4899',
    },
    { 
      name: 'Preferred Bank', 
      value: metrics?.momentum.preferred || 0, 
      fill: '#10B981',
    }
  ];

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-2">
          <Eye size={24} className="text-primary" />
          <h2 className="text-xl lg:text-2xl font-black text-foreground">Awareness & Brand Health</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Detailed breakdown of brand recognition, recall, and funnel performance for {selectedBankName}
        </p>
      </div>

      {/* Granular Awareness Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Top of Mind */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Trophy size={48} className="text-primary" />
          </div>
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-medium text-muted-foreground">Top of Mind (First Mention)</span>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
              metrics?.topOfMind.rank === 1 ? 'bg-yellow-500 text-black' : 'bg-secondary text-foreground'
            }`}>
              #{metrics?.topOfMind.rank || '-'}
            </div>
          </div>
          <div className="text-3xl font-black text-foreground mb-1">{metrics?.topOfMind.value || 0}%</div>
          <div className="text-xs text-emerald-500 font-medium flex items-center gap-1">
            <TrendingUp size={12} />
            {metrics?.topOfMind.change}% vs prev period
          </div>
        </div>
        
        {/* Spontaneous (Unaided) */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap size={48} className="text-blue-500" />
          </div>
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-medium text-muted-foreground">Spontaneous (Unaided)</span>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black bg-secondary text-foreground`}>
              #{metrics?.spontaneous?.rank || '-'}
            </div>
          </div>
          <div className="text-3xl font-black text-foreground mb-1">{metrics?.spontaneous?.value || 0}%</div>
          <div className="text-xs text-emerald-500 font-medium flex items-center gap-1">
            <TrendingUp size={12} />
            {metrics?.spontaneous?.change || 0}% vs prev period
          </div>
        </div>

        {/* Total Awareness */}
        <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Target size={48} className="text-emerald-500" />
          </div>
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-medium text-muted-foreground">Total Awareness (Aided)</span>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
               metrics?.totalAwareness.rank === 1 ? 'bg-emerald-500 text-white' : 'bg-secondary text-foreground'
            }`}>
              #{metrics?.totalAwareness.rank || '-'}
            </div>
          </div>
          <div className="text-3xl font-black text-foreground mb-1">{metrics?.totalAwareness.value || 0}%</div>
          <div className="text-xs text-emerald-500 font-medium flex items-center gap-1">
            <TrendingUp size={12} />
            {metrics?.totalAwareness.change}% vs prev period
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Marketing Funnel */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-base font-bold text-foreground mb-6 flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" />
            Marketing Funnel Efficiency
          </h3>
          <FunnelChart data={funnelData} />
        </div>

        {/* Competitor Ranking Table */}
        <div className="glass-card rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border">
            <h3 className="text-base font-bold text-foreground">
              Market Awareness Ranking
            </h3>
          </div>
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-secondary/30">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-10">Rnk</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bank</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">TOM</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Spon.</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitorData.map((bank, idx) => (
                  <TableRow key={bank.id} className="border-b border-border hover:bg-secondary/30">
                    <TableCell>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        idx === 0 ? 'bg-yellow-500 text-black' : 
                        idx === 1 ? 'bg-slate-400 text-white' : 
                        idx === 2 ? 'bg-amber-700 text-white' : 
                        'bg-secondary text-muted-foreground'
                      }`}>
                        {idx + 1}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-foreground text-xs">{bank.name}</TableCell>
                    <TableCell className="text-right font-bold">{bank.tom}%</TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">{(bank.tom + 5)}%</TableCell> {/* Mock Spon. if needed or add to CompetitorData */}
                    <TableCell className="text-right">
                      <span className="font-black text-primary">{bank.total}%</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Trend Over Time */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-base font-bold text-foreground mb-4">Awareness Trend (6 months)</h3>
        <div className="flex items-end gap-2 h-32">
          {trendData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
              <div 
                className="w-full rounded-t-sm transition-all duration-700 opacity-60 group-hover:opacity-100"
                style={{ 
                  height: `${(d.awareness / 100) * 100}%`,
                  background: `linear-gradient(to top, hsl(var(--primary)), hsl(var(--primary) / 0.4))`
                }}
              />
              <span className="text-[10px] font-bold text-muted-foreground">{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Insight Card */}
      <div className="glass-card p-6 rounded-2xl border-l-4 border-l-primary bg-primary/5">
        <div className="flex items-start gap-4">
          <Lightbulb size={20} className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-foreground mb-2">Strategic Insight</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {metrics?.awarenessQuality.value || 0}% Awareness Quality (TOM/Total). 
              { (metrics?.awarenessQuality.value || 0) > 40 
                ? " Excellent mental availability. The brand is the default choice for many."
                : " While total awareness is high, the brand is not the first to come to mind. Focus on distinctiveness."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
