# Dashboard Implementation Logic
## Formulas, Pseudocode & SQL for All Metrics

---

## Table of Contents
1. [Awareness Implementation](#1-awareness-implementation)
2. [Usage Implementation](#2-usage-implementation)
3. [NPS Implementation](#3-nps-implementation)
4. [Loyalty Implementation](#4-loyalty-implementation)
5. [Momentum Implementation](#5-momentum-implementation)
6. [Future Intent Implementation](#6-future-intent-implementation)
7. [Competitive Implementation](#7-competitive-implementation)
8. [Geographic Implementation](#8-geographic-implementation)
9. [Trend Implementation](#9-trend-implementation)
10. [Data Quality Implementation](#10-data-quality-implementation)

---

# 1. AWARENESS IMPLEMENTATION

## 1.1 Total Awareness

**SQL:**
```sql
SELECT 
    bank_name,
    COUNT(DISTINCT CASE WHEN aware = TRUE THEN respondent_id END) as aware_count,
    COUNT(DISTINCT respondent_id) as total_count,
    ROUND(
        COUNT(DISTINCT CASE WHEN aware = TRUE THEN respondent_id END) * 100.0 / 
        COUNT(DISTINCT respondent_id), 
        1
    ) as total_awareness_pct
FROM survey_responses
WHERE survey_period = 'June 2026'
GROUP BY bank_name
ORDER BY total_awareness_pct DESC;
```

**Python:**
```python
def calculate_total_awareness(df, bank_name):
    """
    Calculate total awareness for a bank
    
    Args:
        df: DataFrame with columns ['respondent_id', 'bank', 'aware']
        bank_name: Name of bank to calculate for
    
    Returns:
        float: Awareness percentage
    """
    bank_data = df[df['bank'] == bank_name]
    
    total = len(bank_data)
    aware = bank_data['aware'].sum()
    
    awareness_pct = (aware / total) * 100 if total > 0 else 0
    
    return round(awareness_pct, 1)
```

**Excel/Sheets:**
```excel
=COUNTIF(C2:C1001, "Yes") / COUNTA(C2:C1001) * 100

Where C2:C1001 is the "Aware of BK?" column
```

**Google Data Studio:**
```
Awareness Percentage = 
COUNT(CASE WHEN Aware = TRUE THEN Respondent_ID END) / 
COUNT(Respondent_ID) * 100
```

---

## 1.2 Top-of-Mind Awareness

**SQL:**
```sql
SELECT 
    top_of_mind_mention as bank_name,
    COUNT(*) as mentions,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM survey_responses WHERE survey_period = 'June 2026') as top_of_mind_pct
FROM survey_responses
WHERE survey_period = 'June 2026'
  AND top_of_mind_mention IS NOT NULL
GROUP BY top_of_mind_mention
ORDER BY mentions DESC;
```

**Python:**
```python
def calculate_top_of_mind(df, bank_name):
    """
    Calculate top-of-mind awareness
    """
    total = len(df)
    first_mentions = (df['top_of_mind'] == bank_name).sum()
    
    tom_pct = (first_mentions / total) * 100
    
    return round(tom_pct, 1)
```

---

## 1.3 Awareness Quality

**SQL:**
```sql
WITH awareness AS (
    SELECT 
        bank_name,
        COUNT(DISTINCT CASE WHEN top_of_mind = bank_name THEN respondent_id END) as tom_count,
        COUNT(DISTINCT CASE WHEN aware = TRUE THEN respondent_id END) as total_aware
    FROM survey_responses
    WHERE survey_period = 'June 2026'
    GROUP BY bank_name
)
SELECT 
    bank_name,
    tom_count,
    total_aware,
    ROUND((tom_count * 100.0 / NULLIF(total_aware, 0)), 1) as awareness_quality_pct
FROM awareness
ORDER BY awareness_quality_pct DESC;
```

**Python:**
```python
def calculate_awareness_quality(df, bank_name):
    """
    Calculate awareness quality (Top-of-Mind / Total Aware)
    """
    tom = calculate_top_of_mind(df, bank_name)
    total_aware = calculate_total_awareness(df, bank_name)
    
    if total_aware > 0:
        quality = (tom / total_aware) * 100
    else:
        quality = 0
    
    return round(quality, 1)
```

---

# 2. USAGE IMPLEMENTATION

## 2.1 Usage Funnel Metrics

**SQL (Complete Funnel):**
```sql
WITH funnel AS (
    SELECT 
        bank_name,
        COUNT(DISTINCT CASE WHEN aware = TRUE THEN respondent_id END) as aware,
        COUNT(DISTINCT CASE WHEN ever_used = TRUE THEN respondent_id END) as ever_used,
        COUNT(DISTINCT CASE WHEN currently_using = TRUE THEN respondent_id END) as currently_using,
        COUNT(DISTINCT CASE WHEN preferred_bank = bank_name THEN respondent_id END) as preferred
    FROM survey_responses
    WHERE survey_period = 'June 2026'
    GROUP BY bank_name
)
SELECT 
    bank_name,
    aware,
    ever_used,
    currently_using,
    preferred,
    ROUND(ever_used * 100.0 / NULLIF(aware, 0), 1) as trial_rate,
    ROUND(currently_using * 100.0 / NULLIF(ever_used, 0), 1) as retention_rate,
    ROUND(preferred * 100.0 / NULLIF(currently_using, 0), 1) as preference_rate
FROM funnel;
```

**Python (Funnel Class):**
```python
class UsageFunnel:
    def __init__(self, df, bank_name):
        self.df = df[df['bank'] == bank_name]
        self.bank_name = bank_name
    
    def calculate_metrics(self):
        total = len(self.df)
        aware = self.df['aware'].sum()
        ever_used = self.df['ever_used'].sum()
        currently_using = self.df['currently_using'].sum()
        preferred = self.df['preferred_bank'].eq(self.bank_name).sum()
        
        # Conversion rates
        trial_rate = (ever_used / aware * 100) if aware > 0 else 0
        retention_rate = (currently_using / ever_used * 100) if ever_used > 0 else 0
        preference_rate = (preferred / currently_using * 100) if currently_using > 0 else 0
        
        return {
            'aware': aware,
            'aware_pct': round(aware / total * 100, 1),
            'ever_used': ever_used,
            'trial_rate': round(trial_rate, 1),
            'currently_using': currently_using,
            'retention_rate': round(retention_rate, 1),
            'preferred': preferred,
            'preference_rate': round(preference_rate, 1)
        }
```

---

## 2.2 Drop-off Analysis

**SQL:**
```sql
SELECT 
    bank_name,
    aware - ever_used as aware_to_trial_dropoff,
    ROUND((aware - ever_used) * 100.0 / NULLIF(aware, 0), 1) as aware_dropoff_pct,
    ever_used - currently_using as trial_to_current_dropoff,
    ROUND((ever_used - currently_using) * 100.0 / NULLIF(ever_used, 0), 1) as trial_dropoff_pct,
    currently_using - preferred as current_to_preferred_dropoff,
    ROUND((currently_using - preferred) * 100.0 / NULLIF(currently_using, 0), 1) as current_dropoff_pct
FROM (
    SELECT 
        bank_name,
        COUNT(DISTINCT CASE WHEN aware = TRUE THEN respondent_id END) as aware,
        COUNT(DISTINCT CASE WHEN ever_used = TRUE THEN respondent_id END) as ever_used,
        COUNT(DISTINCT CASE WHEN currently_using = TRUE THEN respondent_id END) as currently_using,
        COUNT(DISTINCT CASE WHEN preferred_bank = bank_name THEN respondent_id END) as preferred
    FROM survey_responses
    GROUP BY bank_name
) funnel;
```

---

# 3. NPS IMPLEMENTATION

## 3.1 Basic NPS Calculation

**SQL:**
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
        END as nps_category
    FROM survey_responses
    WHERE nps_score IS NOT NULL
)
SELECT 
    bank_name,
    COUNT(*) as total_responses,
    SUM(CASE WHEN nps_category = 'Promoter' THEN 1 ELSE 0 END) as promoters,
    SUM(CASE WHEN nps_category = 'Passive' THEN 1 ELSE 0 END) as passives,
    SUM(CASE WHEN nps_category = 'Detractor' THEN 1 ELSE 0 END) as detractors,
    ROUND(SUM(CASE WHEN nps_category = 'Promoter' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as promoter_pct,
    ROUND(SUM(CASE WHEN nps_category = 'Detractor' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as detractor_pct,
    ROUND(
        (SUM(CASE WHEN nps_category = 'Promoter' THEN 1 ELSE 0 END) - 
         SUM(CASE WHEN nps_category = 'Detractor' THEN 1 ELSE 0 END)) * 100.0 / COUNT(*),
        0
    ) as nps
FROM nps_categories
GROUP BY bank_name;
```

**Python:**
```python
def calculate_nps(df, bank_name):
    """
    Calculate Net Promoter Score
    
    Args:
        df: DataFrame with 'bank', 'nps_score' columns
        bank_name: Bank to calculate NPS for
    
    Returns:
        dict with NPS and breakdown
    """
    bank_scores = df[df['bank'] == bank_name]['nps_score'].dropna()
    
    if len(bank_scores) == 0:
        return None
    
    promoters = (bank_scores >= 9).sum()
    passives = ((bank_scores >= 7) & (bank_scores < 9)).sum()
    detractors = (bank_scores < 7).sum()
    
    total = len(bank_scores)
    
    promoter_pct = promoters / total * 100
    detractor_pct = detractors / total * 100
    
    nps = promoter_pct - detractor_pct
    
    return {
        'nps': round(nps, 0),
        'promoters': promoters,
        'promoter_pct': round(promoter_pct, 1),
        'passives': passives,
        'passive_pct': round(passives / total * 100, 1),
        'detractors': detractors,
        'detractor_pct': round(detractor_pct, 1),
        'total': total
    }
```

**Excel:**
```excel
Promoters: =COUNTIFS(E2:E1001, ">=9")
Detractors: =COUNTIFS(E2:E1001, "<=6")
Total: =COUNTA(E2:E1001)

NPS: =(Promoters/Total - Detractors/Total)*100
```

---

## 3.2 NPS by Segment

**SQL:**
```sql
WITH nps_by_segment AS (
    SELECT 
        bank_name,
        CASE 
            WHEN preferred_bank = bank_name THEN 'BUMO'
            WHEN currently_using = TRUE THEN 'Secondary'
            WHEN ever_used = TRUE THEN 'Lapsed'
            ELSE 'Never Used'
        END as usage_segment,
        nps_score,
        CASE 
            WHEN nps_score >= 9 THEN 'Promoter'
            WHEN nps_score >= 7 THEN 'Passive'
            ELSE 'Detractor'
        END as nps_category
    FROM survey_responses
    WHERE nps_score IS NOT NULL
)
SELECT 
    bank_name,
    usage_segment,
    COUNT(*) as responses,
    ROUND(
        (SUM(CASE WHEN nps_category = 'Promoter' THEN 1 ELSE 0 END) - 
         SUM(CASE WHEN nps_category = 'Detractor' THEN 1 ELSE 0 END)) * 100.0 / COUNT(*),
        0
    ) as nps
FROM nps_by_segment
GROUP BY bank_name, usage_segment
ORDER BY bank_name, usage_segment;
```

---

# 4. LOYALTY IMPLEMENTATION

## 4.1 Loyalty Segment Assignment

**SQL (Complete Logic):**
```sql
SELECT 
    respondent_id,
    bank_name,
    CASE
        -- NOT IN SCOPE
        WHEN aware = FALSE THEN 'NOT_IN_SCOPE'
        
        -- COMMITTED
        WHEN currently_using = TRUE 
         AND preferred_bank = bank_name
         AND committed_bank = bank_name
         AND nps_score >= 9
        THEN 'COMMITTED'
        
        -- FAVORS
        WHEN currently_using = TRUE
        THEN 'FAVORS'
        
        -- POTENTIAL
        WHEN aware = TRUE
         AND currently_using = FALSE
         AND future_intent >= 7
         AND (relevant = TRUE OR future_intent >= 8)
        THEN 'POTENTIAL'
        
        -- REJECTORS
        WHEN aware = TRUE
         AND currently_using = FALSE
         AND (future_intent <= 3 OR (ever_used = TRUE AND nps_score <= 6))
        THEN 'REJECTORS'
        
        -- ACCESSIBLES
        WHEN aware = TRUE
         AND currently_using = FALSE
         AND future_intent >= 4
         AND future_intent < 7
        THEN 'ACCESSIBLES'
        
        ELSE 'UNCATEGORIZED'
    END as loyalty_segment
FROM survey_responses;
```

**Python:**
```python
def assign_loyalty_segment(row, bank_name):
    """
    Assign loyalty segment to a respondent for a specific bank
    """
    if not row['aware']:
        return 'NOT_IN_SCOPE'
    
    # Current users
    if row['currently_using']:
        if (row['preferred_bank'] == bank_name and 
            row['committed_bank'] == bank_name and 
            row['nps_score'] >= 9):
            return 'COMMITTED'
        else:
            return 'FAVORS'
    
    # Non-users
    else:
        # Potential
        if row['future_intent'] >= 7 and (row['relevant'] or row['future_intent'] >= 8):
            return 'POTENTIAL'
        
        # Rejectors
        elif row['future_intent'] <= 3 or (row['ever_used'] and row['nps_score'] <= 6):
            return 'REJECTORS'
        
        # Accessibles
        elif 4 <= row['future_intent'] < 7:
            return 'ACCESSIBLES'
        
        else:
            return 'UNCATEGORIZED'
```

---

## 4.2 Loyalty Index Calculation

**SQL:**
```sql
WITH loyalty_segments AS (
    -- ... segment assignment logic from above ...
),
segment_counts AS (
    SELECT 
        bank_name,
        COUNT(CASE WHEN loyalty_segment = 'COMMITTED' THEN 1 END) as committed,
        COUNT(CASE WHEN loyalty_segment = 'FAVORS' THEN 1 END) as favors,
        COUNT(CASE WHEN loyalty_segment = 'POTENTIAL' THEN 1 END) as potential,
        COUNT(CASE WHEN loyalty_segment = 'ACCESSIBLES' THEN 1 END) as accessibles,
        COUNT(CASE WHEN loyalty_segment = 'REJECTORS' THEN 1 END) as rejectors,
        COUNT(CASE WHEN aware = TRUE THEN 1 END) as total_aware
    FROM loyalty_segments
    GROUP BY bank_name
)
SELECT 
    bank_name,
    committed,
    favors,
    potential,
    accessibles,
    rejectors,
    total_aware,
    ROUND(
        ((committed * 100) + (favors * 70) + (potential * 40) + 
         (accessibles * 20) + (rejectors * 0)) * 1.0 / NULLIF(total_aware, 0),
        0
    ) as loyalty_index
FROM segment_counts;
```

**Python:**
```python
def calculate_loyalty_index(segments):
    """
    Calculate weighted loyalty index
    
    Args:
        segments: dict with counts of each segment
    
    Returns:
        float: Loyalty index (0-100)
    """
    weights = {
        'COMMITTED': 100,
        'FAVORS': 70,
        'POTENTIAL': 40,
        'ACCESSIBLES': 20,
        'REJECTORS': 0
    }
    
    total_points = sum(segments[seg] * weights[seg] for seg in weights.keys())
    total_aware = sum(segments.values())
    
    if total_aware > 0:
        loyalty_index = total_points / total_aware
    else:
        loyalty_index = 0
    
    return round(loyalty_index, 0)
```

---

# 5. MOMENTUM IMPLEMENTATION

## 5.1 Momentum Score Calculation

**SQL:**
```sql
WITH current_period AS (
    SELECT 
        bank_name,
        AVG(CASE WHEN aware = TRUE THEN 100 ELSE 0 END) as awareness_current,
        AVG(CASE WHEN currently_using = FALSE AND future_intent >= 7 THEN 100 ELSE 0 END) as consideration,
        AVG(CASE WHEN aware = TRUE AND ever_used = TRUE THEN 100 ELSE 0 END) as conversion,
        AVG(CASE WHEN ever_used = TRUE AND currently_using = TRUE THEN 100 ELSE 0 END) as retention,
        AVG(CASE WHEN currently_using = TRUE AND preferred_bank = bank_name THEN 100 ELSE 0 END) as adoption
    FROM survey_responses
    WHERE survey_period = 'June 2026'
    GROUP BY bank_name
),
previous_period AS (
    SELECT 
        bank_name,
        AVG(CASE WHEN aware = TRUE THEN 100 ELSE 0 END) as awareness_previous
    FROM survey_responses
    WHERE survey_period = 'May 2026'
    GROUP BY bank_name
),
momentum_components AS (
    SELECT 
        c.bank_name,
        -- Awareness growth (normalized 0-100)
        CASE 
            WHEN (c.awareness_current - p.awareness_previous) >= 10 THEN 100
            WHEN (c.awareness_current - p.awareness_previous) <= -10 THEN 0
            ELSE 50 + ((c.awareness_current - p.awareness_previous) * 5)
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
    ROUND(
        (awareness_score * 0.15) + 
        (consideration_score * 0.25) + 
        (conversion_score * 0.25) + 
        (retention_score * 0.20) + 
        (adoption_score * 0.15),
        0
    ) as momentum_score,
    awareness_score,
    consideration_score,
    conversion_score,
    retention_score,
    adoption_score
FROM momentum_components;
```

**Python:**
```python
def calculate_momentum_score(current_data, previous_data, bank_name):
    """
    Calculate brand momentum score (0-100)
    """
    # Component scores
    awareness_growth = current_data['awareness'] - previous_data['awareness']
    awareness_score = normalize_growth(awareness_growth, threshold=10)
    
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

def normalize_growth(growth, threshold=10):
    """Normalize growth to 0-100 scale"""
    if growth >= threshold:
        return 100
    elif growth <= -threshold:
        return 0
    else:
        return 50 + (growth / threshold * 50)
```

---

# 6. FUTURE INTENT IMPLEMENTATION

## 6.1 Average Intent Score

**SQL:**
```sql
SELECT 
    bank_name,
    COUNT(*) as responses,
    ROUND(AVG(future_intent), 1) as avg_intent,
    ROUND(STDDEV(future_intent), 2) as stddev_intent,
    COUNT(CASE WHEN future_intent >= 9 THEN 1 END) as very_high,
    COUNT(CASE WHEN future_intent >= 7 AND future_intent < 9 THEN 1 END) as high,
    COUNT(CASE WHEN future_intent >= 5 AND future_intent < 7 THEN 1 END) as medium,
    COUNT(CASE WHEN future_intent >= 3 AND future_intent < 5 THEN 1 END) as low,
    COUNT(CASE WHEN future_intent < 3 THEN 1 END) as very_low
FROM survey_responses
WHERE future_intent IS NOT NULL
GROUP BY bank_name;
```

---

## 6.2 Intent vs Behavior Gap

**SQL:**
```sql
WITH intent_by_usage AS (
    SELECT 
        bank_name,
        respondent_id,
        future_intent,
        CASE 
            WHEN preferred_bank = bank_name THEN 10  -- Full engagement
            WHEN currently_using = TRUE THEN 7        -- Partial engagement
            WHEN ever_used = TRUE THEN 3              -- Tried but stopped
            ELSE 0                                     -- Never used
        END as current_behavior_score
    FROM survey_responses
)
SELECT 
    bank_name,
    AVG(future_intent) as avg_intent,
    AVG(current_behavior_score) as avg_behavior,
    AVG(future_intent - current_behavior_score) as avg_gap,
    SUM(CASE WHEN future_intent > current_behavior_score THEN future_intent - current_behavior_score ELSE 0 END) as total_opportunity
FROM intent_by_usage
GROUP BY bank_name;
```

---

# 7. COMPETITIVE IMPLEMENTATION

## 7.1 Side-by-Side Comparison

**SQL:**
```sql
WITH bank_metrics AS (
    SELECT 
        bank_name,
        AVG(CASE WHEN aware = TRUE THEN 100.0 ELSE 0 END) as awareness,
        AVG(CASE WHEN top_of_mind = bank_name THEN 100.0 ELSE 0 END) as top_of_mind,
        AVG(CASE WHEN currently_using = TRUE THEN 100.0 ELSE 0 END) as current_usage,
        AVG(CASE WHEN preferred_bank = bank_name THEN 100.0 ELSE 0 END) as preferred,
        AVG(CASE WHEN nps_score >= 9 THEN 100.0 WHEN nps_score <= 6 THEN -100.0 ELSE 0 END) / 100 as nps
    FROM survey_responses
    GROUP BY bank_name
)
SELECT 
    a.bank_name as bank_a,
    b.bank_name as bank_b,
    a.awareness as a_awareness,
    b.awareness as b_awareness,
    a.awareness - b.awareness as awareness_gap,
    a.top_of_mind as a_tom,
    b.top_of_mind as b_tom,
    a.top_of_mind - b.top_of_mind as tom_gap,
    a.current_usage as a_usage,
    b.current_usage as b_usage,
    a.current_usage - b.current_usage as usage_gap,
    a.nps as a_nps,
    b.nps as b_nps,
    a.nps - b.nps as nps_gap
FROM bank_metrics a
CROSS JOIN bank_metrics b
WHERE a.bank_name < b.bank_name;  -- Avoid duplicate pairs
```

---

## 7.2 Market Share Calculation

**SQL:**
```sql
WITH primary_banks AS (
    SELECT 
        preferred_bank as bank_name,
        COUNT(*) as primary_users
    FROM survey_responses
    WHERE preferred_bank IS NOT NULL
    GROUP BY preferred_bank
),
market_totals AS (
    SELECT SUM(primary_users) as total_primary
    FROM primary_banks
)
SELECT 
    p.bank_name,
    p.primary_users,
    ROUND(p.primary_users * 100.0 / m.total_primary, 1) as market_share_pct
FROM primary_banks p
CROSS JOIN market_totals m
ORDER BY market_share_pct DESC;
```

---

# 8. GEOGRAPHIC IMPLEMENTATION

## 8.1 Country Comparison

**SQL:**
```sql
SELECT 
    country,
    bank_name,
    COUNT(*) as sample_size,
    ROUND(AVG(CASE WHEN aware = TRUE THEN 100.0 ELSE 0 END), 1) as awareness,
    ROUND(AVG(CASE WHEN top_of_mind = bank_name THEN 100.0 ELSE 0 END), 1) as top_of_mind,
    ROUND(AVG(CASE WHEN currently_using = TRUE THEN 100.0 ELSE 0 END), 1) as current_usage,
    ROUND(AVG(CASE WHEN preferred_bank = bank_name THEN 100.0 ELSE 0 END), 1) as preferred,
    ROUND(AVG(CASE WHEN nps_score >= 9 THEN 1.0 WHEN nps_score <= 6 THEN -1.0 ELSE 0 END) * 100, 0) as nps
FROM survey_responses
GROUP BY country, bank_name
ORDER BY country, awareness DESC;
```

---

# 9. TREND IMPLEMENTATION

## 9.1 Month-over-Month Trend

**SQL:**
```sql
WITH monthly_metrics AS (
    SELECT 
        DATE_TRUNC('month', survey_date) as month,
        bank_name,
        AVG(CASE WHEN aware = TRUE THEN 100.0 ELSE 0 END) as awareness
    FROM survey_responses
    GROUP BY DATE_TRUNC('month', survey_date), bank_name
),
lagged_metrics AS (
    SELECT 
        month,
        bank_name,
        awareness,
        LAG(awareness) OVER (PARTITION BY bank_name ORDER BY month) as prev_awareness
    FROM monthly_metrics
)
SELECT 
    month,
    bank_name,
    awareness as current_awareness,
    prev_awareness,
    awareness - prev_awareness as change_pp,
    ROUND((awareness - prev_awareness) / NULLIF(prev_awareness, 0) * 100, 1) as change_pct
FROM lagged_metrics
WHERE prev_awareness IS NOT NULL
ORDER BY bank_name, month;
```

---

# 10. DATA QUALITY IMPLEMENTATION

## 10.1 Data Quality Score

**SQL:**
```sql
WITH quality_checks AS (
    SELECT 
        respondent_id,
        -- Completion check
        CASE WHEN demographics_complete = TRUE THEN 1 ELSE 0 END as complete_score,
        -- Speed check (3-30 minutes acceptable)
        CASE WHEN completion_time_seconds BETWEEN 180 AND 1800 THEN 1 ELSE 0 END as speed_score,
        -- Consistency check
        CASE WHEN (currently_using = TRUE AND ever_used = FALSE) THEN 0 ELSE 1 END as consistency_score,
        -- Engagement check (not all same answer)
        CASE WHEN nps_variance > 0 THEN 1 ELSE 0 END as engagement_score
    FROM survey_responses
)
SELECT 
    COUNT(*) as total_responses,
    ROUND(AVG(complete_score) * 100, 1) as completion_rate,
    ROUND(AVG(speed_score) * 100, 1) as appropriate_speed_rate,
    ROUND(AVG(consistency_score) * 100, 1) as consistency_rate,
    ROUND(AVG(engagement_score) * 100, 1) as engagement_rate,
    ROUND(
        (AVG(complete_score) + AVG(speed_score) + AVG(consistency_score) + AVG(engagement_score)) / 4 * 100,
        0
    ) as overall_quality_score
FROM quality_checks;
```

---

## Quick Reference: Key Formulas

```
AWARENESS:
- Total Awareness = Aware ÷ Total Sample × 100
- Top-of-Mind = First Mentions ÷ Total Sample × 100
- Awareness Quality = Top-of-Mind ÷ Total Awareness × 100

USAGE:
- Trial Rate = Ever Used ÷ Aware × 100
- Retention = Currently Using ÷ Ever Used × 100
- Preference Rate = Preferred ÷ Currently Using × 100

NPS:
- NPS = % Scores 9-10 - % Scores 0-6

LOYALTY:
- Index = (Committed×100 + Favors×70 + Potential×40 + Accessible×20) ÷ Total Aware

MOMENTUM:
- Score = Weighted(Awareness Growth + Consideration + Conversion + Retention + Adoption)

COMPETITIVE:
- Market Share = Your Preferred Users ÷ Total Sample × 100
- Share of Voice = Your Top-of-Mind ÷ Total Top-of-Mind × 100

TRENDS:
- MoM Change = (Current - Previous) ÷ Previous × 100
- Volatility (CV) = StdDev ÷ Mean × 100
```

---

**These implementations provide production-ready code for all dashboard metrics. Adapt syntax for your specific platform (SQL dialect, programming language, BI tool).**
