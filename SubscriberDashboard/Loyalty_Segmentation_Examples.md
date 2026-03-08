# Loyalty Segmentation: Worked Examples

## Quick Reference Card

```
╔════════════════════════════════════════════════════════════════════╗
║                  LOYALTY SEGMENT QUICK REFERENCE                    ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  🏆 COMMITTED (Highest Loyalty)                                     ║
║  ────────────────────────────────                                  ║
║  ✓ Currently using                                                  ║
║  ✓ Preferred/BUMO bank                                             ║
║  ✓ Only bank they'd keep                                           ║
║  ✓ NPS: 9-10                                                       ║
║  Color: Green                                                       ║
║                                                                      ║
║  ⭐ FAVORS (Good Loyalty)                                           ║
║  ────────────────────────                                          ║
║  ✓ Currently using                                                  ║
║  ✗ NOT preferred (OR not committed)                                ║
║  ✓ NPS: 7-10                                                       ║
║  Color: Blue                                                        ║
║                                                                      ║
║  🌱 POTENTIAL (Warm Leads)                                          ║
║  ──────────────────────────                                        ║
║  ✓ Aware                                                            ║
║  ✗ NOT currently using                                             ║
║  ✓ Future Intent: 7-10                                             ║
║  ✓ Relevant for me                                                 ║
║  Color: Orange                                                      ║
║                                                                      ║
║  👥 ACCESSIBLES (Neutral)                                           ║
║  ─────────────────────────                                         ║
║  ✓ Aware                                                            ║
║  ✗ NOT currently using                                             ║
║  ✓ Future Intent: 4-6                                              ║
║  Color: Gray                                                        ║
║                                                                      ║
║  🚫 REJECTORS (Active Rejection)                                    ║
║  ────────────────────────────────                                  ║
║  ✓ Aware                                                            ║
║  ✗ NOT currently using                                             ║
║  ✓ Future Intent: 0-3                                              ║
║  OR: Lapsed + NPS 0-6                                              ║
║  Color: Red                                                         ║
║                                                                      ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## Sample Data with Segmentation Logic

Let's walk through 10 sample respondents to see how segmentation works:

### RESPONDENT 1: Sarah, 28
```
Questionnaire Responses:
─────────────────────────
Aware of BK? YES (Section C, Q3)
Ever Used BK? YES (Section D, Q1)
Currently Using BK? YES (Section D, Q2)
Preferred/BUMO Bank? BK (Section D, Q3)
Committed (only bank)? BK (Section D, Q4)
Future Intent for BK: 10/10 (Section D, Q1)
NPS for BK: 10/10 (Section E, Q5)

→ SEGMENT: COMMITTED 🏆
Reasoning: Currently using + Preferred + Committed + NPS 10
```

---

### RESPONDENT 2: James, 35
```
Questionnaire Responses:
─────────────────────────
Aware of BK? YES
Ever Used BK? YES
Currently Using BK? YES
Preferred/BUMO Bank? I&M (not BK)
Committed (only bank)? I&M (not BK)
Future Intent for BK: 7/10
NPS for BK: 8/10

→ SEGMENT: FAVORS ⭐
Reasoning: Currently using but BK is NOT primary bank
```

---

### RESPONDENT 3: Mary, 42
```
Questionnaire Responses:
─────────────────────────
Aware of BK? YES
Ever Used BK? YES
Currently Using BK? YES
Preferred/BUMO Bank? BK
Committed (only bank)? I&M (not BK)
Future Intent for BK: 9/10
NPS for BK: 9/10

→ SEGMENT: FAVORS ⭐
Reasoning: Currently using + Preferred, but NOT selected as "only bank to keep"
Note: Close to Committed, just needs that final commitment step
```

---

### RESPONDENT 4: Peter, 29
```
Questionnaire Responses:
─────────────────────────
Aware of BK? YES
Ever Used BK? NO
Currently Using BK? NO
Preferred/BUMO Bank? N/A (doesn't use BK)
Committed (only bank)? N/A
Future Intent for BK: 8/10
Relevance (suitable for me)? YES
NPS for BK: N/A (never used)

→ SEGMENT: POTENTIAL 🌱
Reasoning: Aware + Not using + High intent (8) + Says it's relevant
```

---

### RESPONDENT 5: Grace, 45
```
Questionnaire Responses:
─────────────────────────
Aware of BK? YES
Ever Used BK? YES (used in the past)
Currently Using BK? NO (lapsed)
Preferred/BUMO Bank? Equity
Committed (only bank)? Equity
Future Intent for BK: 2/10
NPS for BK: 3/10 (detractor)

→ SEGMENT: REJECTORS 🚫
Reasoning: Lapsed user + Low NPS (3) + Very low intent (2)
Note: Had bad experience, unlikely to return
```

---

### RESPONDENT 6: David, 31
```
Questionnaire Responses:
─────────────────────────
Aware of BK? YES
Ever Used BK? NO
Currently Using BK? NO
Preferred/BUMO Bank? N/A
Committed (only bank)? N/A
Future Intent for BK: 5/10
Relevance (suitable for me)? NO
NPS for BK: N/A

→ SEGMENT: ACCESSIBLES 👥
Reasoning: Aware + Not using + Neutral intent (5) + Not seen as relevant
Note: Open to persuasion but needs convincing
```

---

### RESPONDENT 7: Linda, 38
```
Questionnaire Responses:
─────────────────────────
Aware of BK? YES
Ever Used BK? NO
Currently Using BK? NO
Preferred/BUMO Bank? N/A
Committed (only bank)? N/A
Future Intent for BK: 1/10
Relevance (suitable for me)? NO
NPS for BK: N/A

→ SEGMENT: REJECTORS 🚫
Reasoning: Aware + Never used + Very low intent (1)
Note: Actively avoiding, possibly based on reputation/hearsay
```

---

### RESPONDENT 8: John, 52
```
Questionnaire Responses:
─────────────────────────
Aware of BK? YES
Ever Used BK? YES
Currently Using BK? YES
Preferred/BUMO Bank? BK
Committed (only bank)? BK
Future Intent for BK: 10/10
NPS for BK: 7/10 (passive, not promoter)

→ SEGMENT: FAVORS ⭐
Reasoning: All conditions met EXCEPT NPS is 7 (not 9-10)
Note: Loyal behavior but not fully satisfied - at risk!
```

---

### RESPONDENT 9: Rachel, 26
```
Questionnaire Responses:
─────────────────────────
Aware of BK? YES
Ever Used BK? NO
Currently Using BK? NO
Preferred/BUMO Bank? N/A
Committed (only bank)? N/A
Future Intent for BK: 9/10
Relevance (suitable for me)? YES
NPS for BK: N/A

→ SEGMENT: POTENTIAL 🌱
Reasoning: Aware + High intent (9) + Relevant
Note: Strong acquisition opportunity!
```

---

### RESPONDENT 10: Michael, 40
```
Questionnaire Responses:
─────────────────────────
Aware of BK? YES
Ever Used BK? NO
Currently Using BK? NO
Preferred/BUMO Bank? N/A
Committed (only bank)? N/A
Future Intent for BK: 4/10
Relevance (suitable for me)? NO
NPS for BK: N/A

→ SEGMENT: ACCESSIBLES 👥
Reasoning: Aware + Low-medium intent (4) + Not relevant
Note: On the fence, could go either way
```

---

## Summary Table of Examples

| # | Name | Aware? | Current? | BUMO? | Committed? | Intent | NPS | → SEGMENT |
|---|------|--------|----------|-------|------------|--------|-----|-----------|
| 1 | Sarah | ✓ | ✓ | ✓ | ✓ | 10 | 10 | 🏆 Committed |
| 2 | James | ✓ | ✓ | ✗ | ✗ | 7 | 8 | ⭐ Favors |
| 3 | Mary | ✓ | ✓ | ✓ | ✗ | 9 | 9 | ⭐ Favors |
| 4 | Peter | ✓ | ✗ | - | - | 8 | - | 🌱 Potential |
| 5 | Grace | ✓ | ✗ | - | - | 2 | 3 | 🚫 Rejectors |
| 6 | David | ✓ | ✗ | - | - | 5 | - | 👥 Accessibles |
| 7 | Linda | ✓ | ✗ | - | - | 1 | - | 🚫 Rejectors |
| 8 | John | ✓ | ✓ | ✓ | ✓ | 10 | 7 | ⭐ Favors* |
| 9 | Rachel | ✓ | ✗ | - | - | 9 | - | 🌱 Potential |
| 10 | Michael | ✓ | ✗ | - | - | 4 | - | 👥 Accessibles |

*John is an interesting case - he shows all committed behaviors but NPS is only 7, suggesting something is wrong. He's at risk of becoming a Rejector.

---

## Segment Distribution from Sample

From our 10 respondents:
- 🏆 Committed: 1 person (10%)
- ⭐ Favors: 3 people (30%)
- 🌱 Potential: 2 people (20%)
- 👥 Accessibles: 2 people (20%)
- 🚫 Rejectors: 2 people (20%)

**Total: 10 people (100%)** ✓ All segments add up!

---

## Calculation Examples

### Loyalty Index Calculation:
```
Using the sample above:

Committed: 1 × 100 = 100
Favors: 3 × 70 = 210
Potential: 2 × 40 = 80
Accessibles: 2 × 20 = 40
Rejectors: 2 × 0 = 0
─────────────────────
Total Points = 430
Total Aware = 10

Loyalty Index = 430 ÷ 10 = 43 out of 100

Interpretation: 
- 43/100 suggests moderate brand loyalty
- Room for improvement (goal: 60+)
- Focus on converting Favors to Committed
- Reduce Rejectors through issue resolution
```

---

## Edge Cases & How to Handle Them

### EDGE CASE 1: High intent but current user
```
Person says:
- Currently using BK
- Future intent: 10/10 (for BK)
- NOT preferred bank
- NPS: 8

→ Segment: FAVORS (not Potential, because they're already using)
```

### EDGE CASE 2: Lapsed user with high intent
```
Person says:
- Ever used BK: YES
- Currently using BK: NO
- Future intent: 9/10
- NPS: 8 (when they used it before)

→ Segment: POTENTIAL (not Rejectors, because intent is high)
Note: This is a "win-back" opportunity
```

### EDGE CASE 3: Primary bank but dissatisfied
```
Person says:
- Currently using BK
- Preferred/BUMO: BK
- Committed: BK
- NPS: 5 (detractor!)
- Future intent: 7/10

→ Segment: FAVORS (not Committed, because NPS is too low)
Note: This person is at VERY HIGH RISK of leaving
```

### EDGE CASE 4: Not aware
```
Person says:
- Aware of BK: NO

→ Segment: NONE / OUT OF SCOPE
Note: Can't be in any loyalty segment if they don't know you exist
```

---

## Common Mistakes in Segmentation

### ❌ MISTAKE 1: Treating all current users as "loyal"
**Problem:** Current users with low NPS (0-6) are NOT Favors, they're at-risk
**Solution:** Use NPS as a quality filter

**Example:**
```
BAD: "Currently using = Favors"
GOOD: "Currently using + NPS 7+ = Favors"
       "Currently using + NPS 0-6 = At-Risk Favors (flag for churn)"
```

---

### ❌ MISTAKE 2: Ignoring lapsed users
**Problem:** Treating "Ever Used but not Current" same as "Never Used"
**Solution:** Lapsed users are usually Rejectors (unless they have high intent for return)

**Example:**
```
Person: Used BK 2 years ago, stopped using, NPS was 4, intent now 2
BAD: Segment as "Accessible" (because intent is low)
GOOD: Segment as "Rejectors" (because they're lapsed + low NPS)
```

---

### ❌ MISTAKE 3: Making Accessibles the default
**Problem:** Everyone who doesn't fit elsewhere becomes Accessible (your 100% issue!)
**Solution:** Accessibles should have specific criteria (intent 4-6, not relevant)

**Example:**
```
BAD: IF NOT(Committed OR Favors OR Potential OR Rejectors) THEN Accessibles
GOOD: IF Aware AND NOT Using AND Intent 4-6 AND NOT Relevant THEN Accessibles
```

---

## Testing Your Segmentation Logic

### TEST 1: Mutual Exclusivity
**Take any respondent. They should be in EXACTLY ONE segment.**

```
Example: Sarah from above
Can she be in multiple segments?
- Committed? YES (meets all criteria)
- Favors? NO (she's already Committed)
- Potential? NO (she's already using)
- Accessibles? NO (she's already using)
- Rejectors? NO (she loves the bank)

Result: ✓ Only in ONE segment (Committed)
```

---

### TEST 2: Total Percentage
**All segments should add up to 100% of aware respondents.**

```
Sample of 100 people aware of BK:

Committed: 8 people (8%)
Favors: 17 people (17%)
Potential: 25 people (25%)
Accessibles: 35 people (35%)
Rejectors: 15 people (15%)
────────────────────────
TOTAL: 100 people (100%) ✓ CORRECT!

If your total is ≠ 100%, you have a logic error.
```

---

### TEST 3: Current User Reconciliation
**Committed + Favors should equal total "Currently Using" respondents.**

```
From questionnaire Section D, Q2:
Total currently using BK: 25 people

Segmentation shows:
Committed: 8 people
Favors: 17 people
────────────────────
Total: 25 people ✓ CORRECT!

If these don't match, you're miscategorizing current users.
```

---

## Implementation Checklist

### STEP 1: Data Preparation
- [ ] Extract all relevant fields from survey
- [ ] Create calculated fields for segment logic
- [ ] Handle missing/null values (e.g., NPS for non-users)

### STEP 2: Apply Segmentation Logic
- [ ] Use decision tree from methodology doc
- [ ] Apply to small test sample first (10-20 responses)
- [ ] Manually verify each segment assignment

### STEP 3: Validation
- [ ] Run mutual exclusivity test
- [ ] Run total percentage test
- [ ] Run current user reconciliation test
- [ ] Check for edge cases

### STEP 4: Calculate Metrics
- [ ] Segment sizes (count and percentage)
- [ ] Loyalty Index (weighted score)
- [ ] Average NPS by segment
- [ ] Average demographics by segment

### STEP 5: Dashboard Integration
- [ ] Create segment distribution visualizations
- [ ] Add segment profile cards
- [ ] Build segment movement tracker (for future periods)
- [ ] Add drill-down capabilities

---

## Expected Benchmark Ranges

### Healthy Brand Distribution:
```
🏆 Committed:    5-15%  (Target: 10%+)
⭐ Favors:       10-25% (Target: 20%+)
🌱 Potential:    15-35% (Target: 25%+)
👥 Accessibles:  30-50% (Target: <40%)
🚫 Rejectors:    10-25% (Target: <15%)
```

### Red Flags:
- **Committed < 5%:** Very low loyalty, focus on retention
- **Rejectors > 30%:** Major brand issues, investigate root causes
- **Accessibles > 60%:** Weak brand differentiation, need clearer positioning
- **Potential < 10%:** Limited growth pipeline, increase awareness/consideration

---

## Action Plans by Segment

### 🏆 COMMITTED (8%)
**Goal:** Retain and leverage
**Actions:**
- Launch referral program (they're your advocates!)
- Exclusive loyalty rewards
- Early access to new features
- VIP customer service
**KPI:** Retention rate 95%+

---

### ⭐ FAVORS (17%)
**Goal:** Convert to primary bank
**Actions:**
- Analyze why they're not primary (what's missing?)
- Targeted offers to increase usage
- Simplify account management
- Reduce friction in digital experience
**KPI:** 30% convert to Committed within 6 months

---

### 🌱 POTENTIAL (25%)
**Goal:** Convert consideration into trial
**Actions:**
- Limited-time trial offers
- Address barriers to entry (fees, documentation, etc.)
- Testimonials and social proof
- Targeted awareness campaigns
**KPI:** 20% convert to Favors/Committed within 3 months

---

### 👥 ACCESSIBLES (35%)
**Goal:** Create differentiation and preference
**Actions:**
- Brand building and awareness
- Clear value proposition communication
- Education about products/services
- Competitive positioning
**KPI:** 15% convert to Potential within 6 months

---

### 🚫 REJECTORS (15%)
**Goal:** Understand reasons and fix root causes
**Actions:**
- Survey to understand why they reject
- Address common complaints
- Improve reputation management
- Consider rebranding if needed
**KPI:** Reduce to <10% within 12 months

---

## Summary: Key Takeaways

1. **Your questionnaire HAS all the data needed** - just need to apply correct logic
2. **Each segment requires specific criteria** - use the decision tree
3. **NPS is critical for quality** - don't ignore it in segmentation
4. **Mutual exclusivity is essential** - each person in exactly ONE segment
5. **Validate your logic** - test with sample data before full implementation
6. **Track over time** - segment movement is as important as current state
7. **Different strategies for different segments** - one size does NOT fit all

**Fix the "100% Accessibles" issue by implementing the strict criteria outlined in this document. Your loyalty analysis will then provide actionable insights for your business strategy.**
