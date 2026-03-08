# NPS Deep Dive: Complete Methodology Guide

---

## Overview

Net Promoter Score (NPS) measures customer satisfaction and loyalty through willingness to recommend. It's one of the most widely used customer experience metrics in banking.

---

## Table of Contents
1. [NPS Fundamentals](#nps-fundamentals)
2. [Core NPS Calculations](#core-nps-calculations)
3. [NPS by Segments](#nps-by-segments)
4. [NPS Distribution Analysis](#nps-distribution-analysis)
5. [NPS Drivers](#nps-drivers)
6. [Trend Analysis](#trend-analysis)
7. [Actionable Insights](#actionable-insights)

---

# 1. NPS FUNDAMENTALS

## 1.1 The NPS Question

**Your Questionnaire:**
Section E, Q5: "On a scale of 0 to 10, how likely are you to recommend [BANK] to a friend or colleague?"

**Scale:**
- 0 = Not at all likely
- 10 = Extremely likely

**Important:** Only ask customers who have EVER USED the bank (they need experience to recommend).

---

## 1.2 The Three Categories

### Promoters (9-10)
- **Who:** Loyal enthusiasts
- **Behavior:** Actively recommend, repeat purchase, positive word-of-mouth
- **Value:** Highest lifetime value, lowest churn
- **Color:** Green

### Passives (7-8)
- **Who:** Satisfied but unenthusiastic
- **Behavior:** Won't actively recommend, vulnerable to competition
- **Value:** Moderate, higher churn risk than promoters
- **Color:** Yellow/Orange
- **Note:** NOT included in NPS calculation

### Detractors (0-6)
- **Who:** Unhappy customers
- **Behavior:** Negative word-of-mouth, likely to churn, damage brand
- **Value:** Negative (cost to retain, hurt reputation)
- **Color:** Red

---

## 1.3 Why NPS Matters in Banking

**Research shows:**
- Promoters have 3-5x higher wallet share than detractors
- Detractors cost 2x more to serve (complaints, support)
- Each promoter drives 2-3 new customers through referrals
- Passives are 4x more likely to churn than promoters

**Banking-specific insights:**
- NPS correlates with deposits growth
- Branch NPS predicts cross-sell success
- Digital NPS drives mobile app adoption

---

# 2. CORE NPS CALCULATIONS

## 2.1 Basic NPS Formula

```
NPS = % Promoters - % Detractors

Where:
% Promoters = (Scores 9-10 ÷ Total responses) × 100
% Detractors = (Scores 0-6 ÷ Total responses) × 100
```

**Important:** Passives (7-8) are counted in total but NOT in the formula.

### Score Range
- **Best possible:** +100 (everyone is 9-10)
- **Worst possible:** -100 (everyone is 0-6)
- **Neutral:** 0 (equal promoters and detractors)

---

## 2.2 NPS Calculation Steps

**Step 1: Categorize Responses**
```
For each respondent:
IF score >= 9: Promoter
IF score = 7 OR score = 8: Passive  
IF score <= 6: Detractor
```

**Step 2: Count Each Category**
```
Promoters: Count(scores 9-10)
Passives: Count(scores 7-8)
Detractors: Count(scores 0-6)
Total: Promoters + Passives + Detractors
```

**Step 3: Calculate Percentages**
```
% Promoters = (Promoters ÷ Total) × 100
% Passives = (Passives ÷ Total) × 100
% Detractors = (Detractors ÷ Total) × 100
```

**Step 4: Calculate NPS**
```
NPS = % Promoters - % Detractors
```

---

## 2.3 NPS Benchmarks (Banking)

### Global Banking Standards
- **World Class:** +70 to +100
- **Excellent:** +50 to +69
- **Good:** +30 to +49
- **Average:** +10 to +29
- **Poor:** -10 to +9
- **Critical:** -100 to -11

### Regional Context
- **Developed Markets:** +30 to +50 typical
- **Emerging Markets:** +10 to +30 typical (lower baseline expectations)

### By Bank Type
- **Digital-first banks:** +40 to +60
- **Traditional banks:** +20 to +40
- **Microfinance:** +15 to +35

---

# 3. NPS BY SEGMENTS

## 3.1 NPS by Usage Status

### Primary Bank (BUMO) NPS
**Who:** Customers where this is their main bank
**Expected:** +40 to +70 (should be highest)
**Why it matters:** These are your most engaged customers

**Calculation:**
```
Filter to: Preferred_Bank = "BK"
Calculate NPS for this subset only
```

### Secondary Bank NPS
**Who:** Active customers but prefer another bank
**Expected:** +15 to +40 (moderate)
**Why it matters:** Identifies conversion opportunity

**Calculation:**
```
Filter to: Currently_Using = TRUE AND Preferred_Bank ≠ "BK"
Calculate NPS for this subset
```

### Lapsed User NPS
**Who:** Used before, no longer active
**Expected:** -30 to +10 (often negative)
**Why it matters:** Shows why customers left

**Calculation:**
```
Filter to: Ever_Used = TRUE AND Currently_Using = FALSE
Calculate NPS for this subset
```

---

## 3.2 NPS by Demographics

### Age Group NPS
**Calculate separately for:**
- 18-24
- 25-34
- 35-44
- 45-54
- 55+

**Pattern to expect:** 
- Often higher among older customers (more patient, traditional)
- Lower among youth (higher digital expectations)

### Gender NPS
**Calculate separately for:**
- Male
- Female

**What to look for:**
- Gaps >10 points suggest gendered service issues
- Example: Lower female NPS may indicate male-biased service culture

### Employment NPS
- Employed
- Self-employed
- Unemployed/Student

**Insight:** Self-employed often have different needs (business banking)

---

## 3.3 NPS by Loyalty Segment

### Committed Customers
**Expected NPS:** +80 to +100
**Why:** These are your raving fans

### Favors Customers  
**Expected NPS:** +40 to +70
**Why:** Satisfied but not fully committed

### Rejectors
**Expected NPS:** -50 to -20
**Why:** Had bad experiences

---

## 3.4 NPS by Channel

**If you track channel data:**

### Branch NPS
Customers who primarily use branches

### Digital NPS
Customers who primarily use mobile/online

### ATM NPS
ATM-only users

**Insight:** Digital NPS often 10-20 points higher than branch

---

# 4. NPS DISTRIBUTION ANALYSIS

## 4.1 Score Distribution

**Beyond the headline number, analyze the full distribution:**

```
Score 10: X%  }
Score 9:  Y%  } = Promoters (add these)
Score 8:  Z%  }
Score 7:  A%  } = Passives (excluded from NPS)
Score 6:  B%  }
Score 5:  C%  }
Score 4:  D%  }
Score 3:  E%  } = Detractors (add these)
Score 2:  F%  }
Score 1:  G%  }
Score 0:  H%  }
```

---

## 4.2 Distribution Patterns

### Healthy Distribution
```
Heavy right-skew (most scores 8-10)
Few detractors (<20%)
Example: 
  10: 20%
  9:  30%
  8:  25%
  7:  15%
  0-6: 10%
```

### Polarized Distribution
```
High scores at both extremes
Large gap in middle
Example:
  9-10: 40%
  7-8:  20%
  0-2:  30%
  
Problem: You have fans AND haters, few neutral
Cause: Inconsistent service quality
```

### Neutral Distribution
```
Most scores cluster 5-7
Few strong opinions either way
Example:
  9-10: 15%
  7-8:  50%
  0-6:  35%
  
Problem: No passion, vulnerable to competition
Cause: Adequate but uninspiring experience
```

---

## 4.3 Top Box vs Bottom Box

**Top Box (Score 10 only):**
```
Top Box % = (Score 10 ÷ Total) × 100
```
**Benchmark:** 15-30% is good

**Bottom Box (Scores 0-4):**
```
Bottom Box % = (Scores 0-4 ÷ Total) × 100
```
**Benchmark:** <10% is good

**Why track separately:**
- Top box = True evangelists
- Bottom box = Severely dissatisfied (urgent action needed)

---

# 5. NPS DRIVERS

## 5.1 Correlation Analysis

**If you add satisfaction driver questions, correlate with NPS:**

### Example Drivers (Banking)
- Branch access
- Digital experience
- Customer service quality
- Fees and charges
- Product range
- Transaction speed
- Trust and security

**Method:**
```
For each driver:
  Calculate correlation coefficient with NPS score
  Rank by correlation strength
```

**Example Output:**
```
Driver                    Correlation
─────────────────────────────────────
Customer Service           0.72 (Strongest)
Digital Experience         0.65
Trust & Security           0.58
Fees & Charges            0.42
Branch Access             0.28 (Weakest)
```

**Action:** Focus improvement efforts on high-correlation drivers.

---

## 5.2 Relative Importance

**Not all drivers matter equally:**

### Impact-Satisfaction Matrix

```
            High Performance │ Low Performance
            ─────────────────┼─────────────────
High        Strengths        │ Priority Fixes
Impact      (Maintain)       │ (Fix Urgently)
            ─────────────────┼─────────────────
Low         Nice to Have     │ Low Priority
Impact      (Don't over-     │ (Monitor)
            invest)          │
```

**Example:**
- Digital Experience: High impact + Low satisfaction = PRIORITY FIX
- Branch decor: Low impact + Low satisfaction = Don't worry about it

---

# 6. TREND ANALYSIS

## 6.1 Month-over-Month NPS

**Track NPS monthly:**

```
Jan: +25
Feb: +28 (↑ +3)
Mar: +26 (↓ -2)
Apr: +30 (↑ +4)
May: +32 (↑ +2)
Jun: +35 (↑ +3)
```

**Metrics to calculate:**
- **Average monthly change:** +2 points/month
- **6-month total change:** +10 points
- **Volatility:** StdDev = 3.2 (moderate)

---

## 6.2 Trend Indicators

**Classify monthly changes:**

```
Strong Improvement:    +5 points or more
Moderate Improvement:  +2 to +4 points
Stable:                ±1 point
Moderate Decline:      -2 to -4 points
Concerning Decline:    -5 points or more
```

---

## 6.3 Momentum Analysis

**Compare periods:**

```
Recent 3 months avg: +32.3
Earlier 3 months avg: +26.3
Momentum: +6.0 points improvement

Trend: ACCELERATING ✓
```

---

## 6.4 Category Trends

**Track each NPS category over time:**

```
Month    Promoters  Passives  Detractors  NPS
──────────────────────────────────────────────
Jan      35%        40%       25%         +10
Feb      38%        38%       24%         +14
Mar      40%        36%       24%         +16
Apr      42%        35%       23%         +19
May      45%        33%       22%         +23
Jun      48%        30%       22%         +26
```

**Insight:** Promoters growing, detractors shrinking = healthy trend.

---

# 7. ACTIONABLE INSIGHTS

## 7.1 Automatic Insight Generation

### Low NPS (<+15)
```
IF NPS < +15:
    Alert: "NPS below industry average. Customer satisfaction is poor."
    Action: "Urgent review of customer experience needed. 
             Conduct detractor interviews to identify issues."
```

### High Detractor %
```
IF Detractors% > 30%:
    Alert: "High proportion of detractors (XX%). Negative word-of-mouth risk."
    Action: "Implement detractor recovery program. 
             Address top complaint drivers urgently."
```

### Declining NPS
```
IF Current_NPS < Previous_NPS by >5 points:
    Alert: "NPS declined significantly (-X points). Investigate cause."
    Action: "Review recent changes (new fees, policy changes, staff turnover).
             Check for service quality issues."
```

### Low Top Box
```
IF Score_10_pct < 15%:
    Alert: "Few true advocates (XX% give score 10). Limited referral potential."
    Action: "Create 'wow' moments in customer journey.
             Exceed expectations, don't just meet them."
```

---

## 7.2 Segment-Specific Actions

### BUMO NPS Low (<+40)
```
Problem: Primary customers not satisfied
Impact: High churn risk on most valuable segment
Action: Priority retention campaigns, service improvements
```

### Secondary NPS Higher than BUMO
```
Problem: Casual users more satisfied than primary customers
Cause: Primary users have higher expectations or see more problems
Action: Audit primary customer pain points
```

### Youth NPS Low
```
Problem: Not resonating with young adults
Impact: Threatens future market position
Action: Digital improvements, youth-specific products
```

---

## 7.3 Recovery Strategies

### For Detractors (0-6)
**Immediate Actions:**
1. Contact within 48 hours
2. Acknowledge the issue
3. Apologize genuinely
4. Fix the problem
5. Follow up to confirm resolution

**Win-Back Offer:**
- Fee reversal
- Compensation
- Service upgrade
- Dedicated support

**Measure:**
- % of detractors who become promoters after intervention
- Time to resolution
- Re-survey NPS 30 days later

### For Passives (7-8)
**Goal:** Convert to promoters

**Actions:**
1. Identify what would make them give 9-10
2. Address those specific gaps
3. Create positive surprises
4. Build emotional connection

### For Promoters (9-10)
**Goal:** Activate as advocates

**Actions:**
1. Referral program
2. Public testimonials
3. Advisory board invitations
4. VIP treatment

---

## Key Metrics Summary

| Metric | Formula | Data Source | Benchmark (Banking) |
|--------|---------|-------------|---------------------|
| NPS | % Promoters - % Detractors | E.Q5 | >+30 good |
| Promoters % | Scores 9-10 ÷ Total × 100 | E.Q5 | >40% |
| Passives % | Scores 7-8 ÷ Total × 100 | E.Q5 | 30-40% |
| Detractors % | Scores 0-6 ÷ Total × 100 | E.Q5 | <25% |
| Top Box % | Score 10 ÷ Total × 100 | E.Q5 | >20% |
| Bottom Box % | Scores 0-4 ÷ Total × 100 | E.Q5 | <10% |

---

## Decision Framework

### When NPS is Low (<+20)
**Focus:** Customer experience overhaul
**Tactics:**
- Detractor recovery program
- Root cause analysis
- Service quality improvements
- Staff training

### When NPS is Declining
**Focus:** Identify recent changes
**Tactics:**
- Compare to previous period
- Check for policy/price changes
- Review operational issues
- Customer interviews

### When Detractors are High (>30%)
**Focus:** Damage control
**Tactics:**
- Urgent issue resolution
- Win-back campaigns
- Address top complaints
- Prevent churn

### When NPS is Good but Stagnant
**Focus:** Breakthrough to excellence
**Tactics:**
- Create "wow" experiences
- Innovate products/services
- Exceed expectations
- Build emotional connection

---

**Use this methodology to build your NPS Dashboard. Refer to worked examples for calculations and implementation docs for code.**
