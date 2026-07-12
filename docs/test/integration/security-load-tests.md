# Security and Load Tests

This suite validates first-party session cookie configurations and checks Express Server-Sent Events (SSE) subscriptions for memory leaks and resource containment.

---

## Target Scopes

### 1. Cookie Security
* **Location:** `backend/routes/authRoutes.js`
* **Test Focus:**
  * Checks that the OAuth state and verifier session cookies are set with `HttpOnly`, `SameSite=Lax`, and `Secure` attributes depending on the environment.
  * Asserts that `secure: true` is enforced under `NODE_ENV=production` but disabled under development modes to prevent local loopback blocks.

### 2. SSE Connection Load & Cleanup (Leak Testing)
* **Location:** `backend/routes/courseRoutes.js` (controller `streamCourse`)
* **Test Focus:**
  * Spawns 5 concurrent clients connecting to a course SSE generation stream.
  * Asserts that `generationEvents` correctly adds 5 active event listeners during active streaming.
  * Shuts down/aborts all connections concurrently and asserts that the event emitter unregisters all 5 listeners, proving that drops don't leak connection handles or database sockets.

---

## Running Security & Load Tests
```bash
# Execute native node test runner on the target test file
node --env-file=.env --test routes/__tests__/securityAndLoad.test.js
```
