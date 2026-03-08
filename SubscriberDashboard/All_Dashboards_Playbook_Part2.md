# Brand Health Dashboards: Complete Implementation Playbook
## Part 2: Future Intent, Perception, Geographic, Journey Analytics

---

# 7. FUTURE INTENT & CONSIDERATION

## 7.1 Methodology Summary

### What is Future Intent?
Predictive measure of likelihood to use the bank in the future, scored 0-10.

**Data Source:** Section D, Q1
**Question:** "How likely are you to bank with [BANK] in the future?"

**Key Metrics:**
1. **Average Intent Score:** Mean of all scores (0-10)
2. **High Intent %:** Scores 7-10
3. **Intent Distribution:** By score level
4. **Intent by Usage:** Non-users vs Current users
5. **Intent-Behavior Gap:** Difference between stated intent and actual usage

**Interpretation:**
- **9-10:** Very high intent (strong leads)
- **7-8:** High intent (warm prospects)
- **5-6:** Medium intent (neutral, persuadable)
- **3-4:** Low intent (unlikely to convert)
- **0-2:** Very low intent (rejectors)

---

## 7.2 Worked Examples

### Example 1: Average Intent Score

**Data: 720 aware respondents rated BK**
```
Score 10: 72 people
Score 9: 108 people
Score 8: 144 people
Score 7: 108 people
Score 6: 72 people
Score 5: 72 people
Score 4: 54 people
Score 3: 36 people
Score 2: 29 people
Score 1: 14 people
Score 0: 11 people
Total: 720 ✓
```

**Calculation:**
```
Sum = (72×10) + (108×9) + (144×8) + ... + (11×0)
    = 720 + 972 + 1,152 + 756 + 432 + 360 + 216 + 108 + 58 + 14 + 0
    = 4,788

Average = 4,788 ÷ 720 = 6.65

Average Intent: 6.7/10
```

**Interpretation:** Above neutral (5.0), indicates generally positive intent but room for improvement.

---

### Example 2: Intent Categories

```
Category              Count    %
Very High (9-10)      180      25%
High (7-8)            252      35%
Medium (5-6)          144      20%
Low (3-4)             90       12.5%
Very Low (0-2)        54       7.5%
──────────────────────────────────
Total                 720      100%

High + Very High = 60% (strong consideration pool)
```

---

### Example 3: Intent by Usage Status

**Non-Users (432 aware but not using):**
```
High Intent (7-10): 180 people (41.7%)
→ "Acquisition Pipeline" - warm leads

Low Intent (0-3): 54 people (12.5%)
→ "Rejectors" - unlikely to convert

Gap: 180 high-intent non-users = primary acquisition target
```

**Current Users (288 using):**
```
High Intent (9-10): 150 people (52.1%)
→ "Secure" - happy customers

Low Intent (0-6): 40 people (13.9%)
→ "At Risk" - likely to churn

Risk: 40 at-risk customers need attention
```

---

### Example 4: Intent vs Behavior Gap

**Non-user with high intent:**
```
Person A: Not using, intent = 8
Gap = 8 - 0 (current usage) = 8 points unrealized potential
```

**Secondary user:**
```
Person B: Secondary bank, intent = 9
Gap = 9 - 5 (secondary usage score) = 4 points
Opportunity: Convert to primary
```

**Total Unrealized Potential:**
```
Sum all positive gaps across respondents
= Measure of untapped opportunity
```

---

## 7.3 Implementation

### SQL: Intent Analysis

```sql
-- Average intent and distribution
SELECT 
    bank_name,
    COUNT(*) as responses,
    ROUND(AVG(future_intent), 1) as avg_intent,
    ROUND(STDDEV(future_intent), 2) as std_dev,
    COUNT(CASE WHEN future_intent >= 9 THEN 1 END) as very_high,
    COUNT(CASE WHEN future_intent >= 7 AND future_intent < 9 THEN 1 END) as high,
    COUNT(CASE WHEN future_intent >= 5 AND future_intent < 7 THEN 1 END) as medium,
    COUNT(CASE WHEN future_intent >= 3 AND future_intent < 5 THEN 1 END) as low,
    COUNT(CASE WHEN future_intent < 3 THEN 1 END) as very_low,
    ROUND(COUNT(CASE WHEN future_intent >= 7 THEN 1 END) * 100.0 / COUNT(*), 1) as high_intent_pct
FROM survey_responses
WHERE future_intent IS NOT NULL
GROUP BY bank_name;

-- Intent by usage status
SELECT 
    bank_name,
    CASE 
        WHEN currently_using = TRUE THEN 'Current User'
        ELSE 'Non-User'
    END as user_status,
    COUNT(*) as count,
    ROUND(AVG(future_intent), 1) as avg_intent,
    COUNT(CASE WHEN future_intent >= 7 THEN 1 END) as high_intent_count,
    ROUND(COUNT(CASE WHEN future_intent >= 7 THEN 1 END) * 100.0 / COUNT(*), 1) as high_intent_pct
FROM survey_responses
WHERE aware = TRUE
GROUP BY bank_name, 
    CASE WHEN currently_using = TRUE THEN 'Current User' ELSE 'Non-User' END;
```

### Python: Intent Analyzer

```python
def analyze_future_intent(df, bank_name):
    """
    Analyze future intent scores
    
    Args:
        df: DataFrame with 'future_intent' column
        bank_name: Bank to analyze
    """
    scores = df['future_intent'].dropna()
    
    # Average and distribution
    avg_intent = scores.mean()
    
    categories = {
        'Very High (9-10)': ((scores >= 9).sum(), (scores >= 9).mean() * 100),
        'High (7-8)': (((scores >= 7) & (scores < 9)).sum(), 
                       ((scores >= 7) & (scores < 9)).mean() * 100),
        'Medium (5-6)': (((scores >= 5) & (scores < 7)).sum(),
                         ((scores >= 5) & (scores < 7)).mean() * 100),
        'Low (3-4)': (((scores >= 3) & (scores < 5)).sum(),
                      ((scores >= 3) & (scores < 5)).mean() * 100),
        'Very Low (0-2)': ((scores < 3).sum(), (scores < 3).mean() * 100)
    }
    
    return {
        'avg_intent': round(avg_intent, 1),
        'total_responses': len(scores),
        'categories': categories,
        'high_intent_pct': round((scores >= 7).mean() * 100, 1)
    }
```

---

# 8. BRAND PERCEPTION & IMAGE

## 8.1 Methodology Summary

### What is Brand Perception?
How the bank is viewed beyond just awareness - measures relevance, popularity, and commitment.

**Key Metrics:**

**1. Relevance Score (Section D, Q2)**
- Question: "Which banks are most suitable for people like you?"
- Formula: `(Selected as relevant ÷ Aware) × 100`

**2. Popularity Index (Section D, Q3)**
- Question: "Which ONE bank do most people know or talk about?"
- Formula: `(Selected as popular ÷ Total sample) × 100`

**3. Commitment Score (Section D, Q4)**
- Question: "If you could only keep ONE bank, which would it be?"
- Formula: `(Selected as only bank ÷ Current users) × 100`

---

## 8.2 Worked Examples

### Example 1: Relevance Score

```
720 aware of BK
288 said BK is "suitable for people like me"

Relevance = 288 ÷ 720 × 100 = 40%

Benchmark:
- High (>40%): Strong personal connection ✓
- Medium (20-40%): Moderate appeal
- Low (<20%): Weak positioning
```

---

### Example 2: Popularity Index

```
1,000 total sample
180 said BK is "most talked about"

Popularity = 180 ÷ 1,000 × 100 = 18%

All banks:
BPR: 220 (22%) - Most popular
BK: 180 (18%) - Second
I&M: 150 (15%)

BK is #2 in buzz/word-of-mouth
```

---

### Example 3: Commitment Score

```
288 currently using BK
108 would keep BK as "only bank"

Commitment = 108 ÷ 288 × 100 = 37.5%

Benchmark:
- Strong (>60%): Deep loyalty
- Moderate (40-60%): Average commitment
- Weak (<40%): Shallow relationships ← BK
```

**Insight:** Only 37.5% would commit to BK alone. Most multi-bank and not deeply loyal.

---

### Example 4: Perception vs Reality Gap

```
Popularity: 18% (perception)
Total Awareness: 72% (reality)

Gap = 72 - 18 = 54 percentage points

Many people know BK (72%) but few talk about it (18%)
→ Need to create buzz and word-of-mouth
```

---

## 8.3 Implementation

### SQL: Perception Metrics

```sql
SELECT 
    bank_name,
    -- Relevance
    COUNT(DISTINCT CASE WHEN relevant = TRUE THEN respondent_id END) as relevant_count,
    ROUND(
        COUNT(DISTINCT CASE WHEN relevant = TRUE THEN respondent_id END) * 100.0 /
        NULLIF(COUNT(DISTINCT CASE WHEN aware = TRUE THEN respondent_id END), 0),
        1
    ) as relevance_pct,
    -- Popularity
    COUNT(DISTINCT CASE WHEN most_popular = bank_name THEN respondent_id END) as popularity_count,
    ROUND(
        COUNT(DISTINCT CASE WHEN most_popular = bank_name THEN respondent_id END) * 100.0 /
        COUNT(DISTINCT respondent_id),
        1
    ) as popularity_pct,
    -- Commitment
    COUNT(DISTINCT CASE WHEN only_bank = bank_name THEN respondent_id END) as commitment_count,
    ROUND(
        COUNT(DISTINCT CASE WHEN only_bank = bank_name THEN respondent_id END) * 100.0 /
        NULLIF(COUNT(DISTINCT CASE WHEN currently_using = TRUE THEN respondent_id END), 0),
        1
    ) as commitment_pct
FROM survey_responses
GROUP BY bank_name;
```

---

# 9. GEOGRAPHIC ANALYSIS

## 9.1 Methodology Summary

### What is Geographic Analysis?
Compare brand health metrics across countries (Rwanda, Uganda, Burundi).

**Key Comparisons:**
1. Awareness by country
2. Usage metrics by country
3. NPS by country
4. Market penetration by country
5. Competitive position by country

---

## 9.2 Worked Examples

### Example 1: Country-Level Metrics

```
                Rwanda    Uganda    Burundi
Sample          400       350       250
Aware           288(72%)  238(68%)  138(55%)
Top-Mind        60(15%)   42(12%)   20(8%)
Current         115(29%)  67(19%)   38(15%)
Preferred       43(11%)   24(7%)    13(5%)
NPS             +20       +12       +8

Insight: Rwanda is strongest market across all metrics
```

---

### Example 2: Country Rankings

**By Awareness:**
```
1. Rwanda (72%)
2. Uganda (68%)
3. Burundi (55%) - needs work
```

**By NPS:**
```
1. Rwanda (+20)
2. Uganda (+12)
3. Burundi (+8)

Pattern: Satisfaction decreases Rwanda → Burundi
```

---

### Example 3: Conversion Rates by Country

```
                Rwanda    Uganda    Burundi
Trial Rate      40%       28%       28%
Retention       75%       78%       74%
Preference      37%       36%       34%

Rwanda: Best acquisition
Uganda: Best retention
Burundi: Weakest overall
```

---

## 9.3 Implementation

### SQL: Geographic Comparison

```sql
SELECT 
    country,
    bank_name,
    COUNT(*) as sample_size,
    -- Awareness
    ROUND(AVG(CASE WHEN aware = TRUE THEN 100.0 ELSE 0 END), 1) as awareness_pct,
    -- Top-of-mind
    ROUND(AVG(CASE WHEN top_of_mind_mention = bank_name THEN 100.0 ELSE 0 END), 1) as tom_pct,
    -- Current usage
    ROUND(AVG(CASE WHEN currently_using = TRUE THEN 100.0 ELSE 0 END), 1) as current_pct,
    -- Preferred
    ROUND(AVG(CASE WHEN preferred_bank = bank_name THEN 100.0 ELSE 0 END), 1) as preferred_pct,
    -- NPS
    ROUND(
        (SUM(CASE WHEN nps_score >= 9 THEN 1 ELSE 0 END) - 
         SUM(CASE WHEN nps_score <= 6 THEN 1 ELSE 0 END)) * 100.0 /
        NULLIF(SUM(CASE WHEN nps_score IS NOT NULL THEN 1 ELSE 0 END), 0),
        0
    ) as nps
FROM survey_responses
GROUP BY country, bank_name
ORDER BY country, awareness_pct DESC;
```

### Python: Country Comparison

```python
def compare_countries(df, bank_name, countries):
    """Compare metrics across countries"""
    results = {}
    
    for country in countries:
        country_df = df[(df['country'] == country) & (df['bank'] == bank_name)]
        
        aware = country_df['aware'].sum()
        total = len(country_df)
        
        results[country] = {
            'sample': total,
            'awareness': round(aware / total * 100, 1),
            'current_usage': round(country_df['currently_using'].sum() / total * 100, 1),
            'nps': calculate_nps(country_df['nps_score'].dropna())['nps']
        }
    
    return results

# Usage
comparison = compare_countries(df, 'BK', ['Rwanda', 'Uganda', 'Burundi'])
```

---

# 10. CUSTOMER JOURNEY ANALYTICS

## 10.1 Methodology Summary

### What is Customer Journey?
Maps the path from awareness to advocacy, identifying friction points.

**5-Stage Model:**
```
1. AWARENESS → Know bank exists
2. CONSIDERATION → Thinking about using
3. TRIAL → Open account
4. ACTIVE USAGE → Regular transactions
5. ADVOCACY → Preferred bank + recommend
```

**Key Metrics:**
- Stage-to-stage conversion rates
- Drop-off analysis
- Time-to-conversion (if date stamps available)
- Journey segmentation (Fast vs Slow adopters)

---

## 10.2 Worked Examples

### Example 1: Journey Conversion Rates

```
Stage               Count    Conversion    Drop-off
────────────────────────────────────────────────────
Awareness           720      -             -
    ↓ 25% consider
Consideration       180      25%           540 lost
    ↓ 200% convert
Trial (Ever Used)   360      200%*         -
    ↓ 80% retain
Active Usage        288      80%           72 lost
    ↓ 38% advocate
Advocacy (BUMO+NPS9) 108     38%           180 lost

*Note: Consideration → Trial may exceed 100% because not everyone 
       with high intent gets measured in consideration
```

---

### Example 2: Friction Point Analysis

**Calculate friction score:**
```
Stage: Awareness → Consideration
Drop-off: 540 people (75%)
Weight: 1.0
Friction = 75 × 1.0 = 75 points

Stage: Trial → Active
Drop-off: 72 people (20%)
Weight: 2.0 (retention more important)
Friction = 20 × 2.0 = 40 points

Stage: Active → Advocacy
Drop-off: 180 people (62.5%)
Weight: 1.5
Friction = 62.5 × 1.5 = 94 points ← HIGHEST

Action: Focus on converting active users to advocates
```

---

### Example 3: Journey Segments

**Fast Movers (Aware → Active < 1 month):**
```
Count: 45 people (16% of active)
Characteristics: High intent, quick decision
Behavior: Immediate need, less price sensitive
```

**Slow Adopters (Aware → Active > 6 months):**
```
Count: 115 people (40% of active)
Characteristics: Cautious, need convincing
Behavior: Research extensively, compare options
```

---

## 10.3 Implementation

### SQL: Journey Stages

```sql
WITH journey_stages AS (
    SELECT 
        respondent_id,
        bank_name,
        aware,
        CASE WHEN aware = TRUE AND future_intent >= 7 THEN TRUE ELSE FALSE END as consideration,
        ever_used as trial,
        currently_using as active,
        CASE WHEN preferred_bank = bank_name AND nps_score >= 9 THEN TRUE ELSE FALSE END as advocacy
    FROM survey_responses
)
SELECT 
    bank_name,
    COUNT(*) as total,
    SUM(CASE WHEN aware = TRUE THEN 1 ELSE 0 END) as awareness,
    SUM(CASE WHEN consideration = TRUE THEN 1 ELSE 0 END) as consideration,
    SUM(CASE WHEN trial = TRUE THEN 1 ELSE 0 END) as trial,
    SUM(CASE WHEN active = TRUE THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN advocacy = TRUE THEN 1 ELSE 0 END) as advocacy,
    -- Conversion rates
    ROUND(SUM(CASE WHEN consideration = TRUE THEN 1 ELSE 0 END) * 100.0 / 
          NULLIF(SUM(CASE WHEN aware = TRUE THEN 1 ELSE 0 END), 0), 1) as aware_to_consider,
    ROUND(SUM(CASE WHEN trial = TRUE THEN 1 ELSE 0 END) * 100.0 / 
          NULLIF(SUM(CASE WHEN consideration = TRUE THEN 1 ELSE 0 END), 0), 1) as consider_to_trial,
    ROUND(SUM(CASE WHEN active = TRUE THEN 1 ELSE 0 END) * 100.0 / 
          NULLIF(SUM(CASE WHEN trial = TRUE THEN 1 ELSE 0 END), 0), 1) as trial_to_active,
    ROUND(SUM(CASE WHEN advocacy = TRUE THEN 1 ELSE 0 END) * 100.0 / 
          NULLIF(SUM(CASE WHEN active = TRUE THEN 1 ELSE 0 END), 0), 1) as active_to_advocacy
FROM journey_stages
GROUP BY bank_name;
```

---

**Continue to Part 3 for final topics...**
