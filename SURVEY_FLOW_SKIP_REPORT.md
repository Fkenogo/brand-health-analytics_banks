# Public Survey Flow Skips Questionnaire — Investigation Report

Date: 2026-02-10

## Scope
Per request: **report only**, no fixes or recommendations implemented in code. This report documents a step‑by‑step review of the public survey flow to explain why `/survey/rwanda` is showing the end screen immediately.

## Constraints
- I cannot access the hosted preview URL from this environment.
- Review was done by static code inspection and local flow reasoning.

---

## Step‑by‑Step Review (Local Code Inspection)

### 1) Entry points
- **Landing page** routes to `/survey/rwanda` via `PublicLandingPage` button.
- **Survey page** is rendered by `SurveyPage` for `/survey/:country`.

**Code references**
- `src/pages/PublicLandingPage.tsx`
```tsx
<button onClick={() => navigate('/survey/rwanda')}>
  Start the survey
</button>
```

- `src/App.tsx`
```tsx
<Route path="/survey/:country" element={
  <PublicSurveyGate>
    <SurveyPage />
  </PublicSurveyGate>
}/>
```

### 2) SurveyPage state initialization
- `SurveyPage` initializes `isCompleted` to `false`.
- It sets `formData.selected_country` based on URL param.

**Code reference**
- `src/pages/SurveyPage.tsx`
```tsx
const [isCompleted, setIsCompleted] = useState(false);
const [formData, setFormData] = useState<Partial<SurveyResponse>>(() => {
  const normalized = country?.toLowerCase();
  const pre = valid.find(c => c === normalized || c.startsWith(normalized || ''));
  return {
    response_id: crypto.randomUUID(),
    selected_country: pre,
  };
});
```

### 3) Route change reset logic
- On route change, SurveyPage explicitly resets state.

**Code reference**
```tsx
useEffect(() => {
  const pre = valid.find(c => c === normalized || c.startsWith(normalized || ''));
  if (pre) {
    setFormData((prev) => ({
      response_id: crypto.randomUUID(),
      selected_country: pre,
    }));
    setIsCompleted(false);
    setCurrentStep(0);
    setShowWelcome(true);
  }
}, [country]);
```

### 4) Completion view
- The thank‑you screen renders **if `isCompleted` is true**.

**Code reference**
```tsx
if (isCompleted) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0f172a]">
      ...
    </div>
  );
}
```

### 5) Where `isCompleted` becomes true
- `isCompleted` is set to true in `handleNext()` in two cases:
  - When the current question is a termination point.
  - When reaching the final question.

**Code reference**
```tsx
if (currentQuestion?.isTerminationPoint) {
  ...
  setIsCompleted(true);
  return;
}

if (currentStep < visibleQuestions.length - 1) {
  setCurrentStep(s => s + 1);
} else {
  ...
  setIsCompleted(true);
}
```

### 6) Possible early termination logic
- Survey questions include multiple **termination points** (e.g. consent, recency, age) in `SURVEY_QUESTIONS`.
- These depend on user inputs, which are undefined when the survey starts.

**Code reference**
- `src/constants.ts`
```tsx
{ id: 'termination_consent', logic: (d) => d.consent === 'no', isTerminationPoint: true }
{ id: 'termination_recency', logic: (d) => d.b1_recency === 'longer_than_3_months' || d.b1_recency === 'never', isTerminationPoint: true }
{ id: 'termination_age', logic: (d) => d.b2_age === 'below_18', isTerminationPoint: true }
```

### 7) `visibleQuestions` filtering
- The survey uses `logic` to determine which questions are shown.

**Code reference**
```tsx
const visibleQuestions = useMemo(() => {
  return SURVEY_QUESTIONS.filter(q => !q.logic || q.logic(formData));
}, [formData]);
```

---

## Where the error is likely generated (code hotspots)

### A) Survey completion condition
**File**: `src/pages/SurveyPage.tsx`
```tsx
if (isCompleted) {
  return (...thank‑you screen...);
}
```

### B) Termination‑point handling (possible early completion)
**File**: `src/pages/SurveyPage.tsx`
```tsx
if (currentQuestion?.isTerminationPoint) {
  ...
  setIsCompleted(true);
}
```

### C) Visible question filtering based on `formData`
**File**: `src/pages/SurveyPage.tsx`
```tsx
const visibleQuestions = useMemo(() => {
  return SURVEY_QUESTIONS.filter(q => !q.logic || q.logic(formData));
}, [formData]);
```

### D) Termination questions in constants
**File**: `src/constants.ts`
```tsx
{ id: 'termination_consent', logic: (d) => d.consent === 'no', isTerminationPoint: true }
```

---

## Hypotheses to validate (for next agent)
1) **State reset not taking effect** in deployed preview; `isCompleted` might be set from stale state or an unintended call.
2) **`visibleQuestions` ends up empty** or the current question is the termination note on initial render, triggering completion.
3) **`handleNext` invoked unintentionally** by a side‑effect or auto‑advance.

---

## Files to review first
- `src/pages/SurveyPage.tsx`
- `src/constants.ts` (logic + termination points)
- `src/components/survey/QuestionRenderer.tsx` (any auto‑advance logic)
- `src/utils/storage.ts` (completion flags or side effects)

---

## Notes for another agent
- Reproduce on deployed preview and compare to local.
- Add temporary logging for `isCompleted`, `currentStep`, `visibleQuestions.length`, and `currentQuestion?.id` on mount.
- Ensure the survey always starts at question 0 and does not auto‑advance.

---

## Status
No fixes applied. Report only.
