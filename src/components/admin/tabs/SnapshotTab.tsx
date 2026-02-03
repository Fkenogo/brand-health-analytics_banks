import React from 'react';
import { DashboardMetrics } from '@/utils/api';
import { Camera, Eye, EyeOff, Users, UserMinus, CheckCircle, XCircle, Star, Lightbulb } from 'lucide-react';

interface SnapshotTabProps {
  dashboardData: DashboardMetrics | null;
  selectedBankName: string;
  sampleSize: number;
}

export const SnapshotTab: React.FC<SnapshotTabProps> = ({
  dashboardData,
  selectedBankName,
  sampleSize
}) => {
  const metrics = dashboardData?.metrics;
  const snapshot = metrics?.snapshot || {
    aware: 0,
    notAware: 0,
    triers: 0,
    nonTriers: 0,
    current: 0,
    lapsers: 0,
    bumo: 0,
    nonBumo: 0,
    nps: { nonTriers: 0, lapsers: 0, nonBumo: 0, bumo: 0 }
  };

  // Segmentation tree structure
  const segmentTree = [
    {
      level: 'Awareness',
      segments: [
        { label: 'Aware', value: snapshot.aware, color: '#3B82F6', icon: Eye },
        { label: 'Not Aware', value: snapshot.notAware, color: '#64748B', icon: EyeOff },
      ]
    },
    {
      level: 'Trial',
      segments: [
        { label: 'Triers', value: snapshot.triers, color: '#8B5CF6', icon: Users },
        { label: 'Non-Triers', value: snapshot.nonTriers, color: '#94A3B8', icon: UserMinus },
      ]
    },
    {
      level: 'Usage',
      segments: [
        { label: 'Current Users', value: snapshot.current, color: '#22C55E', icon: CheckCircle },
        { label: 'Lapsers', value: snapshot.lapsers, color: '#F59E0B', icon: XCircle },
      ]
    },
    {
      level: 'Preference',
      segments: [
        { label: 'BUMO', value: snapshot.bumo, color: '#F59E0B', icon: Star, desc: 'Bank Used Most Often' },
        { label: 'Non-BUMO', value: snapshot.nonBumo, color: '#6366F1', icon: Users, desc: 'Secondary bank users' },
      ]
    },
  ];

  // NPS by segment
  const npsSegments = [
    { label: 'Non-Triers', value: snapshot.nps.nonTriers, desc: 'Aware but never used' },
    { label: 'Lapsers', value: snapshot.nps.lapsers, desc: 'Used before, not now' },
    { label: 'Non-BUMO', value: snapshot.nps.nonBumo, desc: 'Current secondary users' },
    { label: 'BUMO', value: snapshot.nps.bumo, desc: 'Primary bank users' },
  ];

  const getNpsColor = (nps: number) => {
    if (nps >= 50) return 'text-emerald-500';
    if (nps >= 0) return 'text-yellow-500';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-2">
          <Camera size={24} className="text-primary" />
          <h2 className="text-xl lg:text-2xl font-black text-foreground">Brand Snapshot</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Comprehensive customer segmentation and NPS breakdown for {selectedBankName}
        </p>
      </div>

      {/* Sample Size Info */}
      <div className="glass-card p-4 rounded-2xl bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-3">
          <Users size={18} className="text-primary" />
          <span className="text-sm font-medium text-foreground">
            Based on <span className="font-black text-primary">N={sampleSize}</span> respondents
          </span>
        </div>
      </div>

      {/* Segmentation Tree */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-base font-bold text-foreground mb-6">Customer Segmentation Tree</h3>
        
        <div className="space-y-6">
          {segmentTree.map((level, levelIdx) => (
            <div key={level.level}>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                {level.level}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {level.segments.map((seg) => (
                  <div 
                    key={seg.label}
                    className="relative p-5 rounded-xl transition-all hover:scale-[1.02]"
                    style={{ backgroundColor: `${seg.color}15`, borderLeft: `4px solid ${seg.color}` }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${seg.color}30` }}
                      >
                        <seg.icon size={20} style={{ color: seg.color }} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-foreground">{seg.label}</div>
                        {'desc' in seg && (
                          <div className="text-[10px] text-muted-foreground">{seg.desc}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-3xl font-black" style={{ color: seg.color }}>
                      {seg.value}%
                    </div>
                    <div className="mt-3 h-2 bg-secondary/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${seg.value}%`, backgroundColor: seg.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {levelIdx < segmentTree.length - 1 && (
                <div className="flex justify-center my-4">
                  <div className="w-px h-6 bg-border" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* NPS by Segment */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-base font-bold text-foreground mb-6">NPS by Customer Segment</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {npsSegments.map((seg) => (
            <div key={seg.label} className="glass-card p-5 rounded-xl text-center">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                {seg.label}
              </div>
              <div className={`text-4xl font-black mb-2 ${getNpsColor(seg.value)}`}>
                {seg.value > 0 ? '+' : ''}{seg.value}
              </div>
              <div className="text-[10px] text-muted-foreground">{seg.desc}</div>
              
              {/* NPS indicator bar */}
              <div className="mt-4 relative h-2 bg-secondary rounded-full overflow-hidden">
                <div className="absolute inset-0 flex">
                  <div className="h-full bg-destructive" style={{ width: '40%' }} />
                  <div className="h-full bg-yellow-500" style={{ width: '20%' }} />
                  <div className="h-full bg-emerald-500" style={{ width: '40%' }} />
                </div>
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-foreground shadow-lg transition-all duration-500"
                  style={{ left: `${Math.min(Math.max((seg.value + 100) / 2, 5), 95)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Journey Flow Visualization */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-base font-bold text-foreground mb-6">Customer Journey Flow</h3>
        
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4">
          {/* Total Population */}
          <div className="flex-shrink-0 text-center">
            <div className="w-24 h-24 rounded-full bg-secondary/50 flex flex-col items-center justify-center mx-auto mb-2">
              <span className="text-2xl font-black text-foreground">100%</span>
              <span className="text-[9px] text-muted-foreground">Total</span>
            </div>
          </div>

          <div className="text-muted-foreground">→</div>

          {/* Aware */}
          <div className="flex-shrink-0 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex flex-col items-center justify-center mx-auto mb-2 border-2 border-primary">
              <span className="text-xl font-black text-primary">{snapshot.aware}%</span>
              <span className="text-[8px] text-muted-foreground">Aware</span>
            </div>
          </div>

          <div className="text-muted-foreground">→</div>

          {/* Triers */}
          <div className="flex-shrink-0 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex flex-col items-center justify-center mx-auto mb-2 border-2 border-purple-500">
              <span className="text-lg font-black text-purple-500">{snapshot.triers}%</span>
              <span className="text-[8px] text-muted-foreground">Triers</span>
            </div>
          </div>

          <div className="text-muted-foreground">→</div>

          {/* Current */}
          <div className="flex-shrink-0 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex flex-col items-center justify-center mx-auto mb-2 border-2 border-emerald-500">
              <span className="text-base font-black text-emerald-500">{snapshot.current}%</span>
              <span className="text-[7px] text-muted-foreground">Current</span>
            </div>
          </div>

          <div className="text-muted-foreground">→</div>

          {/* BUMO */}
          <div className="flex-shrink-0 text-center">
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex flex-col items-center justify-center mx-auto mb-2 border-2 border-yellow-500">
              <span className="text-sm font-black text-yellow-500">{snapshot.bumo}%</span>
              <span className="text-[7px] text-muted-foreground">BUMO</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl text-center">
          <div className="text-xs font-bold text-muted-foreground mb-2">Trial Rate</div>
          <div className="text-2xl font-black text-foreground">
            {snapshot.aware > 0 ? Math.round((snapshot.triers / snapshot.aware) * 100) : 0}%
          </div>
          <div className="text-[10px] text-muted-foreground">Aware → Triers</div>
        </div>
        <div className="glass-card p-5 rounded-2xl text-center">
          <div className="text-xs font-bold text-muted-foreground mb-2">Retention Rate</div>
          <div className="text-2xl font-black text-emerald-500">
            {snapshot.triers > 0 ? Math.round((snapshot.current / snapshot.triers) * 100) : 0}%
          </div>
          <div className="text-[10px] text-muted-foreground">Triers → Current</div>
        </div>
        <div className="glass-card p-5 rounded-2xl text-center">
          <div className="text-xs font-bold text-muted-foreground mb-2">Preference Rate</div>
          <div className="text-2xl font-black text-yellow-500">
            {snapshot.current > 0 ? Math.round((snapshot.bumo / snapshot.current) * 100) : 0}%
          </div>
          <div className="text-[10px] text-muted-foreground">Current → BUMO</div>
        </div>
        <div className="glass-card p-5 rounded-2xl text-center">
          <div className="text-xs font-bold text-muted-foreground mb-2">Lapse Rate</div>
          <div className="text-2xl font-black text-destructive">
            {snapshot.triers > 0 ? Math.round((snapshot.lapsers / snapshot.triers) * 100) : 0}%
          </div>
          <div className="text-[10px] text-muted-foreground">Triers → Lapsed</div>
        </div>
      </div>

      {/* Insight Card */}
      <div className="glass-card p-6 rounded-2xl border-l-4 border-l-accent bg-accent/5">
        <div className="flex items-start gap-4">
          <Lightbulb size={20} className="text-accent flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-foreground mb-2">Snapshot Insight</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {snapshot.bumo > 10 
                ? `Strong BUMO segment of ${snapshot.bumo}% indicates excellent primary bank positioning. BUMO customers show NPS of ${snapshot.nps.bumo}, the highest among all segments.`
                : `BUMO segment at ${snapshot.bumo}% presents growth opportunity. Focus on converting current users to primary bank status through improved digital services and rewards programs.`}
              {snapshot.lapsers > 15 && ` High lapse rate of ${snapshot.lapsers}% requires attention to customer retention strategies.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
