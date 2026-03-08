# 3-Step Bank Awareness Section Implementation

## Overview

This document outlines the implementation of a sophisticated 3-step bank awareness section that measures **Top-of-Mind Awareness**, **Spontaneous Awareness**, and **Total (Assisted) Awareness** with smart bank name recognition.

## Features Implemented

### 1. Smart Bank Recognition Engine (`src/utils/bankRecognition.ts`)

**Core Capabilities:**

- **Case-insensitive matching**: `KCB`, `kcb`, `KCB Bank` all map to the same bank
- **Abbreviation handling**: `KCB` → `Kenya Commercial Bank`
- **Fuzzy matching**: Levenshtein distance algorithm for typos and variations
- **Confidence scoring**: 0-100% confidence with 60% threshold for acceptance
- **Multi-format input parsing**: Comma-separated, line-by-line, space-separated
- **Real-time recognition**: Instant feedback as users type

**Recognition Rules:**

- Exact matches: 100% confidence
- Starts with: 90% confidence
- Contains: 80% confidence
- Fuzzy match: 0-70% confidence (based on similarity)
- **Threshold**: 60% minimum confidence to accept match

**Input Format Support:**

```javascript
// Comma-separated
"Equity, I&M, Stanbic"

// Line-by-line
"Equity
I&M
Stanbic"

// Single entry
"KCB"
```

### 2. Bank Recognition Hook (`src/hooks/useBankRecognition.ts`)

**Hook Features:**

- **Real-time recognition**: 300ms debounce for Top-of-Mind, 500ms for Spontaneous
- **State management**: Separate states for each awareness step
- **Deduplication**: Automatic removal of duplicates across steps
- **Pre-selection logic**: Automatically pre-selects recognized banks in assisted step
- **Metrics calculation**: Real-time awareness metrics
- **Bank suggestions**: Autocomplete functionality

**Key Functions:**

```typescript
const {
  // Top-of-Mind recognition
  topOfMindInput,
  topOfMindResult,
  topOfMindLoading,
  handleTopOfMindChange,

  // Spontaneous recognition
  spontaneousInput,
  spontaneousResult,
  spontaneousLoading,
  handleSpontaneousChange,

  // Assisted selection
  assistedSelections,
  handleAssistedSelectionChange,

  // Final data
  awarenessData,

  // Utilities
  getPreSelectedBanks,
  getLockedBanks,
  getAvailableBanks,
  resetRecognition,
} = useBankRecognition({ country, onAwarenessDataChange });
```

### 3. Awareness Data Processing

**Data Structure:**

```typescript
interface AwarenessData {
  top_of_mind: {
    raw_input: string;
    recognized_bank_id: string | null;
    recognition_confidence: number;
  };
  spontaneous: {
    raw_input: string;
    recognized_bank_ids: string[];
    unrecognized_entries: string[];
  };
  assisted: {
    selected_bank_ids: string[];
  };
  total_awareness: string[]; // Union of all three steps
}
```

**Processing Logic:**

1. **Step 1**: Process Top-of-Mind bank with confidence scoring
2. **Step 2**: Parse Spontaneous banks, remove duplicates from Step 1
3. **Step 3**: Combine all recognized banks for Total Awareness
4. **Deduplication**: Automatic removal of duplicates across steps

## Survey Integration

### Current Survey Questions (from `src/constants.ts`)

**Question C1 - Top-of-Mind Awareness:**

```javascript
{
  id: 'c1_top_of_mind',
  type: 'text',
  section: 'C',
  label: { en: 'Which bank from your country comes to your mind FIRST?', ... },
  description: { en: 'Only one mention.', ... },
  required: true,
  logic: passedScreening
}
```

**Question C2 - Spontaneous Awareness:**

```javascript
{
  id: 'c2_spontaneous',
  type: 'text',
  section: 'C',
  label: { en: 'Which other banks from your country come to your mind?', ... },
  description: { en: 'List all that come to mind, separated by commas.', ... },
  logic: (d) => passedScreening(d) && d.c1_top_of_mind
}
```

**Question C3 - Total Awareness (Assisted):**

```javascript
{
  id: 'c3_aware_banks',
  type: 'checkbox',
  section: 'C',
  label: { en: 'Tick all banks that you are aware of:', ... },
  required: true,
  filterChoices: (d) => getBankChoicesByCountry(d.selected_country),
  logic: (d) => passedScreening(d) && d.c1_top_of_mind
}
```

## Implementation Requirements

### 1. Update QuestionRenderer.tsx

The `QuestionRenderer` component needs to be enhanced to support the bank recognition features:

**For Top-of-Mind (C1):**

- Add real-time recognition feedback
- Show confidence indicator
- Display recognized bank name if confidence ≥ 60%
- Handle "unrecognized" state gracefully

**For Spontaneous (C2):**

- Parse multiple bank entries
- Show recognition status for each bank
- Display unrecognized entries separately
- Provide suggestions for unrecognized banks
- ✅ Support space‑separated input without commas using bank‑name scanning
- ✅ Explicitly flag banks already captured in Q1

**For Assisted (C3):**

- Pre-select and lock recognized banks from C1 and C2
- ✅ Keep pre-selected banks visible in the list (disabled)
- ✅ Prevent deselection of pre-selected banks
- Display recognition confidence indicators

### 2. Enhanced User Interface

**Recognition Feedback:**

- ✅ **Green check**: High confidence match (≥90%)
- ⚠️ **Yellow warning**: Medium confidence match (60-89%)
- ❌ **Red X**: Low confidence/unrecognized
- 🔄 **Spinner**: Processing recognition

**Bank Selection Logic:**

- Pre-selected banks are visually distinct
- Pre-selected banks cannot be deselected
- Only unrecognized banks are available for new selection
- Clear visual hierarchy between steps

### 3. Data Storage Integration

**Current Storage Structure:**

```typescript
interface SurveyResponse {
  // Current fields
  c1_top_of_mind?: string;
  c2_spontaneous?: string;
  c3_aware_banks?: string[];

  // New fields for enhanced data
  c1_recognized_bank_id?: string;
  c1_recognition_confidence?: number;
  c2_recognized_bank_ids?: string[];
  c2_unrecognized_entries?: string[];
  c3_total_awareness?: string[];
}
```

## Usage Examples

### Example 1: Top-of-Mind Recognition

**User Input:** `"kcb"`
**Recognition Result:**

```javascript
{
  bank_id: "KCB_RW",
  confidence: 100,
  raw_input: "kcb",
  matched_name: "KCB"
}
```

### Example 2: Spontaneous Recognition

**User Input:** `"Equity, I&M, kcb, fake bank"`
**Recognition Result:**

```javascript
{
  recognized_banks: [
    { bank_id: "EQU_RW", confidence: 100, raw_input: "Equity", matched_name: "Equity" },
    { bank_id: "IM_RW", confidence: 100, raw_input: "I&M", matched_name: "I&M" },
    { bank_id: "KCB_RW", confidence: 100, raw_input: "kcb", matched_name: "KCB" }
  ],
  unrecognized_entries: ["fake bank"],
  raw_input: "Equity, I&M, kcb, fake bank"
}
```

### Example 3: Assisted Selection

**Pre-selected Banks:** `["KCB_RW", "EQU_RW", "IM_RW"]`
**Available for Selection:** All banks except pre-selected ones
**Final Selection:** Pre-selected + user-selected additional banks

## Benefits

1. **Clean Data**: No manual cleaning required
2. **User-Friendly**: Simple text input with smart recognition
3. **Robust**: Handles typos, abbreviations, and variations
4. **Real-time**: Instant feedback during survey
5. **Comprehensive**: Tracks recognition confidence and unrecognized entries
6. **Deduplication**: Automatic removal of duplicates across steps

## Next Steps

1. **Enhance QuestionRenderer**: Add bank recognition UI components
2. **Update Survey Flow**: Integrate hook into main survey component
3. **Add Validation**: Ensure data integrity and completeness
4. **Testing**: Comprehensive testing with various input formats
5. **Documentation**: User guide for survey administrators

## Current Gaps (as of latest review)

- Alias coverage still depends on available bank metadata; full-name expansions not present in aliases can still miss.

## Technical Notes

- **Performance**: Recognition engine is optimized for real-time use
- **Memory**: Singleton pattern prevents memory leaks
- **Extensibility**: Easy to add new countries or banks
- **Internationalization**: Full support for English, Kinyarwanda, and French
- **Accessibility**: ARIA labels and keyboard navigation support
