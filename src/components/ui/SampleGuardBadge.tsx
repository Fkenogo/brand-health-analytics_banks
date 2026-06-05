import React from 'react';
import { SAMPLE_GUARD_THRESHOLDS, type SampleGuard } from '@/utils/sampleGuards';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SampleGuardBadgeProps {
  guard?: SampleGuard;
  showDirectional?: boolean;
}

export function SampleGuardBadge({ guard, showDirectional = false }: SampleGuardBadgeProps) {
  if (!guard || guard.sampleGuardStatus === 'reliable') return null;

  if (guard.sampleGuardStatus === 'suppressed') {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              aria-label={`Low sample size: n=${guard.n}`}
              className="inline-flex cursor-default items-center rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-800"
            >
              Low N
            </span>
          </TooltipTrigger>
          <TooltipContent>
            n={guard.n} — metrics suppressed (min {SAMPLE_GUARD_THRESHOLDS.display} required)
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (guard.sampleGuardStatus === 'directional' && showDirectional) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              aria-label={`Directional only: n=${guard.n}`}
              className="inline-flex cursor-default items-center rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-600"
            >
              Directional
            </span>
          </TooltipTrigger>
          <TooltipContent>
            n={guard.n} — indicative only, limited sample
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
}
