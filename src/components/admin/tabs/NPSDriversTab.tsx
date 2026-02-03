import React from 'react';
import { DashboardMetrics, NPSDriver } from '@/utils/api';
import { Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Lightbulb, BarChart3 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface NPSDriversTabProps {
  dashboardData: DashboardMetrics | null;
  npsDrivers: NPSDriver[];
  selectedBankName: string;
}

export const NPSDriversTab: React.FC<NPSDriversTabProps> = ({
  dashboardData,
  npsDrivers,
  selectedBankName
}) => {
  const metrics = dashboardData?.metrics;
  const nps = metrics?.nps || { value: 0, rank: 0, p: 30, pass: 40, d: 30 };

  // Calculate totals for NPS distribution
  const total = nps.p + nps.pass + nps.d || 1;
  const promoters = Math.round((nps.p / total) * 100);
  const passives = Math.round((nps.pass / total) * 100);
  const detractors = Math.round((nps.d / total) * 100);

  // Categorize drivers by quadrant
  const priorityDrivers = npsDrivers.filter(d => d.importance >= 0.7 && d.performance < 60);
  const strengthDrivers = npsDrivers.filter(d => d.importance >= 0.7 && d.performance >= 60);
  const lowPriorityDrivers = npsDrivers.filter(d => d.importance < 0.7);

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Header */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-2">
          <Target size={24} className="text-primary" />
          <h2 className="text-xl lg:text-2xl font-black text-foreground">NPS Drivers Analysis</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Key factors driving Net Promoter Score for {selectedBankName}
        </p>
      </div>

      {/* NPS Score Card */}
      <div className="glass-card p-8 rounded-2xl text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full mb-4">
          <BarChart3 size={14} className="text-primary" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Net Promoter Score</span>
        </div>
        <div className={`text-7xl font-black mb-4 ${nps.value >= 50 ? 'text-emerald-500' : nps.value >= 0 ? 'text-yellow-500' : 'text-destructive'}`}>
          {nps.value > 0 ? '+' : ''}{nps.value}
        </div>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <span className="text-sm">Market Rank: #{nps.rank}</span>
        </div>
      </div>

      {/* NPS Distribution */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-base font-bold text-foreground mb-6">Score Distribution</h3>
        
        {/* Segmented bar */}
        <div className="flex h-12 rounded-xl overflow-hidden mb-6">
          <div 
            className="h-full transition-all duration-500 flex items-center justify-center" 
            style={{ width: `${promoters}%`, backgroundColor: '#22C55E' }}
          >
            <span className="text-sm font-black text-white">{promoters}%</span>
          </div>
          <div 
            className="h-full transition-all duration-500 flex items-center justify-center" 
            style={{ width: `${passives}%`, backgroundColor: '#FACC15' }}
          >
            <span className="text-sm font-black text-black">{passives}%</span>
          </div>
          <div 
            className="h-full transition-all duration-500 flex items-center justify-center" 
            style={{ width: `${detractors}%`, backgroundColor: '#EF4444' }}
          >
            <span className="text-sm font-black text-white">{detractors}%</span>
          </div>
        </div>
        
        {/* Labels */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <div className="text-3xl font-black text-emerald-500">{promoters}%</div>
            <div className="text-xs text-muted-foreground mt-1">Promoters (9-10)</div>
            <div className="text-[10px] text-emerald-500 mt-2">Likely to recommend</div>
          </div>
          <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
            <div className="text-3xl font-black text-yellow-500">{passives}%</div>
            <div className="text-xs text-muted-foreground mt-1">Passives (7-8)</div>
            <div className="text-[10px] text-yellow-500 mt-2">Satisfied but vulnerable</div>
          </div>
          <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20">
            <div className="text-3xl font-black text-destructive">{detractors}%</div>
            <div className="text-xs text-muted-foreground mt-1">Detractors (0-6)</div>
            <div className="text-[10px] text-destructive mt-2">May discourage others</div>
          </div>
        </div>
      </div>

      {/* Priority Matrix */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-base font-bold text-foreground mb-6">Priority Matrix</h3>
        
        <div className="relative aspect-square max-w-lg mx-auto border-l-2 border-b-2 border-border/50 m-4">
          {/* Axis labels */}
          <span className="absolute -left-16 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-black uppercase text-muted-foreground tracking-widest whitespace-nowrap">
            Performance
          </span>
          <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
            Importance
          </span>
          
          {/* Quadrant labels */}
          <div className="absolute top-4 right-4 text-[9px] font-black uppercase opacity-40 text-muted-foreground">Maintain</div>
          <div className="absolute top-4 left-4 text-[9px] font-black uppercase opacity-60 text-emerald-500">Opportunity</div>
          <div className="absolute bottom-4 left-4 text-[9px] font-black uppercase opacity-40 text-muted-foreground">Low Priority</div>
          <div className="absolute bottom-4 right-4 text-[9px] font-black uppercase opacity-60 text-destructive">Critical Focus</div>
          
          {/* Grid lines */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-[1px] bg-border/30" />
            <div className="h-full w-[1px] bg-border/30 absolute" />
          </div>

          {/* Driver points */}
          {npsDrivers.map((d, i) => (
            <div 
              key={i} 
              className={`absolute w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all cursor-default hover:scale-125 hover:z-10 ${
                d.impact === 'positive' 
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                  : 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
              }`} 
              style={{
                left: `${d.importance * 100}%`, 
                bottom: `${d.performance}%`, 
                transform: 'translate(-50%, 50%)'
              }}
              title={`${d.attribute}: Performance ${d.performance}%, Importance ${Math.round(d.importance * 100)}%`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Driver Details Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-base font-bold text-foreground">Driver Performance Details</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-secondary/30">
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground w-12">#</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Attribute</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Performance</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Importance</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Impact</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {npsDrivers.map((driver, idx) => {
              const priority = driver.importance >= 0.7 && driver.performance < 60 ? 'Critical' :
                               driver.importance >= 0.7 ? 'Maintain' :
                               driver.performance < 60 ? 'Improve' : 'Monitor';
              const priorityColor = priority === 'Critical' ? 'text-destructive' :
                                   priority === 'Maintain' ? 'text-emerald-500' :
                                   priority === 'Improve' ? 'text-yellow-500' : 'text-muted-foreground';
              
              return (
                <TableRow key={driver.attribute} className="border-b border-border hover:bg-secondary/30">
                  <TableCell>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      driver.impact === 'positive' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-destructive/20 text-destructive'
                    }`}>
                      {idx + 1}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-foreground">{driver.attribute}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className={`text-lg font-black ${driver.performance >= 60 ? 'text-emerald-500' : 'text-yellow-500'}`}>
                        {driver.performance}%
                      </span>
                      <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden mt-1">
                        <div 
                          className={`h-full rounded-full ${driver.performance >= 60 ? 'bg-emerald-500' : 'bg-yellow-500'}`}
                          style={{ width: `${driver.performance}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-lg font-black text-foreground">{Math.round(driver.importance * 100)}%</span>
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
                  <TableCell className="text-center">
                    <span className={`text-xs font-bold uppercase ${priorityColor}`}>{priority}</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Focus */}
        <div className="glass-card p-6 rounded-2xl border-l-4 border-l-destructive">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={20} className="text-destructive" />
            <h4 className="text-sm font-bold text-foreground">Critical Focus Areas</h4>
          </div>
          {priorityDrivers.length > 0 ? (
            <div className="space-y-3">
              {priorityDrivers.map((d) => (
                <div key={d.attribute} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                  <span className="text-sm font-medium text-foreground">{d.attribute}</span>
                  <span className="text-sm font-black text-destructive">{d.performance}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No critical focus areas identified.</p>
          )}
        </div>

        {/* Strengths */}
        <div className="glass-card p-6 rounded-2xl border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle size={20} className="text-emerald-500" />
            <h4 className="text-sm font-bold text-foreground">Competitive Strengths</h4>
          </div>
          {strengthDrivers.length > 0 ? (
            <div className="space-y-3">
              {strengthDrivers.map((d) => (
                <div key={d.attribute} className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg">
                  <span className="text-sm font-medium text-foreground">{d.attribute}</span>
                  <span className="text-sm font-black text-emerald-500">{d.performance}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No standout strengths identified yet.</p>
          )}
        </div>
      </div>

      {/* Insight Card */}
      <div className="glass-card p-6 rounded-2xl border-l-4 border-l-primary bg-primary/5">
        <div className="flex items-start gap-4">
          <Lightbulb size={20} className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-foreground mb-2">NPS Strategy Insight</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {nps.value >= 50 
                ? `Excellent NPS of ${nps.value} positions ${selectedBankName} as a market leader. Focus on maintaining ${strengthDrivers.map(d => d.attribute).join(', ')} while converting passives to promoters.`
                : nps.value >= 0 
                  ? `NPS of ${nps.value} shows room for improvement. Prioritize ${priorityDrivers.length > 0 ? priorityDrivers.map(d => d.attribute).join(', ') : 'service quality and customer experience'} to move detractors to passives and passives to promoters.`
                  : `Negative NPS of ${nps.value} requires immediate attention. Address critical pain points in ${priorityDrivers.length > 0 ? priorityDrivers.map(d => d.attribute).join(', ') : 'customer service'} and implement recovery programs.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
