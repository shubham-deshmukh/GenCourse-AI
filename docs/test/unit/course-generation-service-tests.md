# Course Generation Service & Prompt/Parser Unit Tests

This suite unit-tests the prompt construction templates and JSON parsing pipelines used to generate course outlines and lesson textbook contents.

---

## Test Scopes & Scenarios

### 1. LLM Prompt Builders (`courseGenerationService.js`)
* **Syllabus Outline Prompt Builder:**
  * Asserts `getCourseOutlinePrompt(topic)` correctly injects the topic parameter.
  * Asserts the returned prompt matches constraints (e.g. exactly 3 modules, JSON output instructions).
* **Lesson Details Prompt Builder:**
  * Asserts `getLessonDetailsPrompt(course, module, targetLessonTitle)` correctly maps the course title, description, parent module title, other sibling lesson titles, and the target lesson title.

### 2. JSON Parsers & Response Sanitization (`courseGenerationService.js`)
* **Successful Generation Pipeline:**
  * Mocks `llmService.generateContent` to return clean JSON strings.
  * Asserts `generateCourseOutline` and `generateLessonDetails` successfully resolve and return parsed JS objects.
* **Malformed & Fenced JSON Repair:**
  * Mocks `llmService.generateContent` to return malformed structures (e.g. JSON wrapped in markdown code blocks like ` ```json ... ``` `).
  * Asserts that `parseJSONSafely` strips fences, repairs trailing commas, and returns fully parsed validation structures without throwing errors.

---

## Running Service Tests
```bash
node --env-file=.env --test services/__tests__/courseGenerationService.test.js
```
