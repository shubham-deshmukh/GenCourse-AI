# Course SSE Streaming API Tests

This integration suite validates Server-Sent Events (SSE) packet generation, syllabus outlines stream dispatch, completed lesson sync messages, and real-time generation progress updates on the `/api/courses/:id/stream` route.

---

## Test Scopes & Scenarios

### 1. Syllabus Outline Delivery
* Establishes an SSE stream connection and captures incoming data chunks.
* Asserts the client receives the `outline` event payload containing populated modules and user lesson progress records.

### 2. Completed Lesson Sync
* Asserts that previously generated and completed lessons are sent sequentially as separate `lesson` events upon connection.

### 3. Real-Time Generation Stream Updates
* Emits mock progress events (`generationEvents.emit('course:<id>', { type: 'progress', data: ... })`) on the backend.
* Verifies that the connected client receives these event streams in real-time.

### 4. Connection Drop Cleanup
* Aborts connections and confirms that the listener count on the shared event emitter is cleanly restored to prevent leaks.

---

## Running SSE Streaming Tests
```bash
node --env-file=.env --test routes/__tests__/courseStreaming.test.js
```
