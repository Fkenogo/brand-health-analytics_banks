# Developer Documentation Index

This folder contains technical reference documentation generated from the current codebase implementation.

## Documents
- [System Architecture](./system-architecture.md)
- [Database Schema](./database-schema.md)
- [User Flow Map](./user-flow-map.md)

## Recommended Reading Order
1. `system-architecture.md`
2. `database-schema.md`
3. `user-flow-map.md`

## How To Use These Docs
- Use **System Architecture** to understand component boundaries, platform dependencies, and data movement.
- Use **Database Schema** when changing Firestore models, introducing migrations, or validating query assumptions.
- Use **User Flow Map** when editing routes, onboarding, role guards, or admin/subscriber workflows.

## Scope Notes
- These docs reflect **actual code paths currently in the repository**.
- Each document includes a **Known Gaps / Unclear Areas** section for partial or ambiguous implementations.

## Maintenance Guidance
When making substantial changes, update at least one of the docs if you modify:
- Routes, guards, or role logic
- Firestore collections/fields/read-write paths
- Backend integrations (Functions, external APIs)
- End-to-end product flows (survey, onboarding, approvals, dashboard)
