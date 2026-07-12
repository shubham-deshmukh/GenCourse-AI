import { test, expect } from '@playwright/test';

test.describe('Role-Based Access Control (RBAC) E2E', () => {
  test('should not show privileged role badges when logged in as a student', async ({ page }) => {
    // 1. Mock profile endpoint to return a Student user profile
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: '60d0fe4f5311236168e109ca',
          email: 'student@gencourse.edu',
          role: 'student',
          name: 'Jane Student'
        })
      });
    });

    // 2. Navigate to mock dashboard
    await page.goto('/?mockUser=true');

    // 3. Open the user profile dropdown
    const avatarBtn = page.locator('button:has(img[alt="Jane Student"])');
    await expect(avatarBtn).toBeVisible();
    await avatarBtn.click();

    // 4. Verify email is shown but no Admin/Instructor privilege badges are rendered
    await expect(page.locator('text=student@gencourse.edu')).toBeVisible();
    await expect(page.locator('span:has-text("Admin")')).not.toBeVisible();
    await expect(page.locator('span:has-text("Instructor")')).not.toBeVisible();
  });

  test('should display the Admin privilege badge when logged in as an admin', async ({ page }) => {
    // 1. Mock profile endpoint to return an Admin user profile
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: '60d0fe4f5311236168e109ca',
          email: 'admin@gencourse.edu',
          role: 'admin',
          name: 'Chief Administrator'
        })
      });
    });

    // 2. Navigate to mock dashboard
    await page.goto('/?mockUser=true');

    // 3. Open the user profile dropdown
    const avatarBtn = page.locator('button:has(img[alt="Chief Administrator"])');
    await expect(avatarBtn).toBeVisible();
    await avatarBtn.click();

    // 4. Assert Admin badge is displayed
    await expect(page.locator('span:has-text("Admin")')).toBeVisible();
    await expect(page.locator('span:has-text("Instructor")')).not.toBeVisible();
  });

  test('should display the Instructor privilege badge when logged in as an instructor', async ({ page }) => {
    // 1. Mock profile endpoint to return an Instructor user profile
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: '60d0fe4f5311236168e109ca',
          email: 'instructor@gencourse.edu',
          role: 'instructor',
          name: 'Professor Smith'
        })
      });
    });

    // 2. Navigate to mock dashboard
    await page.goto('/?mockUser=true');

    // 3. Open the user profile dropdown
    const avatarBtn = page.locator('button:has(img[alt="Professor Smith"])');
    await expect(avatarBtn).toBeVisible();
    await avatarBtn.click();

    // 4. Assert Instructor badge is displayed
    await expect(page.locator('span:has-text("Instructor")')).toBeVisible();
    await expect(page.locator('span:has-text("Admin")')).not.toBeVisible();
  });
});
