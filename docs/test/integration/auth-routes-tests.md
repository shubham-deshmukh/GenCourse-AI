# Auth Routes & JIT Provisioning Tests

This integration suite validates CSRF checks, token exchange logic, unverified email blocks, dynamic Just-in-Time user provisioning, JWT cookie placement, and logout cookie cleanups on the `/auth` endpoints.

---

## Target Routes

### 1. GET `/auth/login`
* Generates random OAuth challenge parameters (verifier and state).
* Writes verifier and state properties into short-lived cookies.
* Redirects browser to Auth0 authorize endpoints.

### 2. GET `/auth/callback`
* Validates CSRF parameters (`state` parameter against `auth_state` cookie value).
* Confirms verifier cookies are present.
* Exchanges authorization code for access tokens via back-channel API requests.
* Obtains user profile from identity provider:
  * Blocks users if email verification flag is missing/false.
  * Dynamically finds or registers (`JIT provisions`) user profile document.
* Encrypts custom JWT cookie `gencourse_token`.
* Redirects back to target landing homepage (`FRONTEND_URL`).

### 3. GET `/auth/logout`
* Clears local `gencourse_token` JWT cookie.
* Redirects to global Auth0 sign out page.

---

## Test Scopes & Scenarios

1. **Successful JIT User Creation Flow:**
   * Mocks back-channel HTTP token exchange and profile API queries.
   * Asserts database writes the User profile to MongoDB if absent.
   * Confirms redirect URL is correct and secure JWT cookie parameters are set.
2. **Successful JIT Load Existing User:**
   * Asserts database does not write redundant duplicate records if user is already registered.
3. **CSRF Validation Failures:**
   * Mismatches state values and verifies immediate redirect with CSRF error details.
4. **Missing Verifier Cookie Failures:**
   * Removes verifier cookies and asserts verification failure triggers redirect.
5. **Unverified Email Block:**
   * Mocks unverified Auth0 profile flags and asserts route blocks registration and redirects to email validation check fields.
6. **Logout Cookie Cleanup:**
   * Asserts logout calls clear local token cookies and invoke global redirects.

---

## Running Auth Tests
```bash
node --env-file=.env --test routes/__tests__/authRoutes.test.js
```
