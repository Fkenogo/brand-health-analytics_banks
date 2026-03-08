# Subscriber Dashboard Module Alignment Tracker

This tracker is the execution log for module-by-module alignment against:
- `Master_Implementation_Guide.md`
- `Brand_Health_Dashboard_Recommendations.md` (Part 3 architecture)
- Dashboard methodology, worked examples, and playbook documents

## Global Validation Gate (apply after each module)
- [x] Build passes (`npm run build`)
- [x] Tests pass (`npm run test`)
- [x] Preview runs (`npm run preview`)
- [ ] Manual smoke check confirms expected metrics and navigation

## Module Sequence

### 1) Awareness & Consideration
- [x] Review methodology + worked examples + implementation references
- [x] Align formulas to live questionnaire fields in code
- [x] Add awareness change indicators vs previous period
- [x] Add brand ranking table with movement indicators
- [x] Add future intent summary and intent distribution view
- [x] Add Share of Voice metric
- [x] Add Month-to-Month growth metric
- [x] Add Awareness Share Index metric
- [x] Add Awareness Depth Score metric
- [x] Add contextual info icons (definition + calculation) for awareness metrics
- [x] Add hidden "View insights" interactions for awareness report groups
- [x] Run build + test + preview and verify
- [x] Mark module complete

### 2) Usage & Behavior
- [x] Review usage methodology and align core formulas
- [x] Implement usage funnel (Aware -> Ever Used -> Current -> BUMO)
- [x] Add trial rate, lapsed usage, retention/churn, preference chain
- [x] Add multiple-banking analysis and competitive overlap
- [x] Add usage-based segmentation (non-triers, lapsed, secondary, primary)
- [x] Add drop-off analysis and friction scoring by stage
- [x] Add funnel health diagnosis and competitive position matrix
- [x] Add growth opportunity sizing table
- [x] Add usage metric info icons + hidden insights CTA panels
- [x] Run build + test + preview and verify
- [x] Mark module complete

### 3) Loyalty & Satisfaction
- [x] Review loyalty methodology and segmentation logic
- [x] Loyalty segmentation analysis (Committed, Favors, Potential, Accessibles, Rejectors) with descriptors
- [x] Segmentation decision-tree analysis visualization
- [x] Loyalty Index and NPS with metric descriptors
- [x] Segment Movement Tracker (current vs previous period)
- [x] Segment Profile Cards (size, avg NPS, avg intent, demo profile, multi-bank behavior)
- [x] Conversion funnel (Aware -> Potential -> Favors -> Committed) with conversion rates
- [x] Add loyalty metric info icons + hidden insights CTA panels
- [x] Run build + test + preview and verify
- [x] Mark module complete

### 4) Brand Momentum
- [x] Review `Brand_Momentum_Methodology.md` and validate component weights/formulas
- [x] Implement full 5-component momentum breakdown
- [x] Add momentum interpretation bands and pattern diagnostics
- [x] Add momentum drivers (contribution + priority guidance)
- [x] Add momentum trajectory + velocity + volatility summaries
- [x] Add competitive momentum comparison view
- [x] Add metric info icons + hidden insights CTA panels
- [x] Run build + test + preview and verify
- [x] Mark module complete

### 5) Competitive Intelligence
- [x] Review `Competitive_Intelligence_Methodology.md` and map available data vs required analyses
- [x] Implement market structure + concentration + SOV vs market share views
- [x] Implement overlap, competitive set, and position mapping
- [x] Implement win/loss proxy analysis where direct switching data is unavailable
- [x] Implement threat signals and response-oriented insights
- [x] Add metric info icons + hidden insights CTA panels
- [x] Run build + test + preview and verify
- [x] Mark module complete

### 6) Geographic Analysis
- [x] Removed from Subscriber Dashboard scope (cross-country competitive dynamics deferred)

### 7) Demographics
- [x] Add segmentable demographic profile analysis by key metrics
- [x] Add demographic gap/opportunity diagnostics
- [x] Add cohort-level comparisons (age, gender, employment, education)
- [x] Add metric info icons + hidden insights CTA panels
- [x] Run build + test + preview and verify
- [x] Mark module complete

### 8) Trends & Forecasts
- [x] Review `Trends_Forecasts_Methodology.md` and align trend formulas (MoM, QoQ, YoY)
- [x] Add growth, volatility, and stability diagnostics
- [x] Add forecasting layer (moving average / simple projection) with confidence guidance
- [x] Add trend significance and signal-vs-noise interpretation
- [x] Add metric info icons + hidden insights CTA panels
- [x] Run build + test + preview and verify
- [x] Mark module complete
