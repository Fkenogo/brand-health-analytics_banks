import React from 'react';
import { DashboardMetrics, CompetitorData } from '@/utils/api';
import { Users, TrendingUp, ArrowRight, Lightbulb, CheckCircle, BarChart3 } from 'lucide-react';
import { FunnelChart } from '@/components/ui/charts/FunnelChart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UsageTabProps {
  dashboardData: DashboardMetrics | null;
  competitorData: CompetitorData[];
  selectedBankName: string;
}

export const UsageTab: React.FC<UsageTabProps> = ({
  dashboardData,
  competitorData,
  selectedBankName
}) => {
  const metrics = dashboardData?.metrics;
  const momentum = metrics?.momentum;

  // Usage funnel stages for Chart
  const usageFunnelData = [
    { 
      name: 'Total Awareness', 
      value: momentum?.awareness || 0, 
      fill: '#3B82F6' 
    },
    { 
      name: 'Ever Used', 
      value: momentum?.everUsed || 0, 
      fill: '#8B5CF6' 
    },
    { 
      name: 'Currently Using', 
      value: momentum?.current || 0, 
      fill: '#22C55E' 
    },
    { 
      name: 'Preferred Bank', 
      value: momentum?.preferred || 0, 
      fill: '#F59E0B' 
    },
  ];

  // Calculate drop-off rates for cards
  const dropOffs = usageFunnelData.slice(0, -1).map((stage, idx) => {
    const nextStage = usageFunnelData[idx + 1];
    const dropOff = stage.value > 0 ? Math.round(((stage.value - nextStage.value) / stage.value) * 100) : 0;
    return { from: stage.name, to: nextStage.name, dropOff };
  });

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-2">
          <Users size={24} className="text-primary" />
          <h2 className="text-xl lg:text-2xl font-black text-foreground">Usage & Market Share</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Customer journey analysis, conversion rates, and primary bank relationships for {selectedBankName}
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl">
          <span className="text-xs font-medium text-muted-foreground">Ever Used</span>
          <div className="text-3xl font-black text-foreground mt-2">{momentum?.everUsed || 0}%</div>
          <div className="text-xs text-muted-foreground mt-1">Trial rate</div>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <span className="text-xs font-medium text-muted-foreground">Currently Using</span>
          <div className="text-3xl font-black text-foreground mt-2">{momentum?.current || 0}%</div>
          <div className="text-xs text-muted-foreground mt-1">Active customers</div>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <span className="text-xs font-medium text-muted-foreground">Preferred Bank</span>
          <div className="text-3xl font-black text-foreground mt-2">{momentum?.preferred || 0}%</div>
          <div className="text-xs text-muted-foreground mt-1">Primary bank</div>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <span className="text-xs font-medium text-muted-foreground">Retention Rate</span>
          <div className="text-3xl font-black text-emerald-500 mt-2">{momentum?.retention || 0}%</div>
          <div className="text-xs text-muted-foreground mt-1">Ever → Current</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Funnel Visualization */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-base font-bold text-foreground mb-6 flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" />
            Customer Usage Funnel
          </h3>
          <FunnelChart data={usageFunnelData} />
          
          {/* Drop-off indicators */}
          <div className="mt-6 grid grid-cols-3 gap-2">
            {dropOffs.map((d, idx) => (
              <div key={idx} className="p-3 bg-secondary/30 rounded-lg text-center">
                <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1 truncate">
                  {d.from.split(' ')[0]} → {d.to.split(' ')[0]}
                </div>
                <div className={`text-base font-black ${d.dropOff > 50 ? 'text-destructive' : d.dropOff > 30 ? 'text-yellow-500' : 'text-emerald-500'}`}>
                  -{d.dropOff}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Metrics */}
        <div className="space-y-4">
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-foreground">Conversion Rate</h4>
              <ArrowRight size={16} className="text-primary" />
            </div>
            <div className="text-4xl font-black text-primary mb-2">{momentum?.conversion || 0}%</div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${momentum?.conversion || 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3">Aware → Ever Used (Trial Generation)</p>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-foreground">Retention Rate</h4>
              <CheckCircle size={16} className="text-emerald-500" />
            </div>
            <div className="text-4xl font-black text-emerald-500 mb-2">{momentum?.retention || 0}%</div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${momentum?.retention || 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3">Ever Used → Currently Using (Loyalty)</p>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-foreground">Adoption Rate</h4>
              <TrendingUp size={16} className="text-accent" />
            </div>
            <div className="text-4xl font-black text-accent mb-2">{momentum?.adoption || 0}%</div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent rounded-full transition-all duration-700"
                style={{ width: `${momentum?.adoption || 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-3">Currently Using → Preferred (Primacy)</p>
          </div>
        </div>
      </div>

      {/* Usage Comparison Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-base font-bold text-foreground">Usage Comparison</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-secondary/30">
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bank</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Ever Used</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Current</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Preferred</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Retention</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitorData.map((bank) => {
              // Calculate retention from usage data if available
              const retention = bank.usage?.everUsed > 0 
                ? Math.round((bank.usage.current / bank.usage.everUsed) * 100) 
                : 0;
                
              return (
                <TableRow key={bank.id} className="border-b border-border hover:bg-secondary/30">
                  <TableCell className="font-bold text-foreground">{bank.name}</TableCell>
                  <TableCell className="text-center font-medium text-foreground">{bank.usage?.everUsed || 0}%</TableCell>
                  <TableCell className="text-center font-black text-foreground">{bank.usage?.current || 0}%</TableCell>
                  <TableCell className="text-center font-black text-accent">{bank.usage?.preferred || 0}%</TableCell>
                  <TableCell className="text-center">
                    <span className={`font-black ${retention > 60 ? 'text-emerald-500' : 'text-yellow-500'}`}>
                      {retention}%
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Insight Card */}
      <div className="glass-card p-6 rounded-2xl border-l-4 border-l-emerald-500 bg-emerald-500/5">
        <div className="flex items-start gap-4">
          <Lightbulb size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-foreground mb-2">Usage Insight</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {(momentum?.retention || 0) >= 60 
                ? `Strong retention rate of ${momentum?.retention}% indicates high customer satisfaction. Focus on expanding the preferred bank segment.`
                : `Retention rate of ${momentum?.retention}% suggests opportunity to improve customer experience. Consider loyalty programs and service improvements.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
