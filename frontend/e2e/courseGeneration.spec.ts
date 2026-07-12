import { test, expect } from '@playwright/test';

test.describe('Course Generation Flow', () => {
  test('should allow a visitor to generate a course from a prompt and view the syllabus/quizzes', async ({ page }) => {
    // 1. Navigate to the landing page
    await page.goto('/');

    // Assert branding is visible
    await expect(page.locator('span:has-text("GenCourse")')).toBeVisible();

    // 2. Locate the prompt search input and fill it
    const promptInput = page.locator('input[placeholder*="What do you want to learn today"]');
    await expect(promptInput).toBeVisible();
    await promptInput.fill('Intro to React Hooks');

    // 3. Click the Generate button
    const generateBtn = page.locator('form button:has-text("Generate")');
    await generateBtn.click();

    // 4. Verify that the page smooth-scrolls to the simulator and starts generating
    const simulatorSection = page.locator('#demo');
    await expect(simulatorSection).toBeVisible();

    // 5. Verify the logs indicate analyzer ingesting the prompt
    const logConsole = page.locator('.font-mono');
    await expect(logConsole).toContainText('[ANALYZE] Ingesting prompt: "Intro to React Hooks"');

    // 6. Wait for the generation process to complete (progress reaches 100% and displays modules)
    // In fallback mode, this takes ~1.5 - 2 seconds.
    const courseTitle = page.locator('h3:has-text("Intro to React Hooks")');
    await expect(courseTitle).toBeVisible({ timeout: 15000 });

    // 7. Verify course modules are rendered
    const moduleItem = page.locator('span:has-text("Module 1:")');
    await expect(moduleItem).toBeVisible();

    // 8. Verify the interactive quiz is rendered
    const quizSection = page.locator('h4:has-text("Interactive Knowledge Check")');
    await expect(quizSection).toBeVisible();
    
    // Check that quiz question is displayed
    const quizQuestion = page.locator('p:has-text("What is the primary purpose of the useState Hook?")');
    await expect(quizQuestion).toBeVisible();
  });
});
