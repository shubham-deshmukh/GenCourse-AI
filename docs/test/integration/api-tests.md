# Course Creation API Validation Tests

This suite validates input sanitation, size thresholds, format requirements, and rate limit/timeout edge cases on the `POST /api/courses` endpoint.

---

## Endpoint Specification

* **Path:** `POST /api/courses`
* **Headers:** Cookie session with a valid JWT (`gencourse_token`)
* **Payload Structure:**
  ```json
  {
    "title": "Course Title String"
  }
  ```

---

## Test Cases Documented

### 1. Request Body Validation
* **Empty Payload `{}` / Missing `title`**
  * *Purpose:* Ensure the endpoint does not proceed with incomplete data.
  * *Expected Output:* `400 Bad Request`, containing field validation errors.
* **Invalid Topic Type**
  * *Purpose:* Block structural exploits (e.g. passing arrays or booleans as titles).
  * *Expected Output:* `400 Bad Request`.
* **Topic Size Limit (Large Topic)**
  * *Purpose:* Guard against buffer overload or extremely long string storage.
  * *Expected Output:* `400 Bad Request` if the title exceeds 100 characters.

### 2. Input Sanitization
* **Special Characters & Scripts (XSS/Injection)**
  * *Purpose:* Prevent stored Cross-Site Scripting (XSS) or database query injection (e.g. HTML/JS tags).
  * *Expected Output:* Inputs are sanitized, or the server rejects the request with `400 Bad Request`.

### 3. Integration & System Scenarios
* **Successful Generation Call**
  * *Purpose:* Verify standard shell creation returns `201 Created` with a new `courseId`.
  * *Dependencies Mocked:* Database save functions.
* **Timeout Behavior**
  * *Purpose:* Ensure server terminates/cleans up long-lived requests cleanly.
  * *Expected Output:* `504 Gateway Timeout`.
* **Queue Overflow (Queue Full)**
  * *Purpose:* Return correct pressure signals when the job schedule buffer is full.
  * *Expected Output:* `429 Too Many Requests` or `503 Service Unavailable`.

---

## Setup & Running Guide

Ensure `supertest` is installed. Run tests from the `/backend` directory:
```bash
npm run test
```
The test script runs native Node.js tests, which include `/backend/controllers/__tests__/courseController.test.js`.
