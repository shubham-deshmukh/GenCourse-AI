# GenCourse AI: Testing Documentation Index

Welcome to the central index for GenCourse AI testing documentation. This folder is structured into categories to help QA and developers locate test execution guides and architecture references.

---

## 📂 Testing Directory Structure

Use the links below to explore the specifications for each tier of the testing hierarchy:

### 1. 🧪 [Unit Testing](unit/)
Low-level logic verification for prompt engines, parsers, and schemas:
*   [Course Generation Service Prompt Builders & JSON Repairs](unit/course-generation-service-tests.md)
*   [LLM Workers & API Templates Provider Tests](unit/llm-workers-tests.md)
*   [Mongoose Schema & Constraints Model Validation](unit/model-validation-tests.md)

### 2. 🔌 [Integration & API Testing](integration/)
End-point controller actions, SSE event stream emissions, and queues:
*   [Course Validation API Route Controller Integration](integration/api-tests.md)
*   [OAuth JIT Provisioning Auth Integration](integration/auth-routes-tests.md)
*   [Course SSE Outline, Lesson completed, and Progress Streams](integration/course-streaming-tests.md)
*   [AI Tutor System Prompt Sidebar Chat Endpoint Integration](integration/ai-tutor-chat-tests.md)
*   [Task Scheduler Multi-Worker Capacity Concurrency Queue](integration/queue-scheduler-tests.md)
*   [PDF Scheduler Queue & Exporter Provider Integration Tests](integration/pdf-scheduler-tests.md)
*   [Cookie Security & Load Session Verification](integration/security-load-tests.md)

### 3. 💻 [Frontend Unit & Component Testing](frontend/)
UI component render checks and Zustand stores:
*   [Zustand State Stores & Response Caches Store Tests](frontend/frontend-tests.md)
*   [Marketing Hero, Features, & Dropdown Layout Component Tests](frontend/frontend-components-tests.md)

### 4. 🎭 [End-to-End (E2E) Browser Testing](e2e/)
Playwright automated client-journey scripts:
*   [Visitor Generator, AI Tutor Chat Drawer, & RBAC Privilege E2E Guides](e2e/e2e-tests.md)

### 5. ⚡ [Load & Stress Concurrency Testing](load/)
Performance monitoring under high active loads:
*   [Programmatic Node & k6 Concurrency SSE Load Testing Specifications](load/load-testing.md)

---

## 🛠️ Execution Commands Summary

| Testing Tier | Execution command | Location |
| :--- | :--- | :--- |
| **Backend Unit & Integration** | `npm run test` | `/backend` |
| **Frontend Unit & Component** | `npm run test` | `/frontend` |
| **Playwright E2E Browser** | `npx playwright test` | `/frontend` |
| **Programmatic Load Tests** | `node load-test.js` | `/backend` |
| **k6 Concurrency Load Tests** | `k6 run load-test-k6.js` | `/backend` |
