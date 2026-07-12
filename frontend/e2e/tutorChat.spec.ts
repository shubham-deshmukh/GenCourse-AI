import { test, expect } from '@playwright/test';

test.describe('AI Tutor Chat E2E', () => {
  test('should allow a user to open the tutor sidebar and chat with the AI Tutor', async ({ page }) => {
    // 1. Mock the backend APIs using Playwright routes to isolate external integrations
    // Abort the course initialization call to trigger the frontend's local presets fallback
    await page.route('**/api/courses', async (route) => {
      await route.abort('failed');
    });

    // Mock the AI Tutor chat endpoint to return a structured response
    await page.route('**/api/tutor/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: 'Hello! I am your AI Tutor. Memoization stores the results of expensive function calls to speed up execution.'
        })
      });
    });

    // Mock the auth profile endpoint to bypass Auth0 redirection
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          _id: '60d0fe4f5311236168e109ca',
          email: 'mock@student.edu',
          role: 'student',
          name: 'Mock Student'
        })
      });
    });

    // 2. Open dashboard in mock mode
    await page.goto('/?mockUser=true');

    // Verify authenticated dashboard renders
    await expect(page.locator('span:has-text("Create New Course")')).toBeVisible();

    // 3. Navigate to "Create New Course" tab
    await page.click('span:has-text("Create New Course")');

    // 4. Fill prompt input and click Generate
    const searchInput = page.locator('input[placeholder*="e.g. Intro to React Hooks"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Intro to React Hooks');
    await page.locator('form button:has-text("Generate")').click();

    // 5. Wait for simulator fallback generation to complete and show modules
    const startBtn = page.locator('button:has-text("Start Course")');
    await expect(startBtn).toBeVisible({ timeout: 15000 });

    // 6. Click Start Course to open the player
    await startBtn.click();

    // 7. Verify lesson content player is rendered
    await expect(page.locator('h3:has-text("1.1 Introduction to Intro to React Hooks")')).toBeVisible();

    // 8. Open the AI Tutor sidebar panel using the floating toggle button
    const openTutorBtn = page.locator('button:has(.lucide-message-square)');
    await expect(openTutorBtn).toBeVisible();
    await openTutorBtn.click();

    // Verify AI Tutor sidebar header is displayed
    await expect(page.locator('h3:has-text("AI Tutor Assistant")')).toBeVisible();

    // 9. Input a question and submit it
    const chatInput = page.locator('input[placeholder*="Ask AI tutor"]');
    await expect(chatInput).toBeVisible();
    await chatInput.fill('What is memoization?');
    await page.locator('form button:has(.lucide-send)').click();

    // 10. Verify that both the user message and the mocked AI tutor response are displayed in the feed
    await expect(page.locator('div:has-text("What is memoization?")').first()).toBeVisible();
    await expect(page.locator('div:has-text("Memoization stores the results of expensive function calls")').first()).toBeVisible({ timeout: 5000 });
  });
});
