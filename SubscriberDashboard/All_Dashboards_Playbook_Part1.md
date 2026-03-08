# Brand Health Dashboards: Complete Implementation Playbook
## All Metrics, Examples, and Code in One Reference Guide

**Version:** 1.0  
**Date:** February 2026  
**Coverage:** 12 Dashboard Topics  
**Format:** Methodology → Examples → Implementation for Each Topic

---

## 📚 Table of Contents

### Already Completed (Separate Documents)
1. ✅ Awareness Analysis
2. ✅ Usage Analysis  
3. ✅ Loyalty Segmentation

### Covered in This Playbook
4. [NPS Deep Dive](#4-nps-deep-dive)
5. [Brand Momentum](#5-brand-momentum)
6. [Competitive Analysis](#6-competitive-analysis)
7. [Future Intent & Consideration](#7-future-intent--consideration)
8. [Brand Perception & Image](#8-brand-perception--image)
9. [Geographic Analysis](#9-geographic-analysis)
10. [Customer Journey Analytics](#10-customer-journey-analytics)
11. [Competitive Intelligence](#11-competitive-intelligence)
12. [Time-Based Trends](#12-time-based-trends)
13. [Data Quality & Sample](#13-data-quality--sample)

---

# 4. NPS DEEP DIVE

## 4.1 Methodology Summary

### What is NPS?
Net Promoter Score measures customer loyalty through one question: "How likely are you to recommend [BANK] to a friend?" (0-10 scale)

**Categories:**
- **Promoters (9-10):** Loyal advocates
- **Passives (7-8):** Satisfied but uncommitted (NOT in NPS calculation)
- **Detractors (0-6):** Unhappy customers

**Formula:**
```
NPS = % Promoters - % Detractors
Range: -100 to +100
```

**Banking Benchmarks:**
- World Class: +70 to +100
- Excellent: +50 to +69
- Good: +30 to +49
- Average: +10 to +29
- Poor: Below +10

### Key Analysis Dimensions
1. Overall NPS
2. NPS by usage segment (BUMO vs Secondary vs Lapsed)
3. NPS by demographics (age, gender, employment)
4. NPS by loyalty segment
5. Score distribution (not just headline number)
6. Trends over time
7. Driver analysis (what impacts NPS)

---

## 4.2 Worked Examples

### Example 1: Basic NPS Calculation

**Data:**
```
288 BK customers rated (those who ever used):
Score 10: 45 people
Score 9: 72 people
Score 8: 58 people
Score 7: 43 people
Score 6: 29 people
Score 5: 18 people
Score 0-4: 23 people
Total: 288 ✓
```

**Step 1: Categorize**
```
Promoters (9-10): 45 + 72 = 117
Passives (7-8): 43 + 58 = 101
Detractors (0-6): 29 + 18 + 23 = 70
```

**Step 2: Calculate Percentages**
```
% Promoters = 117 ÷ 288 = 40.6%
% Passives = 101 ÷ 288 = 35.1%
% Detractors = 70 ÷ 288 = 24.3%
```

**Step 3: Calculate NPS**
```
NPS = 40.6% - 24.3% = +16.3
Rounded: +16
```

**Interpretation:** NPS of +16 is below average for banking (target: +30). More promoters than detractors (positive), but significant room for improvement.

---

### Example 2: NPS by Usage Segment

**BUMO/Primary Users (108 people):**
```
Promoters: 65 (60.2%)
Passives: 30 (27.8%)
Detractors: 13 (12.0%)

NPS = 60.2 - 12.0 = +48 ✓ Good!
```

**Secondary Users (180 people):**
```
Promoters: 52 (28.9%)
Passives: 71 (39.4%)
Detractors: 57 (31.7%)

NPS = 28.9 - 31.7 = -3 ⚠️ Negative!
```

**Insight:** Primary customers love BK (+48), but secondary users are dissatisfied (-3). Focus on improving secondary user experience.

---

### Example 3: NPS by Age Group

```
Age      Sample  Promoters  Detractors  NPS
18-24    50      15 (30%)   20 (40%)    -10
25-34    80      32 (40%)   20 (25%)    +15
35-44    70      35 (50%)   14 (20%)    +30
45-54    55      28 (51%)   8 (15%)     +36
55+      33      7 (21%)    8 (24%)     -3
```

**Insight:** NPS increases with age, peaks at 45-54, then declines. Youth (18-24) have negative NPS - need youth-focused improvements.

---

## 4.3 Implementation

### SQL: Basic NPS

```sql
WITH nps_categories AS (
    SELECT 
        bank_name,
        respondent_id,
        nps_score,
        CASE 
            WHEN nps_score >= 9 THEN 'Promoter'
            WHEN nps_score >= 7 THEN 'Passive'
            ELSE 'Detractor'
        END as category
    FROM survey_responses
    WHERE nps_score IS NOT NULL
      AND ever_used = TRUE
)
SELECT 
    bank_name,
    COUNT(*) as total,
    SUM(CASE WHEN category = 'Promoter' THEN 1 ELSE 0 END) as promoters,
    SUM(CASE WHEN category = 'Passive' THEN 1 ELSE 0 END) as passives,
    SUM(CASE WHEN category = 'Detractor' THEN 1 ELSE 0 END) as detractors,
    ROUND(SUM(CASE WHEN category = 'Promoter' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as promoter_pct,
    ROUND(SUM(CASE WHEN category = 'Detractor' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as detractor_pct,
    ROUND(
        (SUM(CASE WHEN category = 'Promoter' THEN 1 ELSE 0 END) - 
         SUM(CASE WHEN category = 'Detractor' THEN 1 ELSE 0 END)) * 100.0 / COUNT(*),
        0
    ) as nps
FROM nps_categories
GROUP BY bank_name;
```

### Python: NPS Calculator

```python
def calculate_nps(scores):
    """Calculate NPS from list of scores"""
    promoters = sum(1 for s in scores if s >= 9)
    detractors = sum(1 for s in scores if s <= 6)
    total = len(scores)
    
    nps = ((promoters - detractors) / total * 100) if total > 0 else 0
    
    return {
        'nps': round(nps, 0),
        'promoters': promoters,
        'promoter_pct': round(promoters/total*100, 1),
        'detractors': detractors,
        'detractor_pct': round(detractors/total*100, 1),
        'passives': total - promoters - detractors
    }

# Usage
scores = [10, 9, 8, 7, 9, 10, 8, 6, 5, 9]
result = calculate_nps(scores)
print(f"NPS: {result['nps']}")
```

### Excel: NPS Formula

```excel
// Assuming scores in column E2:E1001

// Promoters
=COUNTIFS(E2:E1001, ">=9")

// Detractors
=COUNTIFS(E2:E1001, "<=6")

// Total
=COUNTA(E2:E1001)

// NPS
=(Promoters/Total - Detractors/Total)*100
```

---

# 5. BRAND MOMENTUM

## 5.1 Methodology Summary

### What is Brand Momentum?
Composite score measuring overall brand health trajectory by combining awareness, consideration, conversion, retention, and adoption.

**Formula (Weighted):**
```
Momentum Score = 
    (Awareness Growth × 15%) +
    (Consideration Rate × 25%) +
    (Conversion Rate × 25%) +
    (Retention Rate × 20%) +
    (Adoption Rate × 15%)

Score Range: 0-100
```

**Components Defined:**

1. **Awareness Growth:** Current vs previous period awareness change (normalized to 0-100)
2. **Consideration Rate:** % of non-users with high intent (7-10) to use
3. **Conversion Rate:** Trial rate (Ever Used ÷ Aware)
4. **Retention Rate:** % of triers still using (Current ÷ Ever Used)
5. **Adoption Rate:** % becoming primary bank (Preferred ÷ Current)

**Interpretation:**
- 80-100: Excellent momentum
- 60-79: Good momentum
- 40-59: Moderate momentum
- 20-39: Weak momentum
- 0-19: Crisis

---

## 5.2 Worked Examples

### Example 1: Calculate Momentum Score

**Component Values:**

**1. Awareness Growth:**
```
Previous: 68%
Current: 72%
Growth: +4 pp (+5.9%)

Normalized score (scale growth -10 to +10 as 0 to 100):
Score = 50 + (4 × 5) = 70/100
```

**2. Consideration Rate:**
```
Non-users aware: 720 - 288 = 432
High intent (7-10): 180
Rate = 180 ÷ 432 = 41.7%

Score: 42/100
```

**3. Conversion Rate:**
```
Ever Used ÷ Aware = 360 ÷ 720 = 50%
Score: 50/100
```

**4. Retention Rate:**
```
Current ÷ Ever Used = 288 ÷ 360 = 80%
Score: 80/100
```

**5. Adoption Rate:**
```
Preferred ÷ Current = 108 ÷ 288 = 37.5%
Score: 38/100
```

**Final Momentum Score:**
```
(70 × 0.15) + (42 × 0.25) + (50 × 0.25) + (80 × 0.20) + (38 × 0.15)
= 10.5 + 10.5 + 12.5 + 16.0 + 5.7
= 55.2

Momentum Score: 55/100 (Moderate)
```

**Interpretation:** Moderate momentum. Strength in retention (80), weakness in adoption (38). Focus: Convert current users to primary bank status.

---

### Example 2: Momentum Trend (6 Months)

```
Month    Score   Change   Assessment
Jan      48      -        Baseline
Feb      50      +2       Slight improvement
Mar      51      +1       Steady
Apr      53      +2       Improving
May      54      +1       Steady
Jun      55      +1       Slight improvement

6-Month Change: +7 points
Average Monthly: +1.4 points
Trend: Positive, gradual improvement ✓
```

---

### Example 3: Momentum Drivers Analysis

**Which component contributes most?**

```
Component          Weight   Raw Score   Contribution
Awareness Growth   15%      70          10.5 (19%)
Consideration      25%      42          10.5 (19%)
Conversion         25%      50          12.5 (23%)
Retention          20%      80          16.0 (29%) ← Biggest
Adoption           15%      38          5.7 (10%) ← Weakest
                                        ─────
Total Momentum: 55.2

Biggest Driver: Retention (29% of total score)
Weakest Link: Adoption (10% of total score)

Action: Focus on adoption (converting secondary to primary)
```

---

## 5.3 Implementation

### SQL: Momentum Components

```sql
WITH current_period AS (
    SELECT 
        bank_name,
        COUNT(DISTINCT CASE WHEN aware = TRUE THEN respondent_id END) * 100.0 / 
            COUNT(DISTINCT respondent_id) as awareness,
        -- Non-users with high intent
        COUNT(DISTINCT CASE WHEN aware = TRUE AND currently_using = FALSE 
                            AND future_intent >= 7 THEN respondent_id END) * 100.0 /
            NULLIF(COUNT(DISTINCT CASE WHEN aware = TRUE AND currently_using = FALSE 
                                 THEN respondent_id END), 0) as consideration,
        -- Trial rate
        COUNT(DISTINCT CASE WHEN ever_used = TRUE THEN respondent_id END) * 100.0 /
            NULLIF(COUNT(DISTINCT CASE WHEN aware = TRUE THEN respondent_id END), 0) as conversion,
        -- Retention
        COUNT(DISTINCT CASE WHEN currently_using = TRUE THEN respondent_id END) * 100.0 /
            NULLIF(COUNT(DISTINCT CASE WHEN ever_used = TRUE THEN respondent_id END), 0) as retention,
        -- Adoption
        COUNT(DISTINCT CASE WHEN preferred_bank = bank_name THEN respondent_id END) * 100.0 /
            NULLIF(COUNT(DISTINCT CASE WHEN currently_using = TRUE THEN respondent_id END), 0) as adoption
    FROM survey_responses
    WHERE survey_period = 'June 2026'
    GROUP BY bank_name
),
previous_period AS (
    SELECT 
        bank_name,
        COUNT(DISTINCT CASE WHEN aware = TRUE THEN respondent_id END) * 100.0 / 
            COUNT(DISTINCT respondent_id) as prev_awareness
    FROM survey_responses
    WHERE survey_period = 'May 2026'
    GROUP BY bank_name
),
normalized AS (
    SELECT 
        c.bank_name,
        -- Normalize awareness growth (-10 to +10 becomes 0 to 100)
        CASE 
            WHEN (c.awareness - p.prev_awareness) >= 10 THEN 100
            WHEN (c.awareness - p.prev_awareness) <= -10 THEN 0
            ELSE 50 + ((c.awareness - p.prev_awareness) * 5)
        END as awareness_score,
        c.consideration as consideration_score,
        c.conversion as conversion_score,
        c.retention as retention_score,
        c.adoption as adoption_score
    FROM current_period c
    LEFT JOIN previous_period p ON c.bank_name = p.bank_name
)
SELECT 
    bank_name,
    awareness_score,
    consideration_score,
    conversion_score,
    retention_score,
    adoption_score,
    ROUND(
        (awareness_score * 0.15) + 
        (consideration_score * 0.25) + 
        (conversion_score * 0.25) + 
        (retention_score * 0.20) + 
        (adoption_score * 0.15),
        0
    ) as momentum_score
FROM normalized;
```

### Python: Momentum Calculator

```python
def calculate_momentum(current_data, previous_data):
    """
    Calculate brand momentum score
    
    Args:
        current_data: dict with awareness, consideration, conversion, retention, adoption
        previous_data: dict with prev_awareness
    
    Returns:
        dict with momentum score and components
    """
    # 1. Awareness Growth Score (normalized)
    awareness_change = current_data['awareness'] - previous_data['awareness']
    if awareness_change >= 10:
        awareness_score = 100
    elif awareness_change <= -10:
        awareness_score = 0
    else:
        awareness_score = 50 + (awareness_change * 5)
    
    # 2-5. Other components already in 0-100 scale
    consideration_score = current_data['consideration_rate']
    conversion_score = current_data['trial_rate']
    retention_score = current_data['retention_rate']
    adoption_score = current_data['preference_rate']
    
    # Weighted momentum
    momentum = (
        awareness_score * 0.15 +
        consideration_score * 0.25 +
        conversion_score * 0.25 +
        retention_score * 0.20 +
        adoption_score * 0.15
    )
    
    return {
        'momentum_score': round(momentum, 0),
        'components': {
            'awareness': round(awareness_score, 0),
            'consideration': round(consideration_score, 0),
            'conversion': round(conversion_score, 0),
            'retention': round(retention_score, 0),
            'adoption': round(adoption_score, 0)
        }
    }

# Usage
current = {
    'awareness': 72,
    'consideration_rate': 42,
    'trial_rate': 50,
    'retention_rate': 80,
    'preference_rate': 38
}
previous = {'awareness': 68}

result = calculate_momentum(current, previous)
print(f"Momentum Score: {result['momentum_score']}")
```

---

# 6. COMPETITIVE ANALYSIS

## 6.1 Methodology Summary

### What is Competitive Analysis?
Head-to-head comparison of your bank vs competitors across key metrics to identify strengths, weaknesses, and opportunities.

**Key Comparisons:**
1. **Awareness:** Total, Top-of-Mind, Quality
2. **Usage:** Trial Rate, Current Usage, Retention
3. **Preference:** BUMO rate, Multi-banking overlap
4. **Satisfaction:** NPS, Promoter %
5. **Momentum:** Trend direction, Growth rate

**Analysis Types:**

**Side-by-Side:** Compare 2-4 banks on all metrics
**Gap Analysis:** Quantify performance differences
**Win/Loss:** Track customer movement between banks
**Share Metrics:** Market share, Share of voice

---

## 6.2 Worked Examples

### Example 1: Side-by-Side Comparison (BK vs BPR)

```
Metric                  BK        BPR      Gap      Winner
─────────────────────────────────────────────────────────
Total Awareness         72%       75%      -3pp     BPR
Top-of-Mind             15%       18%      -3pp     BPR
Awareness Quality       20.8%     24.0%    -3.2pp   BPR
Trial Rate              50%       60%      -10pp    BPR ⚠️
Currently Using         28.8%     30%      -1.2pp   BPR
Retention Rate          80%       75%      +5pp     BK ✓
Preference Rate         37.5%     40%      -2.5pp   BPR
NPS                     +16       +35      -19pts   BPR ⚠️
Market Penetration      10.8%     12%      -1.2pp   BPR
```

**Summary:** BPR leads in awareness and satisfaction, BK leads in retention. BK needs to improve NPS (-19 point gap).

---

### Example 2: Market Share Calculation

**Primary Bank (BUMO) Share:**
```
Total sample: 1,000

BK preferred: 108 (10.8%)
BPR preferred: 120 (12.0%)
I&M preferred: 80 (8.0%)
EcoBank preferred: 60 (6.0%)
Others: 632 (63.2%)
──────────────────────
Total: 1,000 (100%) ✓

Market Rankings:
1. BPR (12.0%) - Leader
2. BK (10.8%) - Strong #2
3. I&M (8.0%)
4. EcoBank (6.0%)
```

---

### Example 3: Share of Voice

```
Top-of-Mind Mentions (excluding "Don't Know"):

BK: 150 ÷ 550 = 27.3%
BPR: 180 ÷ 550 = 32.7%
I&M: 120 ÷ 550 = 21.8%
EcoBank: 80 ÷ 550 = 14.5%
Others: 20 ÷ 550 = 3.6%
──────────────────────
Total: 100%

Share of Voice Rankings:
1. BPR (32.7%) - Voice leader
2. BK (27.3%) - Strong #2
3. I&M (21.8%)
```

---

## 6.3 Implementation

### SQL: Side-by-Side Metrics

```sql
-- Compare multiple banks
WITH bank_metrics AS (
    SELECT 
        bank_name,
        COUNT(DISTINCT respondent_id) as total_sample,
        COUNT(DISTINCT CASE WHEN aware = TRUE THEN respondent_id END) as aware,
        COUNT(DISTINCT CASE WHEN top_of_mind_mention = bank_name THEN respondent_id END) as tom,
        COUNT(DISTINCT CASE WHEN ever_used = TRUE THEN respondent_id END) as ever_used,
        COUNT(DISTINCT CASE WHEN currently_using = TRUE THEN respondent_id END) as current,
        COUNT(DISTINCT CASE WHEN preferred_bank = bank_name THEN respondent_id END) as preferred
    FROM survey_responses
    GROUP BY bank_name
)
SELECT 
    bank_name,
    ROUND(aware * 100.0 / total_sample, 1) as awareness_pct,
    ROUND(tom * 100.0 / total_sample, 1) as tom_pct,
    ROUND(ever_used * 100.0 / NULLIF(aware, 0), 1) as trial_rate,
    ROUND(current * 100.0 / NULLIF(ever_used, 0), 1) as retention_rate,
    ROUND(preferred * 100.0 / NULLIF(current, 0), 1) as preference_rate,
    ROUND(preferred * 100.0 / total_sample, 1) as market_share
FROM bank_metrics
ORDER BY market_share DESC;
```

### Python: Competitive Gap Analysis

```python
def competitive_gap_analysis(your_metrics, competitor_metrics):
    """
    Calculate gaps between you and competitor
    
    Args:
        your_metrics: dict with your bank's metrics
        competitor_metrics: dict with competitor's metrics
    
    Returns:
        dict with gaps and winners
    """
    gaps = {}
    
    for metric in your_metrics.keys():
        your_value = your_metrics[metric]
        comp_value = competitor_metrics[metric]
        
        gap = your_value - comp_value
        gap_pct = (gap / comp_value * 100) if comp_value != 0 else 0
        
        if gap > 0:
            winner = "You"
            symbol = "✓"
        elif gap < 0:
            winner = "Competitor"
            symbol = "⚠️"
        else:
            winner = "Tie"
            symbol = "="
        
        gaps[metric] = {
            'your_value': your_value,
            'competitor_value': comp_value,
            'gap_absolute': round(gap, 1),
            'gap_pct': round(gap_pct, 1),
            'winner': winner,
            'symbol': symbol
        }
    
    return gaps

# Usage
your_bank = {
    'awareness': 72,
    'trial_rate': 50,
    'retention': 80,
    'nps': 16
}

competitor = {
    'awareness': 75,
    'trial_rate': 60,
    'retention': 75,
    'nps': 35
}

gaps = competitive_gap_analysis(your_bank, competitor)
for metric, data in gaps.items():
    print(f"{metric}: {data['gap_absolute']} ({data['symbol']})")
```

---

**Continue to Part 2 for remaining topics...**
