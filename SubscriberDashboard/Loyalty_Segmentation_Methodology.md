# Loyalty Segmentation Methodology Guide

## Understanding the Customer Loyalty Segments

This document provides the complete logic for segmenting survey respondents into loyalty categories using your questionnaire data.

---

## The 5 Loyalty Segments Explained

### 🏆 **1. COMMITTED** (Highest Loyalty)
**Who they are:** Your most loyal customers who cannot imagine banking without you.

**Criteria - ALL conditions must be met:**
```
✓ Currently Using the bank (Section D, Q2)
✓ Selected as Preferred Bank/BUMO (Section D, Q3) 
✓ Selected in "Committed" question (Section D, Q4 - "only ONE bank to keep")
✓ NPS Score: 9-10 (Promoters) (Section E, Q5)
```

**Real-world behavior:**
- Primary bank account holders
- High satisfaction and advocacy
- Low risk of switching
- Will recommend to others

**Dashboard Color:** Green (highest value)

---

### ⭐ **2. FAVORS** (Good Loyalty)
**Who they are:** Customers who use and like your bank, but you're not their #1 choice (yet).

**Criteria - ANY of these scenarios:**

**Scenario A: Secondary Bank Users**
```
✓ Currently Using the bank (Section D, Q2)
✗ NOT selected as Preferred Bank/BUMO (Section D, Q3)
✓ NPS Score: 7-10 (Section E, Q5)
✓ Future Intent: 7-10 (Section D, Q1)
```

**Scenario B: Satisfied Current Users (not committed)**
```
✓ Currently Using the bank (Section D, Q2)
✓ Selected as Preferred Bank/BUMO (Section D, Q3)
✗ NOT selected as "Committed" bank (Section D, Q4)
✓ NPS Score: 7-10 (Section E, Q5)
```

**Real-world behavior:**
- Multi-banking customers
- Positive but not fully committed
- Medium retention risk
- Growth opportunity to convert to Committed

**Dashboard Color:** Blue

---

### 🌱 **3. POTENTIAL** (Opportunity)
**Who they are:** People who don't currently use your bank but are considering you.

**Criteria - ALL conditions must be met:**
```
✓ Aware of the bank (Section C, Q3)
✗ NOT Currently Using (Section D, Q2)
✓ Future Intent: 7-10 (Section D, Q1 - high likelihood to use)
✓ Relevance: Selected bank as "suitable for me" (Section D, Q2)
```

**Alternative Criteria (if above too restrictive):**
```
✓ Aware of the bank (Section C, Q3)
✗ NOT Currently Using (Section D, Q2)
✓ Future Intent: 6-10 (Section D, Q1)
```

**Real-world behavior:**
- In consideration phase
- Warm leads for acquisition
- Need nurturing and targeted marketing
- May have tried before and lapsed

**Dashboard Color:** Orange/Yellow

---

### 🚫 **4. REJECTORS** (Active Rejection)
**Who they are:** People who know your bank but actively don't want to use it.

**Criteria - ANY of these scenarios:**

**Scenario A: Active Rejecters**
```
✓ Aware of the bank (Section C, Q3)
✗ NOT Currently Using (Section D, Q2)
✓ Future Intent: 0-3 (Section D, Q1 - very unlikely to use)
```

**Scenario B: Dissatisfied Ex-Customers**
```
✓ Ever Used the bank (Section D, Q1)
✗ NOT Currently Using (Section D, Q2)
✓ NPS Score: 0-6 (Detractors) (Section E, Q5)
✓ Future Intent: 0-4 (Section D, Q1)
```

**Scenario C: Zero Interest**
```
✓ Aware of the bank (Section C, Q3)
✗ Never Used (Section D, Q1)
✗ NOT selected as "Relevant" (Section D, Q2)
✓ Future Intent: 0-3 (Section D, Q1)
```

**Real-world behavior:**
- Negative brand perception
- Had bad experience or heard negative things
- Will actively discourage others
- Very hard to convert

**Dashboard Color:** Red

---

### 👥 **5. ACCESSIBLES** (Neutral/Open)
**Who they are:** People who are aware but have no strong opinion either way - they're "up for grabs."

**Criteria - ALL conditions must be met:**
```
✓ Aware of the bank (Section C, Q3)
✗ NOT Currently Using (Section D, Q2)
✓ Future Intent: 4-6 (Section D, Q1 - neutral/maybe)
✗ NOT strongly relevant (not selected in Section D, Q2)
```

**Alternative Definition (if you get very few in this category):**
```
✓ Aware of the bank (Section C, Q3)
✗ NOT in any other segment (Committed, Favors, Potential, Rejectors)
```

**Real-world behavior:**
- No strong brand preference yet
- Largest potential audience
- Need awareness and education
- Price/convenience driven

**Dashboard Color:** Gray/Silver

**NOTE:** In your screenshot, Accessibles shows 100%, which suggests either:
1. The segmentation logic is treating "everyone aware" as accessible, OR
2. The logic needs refinement to properly distribute across segments

---

## Segmentation Decision Tree

```
START: Is respondent aware of Bank X? (Section C, Q3)
│
├─ NO → [Out of Scope] (Not in any segment)
│
└─ YES → Is respondent currently using Bank X? (Section D, Q2)
    │
    ├─ YES (Current User) → Is it their Preferred/BUMO bank? (Section D, Q3)
    │   │
    │   ├─ YES (Primary bank) → Did they select it as "only bank to keep"? (Section D, Q4)
    │   │   │
    │   │   ├─ YES + NPS 9-10 → [COMMITTED] ✅
    │   │   │
    │   │   └─ NO but NPS 7-10 → [FAVORS] ⭐
    │   │
    │   └─ NO (Secondary bank) → What's their NPS? (Section E, Q5)
    │       │
    │       ├─ NPS 7-10 → [FAVORS] ⭐
    │       │
    │       └─ NPS 0-6 → [FAVORS] ⭐ (but at-risk)
    │
    └─ NO (Not current user) → Have they ever used? (Section D, Q1)
        │
        ├─ YES (Lapsed user) → What's their Future Intent? (Section D, Q1)
        │   │
        │   ├─ Intent 7-10 + NPS 7-10 → [POTENTIAL] 🌱
        │   │
        │   └─ Intent 0-4 + NPS 0-6 → [REJECTORS] 🚫
        │
        └─ NO (Never used) → What's their Future Intent? (Section D, Q1)
            │
            ├─ Intent 7-10 → [POTENTIAL] 🌱
            │
            ├─ Intent 4-6 → [ACCESSIBLES] 👥
            │
            └─ Intent 0-3 → [REJECTORS] 🚫
```

---

## Questionnaire Mapping to Segments

### Data Fields Required for Segmentation:

| Questionnaire Section | Question | Field Name | Used For |
|----------------------|----------|------------|----------|
| **Section C, Q3** | Total Awareness | `aware_of_bank` | All segments (prerequisite) |
| **Section D, Q1** | Ever Used | `ever_used` | Distinguishing triers from non-triers |
| **Section D, Q2** | Currently Using | `currently_using` | Separating active from inactive |
| **Section D, Q3** | Preferred Bank (BUMO) | `preferred_bank` | Identifying primary vs secondary |
| **Section D, Q4** | Committed (only bank) | `committed_bank` | Key for Committed segment |
| **Section D, Q1** | Future Intent (0-10) | `future_intent` | Separating Potential/Accessible/Rejectors |
| **Section D, Q2** | Relevance | `relevance` | Supporting Potential identification |
| **Section E, Q5** | NPS (0-10) | `nps_score` | Quality filter for all segments |

---

## Sample Segmentation Formulas

### For Implementation in Your Dashboard Tool:

**COMMITTED:**
```
IF(
  currently_using = TRUE 
  AND preferred_bank = TRUE 
  AND committed_bank = TRUE 
  AND nps_score >= 9,
  "Committed",
  ...
)
```

**FAVORS:**
```
IF(
  currently_using = TRUE 
  AND (
    (preferred_bank = FALSE AND nps_score >= 7)
    OR
    (preferred_bank = TRUE AND committed_bank = FALSE AND nps_score >= 7)
  ),
  "Favors",
  ...
)
```

**POTENTIAL:**
```
IF(
  aware_of_bank = TRUE
  AND currently_using = FALSE
  AND future_intent >= 7
  AND (relevance = TRUE OR future_intent >= 8),
  "Potential",
  ...
)
```

**REJECTORS:**
```
IF(
  aware_of_bank = TRUE
  AND currently_using = FALSE
  AND (
    (future_intent <= 3)
    OR
    (ever_used = TRUE AND nps_score <= 6 AND future_intent <= 4)
  ),
  "Rejectors",
  ...
)
```

**ACCESSIBLES:**
```
IF(
  aware_of_bank = TRUE
  AND currently_using = FALSE
  AND future_intent >= 4 AND future_intent <= 6
  AND relevance = FALSE,
  "Accessibles",
  DEFAULT
)
```

---

## Weighted Loyalty Index Calculation

Your dashboard shows a "Loyalty Index" which is a composite score. Here's how to calculate it:

### Formula:
```
Loyalty Index = (Committed × 100) + (Favors × 70) + (Potential × 40) + (Accessibles × 20) + (Rejectors × 0)
                ────────────────────────────────────────────────────────────────────────────────────
                                            Total Aware
```

### Weights Explained:
- **Committed = 100 points** (Highest value - they're your advocates)
- **Favors = 70 points** (Good value - active customers)
- **Potential = 40 points** (Medium value - warm leads)
- **Accessibles = 20 points** (Low value - need conversion effort)
- **Rejectors = 0 points** (No value - unlikely to convert)

### Example Calculation:
```
Sample: 1000 people aware of Bank X

Committed: 50 people × 100 = 5,000
Favors: 150 people × 70 = 10,500
Potential: 200 people × 40 = 8,000
Accessibles: 400 people × 20 = 8,000
Rejectors: 200 people × 0 = 0
─────────────────────────────────
Total Points = 31,500
Total Aware = 1,000

Loyalty Index = 31,500 ÷ 1,000 = 31.5

(Scale: 0-100, where 100 = everyone is Committed)
```

---

## Questionnaire Improvements for Better Loyalty Measurement

### ✅ **Currently Covered Well:**
- Awareness (unaided and aided)
- Usage funnel (Ever → Current → Preferred)
- Commitment question (Q4, Section D)
- NPS (Q5, Section E)
- Future Intent (Q1, Section D)

### 🆕 **Recommended Additions:**

#### **1. Satisfaction Drivers** (New Question)
**Add to Section E:**

**Question:** "Please rate your satisfaction with [CURRENT BANK] on the following aspects:"
- Branch access and locations
- Digital banking (app/website)
- Customer service quality
- Fees and charges
- Loan/credit offerings
- Transaction speed
- Trust and security

**Scale:** 1-5 (Very Dissatisfied → Very Satisfied)

**Why:** This helps you understand WHY people are Committed/Favors/Rejectors, not just WHO they are.

---

#### **2. Consideration Set** (New Question)
**Add to Section D:**

**Question:** "If you were to open a new bank account tomorrow, which banks would you seriously consider?" (Select all that apply)

**Choices:** [Bank list from Section C, Q3]

**Why:** This reveals your true competitive set and helps identify Potential customers more accurately.

---

#### **3. Switching Likelihood** (New Question)
**Add to Section D:**

**Question for Current Users:** "How likely are you to switch away from [CURRENT BANK] in the next 6 months?"

**Scale:** 0-10 (Not at all likely → Extremely likely)

**Why:** This identifies "at-risk" Favors customers who might become Rejectors.

---

#### **4. Reason for Non-Usage** (New Question)
**Add to Section D, for those Aware but Not Using:**

**Question:** "You mentioned you're aware of [BANK] but don't currently use them. What's the main reason?"

**Choices:**
- Haven't needed a new bank
- Satisfied with current bank(s)
- Not sure what they offer
- Heard negative things
- Fees are too high
- Not convenient (few branches/ATMs)
- Digital experience not good
- Don't trust them
- Other (specify)

**Why:** This helps distinguish between Accessibles (neutral) and Rejectors (active avoidance) more clearly.

---

#### **5. Account Activity Level** (New Question)
**Add to Section D, for Current Users:**

**Question:** "How often do you use [BANK] for transactions?"

**Choices:**
- Daily
- Multiple times per week
- Weekly
- Monthly
- Rarely (less than monthly)

**Why:** This helps identify truly engaged Committed customers vs dormant Favors customers.

---

## Validation Checks for Your Segmentation

### Quality Control Tests:

**1. Mutual Exclusivity Check**
- Each respondent should fall into ONLY ONE segment
- If someone appears in multiple segments, your logic has a flaw

**2. Total Percentage Check**
```
Committed % + Favors % + Potential % + Accessibles % + Rejectors % 
should equal 100% of "Aware" respondents
```

**3. Current User Check**
- Committed + Favors should = Total "Currently Using" respondents
- If not, your logic is miscategorizing current users

**4. Non-User Check**
- Potential + Accessibles + Rejectors should = Aware but Not Using
- If not, you're missing some non-users in categorization

**5. Minimum Segment Sizes**
Typical healthy distribution (varies by brand maturity):
- Committed: 5-15% of aware respondents
- Favors: 10-20% of aware respondents
- Potential: 15-30% of aware respondents
- Accessibles: 30-50% of aware respondents
- Rejectors: 10-25% of aware respondents

**If you get:**
- 100% Accessibles → Your logic is defaulting everyone there (bug!)
- 0% in multiple segments → Your criteria are too strict
- >50% Rejectors → Either terrible brand health OR logic issue

---

## Dashboard Visualization Recommendations

### 1. **Loyalty Pyramid** (Your current visual is good!)
```
        ┌──────────────┐
        │  COMMITTED   │  (Top - smallest, most valuable)
        │     5%       │
        ├──────────────┤
        │   FAVORS     │
        │     15%      │
        ├──────────────┤
        │  POTENTIAL   │
        │     25%      │
        ├──────────────┤
        │ ACCESSIBLES  │
        │     40%      │
        ├──────────────┤
        │  REJECTORS   │  (Bottom - largest, least valuable)
        │     15%      │
        └──────────────┘
```

**Color coding:** Green (top) → Blue → Orange → Gray → Red (bottom)

---

### 2. **Segment Movement Tracker** (New!)
Show how people move between segments over time:

```
Period 1 → Period 2

Committed:    8%  →  10%  (↑ +2%)
Favors:      15%  →  14%  (↓ -1%)
Potential:   25%  →  28%  (↑ +3%)
Accessibles: 40%  →  35%  (↓ -5%)
Rejectors:   12%  →  13%  (↑ +1%)
```

---

### 3. **Segment Profile Cards** (New!)
For each segment, show:
- Size (% and count)
- Average NPS
- Average Future Intent
- Average demographic profile (age, gender, etc.)
- Key behaviors

Example:
```
┌────────────────────────────┐
│  🏆 COMMITTED              │
│  ─────────────────────     │
│  Size: 50 people (5%)      │
│  NPS: 9.5 (All Promoters)  │
│  Avg Age: 35-44            │
│  Primary Users: 100%       │
│  Multi-bank: 40%           │
└────────────────────────────┘
```

---

### 4. **Conversion Funnel** (New!)
Show the path to loyalty:

```
Aware (100%)
    ↓
Potential (25%)
    ↓
Favors (15%)
    ↓
Committed (5%)

Conversion rates:
Aware → Potential: 25%
Potential → Favors: 60%
Favors → Committed: 33%
```

---

## Common Pitfalls to Avoid

### ❌ **Mistake 1: Overlapping Definitions**
**Problem:** Someone is both "Favors" and "Potential"
**Solution:** Make segments mutually exclusive with clear IF/THEN logic

### ❌ **Mistake 2: Ignoring NPS**
**Problem:** Classifying dissatisfied current users as "Favors"
**Solution:** Use NPS as a quality filter - low NPS users are at-risk

### ❌ **Mistake 3: Binary Future Intent**
**Problem:** Just asking "Would you use this bank? Yes/No"
**Solution:** Use 0-10 scale to capture nuance (Potential vs Accessible vs Rejector)

### ❌ **Mistake 4: Not Tracking Lapsed Users**
**Problem:** Treating "Ever Used but not Current" same as "Never Used"
**Solution:** Lapsed users are more likely to be Rejectors (had bad experience)

### ❌ **Mistake 5: Defaulting Everyone to Accessibles**
**Problem:** Your screenshot shows 100% Accessibles
**Solution:** Tighten criteria for other segments OR make Accessibles the true "default/other" category

---

## Actionable Insights by Segment

### 📈 **Strategy for Each Segment:**

**🏆 COMMITTED (Protect & Leverage)**
- Goal: Retain and activate as advocates
- Actions: Loyalty rewards, referral programs, VIP treatment
- Risk: Complacency - keep them engaged

**⭐ FAVORS (Convert to Primary)**
- Goal: Increase share of wallet
- Actions: Targeted offers, make it easier to switch primary bank
- Risk: Secondary bank = lower engagement = higher churn risk

**🌱 POTENTIAL (Nurture & Convert)**
- Goal: Convert consideration into trial
- Actions: Awareness campaigns, trial offers, address barriers
- Risk: Competitors may get them first

**👥 ACCESSIBLES (Educate & Differentiate)**
- Goal: Create preference and consideration
- Actions: Brand building, clear value proposition, education
- Risk: Price-sensitive, easily swayed by competitors

**🚫 REJECTORS (Understand & Fix)**
- Goal: Identify root causes, fix issues, potentially win back
- Actions: Address concerns, improve reputation, rebranding if needed
- Risk: Negative word-of-mouth can grow this segment

---

## Summary: Your Current Questionnaire Can Support This!

### ✅ **What you have:**
Your existing questionnaire (Rev7_2) contains ALL the data needed to segment customers into these 5 categories:

- Awareness (Section C)
- Usage funnel (Section D)
- Commitment question (Section D, Q4)
- Future Intent (Section D, Q1)
- Relevance (Section D, Q2)
- NPS (Section E, Q5)

### 🔧 **What needs fixing:**
1. **Clarify segmentation logic** - Use the decision tree above
2. **Fix "100% Accessibles" issue** - Likely a calculation error
3. **Add segment validation checks** - Ensure mutual exclusivity
4. **Calculate Loyalty Index properly** - Use weighted formula

### 🆕 **Optional enhancements:**
1. Satisfaction drivers question
2. Consideration set question
3. Switching likelihood question
4. Reason for non-usage question
5. Account activity level question

---

## Next Steps

1. **Implement segmentation logic** using the decision tree provided
2. **Validate with a small sample** (10-20 responses) manually
3. **Check segment distribution** - should NOT be 100% in one category
4. **Calculate Loyalty Index** using the weighted formula
5. **Add segment profile cards** to your dashboard
6. **Track segment movement** month-over-month

**Your loyalty analysis is critical for understanding not just how many people use your bank, but how deeply they're committed. This segmentation model gives you actionable insights for marketing, product, and strategy teams.**
