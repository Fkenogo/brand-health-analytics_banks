# Questionnaire Management Guide (Admin)

This guide explains how to safely edit questionnaires, version them, and load them back into the live survey without breaking the system.

## 1) Source of Truth

- **Questionnaires are stored in Firestore** under the `questionnaires` collection.
- The survey runtime loads:
  - The **Wave-tagged** version if `/survey/:country/:wave` is used, or
  - The **Active** version otherwise.
- If Firestore is unavailable, the app falls back to the bundled `SURVEY_QUESTIONS`.

## 2) Key Concepts

- **Status**: `active | draft | archived`
- **waveTag**: e.g. `Wave 2` (used to load a specific wave)
- **usedInWaves**: array of wave tags that this version has already shipped in

**Important**: A questionnaire that has been used in a wave is locked from edits.

## 3) Safe Edit Workflow

1) **Open Admin → Questionnaire Management**  
2) Select the **Active** questionnaire (read‑only).
3) Click **Clone to Draft**  
4) Edit the draft only:
   - Question text
   - Description/help text
   - Answer options (label/value)
   - Question order
   - Add/remove questions
5) Set the **waveTag** (e.g., `Wave 2`)
6) When ready, click **Promote Draft to Active**

## 4) Locking Rules

- **Active/Archived** = locked  
- **Draft + usedInWaves length > 0** = locked  

If you need changes for a used questionnaire:
- Clone it to a new draft
- Edit the new draft
- Promote to active

## 5) Marking a Version as Used

Once a wave is launched, click **Mark used** to add the current `waveTag` to `usedInWaves`.

This prevents later edits from accidentally changing a live wave’s questions.

## 6) How the Survey Loads Questions

- Route: `/survey/:country/:wave`
  - The app looks for a questionnaire where `waveTag === "Wave {wave}"`.
  - If none is found, it falls back to the active version.
- Route: `/survey/:country`
  - Loads the **active** questionnaire.

## 7) Firestore Document Shape (Questionnaire)

```
{
  id: "version-1700000000000",
  name: "Wave 2 Draft",
  status: "draft",
  createdAt: "2026-02-11T12:00:00.000Z",
  waveTag: "Wave 2",
  usedInWaves: ["Wave 1"],
  questions: [
    {
      id: "c1_top_of_mind",
      type: "text",
      section: "Awareness",
      label: { en: "...", rw: "...", fr: "..." },
      description: { en: "...", rw: "...", fr: "..." },
      choices: [{ value: "yes", label: { en: "...", rw: "...", fr: "..." } }]
    }
  ]
}
```

## 8) What NOT to Do

- Do **not** edit the active questionnaire directly.
- Do **not** edit a questionnaire already listed in `usedInWaves`.
- Do **not** delete questions that were used in a live wave (clone to a new draft instead).
- Do **not** change option values for a live wave (this breaks analytics alignment).

## 9) Troubleshooting

- If **no questionnaires load**, check:
  - Firestore rules allow authenticated read/write to `questionnaires`.
  - You are logged in as admin.
  - The collection exists in Firestore.
- If **survey shows old questions**, ensure:
  - The draft was promoted to active.
  - The hosted build was redeployed.

## 10) Deployment Checklist

1) Clone active → draft  
2) Make edits  
3) Set `waveTag`  
4) Promote to active  
5) Mark used once launched  
6) Run `npm run build`  
7) Run `npm run preview`  
8) Deploy hosting
