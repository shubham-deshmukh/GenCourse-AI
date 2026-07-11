# Frontend Component Tests

This suite validates the rendering layout, conditional elements, and click interactions of key React UI components in a simulated browser environment.

---

## Target Component under Test: `Navbar.tsx`

* **Location:** `frontend/src/components/Navbar.tsx`
* **Test Focus:**
  * **Brand Rendering:** Verifies that "GenCourse AI" logo and primary links render correctly.
  * **Unauthenticated State:** Verifies that a "Login" or "Get Started" call-to-action button is visible when `isAuthenticated` is false.
  * **Authenticated State:** Verifies that user avatar info, a "Dashboard" link, and a "Sign Out" button are displayed when `isAuthenticated` is true, and clicking them performs the expected logout callback.

---

## Runner & Setup Configuration

* **Test Environment:** `jsdom` (simulated browser environment). Set on a per-file basis using the `// @vitest-environment jsdom` header.
* **Assertion Helpers:** `@testing-library/jest-dom` (adds matchers like `toBeInTheDocument()`, `toHaveTextContent()`).
* **Zustand Mocking:** The component depends on `useAuthStore` to determine auth links. We mock or set states on `useAuthStore` directly before rendering the component to test both paths.

---

## Running Component Tests
```bash
# Run tests inside the frontend folder
npm run test
# Or execute Vitest directly
npx vitest run
```
Vitest scans `src/components/__tests__/*.test.tsx` files and executes them in a virtual jsdom environment.
