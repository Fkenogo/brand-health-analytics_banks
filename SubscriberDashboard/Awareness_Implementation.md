# Awareness Analysis: Implementation Logic & Code
## SQL, Python, Excel, and Dashboard Platform Formulas

---

## Implementation Flowchart

```
START: Awareness Calculation
│
├─ STEP 1: Data Collection
│  │
│  ├─ Load Section C, Q1 (Top-of-Mind)
│  ├─ Load Section C, Q2 (Spontaneous Recall)
│  └─ Load Section C, Q3 (Total Awareness - Aided)
│
├─ STEP 2: Total Awareness
│  │
│  └─ Count respondents where:
│     aware = TRUE (from Q3)
│     OR mentioned in Q1
│     OR mentioned in Q2
│
├─ STEP 3: Top-of-Mind Awareness
│  │
│  └─ Count respondents where:
│     top_of_mind_mention = [BANK_NAME]
│
├─ STEP 4: Spontaneous Recall
│  │
│  └─ Count UNIQUE respondents where:
│     (top_of_mind_mention = [BANK_NAME])
│     OR (Q2_mentions contains [BANK_NAME])
│
├─ STEP 5: Calculate Derived Metrics
│  │
│  ├─ Awareness Quality = Top-of-Mind ÷ Total Awareness
│  ├─ Share of Voice = Bank TOM ÷ All TOM
│  └─ Demographic Breakdowns
│
├─ STEP 6: Competitive Ranking
│  │
│  └─ Rank all banks by each metric
│
└─ STEP 7: Trend Analysis
   │
   └─ Compare to previous periods
```

---

# 1. SQL IMPLEMENTATION

## 1.1 Total Awareness

```sql
-- Basic Total Awareness Calculation
SELECT 
    bank_name,
    COUNT(DISTINCT CASE WHEN aware = TRUE THEN respondent_id END) as aware_count,
    COUNT(DISTINCT respondent_id) as total_count,
    ROUND(
        COUNT(DISTINCT CASE WHEN aware = TRUE THEN respondent_id END) * 100.0 / 
        NULLIF(COUNT(DISTINCT respondent_id), 0), 
        1
    ) as total_awareness_pct
FROM survey_responses
WHERE survey_period = 'June 2026'
  AND country = 'Rwanda'
GROUP BY bank_name
ORDER BY total_awareness_pct DESC;
```

**Output:**
```
bank_name    | aware_count | total_count | total_awareness_pct
-------------|-------------|-------------|--------------------
BPR          | 750         | 1000        | 75.0
BK           | 720         | 1000        | 72.0
I&M          | 680         | 1000        | 68.0
```

---

## 1.2 Top-of-Mind Awareness

```sql
-- Top-of-Mind Calculation
SELECT 
    top_of_mind_mention as bank_name,
    COUNT(*) as first_mentions,
    ROUND(
        COUNT(*) * 100.0 / 
        (SELECT COUNT(*) FROM survey_responses WHERE survey_period = 'June 2026'),
        1
    ) as top_of_mind_pct
FROM survey_responses
WHERE survey_period = 'June 2026'
  AND country = 'Rwanda'
  AND top_of_mind_mention IS NOT NULL
  AND top_of_mind_mention != 'Don''t Know'
GROUP BY top_of_mind_mention
ORDER BY first_mentions DESC;
```

---

## 1.3 Awareness Quality

```sql
-- Awareness Quality (Top-of-Mind ÷ Total Awareness)
WITH awareness_metrics AS (
    SELECT 
        bank_name,
        COUNT(DISTINCT CASE WHEN aware = TRUE THEN respondent_id END) as total_aware,
        COUNT(DISTINCT CASE WHEN top_of_mind_mention = bank_name THEN respondent_id END) as tom_count
    FROM survey_responses
    WHERE survey_period = 'June 2026'
    GROUP BY bank_name
)
SELECT 
    bank_name,
    total_aware,
    tom_count,
    ROUND(tom_count * 100.0 / NULLIF(total_aware, 0), 1) as awareness_quality_pct,
    CASE 
        WHEN tom_count * 100.0 / NULLIF(total_aware, 0) >= 40 THEN 'Excellent'
        WHEN tom_count * 100.0 / NULLIF(total_aware, 0) >= 25 THEN 'Good'
        WHEN tom_count * 100.0 / NULLIF(total_aware, 0) >= 15 THEN 'Moderate'
        WHEN tom_count * 100.0 / NULLIF(total_aware, 0) >= 10 THEN 'Weak'
        ELSE 'Poor'
    END as quality_tier
FROM awareness_metrics
ORDER BY awareness_quality_pct DESC;
```

---

## 1.4 Complete Awareness Dashboard Query

```sql
-- All Awareness Metrics in One Query
WITH base_awareness AS (
    SELECT 
        bank_name,
        respondent_id,
        aware,
        top_of_mind_mention,
        CASE WHEN top_of_mind_mention = bank_name 
             OR spontaneous_mentions LIKE '%' || bank_name || '%'
             THEN 1 ELSE 0 END as spontaneous_recall
    FROM survey_responses
    WHERE survey_period = 'June 2026'
),
awareness_metrics AS (
    SELECT 
        bank_name,
        COUNT(DISTINCT respondent_id) as total_sample,
        COUNT(DISTINCT CASE WHEN aware = TRUE THEN respondent_id END) as total_aware,
        COUNT(DISTINCT CASE WHEN top_of_mind_mention = bank_name THEN respondent_id END) as tom_count,
        COUNT(DISTINCT CASE WHEN spontaneous_recall = 1 THEN respondent_id END) as spontaneous_count
    FROM base_awareness
    GROUP BY bank_name
),
competitive_context AS (
    SELECT 
        SUM(CASE WHEN top_of_mind_mention IS NOT NULL 
                 AND top_of_mind_mention != 'Don''t Know' 
                 THEN 1 ELSE 0 END) as total_tom_mentions
    FROM survey_responses
    WHERE survey_period = 'June 2026'
)
SELECT 
    a.bank_name,
    a.total_sample,
    a.total_aware,
    ROUND(a.total_aware * 100.0 / a.total_sample, 1) as total_awareness_pct,
    a.tom_count,
    ROUND(a.tom_count * 100.0 / a.total_sample, 1) as tom_pct,
    a.spontaneous_count,
    ROUND(a.spontaneous_count * 100.0 / a.total_sample, 1) as spontaneous_pct,
    ROUND(a.tom_count * 100.0 / NULLIF(a.total_aware, 0), 1) as awareness_quality,
    ROUND(a.tom_count * 100.0 / NULLIF(c.total_tom_mentions, 0), 1) as share_of_voice
FROM awareness_metrics a
CROSS JOIN competitive_context c
ORDER BY total_awareness_pct DESC;
```

---

## 1.5 Demographic Awareness

```sql
-- Awareness by Age Group
SELECT 
    age_group,
    bank_name,
    COUNT(*) as segment_total,
    COUNT(CASE WHEN aware = TRUE THEN 1 END) as segment_aware,
    ROUND(
        COUNT(CASE WHEN aware = TRUE THEN 1 END) * 100.0 / 
        NULLIF(COUNT(*), 0),
        1
    ) as awareness_pct
FROM survey_responses
WHERE survey_period = 'June 2026'
GROUP BY age_group, bank_name
ORDER BY bank_name, age_group;
```

---

## 1.6 Trend Analysis (Month-over-Month)

```sql
-- Month-over-Month Awareness Trend
WITH monthly_awareness AS (
    SELECT 
        DATE_TRUNC('month', survey_date) as month,
        bank_name,
        COUNT(*) as total_sample,
        COUNT(CASE WHEN aware = TRUE THEN 1 END) as aware_count,
        ROUND(
            COUNT(CASE WHEN aware = TRUE THEN 1 END) * 100.0 / 
            NULLIF(COUNT(*), 0),
            1
        ) as awareness_pct
    FROM survey_responses
    WHERE survey_date >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', survey_date), bank_name
),
lagged_awareness AS (
    SELECT 
        month,
        bank_name,
        awareness_pct,
        LAG(awareness_pct) OVER (PARTITION BY bank_name ORDER BY month) as prev_month_awareness
    FROM monthly_awareness
)
SELECT 
    month,
    bank_name,
    awareness_pct as current_awareness,
    prev_month_awareness,
    awareness_pct - prev_month_awareness as change_pp,
    ROUND(
        (awareness_pct - prev_month_awareness) / NULLIF(prev_month_awareness, 0) * 100,
        1
    ) as change_pct,
    CASE 
        WHEN awareness_pct - prev_month_awareness > 3 THEN '↑↑ Strong Growth'
        WHEN awareness_pct - prev_month_awareness > 1 THEN '↑ Growth'
        WHEN ABS(awareness_pct - prev_month_awareness) <= 1 THEN '→ Stable'
        WHEN awareness_pct - prev_month_awareness < -3 THEN '↓↓ Declining'
        ELSE '↓ Slight Decline'
    END as trend_indicator
FROM lagged_awareness
WHERE prev_month_awareness IS NOT NULL
ORDER BY bank_name, month;
```

---

# 2. PYTHON IMPLEMENTATION

## 2.1 Awareness Calculator Class

```python
import pandas as pd
import numpy as np

class AwarenessAnalyzer:
    """
    Calculate awareness metrics for brand health tracking
    """
    
    def __init__(self, df, bank_name):
        """
        Initialize with survey data
        
        Args:
            df: DataFrame with columns:
                - respondent_id
                - bank (or filter to specific bank)
                - aware (bool)
                - top_of_mind_mention
                - spontaneous_mentions (comma-separated)
            bank_name: Name of bank to analyze
        """
        self.df = df
        self.bank_name = bank_name
        
    def total_awareness(self):
        """Calculate total awareness percentage"""
        total = len(self.df)
        aware = self.df['aware'].sum()
        
        awareness_pct = (aware / total * 100) if total > 0 else 0
        
        return {
            'total_sample': total,
            'aware_count': aware,
            'awareness_pct': round(awareness_pct, 1)
        }
    
    def top_of_mind(self):
        """Calculate top-of-mind awareness"""
        total = len(self.df)
        tom_count = (self.df['top_of_mind_mention'] == self.bank_name).sum()
        
        tom_pct = (tom_count / total * 100) if total > 0 else 0
        
        return {
            'tom_count': tom_count,
            'tom_pct': round(tom_pct, 1)
        }
    
    def spontaneous_recall(self):
        """Calculate spontaneous (unaided) recall"""
        # Count unique respondents who mentioned bank unprompted
        tom_mask = self.df['top_of_mind_mention'] == self.bank_name
        
        # Check if bank appears in other mentions
        other_mentions_mask = self.df['spontaneous_mentions'].str.contains(
            self.bank_name, 
            case=False, 
            na=False
        )
        
        # Combine (OR logic) and count unique
        spontaneous = (tom_mask | other_mentions_mask).sum()
        total = len(self.df)
        
        spont_pct = (spontaneous / total * 100) if total > 0 else 0
        
        return {
            'spontaneous_count': spontaneous,
            'spontaneous_pct': round(spont_pct, 1)
        }
    
    def awareness_quality(self):
        """Calculate awareness quality ratio"""
        awareness = self.total_awareness()
        tom = self.top_of_mind()
        
        if awareness['awareness_pct'] > 0:
            quality = (tom['tom_pct'] / awareness['awareness_pct']) * 100
        else:
            quality = 0
        
        return {
            'quality_pct': round(quality, 1),
            'quality_tier': self._quality_tier(quality)
        }
    
    def _quality_tier(self, quality):
        """Categorize quality score"""
        if quality >= 40:
            return 'Excellent'
        elif quality >= 25:
            return 'Good'
        elif quality >= 15:
            return 'Moderate'
        elif quality >= 10:
            return 'Weak'
        else:
            return 'Poor'
    
    def share_of_voice(self):
        """Calculate share of voice (competitive context)"""
        # Count all top-of-mind mentions (excluding Don't Know)
        all_tom = self.df[
            (self.df['top_of_mind_mention'].notna()) & 
            (self.df['top_of_mind_mention'] != "Don't Know")
        ]
        
        total_tom = len(all_tom)
        bank_tom = (self.df['top_of_mind_mention'] == self.bank_name).sum()
        
        sov = (bank_tom / total_tom * 100) if total_tom > 0 else 0
        
        return {
            'sov_pct': round(sov, 1),
            'total_mentions': total_tom,
            'bank_mentions': bank_tom
        }
    
    def demographic_breakdown(self, demographic_col):
        """
        Calculate awareness by demographic segment
        
        Args:
            demographic_col: Column name (e.g., 'age_group', 'gender')
        
        Returns:
            DataFrame with awareness by segment
        """
        results = []
        
        for segment in self.df[demographic_col].unique():
            segment_df = self.df[self.df[demographic_col] == segment]
            total = len(segment_df)
            aware = segment_df['aware'].sum()
            
            if total > 0:
                awareness_pct = round(aware / total * 100, 1)
            else:
                awareness_pct = 0
            
            results.append({
                'segment': segment,
                'total': total,
                'aware': aware,
                'awareness_pct': awareness_pct
            })
        
        return pd.DataFrame(results).sort_values('awareness_pct', ascending=False)
    
    def get_all_metrics(self):
        """Get all awareness metrics in one call"""
        return {
            'bank_name': self.bank_name,
            'total_awareness': self.total_awareness(),
            'top_of_mind': self.top_of_mind(),
            'spontaneous_recall': self.spontaneous_recall(),
            'awareness_quality': self.awareness_quality(),
            'share_of_voice': self.share_of_voice()
        }


# USAGE EXAMPLE
# -------------

# Load data
df = pd.read_csv('survey_responses.csv')

# Initialize analyzer
analyzer = AwarenessAnalyzer(df, bank_name='BK')

# Get all metrics
metrics = analyzer.get_all_metrics()

print(f"Total Awareness: {metrics['total_awareness']['awareness_pct']}%")
print(f"Top-of-Mind: {metrics['top_of_mind']['tom_pct']}%")
print(f"Quality: {metrics['awareness_quality']['quality_pct']}%")
print(f"Share of Voice: {metrics['share_of_voice']['sov_pct']}%")

# Demographic breakdown
age_breakdown = analyzer.demographic_breakdown('age_group')
print("\nAwareness by Age Group:")
print(age_breakdown)
```

---

## 2.2 Trend Analysis Function

```python
def calculate_awareness_trend(df, bank_name, periods=6):
    """
    Calculate awareness trend over time
    
    Args:
        df: DataFrame with 'survey_month' column
        bank_name: Bank to analyze
        periods: Number of periods to analyze
    
    Returns:
        DataFrame with monthly metrics and trends
    """
    # Group by month
    monthly = df.groupby('survey_month').agg({
        'respondent_id': 'count',
        'aware': 'sum'
    }).reset_index()
    
    monthly.columns = ['month', 'total', 'aware']
    monthly['awareness_pct'] = round(monthly['aware'] / monthly['total'] * 100, 1)
    
    # Calculate changes
    monthly['prev_awareness'] = monthly['awareness_pct'].shift(1)
    monthly['change_pp'] = monthly['awareness_pct'] - monthly['prev_awareness']
    monthly['change_pct'] = round(
        (monthly['change_pp'] / monthly['prev_awareness']) * 100, 
        1
    )
    
    # Trend indicators
    def trend_indicator(change):
        if pd.isna(change):
            return 'Baseline'
        elif change > 3:
            return '↑↑ Strong Growth'
        elif change > 1:
            return '↑ Growth'
        elif abs(change) <= 1:
            return '→ Stable'
        elif change < -3:
            return '↓↓ Declining'
        else:
            return '↓ Slight Decline'
    
    monthly['trend'] = monthly['change_pp'].apply(trend_indicator)
    
    # Limit to requested periods
    monthly = monthly.tail(periods)
    
    return monthly
```

---

# 3. EXCEL/GOOGLE SHEETS IMPLEMENTATION

## 3.1 Total Awareness

**Assuming:**
- Column C contains "Aware of BK?" (Yes/No)
- Rows 2-1001 contain data (1000 responses)

```excel
=COUNTIF(C2:C1001, "Yes") / COUNTA(C2:C1001) * 100
```

**With error handling:**
```excel
=IFERROR(
    COUNTIF(C2:C1001, "Yes") / COUNTA(C2:C1001) * 100,
    0
)
```

---

## 3.2 Top-of-Mind Awareness

**Assuming:**
- Column D contains "Top-of-Mind Mention"
- Rows 2-1001 contain data

```excel
=COUNTIF(D2:D1001, "BK") / COUNTA(D2:D1001) * 100
```

---

## 3.3 Awareness Quality

**Using named ranges:**
```excel
// Define names:
TotalAwareness: =Sheet1!$C$2
TopOfMind: =Sheet1!$D$2

// Quality formula:
=TopOfMind / TotalAwareness * 100
```

**Or direct formula:**
```excel
=(COUNTIF(D2:D1001, "BK") / COUNTA(D2:D1001)) / 
 (COUNTIF(C2:C1001, "Yes") / COUNTA(C2:C1001)) * 100
```

---

## 3.4 Share of Voice

**Assuming:**
- Column D = Top-of-Mind mentions
- "Don't Know" should be excluded

```excel
=COUNTIF(D2:D1001, "BK") / 
 SUMPRODUCT((D2:D1001<>"Don't Know") * (D2:D1001<>"")) * 100
```

---

## 3.5 Demographic Awareness (Age Groups)

**Using COUNTIFS:**

```excel
// Age 18-24 Awareness
=COUNTIFS(
    $E$2:$E$1001, "18-24",
    $C$2:$C$1001, "Yes"
) / COUNTIF($E$2:$E$1001, "18-24") * 100

// Age 25-34 Awareness
=COUNTIFS(
    $E$2:$E$1001, "25-34",
    $C$2:$C$1001, "Yes"
) / COUNTIF($E$2:$E$1001, "25-34") * 100
```

---

## 3.6 Month-over-Month Change

**Assuming monthly data in columns:**
```excel
// Current Month (June) in B2: 72%
// Previous Month (May) in B3: 68%

// Change in percentage points:
=B2 - B3

// Change as percentage:
=(B2 - B3) / B3 * 100
```

---

# 4. GOOGLE DATA STUDIO / LOOKER STUDIO

## 4.1 Calculated Fields

**Total Awareness:**
```
CASE 
  WHEN Aware = true THEN 1 
  ELSE 0 
END
```
*Then use COUNT() aggregation and divide by record count*

**Or simpler:**
```
COUNT(CASE WHEN Aware = true THEN Respondent_ID END) / 
COUNT(Respondent_ID) * 100
```

---

**Top-of-Mind Awareness:**
```
COUNT(CASE WHEN Top_Of_Mind_Mention = "BK" THEN Respondent_ID END) / 
COUNT(Respondent_ID) * 100
```

---

**Awareness Quality:**
```
(COUNT(CASE WHEN Top_Of_Mind_Mention = "BK" THEN Respondent_ID END) /
 COUNT(CASE WHEN Aware = true THEN Respondent_ID END)) * 100
```

---

## 4.2 Quality Tier (Categorical)

```
CASE
  WHEN Awareness_Quality >= 40 THEN "Excellent"
  WHEN Awareness_Quality >= 25 THEN "Good"
  WHEN Awareness_Quality >= 15 THEN "Moderate"
  WHEN Awareness_Quality >= 10 THEN "Weak"
  ELSE "Poor"
END
```

---

# 5. TABLEAU IMPLEMENTATION

## 5.1 Calculated Fields

**Total Awareness:**
```
SUM(IF [Aware] = TRUE THEN 1 ELSE 0 END) / 
COUNT([Respondent ID])
```

**Top-of-Mind:**
```
SUM(IF [Top of Mind Mention] = "BK" THEN 1 ELSE 0 END) / 
COUNT([Respondent ID])
```

**Awareness Quality:**
```
[Top-of-Mind Awareness] / [Total Awareness]
```

---

## 5.2 Level of Detail (LOD) Expressions

**For demographic awareness:**
```
{FIXED [Age Group]: 
    SUM(IF [Aware] = TRUE THEN 1 ELSE 0 END) / 
    COUNT([Respondent ID])
}
```

---

# 6. POWER BI DAX

## 6.1 Measures

**Total Awareness:**
```dax
Total Awareness = 
VAR TotalRespondents = COUNT(SurveyData[Respondent ID])
VAR AwareCount = CALCULATE(
    COUNT(SurveyData[Respondent ID]),
    SurveyData[Aware] = TRUE()
)
RETURN
    DIVIDE(AwareCount, TotalRespondents, 0) * 100
```

**Top-of-Mind:**
```dax
Top of Mind = 
VAR TotalRespondents = COUNT(SurveyData[Respondent ID])
VAR TOMCount = CALCULATE(
    COUNT(SurveyData[Respondent ID]),
    SurveyData[Top of Mind Mention] = "BK"
)
RETURN
    DIVIDE(TOMCount, TotalRespondents, 0) * 100
```

**Awareness Quality:**
```dax
Awareness Quality = 
DIVIDE([Top of Mind], [Total Awareness], 0) * 100
```

---

# 7. VALIDATION CHECKS

## 7.1 Data Quality Tests

```sql
-- Test 1: Verify percentages sum correctly
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN aware = TRUE THEN 1 END) as aware,
    COUNT(CASE WHEN aware = FALSE OR aware IS NULL THEN 1 END) as not_aware
FROM survey_responses;
-- aware + not_aware should = total

-- Test 2: Top-of-mind ≤ Spontaneous ≤ Total
SELECT 
    bank_name,
    total_awareness,
    spontaneous_recall,
    top_of_mind,
    CASE 
        WHEN top_of_mind <= spontaneous_recall 
         AND spontaneous_recall <= total_awareness 
        THEN 'Valid'
        ELSE 'ERROR'
    END as validation_status
FROM awareness_metrics;

-- Test 3: Check for duplicate respondents
SELECT 
    respondent_id,
    COUNT(*) as count
FROM survey_responses
GROUP BY respondent_id
HAVING COUNT(*) > 1;
-- Should return 0 rows
```

---

## 7.2 Python Validation

```python
def validate_awareness_data(df, bank_name):
    """Run validation checks on awareness data"""
    errors = []
    
    # Check 1: No missing respondent IDs
    if df['respondent_id'].isna().any():
        errors.append("Missing respondent IDs found")
    
    # Check 2: No duplicates
    if df['respondent_id'].duplicated().any():
        errors.append("Duplicate respondent IDs found")
    
    # Check 3: Awareness hierarchy
    total_aware = df['aware'].sum()
    tom_count = (df['top_of_mind_mention'] == bank_name).sum()
    
    if tom_count > total_aware:
        errors.append("Top-of-mind count exceeds total awareness (impossible)")
    
    # Check 4: Valid percentages (0-100)
    awareness_pct = (total_aware / len(df)) * 100
    if awareness_pct < 0 or awareness_pct > 100:
        errors.append(f"Invalid awareness percentage: {awareness_pct}%")
    
    if errors:
        print("⚠️ VALIDATION ERRORS:")
        for error in errors:
            print(f"  - {error}")
        return False
    else:
        print("✅ All validation checks passed")
        return True
```

---

## Quick Reference: Implementation Checklist

- [ ] Data loaded correctly (check row counts)
- [ ] Calculated total awareness
- [ ] Calculated top-of-mind awareness
- [ ] Verified TOM ≤ Total Awareness
- [ ] Calculated awareness quality
- [ ] Calculated share of voice
- [ ] Added competitive rankings
- [ ] Built demographic breakdowns
- [ ] Implemented trend analysis
- [ ] Ran validation checks
- [ ] Tested with sample data
- [ ] Verified against worked examples
- [ ] Added error handling

---

**This implementation guide provides production-ready code for all platforms. Adapt syntax as needed for your specific environment.**
