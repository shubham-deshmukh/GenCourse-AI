# Frontend Zustand Store Tests

This suite validates the state management, session handling, and SSE update integration of the frontend application stores.

---

## Target Stores

### 1. Auth Store (`useAuthStore.ts`)
* **State Managed:** `isAuthenticated`, `user`, `loading`.
* **Actions Tested:**
  * Initial loading and registration states.
  * Login completion (updating user profile details and flags).
  * Logout cleanup (resets all auth fields).

### 2. Generation Store (`useGenerationStore.ts`)
* **State Managed:** Active generation status, currently compiled outline modules, lesson generation updates, and compiler stream logs.
* **Actions Tested:**
  * Resetting generation logs on initialization.
  * Handling incoming outlines (rendering lesson placeholders in correct module indexes).
  * Appending compiled lesson details as they are streamed via SSE.
  * Triggering failure logs and notifications when connection errors occur.

---

## Runner & Tooling Guide

Vitest runs in a lightweight, Node-based mock environment:
```bash
# Run tests inside the frontend folder
npm run test
# Or execute Vitest directly
npx vitest run
```
Vitest is configured to run in `/frontend` and scans for files matching `src/store/__tests__/*.test.ts`.
