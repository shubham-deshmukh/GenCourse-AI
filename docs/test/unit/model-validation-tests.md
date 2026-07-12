# Mongoose Model Validation Tests

This suite validates database constraints, enums, required fields, and default fallback parameters for Mongoose schemas synchronously in-memory, without spinning up an active MongoDB instance.

---

## Validated Models

### 1. User Model Schema
* **Required parameters:** Asserts validation errors are raised if `email` or `auth0Sub` is missing.
* **Role enums:** Verifies only `student`, `instructor`, and `admin` are valid strings; other entries fail validation.
* **Defaults:** Confirms `role` defaults to `student`.
* **Normalization:** Verifies that uppercase emails are automatically converted to lowercase.

### 2. Course Model Schema
* **Required parameters:** Asserts validation errors are raised if `title` is missing.
* **Status enums:** Verifies correct enums for `status` and `pdfStatus`.
* **Defaults:** Confirms progress values (`totalLessons` and `completedLessons`) default to `0`.

### 3. Lesson Model Schema
* **Required parameters:** Asserts validations are raised if `moduleId`, `title`, or `content` map are missing.
* **Defaults:** Confirms `order` defaults to `0` and `youtubeVideoId` defaults to an empty string.

---

## Running Model Tests
```bash
node --env-file=.env --test models/__tests__/models.test.js
```
