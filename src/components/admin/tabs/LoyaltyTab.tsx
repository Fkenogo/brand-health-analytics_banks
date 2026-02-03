import React from 'react';
import { DashboardMetrics, CompetitorData } from '@/utils/api';
import { Heart, TrendingUp, Users, Shield, AlertTriangle, Lightbulb, Star } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LoyaltyTabProps {
  dashboardData: DashboardMetrics | null;
  competitorData: CompetitorData[];
  selectedBankName: string;
}

export const LoyaltyTab: React.FC<LoyaltyTabProps> = ({
  dashboardData,
  competitorData,
  selectedBankName
}) => {
  const metrics = dashboardData?.metrics;
  const loyalty = metrics?.loyalty || {
    committed: 0,
    favors: 0,
    potential: 0,
    rejectors: 0,
    accessibles: 0
  };

  // Loyalty segments with metadata
  const segments = [
    { 
      key: 'committed',
      label: 'Committed', 
      value: loyalty.committed, 
      color: '#22C55E',
      icon: Shield,
      desc: 'Exclusive users who only consider this bank'
    },
    { 
      key: 'favors',
      label: 'Favors', 
      value: loyalty.favors, 
      color: '#3B82F6',
      icon: Star,
      desc: 'Users who prefer this bank among options'
    },
    { 
      key: 'potential',
      label: 'Potential', 
      value: loyalty.potential, 
      color: '#F59E0B',
      icon: TrendingUp,
      desc: 'Interested prospects considering the bank'
    },
    { 
      key: 'rejectors',
      label: 'Rejectors', 
      value: loyalty.rejectors, 
      color: '#EF4444',
      icon: AlertTriangle,
      desc: 'Users who would never consider this bank'
    },
    { 
      key: 'accessibles',
      label: 'Accessibles', 
      value: loyalty.accessibles, 
      color: '#64748B',
      icon: Users,
      desc: 'Unaware users who could be reached'
    },
  ];

  // Calculate loyalty score
  const loyaltyScore = Math.round(
    (loyalty.committed * 5 + loyalty.favors * 3 + loyalty.potential * 1 - loyalty.rejectors * 2) / 7
  );

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-2">
          <Heart size={24} className="text-primary" />
          <h2 className="text-xl lg:text-2xl font-black text-foreground">Loyalty Analysis</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Customer commitment and brand loyalty segments for {selectedBankName}
        </p>
      </div>

      {/* Loyalty Score Header */}
      <div className="glass-card p-8 rounded-2xl text-center bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-background/50 rounded-full mb-4">
          <Heart size={14} className="text-primary" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loyalty Index</span>
        </div>
        <div className="text-6xl font-black text-foreground mb-2">
          {Math.max(loyaltyScore, 0)}
        </div>
        <div className="text-sm text-muted-foreground">
          Weighted score based on segment distribution
        </div>
      </div>

      {/* Segment Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {segments.map((seg) => (
          <div key={seg.key} className="glass-card p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${seg.color}20` }}
              >
                <seg.icon size={16} style={{ color: seg.color }} />
              </div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{seg.label}</span>
            </div>
            <div className="text-3xl font-black text-foreground mb-2">{seg.value}%</div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${seg.value}%`, backgroundColor: seg.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Loyalty Pyramid Visualization */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-base font-bold text-foreground mb-6">Loyalty Pyramid</h3>
        
        <div className="flex flex-col items-center gap-2">
          {segments.slice(0, 4).map((seg, idx) => {
            const width = 30 + (idx * 18);
            return (
              <div 
                key={seg.key}
                className="relative transition-all duration-500 hover:scale-105 cursor-default"
                style={{ width: `${width}%` }}
              >
                <div 
                  className="h-14 rounded-lg flex items-center justify-between px-4"
                  style={{ backgroundColor: seg.color }}
                >
                  <span className="text-sm font-bold text-white">{seg.label}</span>
                  <span className="text-xl font-black text-white">{seg.value}%</span>
                </div>
              </div>
            );
          })}
          
          {/* Accessibles base */}
          <div className="w-full mt-4 p-4 bg-secondary/50 rounded-lg text-center border-2 border-dashed border-border">
            <span className="text-sm font-bold text-muted-foreground">
              Accessibles (Unaware): {loyalty.accessibles}%
            </span>
          </div>
        </div>
      </div>

      {/* Segment Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Positive Segments */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" />
            Core Customer Base
          </h3>
          <div className="space-y-4">
            {segments.slice(0, 3).map((seg) => (
              <div key={seg.key} className="flex items-start gap-4 p-4 bg-secondary/30 rounded-xl">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${seg.color}20` }}
                >
                  <seg.icon size={20} style={{ color: seg.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-foreground">{seg.label}</span>
                    <span className="text-lg font-black" style={{ color: seg.color }}>{seg.value}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{seg.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* At-Risk Segments */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-yellow-500" />
            Opportunity Segments
          </h3>
          <div className="space-y-4">
            {segments.slice(3).map((seg) => (
              <div key={seg.key} className="flex items-start gap-4 p-4 bg-secondary/30 rounded-xl">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${seg.color}20` }}
                >
                  <seg.icon size={20} style={{ color: seg.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-foreground">{seg.label}</span>
                    <span className="text-lg font-black" style={{ color: seg.color }}>{seg.value}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{seg.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Competitor Comparison */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-base font-bold text-foreground">Loyalty Segment Comparison</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-secondary/30">
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bank</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-emerald-500 text-center">Committed</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary text-center">Favors</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-yellow-500 text-center">Potential</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-destructive text-center">Rejectors</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitorData.slice(0, 8).map((bank) => {
              const isSelected = bank.name === selectedBankName;
              return (
                <TableRow key={bank.id} className={`border-b border-border hover:bg-secondary/30 ${isSelected ? 'bg-primary/10' : ''}`}>
                  <TableCell className={`font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>{bank.name}</TableCell>
                  <TableCell className="text-center font-black text-emerald-500">{bank.loyalty.committed}%</TableCell>
                  <TableCell className="text-center font-black text-primary">{bank.loyalty.favors}%</TableCell>
                  <TableCell className="text-center font-black text-yellow-500">{bank.loyalty.potential}%</TableCell>
                  <TableCell className="text-center font-black text-destructive">{bank.loyalty.rejectors}%</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Insight Card */}
      <div className="glass-card p-6 rounded-2xl border-l-4 border-l-primary bg-primary/5">
        <div className="flex items-start gap-4">
          <Lightbulb size={20} className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-foreground mb-2">Loyalty Insight</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {loyalty.committed + loyalty.favors > 30
                ? `Strong loyalty base with ${loyalty.committed + loyalty.favors}% committed/favoring customers. Focus on converting the ${loyalty.potential}% potential segment while maintaining current advocates.`
                : `Opportunity to strengthen loyalty. With ${loyalty.potential}% in the potential segment and ${loyalty.accessibles}% unaware, prioritize awareness campaigns and value proposition clarity.`}
              {loyalty.rejectors > 10 && ` Note: ${loyalty.rejectors}% rejector rate warrants investigation into service improvement areas.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
