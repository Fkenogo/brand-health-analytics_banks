# Loyalty Segmentation: Implementation Logic Flowchart

## FOR TECHNICAL TEAM: Segmentation Algorithm

This document provides the exact logic flow for implementing loyalty segmentation in code/formulas.

---

## Flowchart: Segment Assignment Logic

```
START
│
├─ Is respondent AWARE of Bank X? (Section C, Q3)
│  │
│  ├─ NO → [NOT IN SCOPE] ─┐
│  │                        │
│  └─ YES ─────────────────┤
│                           │
└───────────────────────────┘
                            │
                            ↓
┌───────────────────────────────────────────────────────┐
│ Is respondent CURRENTLY USING Bank X? (Section D, Q2) │
└───────────────────────────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
             YES                         NO
              │                           │
              ↓                           ↓
    ┌─────────────────┐         ┌──────────────────┐
    │ CURRENT USER    │         │ NON-USER PATH    │
    │ PATH            │         │                  │
    └─────────────────┘         └──────────────────┘
              │                           │
              ↓                           ↓
                                          
═══════════════════════════════════════════════════════════════
CURRENT USER PATH (Left Branch)
═══════════════════════════════════════════════════════════════

Is Bank X their PREFERRED/BUMO bank? (Section D, Q3)
│
├─ YES (Primary Bank)
│  │
│  ├─ Did they select Bank X as "only bank to keep"? (Section D, Q4)
│  │  │
│  │  ├─ YES
│  │  │  │
│  │  │  └─ What's their NPS? (Section E, Q5)
│  │  │     │
│  │  │     ├─ 9-10 (Promoter) → [🏆 COMMITTED]
│  │  │     │
│  │  │     └─ 0-8 → [⭐ FAVORS] (at-risk)
│  │  │
│  │  └─ NO
│  │     │
│  │     └─ What's their NPS? (Section E, Q5)
│  │        │
│  │        ├─ 7-10 → [⭐ FAVORS]
│  │        │
│  │        └─ 0-6 → [⭐ FAVORS] (high risk)
│  │
│  └─ NO (Secondary Bank)
│     │
│     └─ What's their NPS? (Section E, Q5)
│        │
│        └─ 0-10 → [⭐ FAVORS] (secondary)


═══════════════════════════════════════════════════════════════
NON-USER PATH (Right Branch)
═══════════════════════════════════════════════════════════════

Have they EVER USED Bank X? (Section D, Q1)
│
├─ YES (Lapsed User)
│  │
│  └─ What's their Future Intent? (Section D, Q1) + NPS? (Section E, Q5)
│     │
│     ├─ Intent 7-10 AND NPS 7+ → [🌱 POTENTIAL] (win-back)
│     │
│     ├─ Intent 4-6 → [👥 ACCESSIBLES] (lukewarm)
│     │
│     └─ Intent 0-3 OR NPS 0-6 → [🚫 REJECTORS] (bad experience)
│
└─ NO (Never Tried)
   │
   └─ What's their Future Intent? (Section D, Q1)
      │
      ├─ Intent 7-10
      │  │
      │  └─ Is bank RELEVANT for them? (Section D, Q2)
      │     │
      │     ├─ YES → [🌱 POTENTIAL] (strong lead)
      │     │
      │     └─ NO but Intent 8-10 → [🌱 POTENTIAL] (intent overrides)
      │
      ├─ Intent 4-6 → [👥 ACCESSIBLES] (neutral)
      │
      └─ Intent 0-3 → [🚫 REJECTORS] (not interested)
```

---

## Simplified Decision Table

| Currently Using? | Preferred? | Committed? | NPS | Intent | Relevance | → SEGMENT |
|------------------|------------|------------|-----|--------|-----------|-----------|
| ✓ | ✓ | ✓ | 9-10 | - | - | 🏆 COMMITTED |
| ✓ | ✓ | ✗ | 7-10 | - | - | ⭐ FAVORS |
| ✓ | ✓ | ✓ | 0-8 | - | - | ⭐ FAVORS (at-risk) |
| ✓ | ✗ | - | Any | - | - | ⭐ FAVORS (secondary) |
| ✗ | - | - | - | 7-10 | ✓ | 🌱 POTENTIAL |
| ✗ | - | - | - | 7-10 | ✗ | 🌱 POTENTIAL* |
| ✗ | - | - | - | 4-6 | - | 👥 ACCESSIBLES |
| ✗ (Lapsed) | - | - | 0-6 | 0-4 | - | 🚫 REJECTORS |
| ✗ | - | - | - | 0-3 | - | 🚫 REJECTORS |

*Only if intent is 8-10 (very high)

---

## Pseudocode Implementation

```python
function assign_segment(respondent):
    
    # PREREQUISITE: Must be aware
    if not respondent.aware:
        return "NOT_IN_SCOPE"
    
    # CURRENT USERS
    if respondent.currently_using:
        
        # Check if primary bank
        if respondent.preferred_bank:
            
            # Check commitment level
            if respondent.committed_bank:
                
                # Final check: NPS
                if respondent.nps >= 9:
                    return "COMMITTED"
                else:
                    return "FAVORS"  # At-risk committed
            
            else:  # Preferred but not committed
                if respondent.nps >= 7:
                    return "FAVORS"
                else:
                    return "FAVORS"  # High-risk favors
        
        else:  # Secondary bank
            return "FAVORS"
    
    # NON-USERS
    else:
        
        # Check if lapsed user
        if respondent.ever_used:
            
            # Lapsed users: high intent + good NPS = win-back opportunity
            if respondent.future_intent >= 7 and respondent.nps >= 7:
                return "POTENTIAL"
            
            # Lapsed users: low intent or bad NPS = rejector
            elif respondent.future_intent <= 4 or respondent.nps <= 6:
                return "REJECTORS"
            
            # Lapsed users: medium intent = accessible
            else:
                return "ACCESSIBLES"
        
        else:  # Never used
            
            # High intent
            if respondent.future_intent >= 7:
                
                # High intent + relevant = strong potential
                if respondent.relevant or respondent.future_intent >= 8:
                    return "POTENTIAL"
                else:
                    return "POTENTIAL"  # Intent alone is strong signal
            
            # Medium intent
            elif respondent.future_intent >= 4:
                return "ACCESSIBLES"
            
            # Low intent
            else:
                return "REJECTORS"
```

---

## SQL Implementation (for database queries)

```sql
-- Segmentation Query
SELECT 
    respondent_id,
    CASE
        -- NOT IN SCOPE
        WHEN aware = FALSE THEN 'NOT_IN_SCOPE'
        
        -- COMMITTED
        WHEN currently_using = TRUE 
         AND preferred_bank = TRUE 
         AND committed_bank = TRUE 
         AND nps >= 9 
        THEN 'COMMITTED'
        
        -- FAVORS (multiple scenarios)
        WHEN currently_using = TRUE 
         AND (
             (preferred_bank = TRUE AND committed_bank = FALSE AND nps >= 7)
             OR
             (preferred_bank = TRUE AND committed_bank = TRUE AND nps < 9)
             OR
             (preferred_bank = FALSE)
         )
        THEN 'FAVORS'
        
        -- POTENTIAL (non-users with high intent)
        WHEN currently_using = FALSE 
         AND future_intent >= 7
         AND (
             relevant = TRUE 
             OR future_intent >= 8
             OR (ever_used = TRUE AND nps >= 7)
         )
        THEN 'POTENTIAL'
        
        -- REJECTORS (low intent or bad experience)
        WHEN currently_using = FALSE 
         AND (
             future_intent <= 3
             OR (ever_used = TRUE AND nps <= 6 AND future_intent <= 4)
         )
        THEN 'REJECTORS'
        
        -- ACCESSIBLES (default for neutral non-users)
        WHEN currently_using = FALSE 
         AND future_intent >= 4 
         AND future_intent < 7
        THEN 'ACCESSIBLES'
        
        ELSE 'UNCATEGORIZED'  -- Should never happen if logic is correct
    END AS segment
FROM survey_responses
WHERE aware = TRUE;
```

---

## Excel/Google Sheets Formula

```excel
=IF(aware="No", "NOT_IN_SCOPE",
  IF(currently_using="Yes",
    IF(AND(preferred_bank="Yes", committed_bank="Yes", nps>=9), "COMMITTED",
    IF(AND(preferred_bank="Yes", committed_bank="Yes", nps<9), "FAVORS",
    IF(AND(preferred_bank="Yes", committed_bank="No", nps>=7), "FAVORS",
    IF(preferred_bank="No", "FAVORS", "UNCATEGORIZED")))),
  IF(future_intent>=7,
    IF(OR(relevant="Yes", future_intent>=8, AND(ever_used="Yes", nps>=7)), "POTENTIAL", "POTENTIAL"),
  IF(future_intent<=3, "REJECTORS",
  IF(AND(ever_used="Yes", nps<=6, future_intent<=4), "REJECTORS",
  IF(AND(future_intent>=4, future_intent<7), "ACCESSIBLES", "UNCATEGORIZED"))))))
```

Note: This is a nested IF statement. Your dashboard tool may have better ways to express this logic.

---

## Google Data Studio / Looker Studio Implementation

```
Create Calculated Field: "Loyalty_Segment"

CASE
  WHEN aware = false THEN "NOT_IN_SCOPE"
  
  WHEN currently_using = true 
   AND preferred_bank = true 
   AND committed_bank = true 
   AND nps >= 9 
  THEN "COMMITTED"
  
  WHEN currently_using = true 
   AND (
     (preferred_bank = true AND committed_bank = false AND nps >= 7)
     OR (preferred_bank = true AND committed_bank = true AND nps < 9)
     OR preferred_bank = false
   )
  THEN "FAVORS"
  
  WHEN currently_using = false 
   AND future_intent >= 7
   AND (relevant = true OR future_intent >= 8 OR (ever_used = true AND nps >= 7))
  THEN "POTENTIAL"
  
  WHEN currently_using = false 
   AND (future_intent <= 3 OR (ever_used = true AND nps <= 6 AND future_intent <= 4))
  THEN "REJECTORS"
  
  WHEN currently_using = false 
   AND future_intent >= 4 
   AND future_intent < 7
  THEN "ACCESSIBLES"
  
  ELSE "UNCATEGORIZED"
END
```

---

## Tableau Implementation

```
Create Calculated Field: "Loyalty Segment"

IF NOT [Aware] THEN "NOT_IN_SCOPE"

ELSEIF [Currently Using] 
  AND [Preferred Bank] 
  AND [Committed Bank] 
  AND [NPS] >= 9 
THEN "COMMITTED"

ELSEIF [Currently Using] THEN "FAVORS"

ELSEIF NOT [Currently Using] 
  AND [Future Intent] >= 7
  AND ([Relevant] OR [Future Intent] >= 8)
THEN "POTENTIAL"

ELSEIF NOT [Currently Using] 
  AND ([Future Intent] <= 3 OR ([Ever Used] AND [NPS] <= 6))
THEN "REJECTORS"

ELSEIF NOT [Currently Using] 
  AND [Future Intent] >= 4
THEN "ACCESSIBLES"

ELSE "UNCATEGORIZED"
END
```

---

## Power BI DAX Implementation

```dax
Loyalty Segment = 
VAR IsAware = 'SurveyData'[Aware] = TRUE()
VAR IsCurrentlyUsing = 'SurveyData'[Currently Using] = TRUE()
VAR IsPreferred = 'SurveyData'[Preferred Bank] = TRUE()
VAR IsCommitted = 'SurveyData'[Committed Bank] = TRUE()
VAR NPSScore = 'SurveyData'[NPS]
VAR FutureIntent = 'SurveyData'[Future Intent]
VAR IsRelevant = 'SurveyData'[Relevant] = TRUE()
VAR EverUsed = 'SurveyData'[Ever Used] = TRUE()

RETURN
    SWITCH(TRUE(),
        NOT(IsAware), "NOT_IN_SCOPE",
        
        IsCurrentlyUsing && IsPreferred && IsCommitted && NPSScore >= 9, 
            "COMMITTED",
        
        IsCurrentlyUsing, 
            "FAVORS",
        
        NOT(IsCurrentlyUsing) && FutureIntent >= 7 && (IsRelevant || FutureIntent >= 8),
            "POTENTIAL",
        
        NOT(IsCurrentlyUsing) && (FutureIntent <= 3 || (EverUsed && NPSScore <= 6)),
            "REJECTORS",
        
        NOT(IsCurrentlyUsing) && FutureIntent >= 4 && FutureIntent < 7,
            "ACCESSIBLES",
        
        "UNCATEGORIZED"
    )
```

---

## Testing Script (Python)

```python
def test_segmentation():
    """
    Test cases to verify segmentation logic
    """
    
    # Test Case 1: Committed customer
    r1 = {
        'aware': True,
        'currently_using': True,
        'preferred_bank': True,
        'committed_bank': True,
        'nps': 10,
        'future_intent': 10,
        'relevant': True,
        'ever_used': True
    }
    assert assign_segment(r1) == "COMMITTED", "Test 1 Failed"
    
    # Test Case 2: Secondary bank user (Favors)
    r2 = {
        'aware': True,
        'currently_using': True,
        'preferred_bank': False,
        'committed_bank': False,
        'nps': 8,
        'future_intent': 7,
        'relevant': True,
        'ever_used': True
    }
    assert assign_segment(r2) == "FAVORS", "Test 2 Failed"
    
    # Test Case 3: Potential customer
    r3 = {
        'aware': True,
        'currently_using': False,
        'preferred_bank': False,
        'committed_bank': False,
        'nps': None,
        'future_intent': 8,
        'relevant': True,
        'ever_used': False
    }
    assert assign_segment(r3) == "POTENTIAL", "Test 3 Failed"
    
    # Test Case 4: Rejector
    r4 = {
        'aware': True,
        'currently_using': False,
        'preferred_bank': False,
        'committed_bank': False,
        'nps': None,
        'future_intent': 1,
        'relevant': False,
        'ever_used': False
    }
    assert assign_segment(r4) == "REJECTORS", "Test 4 Failed"
    
    # Test Case 5: Accessible
    r5 = {
        'aware': True,
        'currently_using': False,
        'preferred_bank': False,
        'committed_bank': False,
        'nps': None,
        'future_intent': 5,
        'relevant': False,
        'ever_used': False
    }
    assert assign_segment(r5) == "ACCESSIBLES", "Test 5 Failed"
    
    print("✓ All test cases passed!")

# Run tests
test_segmentation()
```

---

## Data Validation Queries

### Check 1: Mutual Exclusivity
```sql
-- Each respondent should appear in exactly ONE segment
SELECT respondent_id, COUNT(DISTINCT segment) as segment_count
FROM segmented_respondents
GROUP BY respondent_id
HAVING segment_count > 1;

-- If this returns any rows, you have a logic error!
```

### Check 2: Total Coverage
```sql
-- All aware respondents should be segmented
SELECT 
    COUNT(*) as total_aware,
    SUM(CASE WHEN segment IS NOT NULL THEN 1 ELSE 0 END) as total_segmented,
    COUNT(*) - SUM(CASE WHEN segment IS NOT NULL THEN 1 ELSE 0 END) as unsegmented
FROM survey_responses
WHERE aware = TRUE;

-- unsegmented should be 0!
```

### Check 3: Current User Reconciliation
```sql
-- Committed + Favors should equal total currently using
SELECT 
    SUM(CASE WHEN currently_using = TRUE THEN 1 ELSE 0 END) as total_current_users,
    SUM(CASE WHEN segment IN ('COMMITTED', 'FAVORS') THEN 1 ELSE 0 END) as total_committed_favors
FROM survey_responses
WHERE aware = TRUE;

-- These two numbers should be equal!
```

---

## Troubleshooting Common Issues

### Issue 1: Getting 100% Accessibles
**Cause:** Logic is defaulting everyone to Accessibles
**Fix:** Make sure Accessibles has strict criteria (intent 4-6 only)

```
# BAD
ELSE → ACCESSIBLES

# GOOD  
WHEN future_intent >= 4 AND future_intent < 7 → ACCESSIBLES
```

---

### Issue 2: No Committed customers
**Cause:** Criteria are too strict
**Fix:** Check that all 4 conditions are necessary:
- Currently using ✓
- Preferred bank ✓
- Committed bank ✓
- NPS 9-10 ✓

If you get 0 Committed, consider lowering NPS threshold to 8+.

---

### Issue 3: Too many Rejectors
**Cause:** Intent threshold is too high
**Fix:** Check that you're using intent <= 3 (not <= 5)

---

### Issue 4: Missing lapsed users
**Cause:** Not checking "ever_used" field
**Fix:** Add specific logic for lapsed users:

```
IF ever_used = TRUE AND currently_using = FALSE:
    # Special lapsed user logic
```

---

## Output Format

Your segmentation process should produce a table like this:

| respondent_id | bank | aware | currently_using | nps | future_intent | segment | segment_color |
|---------------|------|-------|-----------------|-----|---------------|---------|---------------|
| 001 | BK | TRUE | TRUE | 10 | 10 | COMMITTED | #4CAF50 |
| 002 | BK | TRUE | TRUE | 8 | 7 | FAVORS | #2196F3 |
| 003 | BK | TRUE | FALSE | N/A | 8 | POTENTIAL | #FF9800 |
| 004 | BK | TRUE | FALSE | N/A | 5 | ACCESSIBLES | #9E9E9E |
| 005 | BK | TRUE | FALSE | 3 | 2 | REJECTORS | #F44336 |

---

## Color Coding for Dashboards

```
COMMITTED:    #4CAF50 (Green)
FAVORS:       #2196F3 (Blue)
POTENTIAL:    #FF9800 (Orange)
ACCESSIBLES:  #9E9E9E (Gray)
REJECTORS:    #F44336 (Red)
```

---

## Priority Order for Dashboard Display

When showing segments in lists or charts, use this order (from best to worst):

1. 🏆 COMMITTED (most valuable)
2. ⭐ FAVORS
3. 🌱 POTENTIAL
4. 👥 ACCESSIBLES
5. 🚫 REJECTORS (least valuable)

---

## Summary Checklist for Implementation

- [ ] Extract required fields from survey data
- [ ] Implement segmentation logic (use flowchart above)
- [ ] Test with sample data (10-20 records manually)
- [ ] Run validation queries (mutual exclusivity, coverage, reconciliation)
- [ ] Calculate segment distributions
- [ ] Verify no "UNCATEGORIZED" records remain
- [ ] Apply color coding
- [ ] Calculate Loyalty Index
- [ ] Build dashboard visualizations
- [ ] Document any edge cases you encounter

**Once implementation is complete, you should see realistic distributions (not 100% in any one segment) and all validation checks should pass.**
