# Brand Health Dashboards: Complete Implementation Playbook
## Part 3: Competitive Intelligence, Trends, Data Quality

---

# 11. COMPETITIVE INTELLIGENCE

## 11.1 Methodology Summary

### What is Competitive Intelligence?
Deeper analysis of competitive dynamics beyond simple head-to-head comparison.

**Key Analyses:**

**1. Market Share & Concentration**
- Primary bank market share
- HHI (Herfindahl-Hirschman Index) for market concentration

**2. Share of Wallet**
- Multi-banking behavior
- Average banks per customer
- Wallet penetration by bank

**3. Win/Loss Matrix**
- Customer switching patterns
- Where churned customers go
- Where new customers come from

**4. Competitive Set**
- Which banks compete for same customers
- Overlap analysis

**5. White Space Opportunities**
- Underserved segments
- Geographic gaps
- Product gaps

---

## 11.2 Worked Examples

### Example 1: Market Concentration (HHI)

**Market Share Data:**
```
BK: 10.8%
BPR: 12.0%
I&M: 8.0%
EcoBank: 6.0%
Others: 63.2%
```

**HHI Calculation:**
```
HHI = Sum of squared market shares
    = (10.8)² + (12.0)² + (8.0)² + (6.0)² + (63.2)²
    = 116.6 + 144 + 64 + 36 + 3,994.2
    = 4,354.8

Interpretation:
- <1,500: Competitive market
- 1,500-2,500: Moderate concentration
- >2,500: Highly concentrated ← Market is here

Conclusion: Market is moderately concentrated (dominated by "Others")
```

---

### Example 2: Win/Loss Matrix

**Customer Movement Between Banks:**

```
                Gained From          Lost To
        BK    BPR   I&M  |  BK    BPR   I&M
BK      --    30    20   |  --    40    25
BPR     40    --    15   |  30    --    20
I&M     25    20    --   |  20    15    --

BK Net Position:
Gained: 30 (from BPR) + 20 (from I&M) = 50
Lost: 40 (to BPR) + 25 (to I&M) = 65
Net: 50 - 65 = -15 (losing customers) ⚠️

Biggest threat: BPR (net -10 customers)
```

**Action:** Study why customers prefer BPR over BK.

---

### Example 3: Competitive Overlap

**Among BK's 288 current users:**
```
Also use I&M: 130 customers (45% overlap)
Also use BPR: 95 customers (33%)
Also use EcoBank: 80 customers (28%)
BK only: 80 customers (28%)

Insight: 
- I&M is BK's primary competitor (45% overlap)
- 72% of BK customers multi-bank
- Only 28% are exclusive to BK
```

---

### Example 4: White Space - Youth Segment

```
Age 18-24 Market Analysis:

Market penetration: 180 banking (out of 800 youth)
- BK: 14 youth (8% of youth market)
- BPR: 40 youth (22% of youth market) ← Leader
- I&M: 25 youth (14%)

BK share of youth market: 8% (vs 11% overall)
Gap: -3pp vs overall market

Opportunity: Youth segment is underserved by BK
Action: Youth-focused products and marketing
```

---

## 11.3 Implementation

### SQL: Win/Loss Analysis

```sql
-- Track customer movement (requires historical data)
WITH previous_period AS (
    SELECT respondent_id, preferred_bank as prev_bank
    FROM survey_responses
    WHERE survey_period = 'May 2026'
),
current_period AS (
    SELECT respondent_id, preferred_bank as current_bank
    FROM survey_responses
    WHERE survey_period = 'June 2026'
),
switches AS (
    SELECT 
        c.respondent_id,
        p.prev_bank,
        c.current_bank
    FROM current_period c
    INNER JOIN previous_period p ON c.respondent_id = p.respondent_id
    WHERE p.prev_bank != c.current_bank
      AND p.prev_bank IS NOT NULL
      AND c.current_bank IS NOT NULL
)
SELECT 
    prev_bank as lost_from,
    current_bank as gained_by,
    COUNT(*) as switch_count
FROM switches
GROUP BY prev_bank, current_bank
ORDER BY switch_count DESC;
```

### SQL: Market Concentration

```sql
WITH market_shares AS (
    SELECT 
        preferred_bank as bank,
        COUNT(*) * 100.0 / (SELECT COUNT(*) FROM survey_responses 
                           WHERE preferred_bank IS NOT NULL) as market_share
    FROM survey_responses
    WHERE preferred_bank IS NOT NULL
    GROUP BY preferred_bank
)
SELECT 
    bank,
    ROUND(market_share, 1) as share_pct,
    ROUND(POWER(market_share, 2), 0) as squared_share
FROM market_shares
ORDER BY market_share DESC;

-- Calculate HHI
SELECT 
    ROUND(SUM(POWER(market_share, 2)), 0) as hhi,
    CASE 
        WHEN SUM(POWER(market_share, 2)) < 1500 THEN 'Competitive'
        WHEN SUM(POWER(market_share, 2)) < 2500 THEN 'Moderate Concentration'
        ELSE 'Highly Concentrated'
    END as market_type
FROM market_shares;
```

### Python: Competitive Overlap

```python
def competitive_overlap_analysis(df, your_bank):
    """
    Analyze which other banks your customers use
    
    Args:
        df: DataFrame with respondent_id, bank, currently_using
        your_bank: Your bank name
    
    Returns:
        dict with overlap statistics
    """
    # Get your customers
    your_customers = df[
        (df['bank'] == your_bank) & 
        (df['currently_using'] == True)
    ]['respondent_id'].unique()
    
    # Check which other banks they use
    overlaps = {}
    
    for other_bank in df['bank'].unique():
        if other_bank == your_bank:
            continue
        
        # Count your customers who also use other bank
        overlap_count = df[
            (df['respondent_id'].isin(your_customers)) &
            (df['bank'] == other_bank) &
            (df['currently_using'] == True)
        ]['respondent_id'].nunique()
        
        overlap_pct = (overlap_count / len(your_customers)) * 100
        
        overlaps[other_bank] = {
            'count': overlap_count,
            'percentage': round(overlap_pct, 1)
        }
    
    return sorted(overlaps.items(), key=lambda x: x[1]['count'], reverse=True)
```

---

# 12. TIME-BASED TRENDS

## 12.1 Methodology Summary

### What is Trend Analysis?
Track changes over time to identify patterns, seasonality, and trajectory.

**Key Analyses:**

**1. Month-over-Month (MoM)**
- Short-term changes
- Recent performance

**2. Quarter-over-Quarter (QoQ)**
- Medium-term trends
- Seasonal patterns

**3. Year-over-Year (YoY)**
- Long-term growth
- Annual comparisons

**4. Volatility Metrics**
- Standard deviation
- Coefficient of variation

**5. Forecasting**
- Linear projection
- Trend extrapolation

---

## 12.2 Worked Examples

### Example 1: Month-over-Month Awareness

```
Month    Awareness   Change(pp)  Change(%)  Direction
Jan      68%         -           -          Baseline
Feb      70%         +2          +2.9%      ↑
Mar      69%         -1          -1.4%      ↓
Apr      71%         +2          +2.9%      ↑
May      73%         +2          +2.8%      ↑
Jun      75%         +2          +2.7%      ↑

6-Month Summary:
Total change: +7pp (+10.3%)
Average monthly: +1.4pp
Volatility: 2.4 (low - stable growth)
Trend: Positive ✓
```

---

### Example 2: Volatility Analysis

**Monthly Awareness Values:**
```
68, 70, 69, 71, 73, 75

Mean: (68+70+69+71+73+75) ÷ 6 = 71.0

Deviations from mean:
-3, -1, -2, 0, +2, +4

Squared deviations:
9, 1, 4, 0, 4, 16 = 34

Variance: 34 ÷ 6 = 5.67
StdDev: √5.67 = 2.38

Coefficient of Variation (CV):
CV = (2.38 ÷ 71.0) × 100 = 3.4%

Interpretation:
CV < 10% = Low volatility (stable, predictable) ✓
```

---

### Example 3: Year-over-Year Comparison

```
Q1 2025: 62% awareness, +20 NPS
Q1 2026: 70% awareness, +32 NPS

YoY Growth:
Awareness: +8pp (+12.9%)
NPS: +12 points (+60%)

Both metrics show strong YoY improvement
```

---

### Example 4: Seasonality Detection

**Monthly Pattern (2025 data):**
```
Jan: 68% (post-holiday dip)
Feb: 70% (recovery)
Mar-May: 69-73% (stable growth)
Jun-Aug: 75-78% (summer peak)
Sep-Nov: 72-75% (decline)
Dec: 70% (holiday dip)

Pattern: ±5% seasonal variation
Peak: Mid-year (June-August)
Trough: Year-end (December-January)

Action: Increase marketing in low seasons
```

---

### Example 5: Growth Rate Projection

**Calculate CAGR (Compound Annual Growth Rate):**
```
2024: 58% awareness
2026: 75% awareness (2 years)

CAGR = (Ending ÷ Beginning)^(1/years) - 1
     = (75 ÷ 58)^(1/2) - 1
     = (1.293)^0.5 - 1
     = 1.137 - 1
     = 0.137 or 13.7% annual growth

At this rate, 2027 projection:
75% × 1.137 = 85.3% awareness
```

---

## 12.3 Implementation

### SQL: MoM Trends

```sql
WITH monthly_metrics AS (
    SELECT 
        DATE_TRUNC('month', survey_date) as month,
        bank_name,
        AVG(CASE WHEN aware = TRUE THEN 100.0 ELSE 0 END) as awareness,
        AVG(CASE WHEN currently_using = TRUE THEN 100.0 ELSE 0 END) as usage,
        AVG(CASE WHEN nps_score >= 9 THEN 1.0 
                 WHEN nps_score <= 6 THEN -1.0 
                 ELSE 0 END) * 100 as nps
    FROM survey_responses
    WHERE survey_date >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', survey_date), bank_name
),
with_lags AS (
    SELECT 
        month,
        bank_name,
        awareness,
        usage,
        nps,
        LAG(awareness) OVER (PARTITION BY bank_name ORDER BY month) as prev_awareness,
        LAG(usage) OVER (PARTITION BY bank_name ORDER BY month) as prev_usage,
        LAG(nps) OVER (PARTITION BY bank_name ORDER BY month) as prev_nps
    FROM monthly_metrics
)
SELECT 
    month,
    bank_name,
    ROUND(awareness, 1) as current_awareness,
    ROUND(awareness - prev_awareness, 1) as awareness_change_pp,
    ROUND((awareness - prev_awareness) / NULLIF(prev_awareness, 0) * 100, 1) as awareness_change_pct,
    ROUND(usage, 1) as current_usage,
    ROUND(usage - prev_usage, 1) as usage_change_pp,
    ROUND(nps, 0) as current_nps,
    ROUND(nps - prev_nps, 0) as nps_change
FROM with_lags
WHERE prev_awareness IS NOT NULL
ORDER BY bank_name, month;
```

### Python: Trend Calculator

```python
import numpy as np
from scipy import stats

def calculate_trend_metrics(values):
    """
    Calculate comprehensive trend metrics
    
    Args:
        values: list of metric values over time
    
    Returns:
        dict with trend statistics
    """
    # Basic stats
    mean_val = np.mean(values)
    std_dev = np.std(values)
    cv = (std_dev / mean_val * 100) if mean_val != 0 else 0
    
    # Total change
    total_change = values[-1] - values[0]
    pct_change = (total_change / values[0] * 100) if values[0] != 0 else 0
    
    # Average period change
    changes = [values[i] - values[i-1] for i in range(1, len(values))]
    avg_change = np.mean(changes)
    
    # Linear regression for trend
    x = np.arange(len(values))
    slope, intercept, r_value, p_value, std_err = stats.linregress(x, values)
    
    # Determine trend direction
    if slope > 0.5:
        trend = "Strong Upward"
    elif slope > 0.1:
        trend = "Moderate Upward"
    elif abs(slope) <= 0.1:
        trend = "Stable"
    elif slope > -0.5:
        trend = "Moderate Downward"
    else:
        trend = "Strong Downward"
    
    # Forecast next period
    forecast = intercept + slope * len(values)
    
    return {
        'mean': round(mean_val, 1),
        'std_dev': round(std_dev, 2),
        'cv': round(cv, 1),
        'total_change': round(total_change, 1),
        'pct_change': round(pct_change, 1),
        'avg_period_change': round(avg_change, 2),
        'trend_slope': round(slope, 3),
        'trend_direction': trend,
        'r_squared': round(r_value**2, 3),
        'next_period_forecast': round(forecast, 1)
    }

# Usage
awareness_values = [68, 70, 69, 71, 73, 75]
trend = calculate_trend_metrics(awareness_values)
print(f"Trend: {trend['trend_direction']}")
print(f"Forecast: {trend['next_period_forecast']}%")
```

---

# 13. DATA QUALITY & SAMPLE

## 13.1 Methodology Summary

### What is Data Quality?
Ensures reliability, validity, and representativeness of survey data.

**Key Checks:**

**1. Sample Size**
- Adequate responses per period
- Margin of error calculation

**2. Response Quality**
- Completion rate
- Time taken
- Straight-lining detection
- Inconsistency checks

**3. Representativeness**
- Sample vs population demographics
- Weighting requirements

**4. Data Consistency**
- Logical flow validation
- Cross-check responses

---

## 13.2 Worked Examples

### Example 1: Sample Size Adequacy

**Margin of Error Calculation:**
```
Formula: MOE = 1.96 × √(p(1-p)/n)

Where:
p = proportion (e.g., 0.70 for 70% awareness)
n = sample size

Example:
n = 1,000
p = 0.70

MOE = 1.96 × √(0.70 × 0.30 ÷ 1,000)
    = 1.96 × √(0.21 ÷ 1,000)
    = 1.96 × √0.00021
    = 1.96 × 0.0145
    = ±2.8%

At 95% confidence: True awareness is 70% ± 2.8% (67.2%-72.8%)
```

---

### Example 2: Response Rate Tracking

```
Survey invitations: 5,000
Started: 1,500 (30% start rate)
Completed: 1,000 (20% completion rate)

Drop-off: 1,500 - 1,000 = 500 (33% of starters)

Drop-off locations:
- Screening: 200 (40%)
- Mid-survey: 150 (30%)
- Near end: 150 (30%)

Quality assessment:
- 20% completion: Below ideal (target: 30%+)
- 33% drop-off: High (investigate causes)
```

---

### Example 3: Representativeness Check

**Sample vs Census:**
```
                Sample    Census    Difference
Age 18-24       18%       22%       -4pp (under)
Age 25-34       32%       28%       +4pp (over)
Age 35-44       25%       24%       +1pp (good)
Age 45-54       15%       16%       -1pp (good)
Age 55+         10%       10%       0pp (perfect)

Gender:
Male            52%       49%       +3pp
Female          48%       51%       -3pp

Representativeness score:
Sum of absolute differences: 16pp
Score = 100 - (16 ÷ 2) = 92%

92% is excellent (>90% is target)
```

**Weight Calculation:**
```
Age 18-24 weight = Census% ÷ Sample%
                 = 22% ÷ 18% = 1.22

Apply: Each 18-24 response counts as 1.22
```

---

### Example 4: Data Quality Checks

**Speeding:**
```
Median completion: 8 minutes
Flag threshold: <4 minutes (50% of median)

Speeders: 32 responses (3.2%)
Action: Review for quality, possible exclusion
```

**Straight-lining:**
```
All NPS questions rated exactly 5/10
Detected: 28 responses (2.8%)
Action: Exclude from analysis
```

**Logic Errors:**
```
Currently Using = Yes BUT Ever Used = No
Inconsistencies: 15 responses (1.5%)
Action: Flag for manual review
```

**Overall Quality Score:**
```
Completion rate: 67% (✓ good)
Appropriate speed: 96.8% (✓ excellent)
No straight-lining: 97.2% (✓ excellent)
Logical consistency: 98.5% (✓ excellent)

Overall: 95/100 (Grade A)
```

---

## 13.3 Implementation

### SQL: Data Quality Dashboard

```sql
-- Comprehensive quality metrics
WITH quality_metrics AS (
    SELECT 
        survey_period,
        COUNT(*) as total_responses,
        -- Completion
        AVG(CASE WHEN is_complete = TRUE THEN 1.0 ELSE 0 END) * 100 as completion_rate,
        -- Speed
        AVG(completion_time_seconds) / 60.0 as avg_time_minutes,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY completion_time_seconds) / 60.0 as median_time,
        AVG(CASE WHEN completion_time_seconds BETWEEN 180 AND 1800 THEN 1.0 ELSE 0 END) * 100 as appropriate_speed,
        -- Logical consistency
        AVG(CASE WHEN (currently_using = TRUE AND ever_used = FALSE) THEN 0 ELSE 1.0 END) * 100 as logic_consistency,
        -- Missing data
        AVG(CASE WHEN demographics_complete = TRUE THEN 1.0 ELSE 0 END) * 100 as demo_completion
    FROM survey_responses
    GROUP BY survey_period
)
SELECT 
    survey_period,
    total_responses,
    ROUND(completion_rate, 1) as completion_rate_pct,
    ROUND(avg_time_minutes, 1) as avg_minutes,
    ROUND(median_time, 1) as median_minutes,
    ROUND(appropriate_speed, 1) as appropriate_speed_pct,
    ROUND(logic_consistency, 1) as consistency_pct,
    ROUND(demo_completion, 1) as demo_completion_pct,
    -- Overall quality score
    ROUND(
        (completion_rate + appropriate_speed + logic_consistency + demo_completion) / 4,
        0
    ) as overall_quality_score
FROM quality_metrics
ORDER BY survey_period DESC;
```

### Python: Quality Validator

```python
def validate_data_quality(df):
    """
    Run comprehensive data quality checks
    
    Args:
        df: Survey responses DataFrame
    
    Returns:
        dict with quality metrics and issues
    """
    issues = []
    
    # Check 1: Sample size
    total = len(df)
    if total < 500:
        issues.append(f"Low sample size: {total} (target: 1000+)")
    
    # Check 2: Completion rate
    complete = df['is_complete'].sum()
    completion_rate = complete / total * 100
    if completion_rate < 60:
        issues.append(f"Low completion rate: {completion_rate:.1f}%")
    
    # Check 3: Speeders
    median_time = df['completion_time_seconds'].median()
    speeders = (df['completion_time_seconds'] < median_time * 0.5).sum()
    speeder_pct = speeders / total * 100
    if speeder_pct > 5:
        issues.append(f"High speeder rate: {speeder_pct:.1f}%")
    
    # Check 4: Logic errors
    logic_errors = (
        (df['currently_using'] == True) & 
        (df['ever_used'] == False)
    ).sum()
    if logic_errors > 0:
        issues.append(f"Logic errors: {logic_errors} responses")
    
    # Check 5: Missing critical data
    missing_demo = df['demographics_complete'].isna().sum()
    if missing_demo / total > 0.1:
        issues.append(f"High missing demographics: {missing_demo/total*100:.1f}%")
    
    # Overall score
    quality_score = (
        (1 if total >= 1000 else 0.5) * 20 +
        min(completion_rate / 70, 1) * 30 +
        (1 if speeder_pct < 5 else 0.7) * 20 +
        (1 if logic_errors == 0 else 0.8) * 15 +
        (1 if missing_demo/total < 0.05 else 0.9) * 15
    )
    
    return {
        'quality_score': round(quality_score, 0),
        'total_responses': total,
        'completion_rate': round(completion_rate, 1),
        'speeder_pct': round(speeder_pct, 1),
        'logic_errors': logic_errors,
        'issues': issues,
        'status': 'PASS' if quality_score >= 80 and len(issues) == 0 else 'REVIEW NEEDED'
    }
```

---

# APPENDIX: QUICK REFERENCE

## All Key Formulas

```
AWARENESS:
Total Awareness = Aware ÷ Sample × 100
Top-of-Mind = First Mentions ÷ Sample × 100
Awareness Quality = Top-of-Mind ÷ Total Awareness × 100

USAGE:
Trial Rate = Ever Used ÷ Aware × 100
Retention = Currently Using ÷ Ever Used × 100
Preference Rate = Preferred ÷ Currently Using × 100

NPS:
NPS = % Promoters (9-10) - % Detractors (0-6)

LOYALTY:
Loyalty Index = (Committed×100 + Favors×70 + Potential×40 + Accessible×20) ÷ Total Aware

MOMENTUM:
Momentum = (Awareness Growth×15%) + (Consideration×25%) + (Conversion×25%) + (Retention×20%) + (Adoption×15%)

COMPETITIVE:
Market Share = Your Preferred ÷ Total Sample × 100
Share of Voice = Your Top-of-Mind ÷ All Top-of-Mind × 100

TRENDS:
MoM Change % = (Current - Previous) ÷ Previous × 100
Volatility (CV) = StdDev ÷ Mean × 100

QUALITY:
Margin of Error = 1.96 × √(p(1-p)/n)
Representativeness = 100 - (Sum absolute differences ÷ 2)
```

---

## Implementation Priority

**Week 1-2: Critical Dashboards**
1. Awareness Analysis
2. Usage Analysis
3. NPS Deep Dive

**Week 3-4: Strategic Dashboards**
4. Loyalty Segmentation
5. Brand Momentum
6. Competitive Analysis

**Week 5-8: Advanced Dashboards**
7. Geographic Analysis
8. Future Intent
9. Trend Analysis
10. Data Quality

**Week 9-12: Specialized Dashboards**
11. Customer Journey
12. Competitive Intelligence
13. Brand Perception

---

**END OF ALL DASHBOARDS IMPLEMENTATION PLAYBOOK**

**Total Coverage:** 13 dashboard topics with methodology, worked examples, and implementation code for each.

**For detailed standalone documentation, refer to:**
- Awareness_Methodology.md, Awareness_Worked_Examples.md, Awareness_Implementation.md
- Usage_Methodology.md, Usage_Worked_Examples.md, Usage_Implementation.md
- Loyalty_Segmentation_Methodology.md, Loyalty_Segmentation_Examples.md, Loyalty_Segmentation_Implementation_Logic.md
