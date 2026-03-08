#!/usr/bin/env node

const checklist = [
  'Run `npm run build` and confirm it completes without errors.',
  'Open the dashboard in desktop width (~1440px) and mobile width (~390px).',
  'Verify both surface modes render correctly: `Dark Executive` and `Soft Neutral`.',
  'Switch between every tab and confirm no card overlap, clipping, or horizontal scroll regression.',
  'Confirm Class A KPI cards are visually dominant (size, spacing, hover lift, delta/sparkline legibility).',
  'Confirm Class B cards look secondary and Class C sections are de-emphasized/collapsible.',
  'Check funnel sections: stage order, conversion %, and drop-off labels are readable.',
  'Check Brand Rankings table: sticky header, alternating rows, active brand highlight, movement arrows.',
  'Open at least one insight dialog per tab and verify spacing, icon bullets, border-left accent, and readability.',
  'Hover over major cards and tabs: motion should be subtle and under ~200ms (no flashy transitions).',
  'Confirm filter changes do not break layout and KPI value changes animate cleanly.',
  'Capture before/after screenshots for Overview, Awareness, Usage, and Momentum tabs.',
];

console.log('\nVisual Regression Checklist\n');
checklist.forEach((item, index) => {
  console.log(`${index + 1}. ${item}`);
});
console.log('\nTip: run this checklist after every dashboard styling change.\n');
