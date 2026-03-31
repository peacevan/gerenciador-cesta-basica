const { test, expect } = require('@playwright/test');

test.describe('Nota Fiscal upload flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the ai-proxy endpoint to return a normalized JSON string
    await page.route('**/api/ai-proxy', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ text: '[{"nome":"arroz","quantidade":5}]' })
    }));

    // Optional: stub client-side OCR extraction if present on window
    await page.addInitScript(() => {
      // Expose a no-op OCR function to speed up tests if code calls a global
      window.__playwrightMockOCR = true;
      window.extractTextFromImageFile = async () => 'arroz 5 kg';
    });
  });

  test('opens upload modal and processes nota fiscal', async ({ page, baseURL }) => {
    await page.goto(baseURL || '/');

    // Open the Nota Fiscal modal
    await page.click('[aria-label="Importar nota fiscal"]');

    // Ensure modal visible
    await expect(page.locator('text=Importar Nota Fiscal')).toBeVisible();

    // Attach a dummy file to the file input
    const input = page.locator('input[type="file"]');
    await input.setInputFiles({ name: 'nota.jpg', mimeType: 'image/jpeg', buffer: Buffer.from([0xFF,0xD8,0xFF]) });

    // Click process
    await page.click('button:has-text("Processar Nota")');

    // Wait for the confirmation modal (result from proxy) to appear
    await expect(page.locator('text=Confirmar')).toBeVisible({ timeout: 5000 });
    // The interpreted item should be visible
    await expect(page.locator('text=arroz')).toBeVisible();
  });
});
