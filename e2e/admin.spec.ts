import { test, expect } from '@playwright/test';

// For simplicity, this test assumes the admin panel is accessible without login.
// In a real app, you would add a `test.beforeEach` block to handle login.
// e.g., using a helper function or by interacting with the UI.

test.describe('Admin Knowledge Base Management', () => {
  test('should allow an admin to add and delete a text source', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Go to the admin panel
    // Note: In the current app, clicking "Go to Admin" changes the view without a page load.
    await page.getByRole('button', { name: 'Go to Admin' }).click();
    await expect(page.getByRole('heading', { name: 'Knowledge Base Manager' })).toBeVisible();

    // Content for the new source
    const newSourceContent = `This is a test source added via Playwright at ${new Date().toISOString()}`;

    // Add a new text source
    const textarea = page.getByPlaceholder(/Paste plain text content here/i);
    await textarea.fill(newSourceContent);
    await page.getByRole('button', { name: 'Add Source' }).click();

    // Wait for the new source to appear in the list.
    // The `getByText` will find the truncated version displayed in the UI.
    const truncatedContent = `${newSourceContent.substring(0, 70)}...`;
    const newSourceRow = page.getByText(truncatedContent);
    await expect(newSourceRow).toBeVisible({ timeout: 5000 });
    
    // Find the parent container of the new source to locate its specific delete button
    const sourceContainer = page.locator('.flex.justify-between.items-center', { has: page.getByText(truncatedContent) });

    // Click the delete button within that container
    const deleteButton = sourceContainer.locator('button').last(); // Assuming delete is the last button
    await deleteButton.click();

    // Handle the confirmation dialog
    page.on('dialog', dialog => dialog.accept());
    // Re-trigger the delete action after setting up the dialog handler
    await deleteButton.click();
    
    // Verify the source is removed from the list
    await expect(newSourceRow).not.toBeVisible({ timeout: 5000 });
  });
});
