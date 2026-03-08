# Dashboard Metrics Methodology Guide - Part 2
## Brand Health Metrics

---

## Table of Contents
1. [Brand Momentum](#1-brand-momentum)
2. [NPS Deep Dive](#2-nps-deep-dive)
3. [Future Intent & Consideration](#3-future-intent--consideration)
4. [Brand Perception & Image](#4-brand-perception--image)

---

# 1. BRAND MOMENTUM

## Overview
Brand Momentum measures the overall health and trajectory of your brand by combining awareness, consideration, conversion, retention, and adoption metrics.

---

## 1.1 Momentum Score Calculation

**Formula (Weighted Composite):**
```
Momentum Score = 
    (Awareness Growth × 15%) +
    (Consideration Rate × 25%) +
    (Conversion Rate × 25%) +
    (Retention Rate × 20%) +
    (Adoption Rate × 15%)
```

**Component Definitions:**

### **1. Awareness Growth**
```
Current Period Awareness - Previous Period Awareness
```
Normalize to 0-100 scale:
```
IF growth > +10%: 100 points
IF growth = 0%: 50 points
IF growth < -10%: 0 points
Linear interpolation between
```

### **2. Consideration Rate**
```
Consideration Rate = (High Future Intent among non-users ÷ Aware non-users) × 100

Where High Intent = Future Intent score 7-10 (Section D, Q1)
```

### **3. Conversion Rate**
```
Conversion Rate = (Ever Used ÷ Aware) × 100
```

### **4. Retention Rate**
```
Retention Rate = (Currently Using ÷ Ever Used) × 100
```

### **5. Adoption Rate**
```
Adoption Rate = (Preferred Bank ÷ Currently Using) × 100
```

---

## 1.2 Momentum Score Interpretation

**Score Ranges:**
- **80-100:** Excellent momentum - brand on strong growth trajectory
- **60-79:** Good momentum - healthy but room for improvement
- **40-59:** Moderate momentum - mixed signals, needs attention
- **20-39:** Weak momentum - concerning trends
- **0-19:** Crisis - urgent intervention needed

---

## 1.3 Momentum Trend (6-Month)

**Calculate monthly momentum scores:**
```
Month 1: Score = 33
Month 2: Score = 35
Month 3: Score = 36
Month 4: Score = 36
Month 5: Score = 38
Month 6: Score = 38
```

**Trend Direction:**
```
IF Month 6 > Month 1 by >5 points: "Rising momentum ↑"
IF Month 6 < Month 1 by >5 points: "Declining momentum ↓"
ELSE: "Stable momentum →"
```

**Volatility Check:**
```
Standard Deviation = StdDev(Month 1, Month 2, ..., Month 6)

IF StdDev < 2: "Consistent"
IF StdDev < 5: "Some fluctuation"
IF StdDev >= 5: "Highly volatile - investigate causes"
```

---

## 1.4 Momentum Drivers Analysis

**Identify which factors most impact momentum:**

Calculate correlation between each component and overall score:

```
For each component:
    Calculate how much it contributes to total momentum
    
Example:
Awareness contribution: +3 points (15% weight × 20 raw score)
Consideration contribution: +18 points (25% weight × 72 raw score)
Conversion contribution: +10 points (25% weight × 40 raw score)
Retention contribution: +14 points (20% weight × 70 raw score)
Adoption contribution: +5 points (15% weight × 35 raw score)
────────────────────────────────────────
Total Momentum Score: 50 points

Biggest driver: Consideration (18/50 = 36% of total score)
Weakest link: Awareness (3/50 = 6% of total score)
```

---

## 1.5 Customer Journey Stages in Momentum

Map momentum to your customer journey stages:

```
AWARENESS (0%)
    ↓
    [Awareness Growth Factor]
    ↓
CONSIDERATION (0%)
    ↓
    [Consideration Rate Factor]
    ↓
EVER USED (0%)
    ↓
    [Conversion Rate Factor]
    ↓
CURRENT (0%)
    ↓
    [Retention Rate Factor]
    ↓
PREFERRED (0%)
    ↓
    [Adoption Rate Factor]
```

**Stage-to-Stage Conversion Rates:**
Each arrow shows momentum factor influence.

---

## 1.6 Competitive Momentum Comparison

**Market Momentum Ranking:**

For each bank, calculate momentum score, then:
```
Rank = Position in descending order of momentum scores

Also calculate:
Market Average Momentum = Sum of all banks' scores ÷ Number of banks

Your momentum relative to market:
Relative Score = (Your Score - Market Average) ÷ Market Average × 100

Example:
Your score: 68
Market average: 55
Relative: (68-55) ÷ 55 = +24% above market
```

---

## 1.7 Momentum Insights & Recommendations

**Auto-generate insights:**

```
IF momentum_score > 70 AND trend = "rising":
    Insight: "Brand momentum is strong and accelerating"
    Recommendation: "Maintain current strategy, scale successful campaigns"

IF momentum_score < 40 AND trend = "declining":
    Insight: "Brand momentum is weak and deteriorating"
    Recommendation: "Urgent review needed - focus on [weakest driver]"

IF momentum_score is moderate but volatile:
    Insight: "Inconsistent performance suggests operational issues"
    Recommendation: "Investigate root causes of fluctuations"
```

---

# 2. NPS DEEP DIVE

## Overview
Net Promoter Score (NPS) measures customer satisfaction and loyalty through likelihood to recommend.

---

## 2.1 Core NPS Calculation

**Formula:**
```
NPS = % Promoters - % Detractors

Where:
Promoters: Score 9-10
Passives: Score 7-8
Detractors: Score 0-6
```

**Data Source:** Section E, Q5 ("How likely are you to recommend [BANK]?")

**Example:**
```
100 respondents who ever used BK:
- 40 gave scores 9-10 → 40% Promoters
- 35 gave scores 7-8 → 35% Passives
- 25 gave scores 0-6 → 25% Detractors

NPS = 40% - 25% = +15
```

**Score Range:** -100 to +100

---

## 2.2 NPS Benchmarks

**Industry Standards (Banking):**
- **World Class:** +70 to +100
- **Excellent:** +50 to +69
- **Good:** +30 to +49
- **Average:** +10 to +29
- **Poor:** -10 to +9
- **Critical:** -100 to -11

**Regional Context:**
- Developed markets: +30 to +50 typical
- Emerging markets: +10 to +30 typical (lower expectations)

---

## 2.3 NPS by Customer Segment

**Calculate NPS for each usage segment:**

### **By Usage Status:**
```
BUMO (Preferred Bank) NPS:
    Only include respondents where bank = preferred
    Calculate NPS for this subset

Secondary Users NPS:
    Currently using but NOT preferred
    Calculate NPS for this subset

Lapsed Users NPS:
    Ever used but NOT currently using
    Calculate NPS for this subset
```

**Expected Pattern:**
- BUMO NPS should be highest (+40 to +60)
- Secondary users: moderate (+20 to +40)
- Lapsed users: negative or very low (-20 to +10)

---

### **By Loyalty Segment:**
```
Committed NPS: Should be +80 to +100 (mostly 9-10 scores)
Favors NPS: Should be +40 to +70
Potential NPS: N/A (haven't used yet)
Rejectors NPS: Should be -50 to -20 (bad experiences)
```

---

### **By Demographics:**
```
Age 18-24 NPS:
    Filter respondents age 18-24 who used bank
    Calculate NPS for this subset

Age 25-34 NPS:
    Filter respondents age 25-34 who used bank
    Calculate NPS for this subset

...and so on for:
- Gender (Male/Female)
- Employment status
- Education level
```

**Insight Generation:**
```
IF Age 18-24 NPS is significantly lower than others:
    "Young customers are dissatisfied - investigate digital experience"

IF Female NPS < Male NPS by >10 points:
    "Women report lower satisfaction - examine service quality"
```

---

## 2.4 NPS Distribution Analysis

**Beyond the headline score, analyze the distribution:**

```
Score 10: X% (Top box - raving fans)
Score 9: Y% (Promoters but not fanatics)
Score 8: Z% (Passives - satisfied but unenthusiastic)
Score 7: A% (Passives - could go either way)
Score 6: B% (Detractors but not angry)
Score 0-5: C% (Bottom box - unhappy customers)
```

**Polarization Check:**
```
IF high % at both ends (0-2 and 9-10):
    "Polarized sentiment - you have fans and haters, few neutral"

IF high % in middle (6-8):
    "Uncommitted middle - satisfaction but no passion"
```

---

## 2.5 NPS Trend Over Time

**Track NPS month-over-month:**

```
Jan: NPS = +25
Feb: NPS = +28 (↑ +3)
Mar: NPS = +26 (↓ -2)
Apr: NPS = +30 (↑ +4)
May: NPS = +32 (↑ +2)
Jun: NPS = +35 (↑ +3)
```

**Trend Indicators:**
```
6-Month Change: +35 - +25 = +10 points (excellent improvement)

Monthly Average Change: +2 points/month

Momentum: Last 3 months vs First 3 months
    Recent: (+30 + +32 + +35) ÷ 3 = +32.3
    Earlier: (+25 + +28 + +26) ÷ 3 = +26.3
    Momentum = +32.3 - +26.3 = +6.0 points improvement
```

---

## 2.6 NPS Driver Analysis

**If you add satisfaction driver questions:**

Correlate NPS with satisfaction on different attributes:

```
For each attribute (Fees, Service, Digital, etc.):
    Calculate correlation with NPS score
    
Example findings:
- Customer Service satisfaction: r = 0.72 (strongest driver)
- Digital Experience satisfaction: r = 0.65 (important driver)
- Fees satisfaction: r = 0.42 (moderate driver)
- Branch Access satisfaction: r = 0.28 (weak driver)

Recommendation: Focus on Customer Service and Digital Experience
```

---

## 2.7 NPS vs Behavior Analysis

**Check if NPS predicts behavior:**

```
Churn Rate by NPS Category:
- Promoters (9-10): 5% churned
- Passives (7-8): 15% churned
- Detractors (0-6): 35% churned

→ NPS is predictive of retention!
```

**Wallet Share by NPS:**
```
Promoters: Average 2.3 accounts with bank
Passives: Average 1.8 accounts
Detractors: Average 1.2 accounts

→ Promoters have deeper relationships
```

---

# 3. FUTURE INTENT & CONSIDERATION

## Overview
Future Intent measures likelihood to use the bank in the future, predicting future behavior.

---

## 3.1 Future Intent Score

**Data Source:** Section D, Q1 (0-10 scale)

**Question:** "How likely are you to bank with [BANK] in the future?"

**Calculation:**
```
Average Intent Score = Sum of all scores ÷ Number of respondents
```

**Example:**
```
50 respondents rated BK:
Scores: 8, 9, 7, 5, 10, 6, 8, 8, 9, 7, ...

Average = (8+9+7+5+10+6+8+8+9+7+...) ÷ 50 = 7.2
```

---

## 3.2 Intent Score Distribution

**Categorize by intent level:**

```
Very High Intent (9-10): X% 
High Intent (7-8): Y%
Medium Intent (5-6): Z%
Low Intent (3-4): A%
Very Low Intent (0-2): B%
```

**Dashboard Visualization:**
Show distribution as stacked bar or histogram.

---

## 3.3 Intent by Current Usage Status

**Critical segmentation:**

### **Non-Users (Acquisition Potential):**
```
Aware but not using ÷ Filter by intent:

High Intent Non-Users (7-10): XX people
    → "Acquisition pipeline" - warm leads

Low Intent Non-Users (0-3): YY people
    → "Rejectors" - unlikely to convert
```

### **Current Users (Retention Indicator):**
```
Currently using ÷ Filter by intent:

High Intent Current Users (9-10): AA people
    → "Secure retention" - loyal customers

Low Intent Current Users (0-6): BB people
    → "At-risk" - likely to churn
```

**At-Risk Calculation:**
```
At-Risk % = (Current users with intent 0-6 ÷ Total current users) × 100

If > 30%: Major retention problem
```

---

## 3.4 Intent vs Current Behavior Gap

**Gap Analysis:**
```
For non-users:
    Intent - Actual Usage (0) = Intent Gap

For current users:
    Intent - Current Engagement Level = Satisfaction Gap
```

**Example:**
```
Person A: Not using, intent = 8
Gap = 8 - 0 = 8 (high unfulfilled potential)

Person B: Using as secondary bank, intent = 9
Gap = 9 - 5 (secondary usage) = 4 (room to grow to primary)

Person C: Primary bank, intent = 10
Gap = 10 - 10 = 0 (perfect alignment)
```

**Aggregate Gap:**
```
Total Unrealized Potential = Sum of all positive gaps
```

---

## 3.5 Consideration Set Analysis

**If you add the recommended question:**

**Question:** "Which banks would you seriously consider if opening a new account?"

**Metrics:**

### **Consideration Rate:**
```
Consideration Rate = (Selected in consideration set ÷ Aware) × 100
```

### **Consideration Share:**
```
Your Bank Mentions in Consideration
────────────────────────────────── × 100
Total Consideration Mentions
```

### **Average Consideration Set Size:**
```
Avg = Total banks in consideration across all respondents ÷ Number of respondents
```

**Example:**
```
1000 respondents, 800 aware of BK
450 included BK in consideration set

Consideration Rate = 450 ÷ 800 = 56%

Total mentions across all banks: 3200
BK mentions: 450
Consideration Share = 450 ÷ 3200 = 14%
```

---

## 3.6 Intent-to-Action Conversion

**Track how many with high intent actually convert:**

```
Period 1: Identify high-intent non-users (intent 8-10)
Period 2: Check how many are now using

Conversion Rate = (Now using ÷ Previously high intent) × 100
```

**Benchmark:**
- Good: 20-30% convert within 6 months
- Average: 10-20%
- Poor: <10%

---

# 4. BRAND PERCEPTION & IMAGE

## Overview
Brand perception measures how the bank is viewed in the market beyond just awareness and usage.

---

## 4.1 Relevance Score

**Data Source:** Section D, Q2

**Question:** "Which bank(s) do you feel is most suitable for people like you?"

**Calculation:**
```
Relevance Score = (Selected as relevant ÷ Aware) × 100
```

**Interpretation:**
```
High (>40%): Strong personal connection
Medium (20-40%): Moderate appeal
Low (<20%): Weak positioning
```

---

## 4.2 Popularity Index

**Data Source:** Section D, Q3

**Question:** "Which ONE bank do most people know or talk about?"

**Calculation:**
```
Popularity = (Selected as most talked about ÷ Total sample) × 100
```

**Share of Voice:**
```
Your Bank Popularity Mentions
───────────────────────────── × 100
All Popularity Mentions
```

**Perception vs Reality Gap:**
```
Gap = Popularity Score - Actual Total Awareness

IF Gap > +10: "Punching above weight - great buzz"
IF Gap < -10: "Underperforming - awareness not translating to buzz"
```

---

## 4.3 Commitment Score

**Data Source:** Section D, Q4

**Question:** "If forced to keep only ONE bank, which would it be?"

**Calculation:**
```
Commitment Score = (Selected as only bank ÷ Current users) × 100
```

**Benchmark:**
```
Strong commitment: >60%
Moderate: 40-60%
Weak: <40%
```

**Commitment vs Preference Gap:**
```
Gap = Commitment Score - Preference Score

IF Gap is large negative:
    "Many prefer us but wouldn't commit - shallow relationships"
```

---

## 4.4 Brand Attribute Mapping

**If you add brand attributes question:**

**Question:** "Which words describe [BANK]?" 

**Attributes:**
- Trustworthy
- Modern
- Affordable
- Reliable
- Innovative
- Customer-focused
- Convenient
- Secure

**Analysis:**
```
For each attribute:
    % who associate attribute with bank
    
Create perception profile:
    Strongest attributes: Trustworthy (78%), Secure (72%)
    Weakest attributes: Modern (23%), Innovative (19%)
    
Insight: "Traditional, safe brand but not seen as innovative"
```

---

## 4.5 Perception by Segment

**Calculate relevance for different groups:**

```
Age 18-24 Relevance: XX%
Age 25-34 Relevance: YY%
Age 35-44 Relevance: ZZ%

If 18-24 relevance is low:
    "Not resonating with young adults - review messaging"
```

---

## 4.6 Perception vs Usage Correlation

**Check alignment between perception and behavior:**

```
Correlation matrix:
                    Relevance  Popularity  Commitment  Ever Used  Current
Relevance              1.00       0.65       0.72       0.58      0.62
Popularity             0.65       1.00       0.45       0.42      0.38
Commitment             0.72       0.45       1.00       0.85      0.88
Ever Used              0.58       0.42       0.85       1.00      0.92
Current Usage          0.62       0.38       0.88       0.92      1.00
```

**Insights:**
- Relevance strongly predicts commitment (0.72)
- Popularity weakly predicts actual usage (0.38) - "all talk, no action"
- Commitment very strongly predicts usage (0.85+) - good alignment

---

## Key Metrics Summary

| Metric | Formula | Data Source | Benchmark |
|--------|---------|-------------|-----------|
| Momentum Score | Weighted composite of 5 factors | Derived | >60 good |
| NPS | % Promoters - % Detractors | E.Q5 | >+30 good |
| Promoters % | Scores 9-10 ÷ Users × 100 | E.Q5 | >40% |
| Detractors % | Scores 0-6 ÷ Users × 100 | E.Q5 | <20% |
| Future Intent Avg | Sum scores ÷ Respondents | D.Q1 | >7.0 |
| High Intent % | Scores 7-10 ÷ Total × 100 | D.Q1 | >50% |
| Relevance Score | Selected ÷ Aware × 100 | D.Q2 | >30% |
| Popularity | Selected ÷ Sample × 100 | D.Q3 | Top 3 |
| Commitment | Selected ÷ Current × 100 | D.Q4 | >50% |

---

*Continue to Part 3 for Competitive & Geographic Analysis*
