# Usage Analysis: Worked Examples
## Step-by-Step Calculations with Sample Data

---

## Sample Dataset

**Survey Period:** June 2026
**Country:** Rwanda  
**Total Sample:** 1,000 respondents
**Bank Focus:** BK (Bank of Kigali)

---

# EXAMPLE 1: Complete Usage Funnel

## Raw Data from Questionnaire

**Awareness (from Section C, Q3):**
```
BK aware: 720 people
BK not aware: 280 people
Total: 1,000 ✓
```

**Ever Used (from Section D, Q1):**
```
Among 720 aware of BK:
  Ever used BK: 360 people
  Never used BK: 360 people
```

**Currently Using (from Section D, Q2):**
```
Among 720 aware of BK:
  Currently using BK: 288 people
  Not currently using: 432 people
```

**Preferred Bank (from Section D, Q3):**
```
Among 288 currently using BK:
  BK is preferred/BUMO: 108 people
  Another bank is preferred: 180 people
```

## Step 1: Build the Funnel

```
AWARE
720 people (100% of aware)
    ↓
    │ Trial conversion
    ↓
EVER USED
360 people (50% of aware)
    ↓
    │ Retention
    ↓
CURRENTLY USING
288 people (40% of aware)
    ↓
    │ Preference capture
    ↓
PREFERRED BANK (BUMO)
108 people (15% of aware)
```

## Step 2: Calculate Conversion Rates

**Trial Rate:**
```
Trial Rate = Ever Used ÷ Aware × 100
           = 360 ÷ 720 × 100
           = 50%
```

**Retention Rate:**
```
Retention Rate = Currently Using ÷ Ever Used × 100
               = 288 ÷ 360 × 100
               = 80%
```

**Preference Rate:**
```
Preference Rate = Preferred ÷ Currently Using × 100
                = 108 ÷ 288 × 100
                = 37.5%
```

## Step 3: Calculate Drop-offs

**Drop-off 1: Aware → Ever Used**
```
Non-triers = 720 - 360 = 360 people
Drop-off % = 360 ÷ 720 × 100 = 50%
```

**Drop-off 2: Ever Used → Currently Using**
```
Lapsed users = 360 - 288 = 72 people  
Churn rate = 72 ÷ 360 × 100 = 20%
```

**Drop-off 3: Currently Using → Preferred**
```
Secondary users = 288 - 108 = 180 people
Secondary % = 180 ÷ 288 × 100 = 62.5%
```

## Summary Table

| Stage | Count | % of Aware | Conversion | Drop-off |
|-------|-------|------------|------------|----------|
| Aware | 720 | 100% | - | - |
| Ever Used | 360 | 50% | 50% trial | 360 lost (50%) |
| Currently Using | 288 | 40% | 80% retention | 72 lost (20%) |
| Preferred | 108 | 15% | 37.5% preference | 180 lost (62.5%) |

---

# EXAMPLE 2: Trial Rate Calculation

## Data

```
Total sample: 1,000
BK aware: 720
BK ever used: 360
```

## Calculation

**Formula:**
```
Trial Rate = (Ever Used ÷ Aware) × 100
```

**Step-by-step:**
```
Trial Rate = 360 ÷ 720
           = 0.50
           = 50%
```

## Interpretation

**Your Result:** 50% trial rate

**Benchmark:**
- Excellent: >50% ← At the threshold
- Good: 30-50% ← YOU ARE HERE ✓
- Average: 20-30%
- Poor: <20%

**Meaning:** Half of people aware of BK have tried it at some point. This is good conversion from awareness to trial.

## Competitive Context

**All Banks' Trial Rates:**
```
BK: 360 ÷ 720 = 50%
BPR: 450 ÷ 750 = 60% (better conversion)
I&M: 204 ÷ 680 = 30% (worse conversion)
EcoBank: 116 ÷ 580 = 20% (poor conversion)
```

**Insight:** BK is middle-of-pack. BPR converts awareness better (60% vs 50%). Opportunity to improve.

---

# EXAMPLE 3: Retention Rate Calculation

## Data

```
BK ever used: 360 people
BK currently using: 288 people
```

## Calculation

**Formula:**
```
Retention Rate = (Currently Using ÷ Ever Used) × 100
```

**Calculation:**
```
Retention = 288 ÷ 360
          = 0.80
          = 80%
```

## Churn Calculation

**Churned customers:**
```
Churned = Ever Used - Currently Using
        = 360 - 288
        = 72 people
```

**Churn rate:**
```
Churn Rate = 72 ÷ 360 × 100
           = 20%
```

**Verification:**
```
Retention + Churn = 80% + 20% = 100% ✓
```

## Interpretation

**Your Result:** 80% retention (20% churn)

**Benchmark:**
- Excellent: >80% ← YOU ARE HERE ✓
- Good: 65-80%
- Average: 50-65%
- Poor: <50%

**Meaning:** BK retains 4 out of 5 triers. Only 1 in 5 tries BK then leaves. This is excellent retention.

---

# EXAMPLE 4: Preference Rate Calculation

## Data

```
BK currently using: 288 people
BK as preferred/BUMO: 108 people
```

## Calculation

**Formula:**
```
Preference Rate = (Preferred ÷ Currently Using) × 100
```

**Calculation:**
```
Preference = 108 ÷ 288
           = 0.375
           = 37.5%
```

## Secondary User Calculation

**Not preferred (secondary):**
```
Secondary = 288 - 108 = 180 people
Secondary % = 180 ÷ 288 × 100 = 62.5%
```

**Verification:**
```
Primary + Secondary = 37.5% + 62.5% = 100% ✓
```

## Interpretation

**Your Result:** 37.5% preference rate

**Benchmark:**
- Excellent: >50%
- Good: 35-50% ← YOU ARE HERE ✓
- Average: 25-35%
- Poor: <25%

**Meaning:** Only 37.5% of BK customers consider it their main bank. The other 62.5% use BK as a secondary account.

**Implication:** Large opportunity to convert secondary users to primary relationships (increase wallet share).

---

# EXAMPLE 5: Market Penetration

## Data

```
Total sample: 1,000
BK currently using: 288
```

## Calculation

**Formula:**
```
Market Penetration = (Currently Using ÷ Total Sample) × 100
```

**Calculation:**
```
Penetration = 288 ÷ 1,000
            = 0.288
            = 28.8%
```

## Interpretation

**Your Result:** 28.8% market penetration

**Benchmark:**
- Market leader: >30%
- Strong player: 20-29% ← YOU ARE HERE ✓
- Moderate: 10-19%
- Niche: 5-9%
- Small: <5%

**Meaning:** BK has 28.8% of the banked population as active customers. Strong market position, just below leader threshold.

---

# EXAMPLE 6: Multi-Banking Analysis

## Sample Data

**Respondent 1:**
```
Currently using (Section D, Q2): BK, I&M, BPR
Number of banks: 3
```

**Respondent 2:**
```
Currently using: BK only
Number of banks: 1
```

**Aggregate for all BK customers (288 people):**
```
Single-bankers (use BK only): 80 people
Dual-bankers (use BK + 1 other): 120 people
Multi-bankers (use BK + 2+ others): 88 people
Total: 288 ✓
```

## Calculation 1: Average Banks per Customer

**Total active accounts:**
```
Single: 80 × 1 = 80 accounts
Dual: 120 × 2 = 240 accounts
Multi: 88 × 3 = 264 accounts (assuming avg of 3)
Total: 584 accounts
```

**Average:**
```
Avg Banks = 584 ÷ 288 = 2.03 banks per customer
```

## Calculation 2: Multi-Banking Rate

**Formula:**
```
Multi-Banking % = (Users with 2+ banks ÷ All users) × 100
```

**Calculation:**
```
Multi-banking = (120 + 88) ÷ 288 × 100
              = 208 ÷ 288 × 100
              = 72.2%
```

## Interpretation

**Your Results:**
- Average: 2.03 banks per customer
- Multi-banking rate: 72.2%

**Meaning:** 
- Most BK customers (72%) also use other banks
- Only 28% are exclusive to BK
- Average customer uses 2 banks total

**Implication:** High multi-banking = opportunity to increase wallet share by becoming preferred bank.

---

# EXAMPLE 7: Competitive Overlap

## Data

**Among 288 BK current users, which OTHER banks do they use?**

```
BK + I&M: 130 customers (45% overlap)
BK + BPR: 95 customers (33% overlap)
BK + EcoBank: 80 customers (28% overlap)
BK + Access: 40 customers (14% overlap)
BK only: 80 customers (28% exclusive)
```

**Note:** Percentages don't sum to 100% because customers can use multiple banks.

## Analysis

**Primary Competitor:**
```
I&M has highest overlap (45%)
→ I&M is BK's main competitive threat
→ These 130 customers are splitting wallets
```

**Customer Overlap Matrix:**

| Other Bank | BK Customers Also Using | Overlap % |
|------------|-------------------------|-----------|
| I&M | 130 | 45% |
| BPR | 95 | 33% |
| EcoBank | 80 | 28% |
| Access | 40 | 14% |

**Strategic Insight:**
- Target I&M customers specifically
- Study why customers use both BK and I&M
- What does I&M offer that BK doesn't?
- Opportunity: Convert these 130 to BK-only

---

# EXAMPLE 8: Customer Segment Sizing

## Segment Definitions

Using funnel data:
```
Aware: 720
Ever Used: 360
Currently Using: 288
Preferred: 108
```

## Calculate Segment Sizes

**Non-Triers:**
```
Size = Aware - Ever Used
     = 720 - 360
     = 360 people (50% of aware)
```

**Lapsed Users:**
```
Size = Ever Used - Currently Using
     = 360 - 288
     = 72 people (10% of aware, 20% of triers)
```

**Secondary Users:**
```
Size = Currently Using - Preferred
     = 288 - 108
     = 180 people (25% of aware, 62.5% of current)
```

**Primary Users (BUMO):**
```
Size = Preferred
     = 108 people (15% of aware, 37.5% of current)
```

## Summary Table

| Segment | Count | % of Aware | Status |
|---------|-------|------------|--------|
| Non-Triers | 360 | 50% | Never tried |
| Lapsed Users | 72 | 10% | Churned |
| Secondary Users | 180 | 25% | Active but not primary |
| Primary Users | 108 | 15% | Main bank |
| **Total Aware** | **720** | **100%** | - |

## Strategic Priorities

**1. Protect Primary Users (108)**
- Highest value
- Most at risk from competitors
- Focus: Retention and expansion

**2. Convert Secondary to Primary (180)**
- Already have account
- Next largest opportunity
- Focus: Cross-sell, make them prefer BK

**3. Win Back Lapsed (72)**
- Smaller segment
- Had bad experience (why they left)
- Focus: Address issues, reactivation offers

**4. Activate Non-Triers (360)**
- Largest segment
- Aware but haven't tried
- Focus: Remove barriers, trial campaigns

---

# EXAMPLE 9: Drop-off Analysis with Benchmarks

## Your Funnel

```
Stage                   Count    % of Aware    Drop-off
───────────────────────────────────────────────────────
Aware                   720      100%          -
  ↓ (50% trial)
Ever Used               360      50%           360 lost (50%)
  ↓ (80% retention)  
Currently Using         288      40%           72 lost (20%)
  ↓ (37.5% preference)
Preferred               108      15%           180 lost (62.5%)
```

## Benchmark Comparison

| Stage | Your Drop-off | Typical | Assessment |
|-------|---------------|---------|------------|
| Aware → Ever | 50% | 40-60% | ✓ Normal |
| Ever → Current | 20% | 20-35% | ✓ Good (low churn) |
| Current → Preferred | 62.5% | 50-70% | ✓ Normal |

## Friction Scoring

**Assign weights to each stage:**
```
Trial friction: 50% loss × 1.0 weight = 50 points
Churn friction: 20% loss × 2.0 weight = 40 points
Preference friction: 62.5% loss × 1.5 weight = 94 points
```

**Highest friction: Current → Preferred (94 points)**

**Action:** Focus on converting secondary users to primary bank relationships.

---

# EXAMPLE 10: Funnel Comparison Over Time

## 3-Month Trend

**April:**
```
Aware: 700 (100%)
Ever Used: 336 (48%)
Currently Using: 252 (36%)
Preferred: 84 (12%)
```

**May:**
```
Aware: 710 (100%)
Ever Used: 348 (49%)
Currently Using: 270 (38%)
Preferred: 95 (13.4%)
```

**June:**
```
Aware: 720 (100%)
Ever Used: 360 (50%)
Currently Using: 288 (40%)
Preferred: 108 (15%)
```

## Calculate Improvements

**Trial Rate:**
```
April: 48%
June: 50%
Improvement: +2 percentage points
```

**Retention Rate:**
```
April: 252 ÷ 336 = 75.0%
June: 288 ÷ 360 = 80.0%
Improvement: +5 percentage points ✓ Significant
```

**Preference Rate:**
```
April: 84 ÷ 252 = 33.3%
June: 108 ÷ 288 = 37.5%
Improvement: +4.2 percentage points ✓ Good
```

## Insight

All funnel metrics improving:
- Trial conversion up slightly (+2 pp)
- Retention improving significantly (+5 pp)
- Preference capture increasing (+4.2 pp)

**Overall assessment:** Healthy growth across entire customer journey.

---

# EXAMPLE 11: Competitive Usage Comparison

## All Banks' Usage Metrics

| Bank | Aware | Ever Used | Trial % | Current | Retention % | Preferred | Preference % |
|------|-------|-----------|---------|---------|-------------|-----------|--------------|
| BK | 720 | 360 | 50% | 288 | 80% | 108 | 37.5% |
| BPR | 750 | 450 | 60% | 338 | 75% | 135 | 40.0% |
| I&M | 680 | 204 | 30% | 163 | 80% | 57 | 35.0% |
| EcoBank | 580 | 116 | 20% | 58 | 50% | 17 | 29.3% |

## Analysis

**Best Trial Conversion:**
```
BPR: 60% (leader)
BK: 50% (good)
I&M: 30% (weak)
EcoBank: 20% (poor)
```

**Best Retention:**
```
BK: 80% (tied for best)
I&M: 80% (tied for best)
BPR: 75% (good)
EcoBank: 50% (poor - major churn problem)
```

**Best Preference Capture:**
```
BPR: 40.0% (leader)
BK: 37.5% (close second)
I&M: 35.0%
EcoBank: 29.3% (weak)
```

## Strategic Positioning

**BK vs BPR:**
- BPR leads in trial (60% vs 50%) - they convert awareness better
- BK leads in retention (80% vs 75%) - we keep customers better
- BPR leads in preference (40% vs 37.5%) - slightly

**Opportunity:** Improve trial conversion to match BPR (potential +10pp = 36 more customers from current aware base).

---

## Quick Reference: Key Formulas

```
Trial Rate = Ever Used ÷ Aware × 100

Retention Rate = Currently Using ÷ Ever Used × 100

Churn Rate = 100 - Retention Rate

Preference Rate = Preferred ÷ Currently Using × 100

Market Penetration = Currently Using ÷ Total Sample × 100

Multi-Banking Avg = Total active accounts ÷ Users

Multi-Banking % = (Users with 2+ banks ÷ All users) × 100

Drop-off % = (Lost customers ÷ Previous stage) × 100
```

---

**These worked examples demonstrate all major usage calculations. Use as reference for building and validating your dashboard.**
