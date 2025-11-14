import { test, expect } from '@playwright/test';

test.describe('Chat Window', () => {
  test('should allow a user to send a message and receive a response', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the initial greeting message to appear
    await expect(page.locator('.prose')).toBeVisible();
    const initialMessage = await page.locator('.prose').first().textContent();
    expect(initialMessage).not.toBeNull();

    // Find the textarea and the submit button
    const messageInput = page.getByPlaceholder(/Ask about job resources/i);
    const sendButton = page.getByRole('button', { name: 'Send message' });

    // Type a message and click send
    const userMessage = 'Hello, can you help me with my resume?';
    await messageInput.fill(userMessage);
    await sendButton.click();

    // Check that the user's message appears in the chat
    await expect(page.locator('.prose').getByText(userMessage)).toBeVisible();
    
    // Check that the "thinking..." indicator appears
    await expect(page.getByText(/Job Connections AI is thinking.../i)).toBeVisible();
    
    // In a real E2E test, we would wait for the actual AI response.
    // Since we are using a mock service, the response is deterministic.
    const expectedResponse = `This is a mock response to your query: "${userMessage}". In a real environment, I would provide a detailed answer based on the provided knowledge base. Please configure your API_KEY to connect to Gemini.`;

    // Wait for the AI's response to appear
    await expect(page.locator('.prose').getByText(expectedResponse, { exact: false })).toBeVisible({ timeout: 10000 });
  });
});
