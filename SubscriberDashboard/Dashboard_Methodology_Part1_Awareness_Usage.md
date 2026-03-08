# Dashboard Metrics Methodology Guide - Part 1
## Awareness & Usage Analytics

---

## Table of Contents
1. [Awareness Analysis](#1-awareness-analysis)
2. [Usage Analysis](#2-usage-analysis)
3. [Customer Journey Analytics](#3-customer-journey-analytics)

---

# 1. AWARENESS ANALYSIS

## Overview
Awareness metrics measure brand recognition and recall in the market. This is the top of your marketing funnel.

---

## 1.1 Core Awareness Metrics

### **Total Awareness (Aided + Unaided)**
**Definition:** Percentage of respondents who know the bank exists (with or without prompting)

**Formula:**
```
Total Awareness = (Number who are aware ÷ Total sample) × 100
```

**Data Source:** 
- Section C, Q1 (Top-of-Mind - unaided)
- Section C, Q2 (Spontaneous Recall - unaided)  
- Section C, Q3 (Total Awareness - aided checklist)

**Calculation Logic:**
```
If respondent mentioned bank in Q1 OR Q2 OR selected in Q3:
    aware = TRUE
```

**Benchmark:** 
- New brand: 10-30%
- Established brand: 60-90%
- Market leader: 80-95%

---

### **Top-of-Mind Awareness (Unaided)**
**Definition:** Percentage who mention the bank FIRST when asked about banks

**Formula:**
```
Top-of-Mind = (First mentions ÷ Total sample) × 100
```

**Data Source:** Section C, Q1 ("Which bank comes to mind FIRST?")

**Key Insight:** This is the strongest measure of brand salience. The bank that comes to mind first is most likely to be chosen.

**Benchmark:**
- Market leader: 20-40%
- Challenger brand: 5-15%
- New entrant: <5%

---

### **Spontaneous Recall (Unaided)**
**Definition:** Percentage who mention the bank without prompting (but not necessarily first)

**Formula:**
```
Spontaneous Recall = (Unaided mentions ÷ Total sample) × 100
```

**Data Source:** Section C, Q2 ("Which OTHER banks come to mind?")

**Calculation:**
```
Count ALL mentions of the bank in Q1 + Q2
(Don't double-count if someone mentioned in both)
```

**Important:** Spontaneous Recall ≥ Top-of-Mind always (it's a superset)

---

### **Aided Awareness**
**Definition:** Percentage who recognize the bank when shown a list

**Formula:**
```
Aided Awareness = (Selected in prompted list ÷ Total sample) × 100
```

**Data Source:** Section C, Q3 (checklist of banks)

**Key Insight:** Gap between Spontaneous and Aided shows depth of brand presence.

---

### **Awareness Quality**
**Definition:** Ratio showing how many aware people think of you first

**Formula:**
```
Awareness Quality = (Top-of-Mind ÷ Total Awareness) × 100
```

**Interpretation:**
- **High (>30%):** Strong brand salience
- **Medium (15-30%):** Moderate mind-share
- **Low (<15%):** Weak positioning, passive awareness

**Example:**
```
Bank A: 80% Total Awareness, 32% Top-of-Mind
Quality = 32 ÷ 80 = 40% (Strong)

Bank B: 80% Total Awareness, 8% Top-of-Mind  
Quality = 8 ÷ 80 = 10% (Weak - people know you but don't think of you)
```

---

## 1.2 Awareness Funnel

The awareness funnel shows the cascade from general knowledge to first recall:

```
TOTAL SAMPLE (100%)
        ↓
TOTAL AWARENESS (70%)
        ↓
SPONTANEOUS RECALL (45%)
        ↓
TOP-OF-MIND (15%)
```

**Funnel Conversion Rates:**
- Sample → Total Aware: Awareness penetration
- Total → Spontaneous: Depth of awareness (should be 50-70%)
- Spontaneous → Top-of-Mind: Mind-share dominance (should be 20-40%)

---

## 1.3 Competitive Awareness Ranking

**Methodology:**
1. Calculate Total Awareness for all banks
2. Calculate Top-of-Mind for all banks
3. Rank banks by both metrics
4. Calculate awareness share of voice

**Share of Voice Formula:**
```
Bank's Top-of-Mind Awareness
─────────────────────────────── × 100
Sum of ALL banks' Top-of-Mind
```

**Example:**
```
BK: 15% Top-of-Mind
I&M: 12% Top-of-Mind
BPR: 18% Top-of-Mind
Others: 5% Top-of-Mind
────────────────────
Total: 50% (50% said "don't know" or mentioned non-tracked banks)

BK Share of Voice = 15 ÷ 50 = 30%
```

---

## 1.4 Awareness Trend Analysis

**Month-over-Month Change:**
```
Change = Current Period - Previous Period
Change % = (Change ÷ Previous Period) × 100
```

**Example:**
```
January: 68% Total Awareness
February: 72% Total Awareness

Change = 72 - 68 = +4 percentage points
Change % = (4 ÷ 68) × 100 = +5.9%
```

**Interpretation:**
- **+2% or more:** Strong growth
- **-2% or less:** Concerning decline
- **±2%:** Normal fluctuation

---

## 1.5 Awareness by Demographics

**Calculate awareness for each segment:**
```
Age 18-24 Awareness = (Aware in age group ÷ Total in age group) × 100
Age 25-34 Awareness = (Aware in age group ÷ Total in age group) × 100
...etc.
```

**Key Analyses:**
- Which age groups have highest/lowest awareness?
- Is awareness higher among men or women?
- Does awareness correlate with education level?

---

## 1.6 Awareness Insight Generation

**Automatic Insights to Display:**

1. **Leading/Lagging Indicator:**
```
IF Top-of-Mind Rank > Total Awareness Rank:
    "BK has strong recall relative to awareness - good quality"
ELSE:
    "BK has weak recall - people know you but don't think of you first"
```

2. **Trend Interpretation:**
```
IF Current > Previous by >5%:
    "Strong awareness growth - campaigns working"
ELIF Current < Previous by >5%:
    "Awareness declining - need intervention"
```

3. **Competitive Position:**
```
IF Rank = 1:
    "BK leads the market in awareness"
ELIF Rank <= 3:
    "BK is among top-of-mind leaders"
ELSE:
    "BK awareness lags behind competitors"
```

---

# 2. USAGE ANALYSIS

## Overview
Usage metrics track the customer journey from trial to active usage to primary bank status.

---

## 2.1 Core Usage Metrics

### **Ever Used (Trial Rate)**
**Definition:** Percentage of aware people who have tried the bank

**Formula:**
```
Ever Used % = (Ever used ÷ Total aware) × 100
```

**Data Source:** Section D, Q1 ("Which banks have you ever used?")

**Important:** Calculate as % of AWARE, not total sample
- Someone can't have "ever used" if they're not aware

**Benchmark:**
- High conversion: 40-60% of aware
- Medium: 20-40%
- Low: <20%

---

### **Currently Using (Active Users)**
**Definition:** Percentage with active accounts

**Formula:**
```
Currently Using % = (Currently using ÷ Total aware) × 100
```

**Data Source:** Section D, Q2 ("Which banks are you currently using?")

**Also calculate as raw penetration:**
```
Market Penetration = (Currently using ÷ Total sample) × 100
```

---

### **Preferred Bank (BUMO - Bank Used Most Often)**
**Definition:** Users who consider this their primary/main bank

**Formula:**
```
Preferred % = (Selected as preferred ÷ Total aware) × 100

Also: Preference Rate = (Preferred ÷ Currently Using) × 100
```

**Data Source:** Section D, Q3 ("Which ONE bank do you use most often?")

**Key Insight:** This is your "primary relationship" metric. Secondary bank users have lower engagement and higher churn risk.

---

### **Multi-Banking Rate**
**Definition:** How many banks do users have on average?

**Formula:**
```
Avg Banks per User = Total active accounts ÷ Number of users with ≥1 account
```

**Calculation:**
```
For each respondent:
    Count how many banks selected in "Currently Using" (Q2)
    
Average across all users
```

**Industry context:**
- Developed markets: 2-3 banks per person average
- Emerging markets: 1.5-2 banks per person

---

### **Retention Rate**
**Definition:** Percentage of triers who remain active

**Formula:**
```
Retention Rate = (Currently Using ÷ Ever Used) × 100
```

**Data Source:** 
- Ever Used: Section D, Q1
- Currently Using: Section D, Q2

**Benchmark:**
- Excellent: >80%
- Good: 60-80%
- Poor: <60%

**Example:**
```
1000 people aware of BK
500 have ever used BK
350 currently use BK

Retention = 350 ÷ 500 = 70%
```

---

## 2.2 Usage Funnel

```
AWARE (100%)
    ↓
EVER USED (40%)     [Trial/Conversion Rate = 40%]
    ↓
CURRENTLY USING (28%)     [Retention Rate = 70%]
    ↓
PREFERRED BANK (10%)     [Preference Rate = 36%]
```

**Funnel Metrics:**
1. **Trial Rate** = Ever Used ÷ Aware
2. **Retention Rate** = Current ÷ Ever Used
3. **Preference Rate** = Preferred ÷ Current

---

## 2.3 Customer Segments by Usage

### **Non-Triers**
- Aware but never used
- Size: Aware - Ever Used

### **Lapsed Users**
- Used before but not currently
- Size: Ever Used - Currently Using
- **Critical segment:** These are your churned customers

### **Secondary Users**
- Currently using but NOT preferred
- Size: Currently Using - Preferred

### **Primary Users (BUMO)**
- Preferred/main bank
- Size: Number who selected as Preferred

---

## 2.4 Drop-Off Analysis

**Calculate drop-off at each stage:**

```
Aware → Ever Used drop-off:
Drop-off = Aware - Ever Used
Drop-off % = (Drop-off ÷ Aware) × 100

Ever Used → Current drop-off:
Drop-off = Ever Used - Currently Using  
Drop-off % = (Drop-off ÷ Ever Used) × 100

Current → Preferred drop-off:
Drop-off = Currently Using - Preferred
Drop-off % = (Drop-off ÷ Currently Using) × 100
```

**Dashboard Display:**
```
Stage: Aware → Ever Used
Loss: 600 people (-60%)

Stage: Ever Used → Current  
Loss: 150 people (-30%)

Stage: Current → Preferred
Loss: 250 people (-71%)
```

---

## 2.5 Usage Intensity & Engagement

**If you add the recommended question about transaction frequency:**

**Engagement Score:**
```
Daily users: 100 points
Multiple times per week: 80 points
Weekly: 60 points
Monthly: 40 points
Rarely: 20 points

Avg Engagement = Sum of all points ÷ Number of users
```

**Segment by Engagement:**
- **Highly Engaged:** Daily + Multiple/week (80-100 points)
- **Moderately Engaged:** Weekly + Monthly (40-60 points)
- **At Risk:** Rarely (<40 points)

---

# 3. CUSTOMER JOURNEY ANALYTICS

## Overview
Customer Journey Analytics maps the path from awareness to advocacy, identifying friction points and conversion opportunities.

---

## 3.1 Journey Stages

**5-Stage Model:**
```
1. AWARENESS → Know the bank exists
2. CONSIDERATION → Thinking about using it  
3. TRIAL → Open account, first usage
4. ACTIVE USAGE → Regular transactions
5. ADVOCACY → Preferred bank, recommend to others
```

**Mapping to Your Data:**
```
Stage 1 (Awareness): Section C, Q3
Stage 2 (Consideration): Section D, Q1 (Future Intent 7-10)
Stage 3 (Trial): Section D, Q1 (Ever Used)
Stage 4 (Active): Section D, Q2 (Currently Using)
Stage 5 (Advocacy): Section D, Q3 (Preferred) + Section E, Q5 (NPS 9-10)
```

---

## 3.2 Journey Conversion Rates

**Calculate progression rates:**

```
Awareness → Consideration:
Rate = (Future Intent 7-10 among aware non-users ÷ Aware non-users) × 100

Consideration → Trial:
Rate = (Ever Used among those who had intent ÷ High intent) × 100

Trial → Active:
Rate = (Currently Using ÷ Ever Used) × 100

Active → Advocacy:
Rate = (Preferred + NPS 9-10 ÷ Currently Using) × 100
```

---

## 3.3 Time-to-Conversion Analysis

**If you add account opening date question:**

Calculate how long it takes customers to progress through stages:

```
Time to Trial = Date of first use - Date of awareness
Time to Active = Date of regular usage - Date of trial
Time to Primary = Date of becoming preferred - Date of active usage
```

**Benchmarks:**
- Fast conversion: <1 month
- Medium: 1-3 months
- Slow: >3 months

---

## 3.4 Journey Friction Points

**Identify where people get stuck:**

```
Friction Score = Drop-off % × Stage importance weight

Example:
Aware → Consider: 70% drop-off × 1.0 weight = 70 friction points
Consider → Trial: 40% drop-off × 1.5 weight = 60 friction points
Trial → Active: 30% drop-off × 2.0 weight = 60 friction points
Active → Advocate: 65% drop-off × 1.2 weight = 78 friction points

→ Biggest friction: Active → Advocate (need to improve satisfaction)
```

---

## 3.5 Multi-Touch Attribution

**If tracking marketing touchpoints:**

Calculate which touchpoints contribute most to conversion:

```
For each touchpoint (TV, Social Media, Branch visit, etc.):
    Conversion with touchpoint - Baseline conversion
    ─────────────────────────────────────────────── × 100
                Baseline conversion
```

---

## 3.6 Journey Segmentation

**Create journey-based personas:**

### **Fast Movers**
- Aware → Active in <1 month
- High engagement from start
- Size: 15-20% of actives

### **Slow Adopters**
- Aware → Active in >6 months
- Gradual engagement increase
- Size: 30-40% of actives

### **Churned**
- Ever Used but no longer active
- Need win-back campaigns
- Size: 30% of ever-users

### **Stuck in Consideration**
- Aware + High intent but haven't tried
- Need conversion push
- Size: 20-30% of aware non-users

---

## 3.7 Customer Lifetime Value Estimate

**If you have transaction data:**

```
CLV = (Avg monthly revenue per user × Avg lifetime in months) - Acquisition cost

Where:
Avg lifetime = 1 ÷ Churn rate
Churn rate = 1 - Retention rate
```

---

## Key Metrics Summary Table

| Metric | Formula | Data Source | Benchmark |
|--------|---------|-------------|-----------|
| Total Awareness | Aware ÷ Total Sample × 100 | C.Q3 | 60-90% |
| Top-of-Mind | First mentions ÷ Sample × 100 | C.Q1 | 15-30% |
| Awareness Quality | Top-of-Mind ÷ Total Aware × 100 | Derived | >30% good |
| Ever Used | Ever Used ÷ Aware × 100 | D.Q1 | 30-50% |
| Currently Using | Current ÷ Aware × 100 | D.Q2 | 20-35% |
| Retention Rate | Current ÷ Ever Used × 100 | Derived | >70% |
| Preferred Bank | Preferred ÷ Aware × 100 | D.Q3 | 10-20% |
| Preference Rate | Preferred ÷ Current × 100 | Derived | 30-50% |

---

## Next Steps

1. Review the formulas and ensure your data structure supports these calculations
2. Check the worked examples document for sample calculations
3. Use the implementation logic document for code/formulas
4. Validate metrics with small sample before full dashboard deployment

---

*Continue to Part 2 for Brand Health Metrics (Momentum, NPS, Perception, Future Intent)*
