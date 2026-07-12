# LLM Workers & Providers Unit Tests

This suite validates prompt payload compilation, API request generation, factory initialization, and rate-limiting error cooldown handling for LLM providers (`GeminiWorker`, `OllamaWorker`, and `CerebrasWorker`).

---

## Test Scopes & Scenarios

### 1. WorkerFactory Instantiation
* Instantiates concrete provider instances dynamically based on config structures:
  * `'gemini'` -> `GeminiWorker`
  * `'ollama'` -> `OllamaWorker`
  * `'cerebras'` -> `CerebrasWorker`
* Rejects unsupported or malformed configurations with error boundaries.

### 2. GeminiWorker Operations
* **Payload Compilation:** Asserts system prompt, JSON response format options, and temperature settings are mapped correctly to the Google GenAI SDK method parameters.
* **Cooldown Triggers:** Simulates a rate-limit exception (e.g. `429 Too Many Requests` or `quota exceeded`), asserts `handleError` intercepts it, and cools down the worker for `30,000` milliseconds.

### 3. CerebrasWorker Operations
* **Request Structure:** Asserts API endpoint header tokens (`Authorization: Bearer <key>`) and payload formatting (e.g. `response_format` when in JSON mode) are constructed correctly.
* **Cooldown Triggers:** Asserts the worker cools down when rate-limit error messages occur.

### 4. OllamaWorker Operations
* **Request Structure:** Asserts local chat requests map correctly to standard endpoints (e.g. `http://localhost:11434/api/chat`).
* **Cooldown Triggers:** Asserts rate-limit errors cool down the worker correctly.

---

## Running Worker Tests
```bash
node --env-file=.env --test services/scheduler/lesson/workers/__tests__/workers.test.js
```
