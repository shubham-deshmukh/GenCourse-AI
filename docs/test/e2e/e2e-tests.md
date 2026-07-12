# Playwright End-to-End (E2E) Tests

This E2E suite uses **Playwright** to validate real user journeys from course initialization to lesson player interactions and role protection.

---

## Testing Scenarios

### 1. Course Creation & Generation Flow (`frontend/e2e/courseGeneration.spec.ts`)
* Launches Chromium, loads the landing page with query parameter `?mockUser=true`.
* Fills a custom learning topic (e.g. `Introduction to Advanced React`) into the main search form and clicks **Generate**.
* Asserts the browser smooth-scrolls and displays the interactive generator logs canvas.
* Validates that syllabus structures, modules list, and quizzes render once generation finishes.

### 2. AI Tutor Chat Interaction (`frontend/e2e/tutorChat.spec.ts`)
* Navigates to the lesson player inside a generated course outline.
* Opens the contextual **AI Tutor** sidebar chat interface.
* Inputs a message (e.g., "Explain this lesson") and asserts that the AI Tutor streams and displays a markdown-formatted response in the chat thread.

### 3. Role-Based Access Control / RBAC (`frontend/e2e/rbac.spec.ts`)
* Simulates custom user role profiles by modifying session mock values.
* Verifies that administrative dashboards and restricted actions (such as deleting generated content or editing parameters) are hidden/blocked for `student` role users, but available for `admin` role users.

---

## Playwright Configuration
Playwright is configured in `frontend/playwright.config.ts`.
It automatically launches the frontend Vite server and backend Express server concurrently before running the test cases.

### Running E2E Tests
1. Start MongoDB on localhost.
2. Run Playwright tests in headless mode:
   ```bash
   cd frontend
   npx.cmd playwright test
   ```
3. To open the Playwright interactive UI runner:
   ```bash
   cd frontend
   npx.cmd playwright test --ui
   ```
