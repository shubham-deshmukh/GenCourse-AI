# GenCourse AI: Testing Documentation

This directory contains execution guides, test specifications, and architectural documentation for the GenCourse AI test suite.

---

## Directory Structure

```text
/docs/
└── test/
    ├── README.md               # Main testing documentation (this file)
    ├── unit-tests.md           # Documentation for prompt builders, parsers, and validation
    ├── api-tests.md            # Details on Supertest route test cases
    └── queue-scheduler-tests.md # Concurrency, crash-recovery, and rate limit queue workflows
```

---

## Testing Frameworks & Tools

| Scope | Tooling Choice | Command | Description |
| :--- | :--- | :--- | :--- |
| **Backend Unit & Integration** | Native Node.js test runner (`node:test`) | `npm run test` (inside `/backend`) | Runs native tests without external dependencies. |
| **API Endpoints** | `supertest` & `node:test` | `npm run test` (inside `/backend`) | Simulates requests against Express controllers offline. |
| **Frontend Unit / Store** | `Vitest` & `React Testing Library` | `npm run test` (inside `/frontend`) | Tests Zustand store hooks and UI components inside jsdom. |
| **End-to-End (E2E)** | `Playwright` | `npx playwright test` | Tests full user generation and tutoring flows. |

---

## Workflow & Branching Guidelines

Before starting work on implementing tests, follow these rules:

1. **Ask for Permission:** Present the scope of the test cases to the user in the workspace and get approval.
2. **Branch Naming:**
   * Parent Branch: `test`
   * Child Branch format: `test/<test-scope-slug>` (e.g. `test/api-courses-validation`, `test/queue-scheduler-concurrency`).
3. **Mocking External APIs:** Never invoke live Gemini, Ollama, Cerebras, or Auth0 APIs in unit/integration/API suites. Use robust mocks or stubs.
4. **Documentation:** Along with the code for each test, add/update the corresponding guide inside this folder (`/docs/test/`).
