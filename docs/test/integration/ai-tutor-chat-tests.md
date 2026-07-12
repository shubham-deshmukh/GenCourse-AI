# AI Tutor Chat Endpoint Tests

This integration suite validates context compilation, adaptive prompts construction, LLM response dispatch, and authorization controls on the `/api/tutor/chat` endpoint.

---

## Endpoint Specification

* **Path:** `POST /api/tutor/chat`
* **Headers:** Requires mock authentication header (`x-mock-user=true`) or valid JWT cookies.
* **Payload Structure:**
  ```json
  {
    "message": "Explain React Hooks",
    "courseId": "65f1a2...",   // Optional
    "lessonId": "65f1a3..."    // Optional
  }
  ```

---

## Test Scopes & Scenarios

### 1. Route Authorization Controls
* **Unauthenticated Requests:** Returns `401 Unauthorized` when the JWT token or mock header is missing.
* **Authenticated Requests:** Successfully routes requests to the controller.

### 2. Context Extraction & Adaptive System Prompts
* **Scenario A (Lesson Context):**
  * When `lessonId` is provided, fetches objectives and English content from the database.
  * Asserts the system prompt includes the lesson title, objectives list, and page content.
* **Scenario B (Course Syllabus Context):**
  * When `courseId` is provided (but no lesson context), fetches the course syllabus outline.
  * Asserts the system prompt includes course title, description, and module headers.
* **Scenario C (General Helper Context):**
  * When neither ID is provided, falls back to general study strategies and outline suggestions.

### 3. LLM Response Dispatch & Error Boundaries
* **Successful LLM Mock Dispatch:** Resolves LLM chat completions and returns them as `{ "response": "..." }`.
* **Missing message:** Returns `400 Bad Request` if `message` is empty or omitted.

---

## Running AI Tutor Tests
```bash
node --env-file=.env --test routes/__tests__/tutorRoutes.test.js
```
