import React from 'react';
import type { GuardRenderContext } from '@/utils/sampleGuards';

interface SampleGuardFooterProps {
  removedCount: number;
  context: GuardRenderContext;
}

export function SampleGuardFooter({ removedCount, context }: SampleGuardFooterProps) {
  if (removedCount === 0) return null;

  const minN =
    context === 'ranking' || context === 'chart-diagnostic' ? 10 : 15;

  const noun = removedCount === 1 ? 'segment' : 'segments';

  return (
    <p className="mt-2 text-[11px] text-slate-500">
      {removedCount} {noun} with n &lt; {minN} excluded from this view.
    </p>
  );
}
