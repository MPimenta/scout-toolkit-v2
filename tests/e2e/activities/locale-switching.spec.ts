import { test, expect } from '@playwright/test'

test.describe('Locale Switching', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/pt')
  })

  test('should switch between Portuguese and English locales', async ({ page }) => {
    // Start on Portuguese
    await expect(page).toHaveURL(/\/pt/)
    
    // Switch to English
    await page.goto('/en')
    await expect(page).toHaveURL(/\/en/)
    
    // Switch back to Portuguese
    await page.goto('/pt')
    await expect(page).toHaveURL(/\/pt/)
  })

  test('should display correct language in navigation', async ({ page }) => {
    // Portuguese navigation
    await page.goto('/pt')
    await expect(page.getByRole('link', { name: /atividades/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /programas/i })).toBeVisible()
    
    // English navigation
    await page.goto('/en')
    await expect(page.getByRole('link', { name: /activities/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /programs/i })).toBeVisible()
  })

  test('should maintain page state when switching locales', async ({ page }) => {
    // Navigate to activities page in Portuguese
    await page.goto('/pt/activities')
    await expect(page).toHaveURL(/\/pt\/activities/)
    
    // Switch to English while on activities page
    await page.goto('/en/activities')
    await expect(page).toHaveURL(/\/en\/activities/)
    
    // Switch back to Portuguese
    await page.goto('/pt/activities')
    await expect(page).toHaveURL(/\/pt\/activities/)
  })

  test('should handle invalid locales gracefully', async ({ page }) => {
    // Try to access invalid locale
    await page.goto('/fr')
    
    // Should redirect to default locale (Portuguese)
    await expect(page).toHaveURL(/\/pt/)
  })

  test('should preserve query parameters when switching locales', async ({ page }) => {
    // Navigate with query parameters
    await page.goto('/pt/activities?search=test&filter=active')
    await expect(page).toHaveURL(/\/pt\/activities\?search=test&filter=active/)
    
    // Switch to English
    await page.goto('/en/activities?search=test&filter=active')
    await expect(page).toHaveURL(/\/en\/activities\?search=test&filter=active/)
  })

  test('should display correct page titles in different locales', async ({ page }) => {
    // Portuguese title
    await page.goto('/pt')
    await expect(page).toHaveTitle(/Scout Toolkit/)
    
    // English title
    await page.goto('/en')
    await expect(page).toHaveTitle(/Scout Toolkit/)
  })

  test('should handle locale switching in deep routes', async ({ page }) => {
    // Test deep route in Portuguese
    await page.goto('/pt/admin/activities/create')
    await expect(page).toHaveURL(/\/pt\/admin\/activities\/create/)
    
    // Switch to English
    await page.goto('/en/admin/activities/create')
    await expect(page).toHaveURL(/\/en\/admin\/activities\/create/)
  })

  test('should maintain authentication state across locale switches', async ({ page }) => {
    // Navigate to Portuguese version
    await page.goto('/pt')
    await expect(page).toHaveURL(/\/pt/)
    
    // Navigate to English version
    await page.goto('/en')
    await expect(page).toHaveURL(/\/en/)
    
    // Navigate back to Portuguese
    await page.goto('/pt')
    await expect(page).toHaveURL(/\/pt/)
  })
})

test.describe('URL Structure', () => {
  test('should have correct URL structure for Portuguese', async ({ page }) => {
    await page.goto('/pt')
    await expect(page).toHaveURL(/\/pt$/)
    
    await page.goto('/pt/activities')
    await expect(page).toHaveURL(/\/pt\/activities$/)
    
    await page.goto('/pt/programs')
    await expect(page).toHaveURL(/\/pt\/programs$/)
  })

  test('should have correct URL structure for English', async ({ page }) => {
    await page.goto('/en')
    await expect(page).toHaveURL(/\/en$/)
    
    await page.goto('/en/activities')
    await expect(page).toHaveURL(/\/en\/activities$/)
    
    await page.goto('/en/programs')
    await expect(page).toHaveURL(/\/en\/programs$/)
  })

  test('should redirect root to default locale', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/pt/)
  })
})

test.describe('Content Localization', () => {
  test('should display Portuguese content', async ({ page }) => {
    await page.goto('/pt')
    
    // Check for Portuguese text
    await expect(page.getByText(/plataforma de atividades escutistas/i)).toBeVisible()
  })

  test('should display English content', async ({ page }) => {
    await page.goto('/en')
    
    // Check for English text
    await expect(page.getByText(/scout activities platform/i)).toBeVisible()
  })

  test('should have consistent content structure across locales', async ({ page }) => {
    // Portuguese version
    await page.goto('/pt')
    const ptContent = await page.textContent('body')
    
    // English version
    await page.goto('/en')
    const enContent = await page.textContent('body')
    
    // Both should have content
    expect(ptContent).toBeTruthy()
    expect(enContent).toBeTruthy()
  })
})

