# BrandEdge Metric Dictionary

Generated: 2026-05-01

Scope: global BrandEdge analytics methodology for all countries and survey markets. This document is diagnostic and contractual only; no formula implementation changed when it was created.

## Base Definitions

| Base Type | Definition | Use For | Do Not Use For |
|---|---|---|---|
| Universal Qualified Base | All analytics-qualified respondents after the active country, market, date, and dashboard filters are applied. | Topline penetration, comparative rankings, market share, BrandEdge topline inputs, momentum topline inputs, and cross-brand comparison. | Funnel conversion diagnostics where the question is explicitly conditional on prior awareness, usage, or preference. |
| Conditional Base | A named subset of qualified respondents, such as aware respondents, ever-used respondents, current users, active bank customers, respondents with NPS, or aware non-users. | Funnel conversion, usage conversion, preference capture, loyalty conversion, NPS among users, switching risk, and intent diagnostics. | Topline market penetration or cross-brand share unless the metric label explicitly says "among..." and the denominator is shown. |
| Segment Base | Qualified respondents inside a demographic, cohort, or behavioral segment after active filters are applied. | Cohort penetration, cohort gaps, age/gender/employment/education diagnostics, and within-segment comparisons. | Overall market penetration or all-market rankings. |

## Global Rules

1. A percentage must have a single published denominator in its metric contract.
2. Topline brand penetration metrics use the Universal Qualified Base, even when a conditional version is also useful diagnostically.
3. Conditional metrics must be named with their base, for example `Consideration among aware` or `NPS among users`.
4. Segment metrics use the Segment Base and must carry segment `n`.
5. Aggregate and raw paths must produce the same numerator, denominator, and base type for the same metric ID and filter scope.
6. No aggregate output is valid when a numerator exceeds its declared denominator.
7. Survey weights are currently not applied. If weights are introduced, every metric must publish both unweighted `n` and weighted denominator.

## Overview

| Metric Name | Module | Formula | Numerator | Denominator | Base Type | Business Rationale | Notes / Caveats |
|---|---|---|---|---|---|---|---|
| Qualified Sample Size | Overview | Count of analytics-qualified respondents | Qualified respondents after filters | Not applicable | Universal Qualified Base | Defines the market base for all topline comparisons. | Must match every universal-base denominator in the same filter context. |
| BrandEdge Score | Overview | Weighted composite of standardized inputs | Component scores | Component-specific contract | Mixed, must be published | Single executive index for brand health. | Inputs must be split into universal penetration inputs and diagnostic conditional inputs before refactor. |
| Total Awareness Penetration | Overview | Aware respondents / qualified respondents | Respondents aware of bank by top-of-mind OR spontaneous OR prompted/checked awareness | Universal Qualified Base | Universal Qualified Base | Measures market reach of brand memory and recognition. | Should never exceed 100%. |
| Current Usage Penetration | Overview | Current users / qualified respondents | Respondents currently using bank | Universal Qualified Base | Universal Qualified Base | Measures current market penetration. | Diagnostic usage among aware belongs in Usage module. |
| Preferred / Primary Share | Overview | Preferred respondents / qualified respondents | Respondents naming bank as preferred or primary | Universal Qualified Base | Universal Qualified Base | Measures primary relationship share in the whole market. | If multiple primary fields exist, mapping must be canonicalized. |
| Market Share | Overview | Preferred respondents / qualified respondents | Preferred / primary bank count | Universal Qualified Base | Universal Qualified Base | Standard comparative share metric. | Same as preferred share unless product defines weighted wallet share separately. |
| Loyalty Index | Overview | Weighted loyalty segment score | Loyalty segment weights among eligible respondents | Conditional loyalty base | Conditional Base | Measures quality of relationship among respondents with enough brand relationship data. | Must not be presented as market penetration. |
| NPS | Overview | % promoters - % detractors | Users with NPS score, classified 9-10 and 0-6 | Users with valid NPS | Conditional Base | Measures satisfaction and advocacy among customers. | Base should be users or ever-used respondents, not all qualified respondents. |
| Momentum Score | Overview | Weighted change or momentum composite | Momentum components | Component-specific trend windows | Mixed, must be published | Shows directional brand health. | Topline momentum inputs should use universal penetration metrics; conversion components remain diagnostic. |
| Switching Risk | Overview | At-risk current users / current users | Current users with negative intent, low NPS, or stated switch risk | Current users with required signal | Conditional Base | Flags retention vulnerability. | It is a diagnostic, not a market penetration measure. |

## Awareness and Consideration

| Metric Name | Module | Formula | Numerator | Denominator | Base Type | Business Rationale | Notes / Caveats |
|---|---|---|---|---|---|---|---|
| Top of Mind Penetration | Awareness | Top-of-mind mentions / qualified respondents | Respondents naming bank first | Universal Qualified Base | Universal Qualified Base | Captures strongest unaided salience. | Source field currently maps to `c1_recognized_bank_id`. |
| Spontaneous Recall Penetration | Awareness | Spontaneous mentions / qualified respondents | Respondents naming bank in top-of-mind or spontaneous list | Universal Qualified Base | Universal Qualified Base | Captures unaided recall beyond first mention. | Must use union logic per respondent, not sum of fields. |
| Prompted / Checked Awareness Penetration | Awareness | Checked awareness / qualified respondents | Respondents selecting bank in prompted awareness checklist | Universal Qualified Base | Universal Qualified Base | Captures recognized awareness after prompt. | Current label "aided" is misleading if checklist is total prompted awareness. |
| Total Awareness Penetration | Awareness | Unique aware respondents / qualified respondents | Union of top-of-mind, spontaneous, and prompted/checked aware respondents | Universal Qualified Base | Universal Qualified Base | Standard brand awareness reach. | Must deduplicate respondent-bank pairs across awareness fields. |
| Awareness Quality | Awareness | Top-of-mind aware respondents / total aware respondents | Respondents with bank top-of-mind | Respondents aware of bank | Conditional Base | Measures depth of salience among the aware audience. | Diagnostic only; can be high for small brands. |
| Share of Voice | Awareness | Bank top-of-mind mentions / all bank top-of-mind mentions | Top-of-mind mentions for bank | Top-of-mind mentions for all banks in scope | Universal Qualified Base | Compares salience share across brands. | Denominator is a market mention total, not a respondent base; compute from raw counts. |
| Awareness Share Index | Awareness | Bank awareness count / total bank awareness counts | Aware respondent-bank pairs for bank | Aware respondent-bank pairs across all brands | Universal Qualified Base | Shows share of total awareness mentions. | Multi-select denominator can exceed respondent count; label as share of awareness mentions. |
| Awareness Depth Score | Awareness | Weighted salience score / qualified respondents | Weighted top-of-mind, spontaneous, and prompted awareness signals | Universal Qualified Base | Universal Qualified Base | Converts awareness strength into one comparative score. | Weights must be globally documented. |
| Consideration Penetration | Awareness | Considerers / qualified respondents | Respondents with future intent or consideration signal for bank | Universal Qualified Base | Universal Qualified Base | Topline market consideration for the brand. | This is the global topline metric required by methodology. |
| Consideration among Aware | Awareness | Considerers / aware respondents | Aware respondents with future intent or consideration signal | Respondents aware of bank | Conditional Base | Diagnostic conversion from awareness to consideration. | Must be named separately from consideration penetration. |
| Average Intent among Aware | Awareness | Mean intent score | Sum of future intent scores for aware respondents | Aware respondents with intent score | Conditional Base | Measures strength of future demand among those who know the brand. | Publish valid-score `n`. |
| High Intent Non-Users | Awareness | High-intent aware non-users / aware non-users | Aware non-users with high intent | Aware respondents not currently using bank | Conditional Base | Identifies acquisition opportunity. | Threshold must be global, currently aligned to high intent scores. |
| At-Risk Current Users | Awareness | At-risk current users / current users | Current users with low intent or risk signals | Current users with required signal | Conditional Base | Identifies retention risk. | Belongs to diagnostics, not topline consideration. |
| Awareness Ranking | Awareness | Rank by total awareness penetration | Bank awareness percentage | Universal Qualified Base | Universal Qualified Base | Orders brands by market reach. | Rankings must fail closed if any row has value > 100%. |

## Usage and Behavior

| Metric Name | Module | Formula | Numerator | Denominator | Base Type | Business Rationale | Notes / Caveats |
|---|---|---|---|---|---|---|---|
| Ever Used Penetration | Usage | Ever-used respondents / qualified respondents | Respondents who have ever used bank | Universal Qualified Base | Universal Qualified Base | Measures trial penetration in the market. | Current config describes aware base in places; contract should be universal. |
| Current Usage Penetration | Usage | Current users / qualified respondents | Respondents currently using bank | Universal Qualified Base | Universal Qualified Base | Measures active customer penetration. | Distinct from current usage among aware. |
| Preferred / Primary Share | Usage | Preferred respondents / qualified respondents | Respondents naming bank as preferred or primary | Universal Qualified Base | Universal Qualified Base | Measures primary relationship share. | Also feeds market share. |
| Consideration Penetration | Usage | Considerers / qualified respondents | Respondents considering bank | Universal Qualified Base | Universal Qualified Base | Allows usage funnel to show future demand as market penetration. | Keep separate from consideration among aware. |
| Trial Conversion | Usage | Ever-used aware respondents / aware respondents | Aware respondents who have ever used bank | Respondents aware of bank | Conditional Base | Measures conversion from awareness to trial. | Diagnostic funnel metric. |
| Current Usage among Aware | Usage | Current aware users / aware respondents | Aware respondents currently using bank | Respondents aware of bank | Conditional Base | Measures activation among people who know the brand. | Should not be labeled current usage penetration. |
| BUMO among Aware | Usage | Preferred aware respondents / aware respondents | Aware respondents naming bank as preferred | Respondents aware of bank | Conditional Base | Measures strongest brand relationship among aware market. | If BUMO means primary share, use universal denominator for topline. |
| Retention Conversion | Usage | Current users / ever-used respondents | Current users of bank | Ever-used respondents for bank | Conditional Base | Measures retention from trial to current relationship. | Requires `ever >= current` invariant or explicit exception handling. |
| Churn / Lapsed Usage | Usage | Ever-used non-current respondents / ever-used respondents | Ever-used respondents not currently using bank | Ever-used respondents for bank | Conditional Base | Measures leakage after trial. | Complement of retention when mappings are clean. |
| Preference Capture | Usage | Preferred respondents / current users | Respondents naming bank preferred | Current users of bank | Conditional Base | Measures ability to become main bank among users. | Diagnostic conversion metric. |
| Multi-Banking Rate | Usage | Multi-bank current users / active current users | Respondents currently using 2+ banks | Respondents currently using any bank | Conditional Base | Measures category behavior and relationship fragmentation. | For selected-brand diagnostics, denominator may be current users of selected brand and must be labeled. |
| Average Banks per User | Usage | Current bank relationships / active current users | Count of current bank relationships | Respondents currently using any bank | Conditional Base | Measures portfolio breadth. | Not a brand penetration metric. |
| Single / Dual / Three Plus User Mix | Usage | User group count / active current users | Active users by number of current banks | Respondents currently using any bank | Conditional Base | Describes market behavior structure. | Segment by selected brand only when label says selected users. |
| Primary in Multi-Bankers | Usage | Preferred selected-bank multi-bankers / selected multi-bank users | Multi-bank current users naming selected bank primary | Multi-bank current users of selected bank | Conditional Base | Measures primary position under multi-banking. | Requires selected brand context. |
| Usage Overlap | Usage | Users of selected and competitor / selected current users | Selected current users also using competitor | Current users of selected bank | Conditional Base | Shows competitive co-usage. | Not a market share metric. |
| Friction Score | Usage | Standardized usage risk composite | Lapsed, low intent, low NPS, or low preference signals | Eligible users with required fields | Conditional Base | Highlights usage pain or conversion blockers. | Component weights must be published. |
| Position Matrix | Usage | Awareness penetration vs usage penetration | Awareness and current usage values | Universal Qualified Base | Universal Qualified Base | Maps brand reach against adoption. | Diagnostic quadrants should use universal penetration axes. |
| Growth Opportunity | Usage | Awareness penetration - current usage penetration | Aware respondents less current users | Universal Qualified Base | Universal Qualified Base | Estimates headroom between reach and active usage. | Interpret as opportunity, not conversion rate. |

## Loyalty and Satisfaction

| Metric Name | Module | Formula | Numerator | Denominator | Base Type | Business Rationale | Notes / Caveats |
|---|---|---|---|---|---|---|---|
| Loyalty Segment Distribution | Loyalty | Segment respondents / loyalty-eligible respondents | Respondents classified as Committed, Favors, Potential, Accessibles, or Rejectors | Loyalty-eligible respondents | Conditional Base | Explains customer relationship quality. | Current code often uses aware respondents; confirm eligibility definition globally. |
| Loyalty Index | Loyalty | Weighted segment score / eligible respondents | Sum of segment weights | Loyalty-eligible respondents | Conditional Base | Summarizes loyalty quality. | Publish segment weights and base. |
| Committed Share | Loyalty | Committed respondents / loyalty-eligible respondents | Respondents in Committed segment | Loyalty-eligible respondents | Conditional Base | Measures strongest relationship group. | Diagnostic only. |
| Favors Share | Loyalty | Favors respondents / loyalty-eligible respondents | Respondents in Favors segment | Loyalty-eligible respondents | Conditional Base | Measures positive but less committed audience. | Diagnostic only. |
| Potential Share | Loyalty | Potential respondents / loyalty-eligible respondents | Respondents in Potential segment | Loyalty-eligible respondents | Conditional Base | Indicates up-sell or conversion opportunity. | Diagnostic only. |
| Accessibles Share | Loyalty | Accessibles respondents / loyalty-eligible respondents | Respondents in Accessibles segment | Loyalty-eligible respondents | Conditional Base | Indicates reachable but weak relationship. | Diagnostic only. |
| Rejectors Share | Loyalty | Rejectors / loyalty-eligible respondents | Respondents in Rejectors segment | Loyalty-eligible respondents | Conditional Base | Measures negative relationship risk. | Diagnostic only. |
| NPS among Users | Loyalty | % promoters - % detractors | Users or ever-used respondents with valid NPS | Users or ever-used respondents with valid NPS | Conditional Base | Measures customer advocacy. | Align all modules to same user base. |
| Satisfaction Driver Score | Loyalty | Mean driver score | Sum of driver scores | Respondents eligible for driver question | Conditional Base | Identifies service strengths and weaknesses. | Publish valid response count per driver. |
| Loyalty Conversion | Loyalty | Higher-loyalty users / eligible users | Respondents reaching target loyalty segment | Eligible users or aware respondents | Conditional Base | Measures movement through loyalty funnel. | Must name the starting base. |
| Segment Movement | Loyalty | Change in segment share over time | Current period segment share - previous period segment share | Matching conditional base by period | Conditional Base | Tracks loyalty improvement or decline. | Requires consistent period filters and base. |

## Brand Momentum

| Metric Name | Module | Formula | Numerator | Denominator | Base Type | Business Rationale | Notes / Caveats |
|---|---|---|---|---|---|---|---|
| Brand Momentum Score | Momentum | Weighted standardized momentum inputs | Momentum component values | Component-specific base and time window | Mixed, must be published | Summarizes direction and strength of brand movement. | Split into topline penetration inputs and diagnostic conversion inputs. |
| Awareness Growth | Momentum | Current awareness penetration - prior awareness penetration | Awareness penetration change | Universal Qualified Base per period | Universal Qualified Base | Tracks market reach movement. | Use comparable periods and filters. |
| Consideration Penetration Input | Momentum | Consideration penetration / qualified respondents | Considerers | Universal Qualified Base | Universal Qualified Base | Required topline momentum input. | Replaces conditional consideration when used as topline. |
| Current Usage Penetration Input | Momentum | Current users / qualified respondents | Current users | Universal Qualified Base | Universal Qualified Base | Tracks adoption movement. | Use universal base for comparative momentum. |
| Preferred Share Input | Momentum | Preferred respondents / qualified respondents | Preferred respondents | Universal Qualified Base | Universal Qualified Base | Tracks primary relationship movement. | Also market share input. |
| Trial Conversion Input | Momentum | Ever-used aware respondents / aware respondents | Ever-used aware respondents | Aware respondents | Conditional Base | Diagnostic conversion component. | Do not mix into universal topline without label. |
| Retention Input | Momentum | Current users / ever-used respondents | Current users | Ever-used respondents | Conditional Base | Diagnostic retention component. | Useful but not market penetration. |
| Preference Capture Input | Momentum | Preferred respondents / current users | Preferred respondents | Current users | Conditional Base | Diagnostic primary relationship conversion. | Current code calls this adoption in places. |
| Momentum Velocity | Momentum | Period-over-period score change | Current momentum score - prior score | Comparable time windows | Conditional Base | Measures acceleration or decline. | Depends on score contract. |
| Forecast Momentum | Momentum | Forecasted future metric value | Forecast model output | Historical time-series window | Conditional Base | Projects likely direction. | Must publish model and confidence. |
| Volatility / Stability | Momentum | Standard deviation, CV, reversal rate | Variation in time-series points | Historical time-series window | Conditional Base | Distinguishes signal from noise. | Not respondent-denominator based. |

## Competitive Intelligence

| Metric Name | Module | Formula | Numerator | Denominator | Base Type | Business Rationale | Notes / Caveats |
|---|---|---|---|---|---|---|---|
| Market Share | Competitive | Preferred respondents / qualified respondents | Preferred respondents by bank | Universal Qualified Base | Universal Qualified Base | Core market position metric. | Preferred shares may sum below 100% if some respondents have no preferred bank. |
| Awareness Ranking | Competitive | Rank by total awareness penetration | Aware respondents by bank | Universal Qualified Base | Universal Qualified Base | Compares reach across competitors. | Must use deduplicated awareness. |
| Current Usage Ranking | Competitive | Rank by current usage penetration | Current users by bank | Universal Qualified Base | Universal Qualified Base | Compares active usage reach. | Multi-bank current usage can sum above 100% across banks. |
| Preferred Ranking | Competitive | Rank by preferred / primary share | Preferred respondents by bank | Universal Qualified Base | Universal Qualified Base | Compares primary relationship strength. | Single preferred field should generally sum <= 100%. |
| HHI | Competitive | Sum of squared market shares | Squared preferred shares | Market preferred share distribution | Universal Qualified Base | Measures market concentration. | Uses market shares from universal base. |
| Share of Voice Gap | Competitive | Share of voice - market share | Difference between top-of-mind SOV and preferred share | Matching market scope | Universal Qualified Base | Shows whether salience over- or under-converts to share. | SOV denominator is mentions; market share denominator is respondents. |
| Average Banks per Active Customer | Competitive | Current bank relationships / active current users | Current bank relationship count | Respondents currently using any bank | Conditional Base | Measures category fragmentation. | Not a brand topline metric. |
| Multi-Banking among Active Customers | Competitive | Active users with 2+ current banks / active current users | Multi-bank current users | Respondents currently using any bank | Conditional Base | Measures competitive overlap potential. | Can be segmented by selected bank with a narrower denominator. |
| Competitive Overlap | Competitive | Selected and competitor users / selected current users | Selected users also using competitor | Current users of selected bank | Conditional Base | Identifies direct relationship overlap. | Requires selected brand. |
| Estimated Wallet Share | Competitive | 1 / number of current banks, averaged | Estimated selected bank wallet allocation | Selected current users | Conditional Base | Proxy for relationship depth where actual balances are unavailable. | Must be labeled as estimated proxy. |
| Win Rate | Competitive | Selected wins / observed or proxy transitions | Respondents switching/preference-moving to selected bank | Respondents with observed or inferred switching event | Conditional Base | Shows competitive acquisition. | Proxy and observed win rates must not be merged silently. |
| Loss Rate | Competitive | Selected losses / observed or proxy transitions | Respondents switching/preference-moving away from selected bank | Respondents with observed or inferred switching event | Conditional Base | Shows competitive leakage. | Same source caveat as win rate. |
| Relative Strength Index | Competitive | Standardized composite vs competitors | Awareness, usage, share, loyalty, momentum components | Published component bases | Mixed, must be published | Provides comparative strength view. | Current implementation mixes universal and conditional metrics. |
| White Space Segment Penetration | Competitive | Segment preferred or usage count / segment respondents | Segment respondents using or preferring bank | Segment Base | Segment Base | Finds underpenetrated cohorts. | Requires segment `n` and minimum sample guard. |
| Threat Indicator | Competitive | Weighted competitor overlap/risk signals | Competitor share, overlap, and switching-risk signals | Component-specific bases | Mixed, must be published | Flags competitive risk. | Separate market threats from customer-base threats. |

## Demographics and Cohorts

| Metric Name | Module | Formula | Numerator | Denominator | Base Type | Business Rationale | Notes / Caveats |
|---|---|---|---|---|---|---|---|
| Demographic Sample Size | Demographics | Count of qualified respondents in demographic scope | Qualified respondents after filters | Universal Qualified Base | Universal Qualified Base | Reconciles demographics with overview. | Must equal overview qualified sample in same filter context. |
| Segment Size | Demographics | Segment respondents / qualified respondents | Respondents in age, gender, employment, or education segment | Universal Qualified Base | Universal Qualified Base | Shows composition of the surveyed market. | This is a distribution metric; brand cohort penetration rows below use Segment Base. |
| Age Cohort Awareness Penetration | Demographics | Aware respondents in age cohort / age cohort respondents | Cohort respondents aware of bank | Segment Base | Segment Base | Measures reach within age segment. | Deduplicate awareness fields per respondent. |
| Gender Penetration | Demographics | Brand respondents in gender segment / gender segment respondents | Segment respondents aware, using, or preferring bank | Segment Base | Segment Base | Compares brand position by gender. | Metric name must say awareness, usage, or preference. |
| Employment Segment Penetration | Demographics | Brand respondents in employment segment / employment segment respondents | Segment respondents aware, using, or preferring bank | Segment Base | Segment Base | Identifies professional cohort strengths. | Use unknown bucket for missing data. |
| Education Segment Penetration | Demographics | Brand respondents in education segment / education segment respondents | Segment respondents aware, using, or preferring bank | Segment Base | Segment Base | Identifies education cohort strengths. | Use unknown bucket for missing data. |
| Cohort Current Usage Penetration | Demographics | Current users in cohort / cohort respondents | Cohort respondents currently using bank | Segment Base | Segment Base | Measures adoption within cohort. | Multi-bank usage can sum above 100% across banks. |
| Cohort Preferred Share | Demographics | Preferred respondents in cohort / cohort respondents | Cohort respondents naming bank preferred | Segment Base | Segment Base | Measures primary share within cohort. | Usually sums <= 100% within cohort. |
| Cohort NPS | Demographics | % promoters - % detractors in cohort | Cohort users with valid NPS | Cohort users or ever-users with valid NPS | Conditional Base | Measures satisfaction by cohort. | This is both segment-scoped and conditional; publish both segment `n` and NPS `n`. |
| Cohort Intent | Demographics | Mean or high-intent rate in cohort | Cohort respondents with intent signal | Eligible cohort respondents | Conditional Base | Shows future demand by segment. | If used as penetration, denominator must be cohort population. |
| Cohort Multi-Banking | Demographics | Multi-bank users in cohort / active users in cohort | Cohort users with 2+ current banks | Cohort current users | Conditional Base | Describes behavior within cohort. | Not a population penetration metric. |
| Usage Gap | Demographics | Best segment penetration - selected segment penetration | Difference between segment penetration values | Segment Base | Segment Base | Highlights underpenetrated segments. | Requires minimum segment size guard. |

## Trends and Forecasts

| Metric Name | Module | Formula | Numerator | Denominator | Base Type | Business Rationale | Notes / Caveats |
|---|---|---|---|---|---|---|---|
| Monthly Awareness Trend | Trends | Monthly aware respondents / monthly qualified respondents | Aware respondents in month | Universal Qualified Base for month | Universal Qualified Base | Tracks awareness reach over time. | Empty historical aggregate buckets must be excluded. |
| Monthly Usage Trend | Trends | Monthly current users / monthly qualified respondents | Current users in month | Universal Qualified Base for month | Universal Qualified Base | Tracks adoption over time. | Raw and aggregate paths must match month boundaries. |
| Monthly Preferred Share Trend | Trends | Monthly preferred respondents / monthly qualified respondents | Preferred respondents in month | Universal Qualified Base for month | Universal Qualified Base | Tracks primary share over time. | Stable preferred mapping required. |
| Month-over-Month Change | Trends | Current month metric - previous month metric | Difference in metric values | Comparable monthly metric values | Conditional Base | Detects short-term movement. | Denominator belongs to the underlying metric. |
| Quarter-over-Quarter Change | Trends | Current quarter average - prior quarter average | Difference in quarterly averages | Comparable monthly or quarterly values | Conditional Base | Smooths short-term noise. | Underlying metric base must be consistent. |
| Year-over-Year Change | Trends | Current month - same month prior year | Difference in values | Comparable monthly values | Conditional Base | Controls for seasonality. | Requires enough history. |
| YTD Average | Trends | Sum of monthly values / count of months | Monthly metric values | Months in year-to-date window | Conditional Base | Summarizes current-year performance. | Underlying metric base must be consistent. |
| CAGR | Trends | ((Ending / beginning)^(1/years) - 1) | Beginning and ending metric values | Trend horizon | Conditional Base | Annualized growth measure. | Use only for non-negative metrics with sufficient horizon. |
| Volatility CV | Trends | Standard deviation / mean | Variation of metric values | Historical time-series values | Conditional Base | Quantifies noise. | Not respondent-base based. |
| Stability Score | Trends | 100 - normalized volatility/reversal penalty | Trend stability components | Historical time-series values | Conditional Base | Helps interpret reliability of changes. | Publish algorithm. |
| Forecast Value | Trends | Model forecast for next period | Forecast model output | Historical time-series window | Conditional Base | Planning estimate. | Publish model used: moving average, weighted average, regression, exponential, or seasonal. |
| Forecast Confidence | Trends | Confidence interval or confidence score | Forecast uncertainty estimate | Historical residuals or model fit inputs | Conditional Base | Communicates forecast reliability. | Must not be confused with respondent confidence. |
| Trend Signal | Trends | Recent change compared with normal variation | Recent movement magnitude | Historical standard deviation or noise threshold | Conditional Base | Separates signal from noise. | Requires sufficient history and stable base. |

## Source Field Families

| Metric Family | Canonical Source Fields |
|---|---|
| Qualified base | Country, status/completion, inclusion flags, screening fields, active dashboard filters |
| Top of mind | `c1_recognized_bank_id`, normalized top-of-mind brand field |
| Spontaneous recall | `c2_recognized_bank_ids`, normalized spontaneous brand list |
| Prompted / checked awareness | `c3_aware_banks`, normalized prompted awareness checklist |
| Ever used | `c4_ever_used`, normalized ever-used brand list |
| Current usage | `c5_currently_using`, normalized current bank list |
| Preferred / primary | `preferred_bank`, normalized main/preferred bank field |
| Consideration / intent | `d2_future_intent`, `d3_relevance`, `c9_would_consider`, normalized consideration fields |
| Loyalty / NPS | NPS score fields, satisfaction driver fields, loyalty classification inputs |
| Demographics | Age, gender, employment, education, and normalized unknown buckets |
