# Survey Flow Test Plan

## Overview

This document outlines the test plan to verify that the entire survey flow works correctly, including the admin and subscriber dashboards.

## Test Scenarios

### 1. Survey Welcome Screen

- [ ] Application loads at the welcome screen (not the thank you screen)
- [ ] Language selection buttons work correctly (English, Kinyarwanda, Français)
- [ ] "Start Survey" button transitions to survey flow
- [ ] "Admin Portal" button transitions to admin login

### 2. Survey Flow

- [ ] Progress bar displays correctly
- [ ] Questions render properly with correct language
- [ ] Navigation (Back/Continue) works correctly
- [ ] Required field validation works
- [ ] Survey completion shows thank you screen with confetti
- [ ] "New Session" button resets the survey

### 3. Admin Dashboard

- [ ] Admin login requires password "admin2026"
- [ ] Admin dashboard loads with country selection
- [ ] Bank selection works correctly
- [ ] All dashboard tabs are accessible:
  - Overview
  - Awareness
  - Usage
  - Momentum
  - Loyalty
  - Snapshot
  - NPS
  - Competitive
- [ ] Data visualization charts render correctly
- [ ] Export functionality works
- [ ] "Back" button returns to survey

### 4. Preview URL Behavior

- [ ] Preview URL opens at welcome screen (not thank you screen)
- [ ] Multiple visits to preview URL don't show completion screen
- [ ] Admin dashboard accessible from preview URL

## Test URLs

- **Preview URL**: https://brand-health-analytics--preview-z6z12yaj.web.app
- **Main URL**: https://brand-health-analytics.web.app

## Expected Behavior

1. **First Visit**: Should always show welcome screen
2. **Survey Completion**: Should show thank you screen with option to start new session
3. **Admin Access**: Should require password and show full dashboard
4. **Preview URLs**: Should always start fresh regardless of previous completions

## Notes

- The application uses localStorage for data persistence
- Preview URLs are detected by hostname containing 'preview' or pathname containing 'preview'
- Admin password is hardcoded as 'admin2026'
- Sample data is seeded on first load (600 responses across 3 countries)
