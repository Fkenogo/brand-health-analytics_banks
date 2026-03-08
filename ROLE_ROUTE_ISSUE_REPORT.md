# Role/Route Enforcement + Survey Flow Issue Report

Date: 2026-02-10

## Summary
Two user-facing issues remain in the deployed preview:
1) **Admin access is mixed with subscriber auth** and lacks a dedicated admin login flow.
2) **Public survey flow skips directly to the end screen** when entering `/survey/rwanda` from landing.

This report documents suspected causes, code hotspots, and recommended fixes so another agent can pick up quickly.

---

## Issue 1: Admin route uses shared login (subscriber + admin)

### Symptoms
- `/admin` redirects to a shared `/login` screen.
- Login page is labeled for both subscriber and admin, but there is no admin-specific login UI or dedicated admin entry point.
- The system requirement says **admin must never be mixed with subscriber** and should have its own isolated entry point.

### Evidence (code)
**Route mapping**
- `src/App.tsx`
```tsx
<Route path="/admin" element={
  <RequireAuth>
    <RequireRole allowedRoles={['admin']}>
      <Suspense fallback={<LoadingScreen />}>
        <AdminDashboardPage />
      </Suspense>
    </RequireRole>
  </RequireAuth>
}/>
```

**Shared login**
- `src/pages/Login.tsx`
```tsx
<p className="mt-2 text-sm text-slate-400">
  Subscriber and Admin access only. Accounts are created by App Admins.
</p>
```

### Root cause (likely)
- The admin route relies on global `/login` which is shared with subscribers.
- There is no dedicated `/admin/login` entry point and no admin-only UI or admin‑only credentials guidance.

### Recommended fix
- Create **`/admin/login`** page that only handles admin login and branding.
- Change `/admin` guard to redirect to `/admin/login` when unauthenticated.
- Keep `/login` for subscriber login only, or remove it and use `/signup` + pending flow.

---

## Issue 2: Survey flow skips to end page at `/survey/rwanda`

### Symptoms
- Public user clicks “Start Survey” on landing page.
- Landing page routes to `/survey/rwanda`.
- The next screen is the **survey completion (thank‑you) screen** — no questionnaire shown.

### Evidence (code)
**Survey routing**
- `src/App.tsx`
```tsx
<Route path="/survey/:country" element={
  <PublicSurveyGate>
    <SurveyPage />
  </PublicSurveyGate>
}/>
```

**Survey completion UI triggers**
- `src/pages/SurveyPage.tsx`
```tsx
if (isCompleted) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0f172a]">
      ... thank‑you screen ...
    </div>
  );
}
```

### Root cause (likely)
There are two likely causes; both must be checked:
1) **Residual state/localStorage** from previous sessions sets `isCompleted` logic indirectly (even though `isCompleted` is a local state, a redirect or initial state update may still set it).
2) **`startSurvey()` was not called**, but `showWelcome` might be bypassed when `formData.selected_country` is prefilled and state is reset. In deployed preview, if `showWelcome` is toggled false by stale state or a prior navigation, the survey can skip.

### Recommended debug checks
- Ensure `showWelcome` is always true on new route entry.
- Confirm no persistent flags in localStorage are toggling completed state.
- In `SurveyPage`, check whether `setShowWelcome(false)` is called without user interaction.

### Recommended fix
- Force a **clean survey session** when entering `/survey/:country`:
  - Reset `isCompleted`, `currentStep`, and `showWelcome` on route change.
- Optionally clear any legacy completion flags from earlier versions.

---

## Files to inspect immediately
- `src/App.tsx` (route definitions)
- `src/pages/Login.tsx` (shared auth UI)
- `src/pages/SurveyPage.tsx` (survey start logic)
- `src/auth/context.tsx` (auth state initialization)

---

## Guidance for next agent
- Create dedicated admin login flow (`/admin/login`) and redirect unauthenticated admin attempts to that page.
- Split subscriber and admin auth experiences completely.
- Add a hard “new survey session” reset on `/survey/:country` route change.
- Re-test via deployed preview and local `npm run preview`.

