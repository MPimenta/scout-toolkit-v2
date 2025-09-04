import { test, expect } from '@playwright/test';

test.describe('Program Management E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to programs page
    await page.goto('/programs');
  });

  test.describe('Non-authenticated users', () => {
    test('should see feature showcase', async ({ page }) => {
      // Should show feature showcase for non-logged users
      await expect(page.getByText('Criador de Programas')).toBeVisible();
      await expect(page.getByText('Cronogramas Inteligentes')).toBeVisible();
      await expect(page.getByText('Gestão de Atividades')).toBeVisible();
      await expect(page.getByText('Objetivos Educativos')).toBeVisible();
      await expect(page.getByText('Exportação Profissional')).toBeVisible();
    });

    test('should see sign-in CTA', async ({ page }) => {
      // Should show sign-in button
      await expect(page.getByRole('button', { name: /iniciar sessão/i })).toBeVisible();
    });

    test('should maintain navigation consistency', async ({ page }) => {
      // Should have consistent header navigation
      await expect(page.locator('header')).toBeVisible();
      await expect(page.getByRole('navigation')).toBeVisible();
    });
  });

  test.describe('Authenticated users', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authentication - simulate logged-in user
      await page.addInitScript(() => {
        window.localStorage.setItem('auth-token', 'mock-token');
        window.localStorage.setItem('user', JSON.stringify({
          id: 'test-user-123',
          name: 'Test User',
          email: 'test@escoteiros.pt'
        }));
      });
      
      // Reload page to apply auth state
      await page.reload();
    });

    test('should see programs list when authenticated', async ({ page }) => {
      // Should show programs list for authenticated users
      await expect(page.getByText('Meus Programas')).toBeVisible();
      await expect(page.getByRole('button', { name: /novo programa/i })).toBeVisible();
    });

    test('should create new program', async ({ page }) => {
      // Click new program button
      await page.getByRole('button', { name: /novo programa/i }).click();
      
      // Fill form
      await page.getByLabel(/nome/i).fill('E2E Test Program');
      await page.getByLabel(/data/i).fill('2024-01-30');
      await page.getByLabel(/hora de início/i).fill('09:00');
      await page.getByLabel(/programa público/i).check();
      
      // Submit form
      await page.getByRole('button', { name: /criar/i }).click();
      
      // Should show success and hide form
      await expect(page.getByText('E2E Test Program')).toBeVisible();
      await expect(page.queryByText('Criar Novo Programa')).not.toBeVisible();
    });

    test('should edit existing program', async ({ page }) => {
      // Create a program first
      await page.getByRole('button', { name: /novo programa/i }).click();
      await page.getByLabel(/nome/i).fill('Program to Edit');
      await page.getByLabel(/data/i).fill('2024-01-31');
      await page.getByLabel(/hora de início/i).fill('10:00');
      await page.getByRole('button', { name: /criar/i }).click();
      
      // Wait for program to appear
      await expect(page.getByText('Program to Edit')).toBeVisible();
      
      // Click edit button
      await page.getByRole('button', { name: /editar/i }).first().click();
      
      // Should navigate to edit page
      await expect(page.getByText('Editar Programa')).toBeVisible();
      await expect(page.getByLabel(/nome/i)).toHaveValue('Program to Edit');
      
      // Update program
      await page.getByLabel(/nome/i).fill('Updated Program Name');
      await page.getByRole('button', { name: /atualizar/i }).click();
      
      // Should show updated name
      await expect(page.getByText('Updated Program Name')).toBeVisible();
    });

    test('should delete program with confirmation', async ({ page }) => {
      // Create a program first
      await page.getByRole('button', { name: /novo programa/i }).click();
      await page.getByLabel(/nome/i).fill('Program to Delete');
      await page.getByLabel(/data/i).fill('2024-02-01');
      await page.getByLabel(/hora de início/i).fill('11:00');
      await page.getByRole('button', { name: /criar/i }).click();
      
      // Wait for program to appear
      await expect(page.getByText('Program to Delete')).toBeVisible();
      
      // Click delete button
      await page.getByRole('button', { name: /excluir/i }).first().click();
      
      // Should show confirmation dialog
      await expect(page.getByText(/tem certeza/i)).toBeVisible();
      await expect(page.getByText('Program to Delete')).toBeVisible();
      
      // Confirm deletion
      await page.getByRole('button', { name: /excluir/i }).click();
      
      // Program should be removed
      await expect(page.queryByText('Program to Delete')).not.toBeVisible();
    });

    test('should cancel program deletion', async ({ page }) => {
      // Create a program first
      await page.getByRole('button', { name: /novo programa/i }).click();
      await page.getByLabel(/nome/i).fill('Program to Keep');
      await page.getByLabel(/data/i).fill('2024-02-02');
      await page.getByLabel(/hora de início/i).fill('12:00');
      await page.getByRole('button', { name: /criar/i }).click();
      
      // Wait for program to appear
      await expect(page.getByText('Program to Keep')).toBeVisible();
      
      // Click delete button
      await page.getByRole('button', { name: /excluir/i }).first().click();
      
      // Should show confirmation dialog
      await expect(page.getByText(/tem certeza/i)).toBeVisible();
      
      // Cancel deletion
      await page.getByRole('button', { name: /cancelar/i }).click();
      
      // Program should still be visible
      await expect(page.getByText('Program to Keep')).toBeVisible();
    });

    test('should handle form validation', async ({ page }) => {
      // Click new program button
      await page.getByRole('button', { name: /novo programa/i }).click();
      
      // Try to submit without filling required fields
      await page.getByRole('button', { name: /criar/i }).click();
      
      // Should show validation error
      await expect(page.getByText(/nome é obrigatório/i)).toBeVisible();
      
      // Fill only name
      await page.getByLabel(/nome/i).fill('Valid Name');
      await page.getByRole('button', { name: /criar/i }).click();
      
      // Should still show validation error for other fields
      await expect(page.getByText(/data é obrigatória/i)).toBeVisible();
    });

    test('should handle form cancellation', async ({ page }) => {
      // Click new program button
      await page.getByRole('button', { name: /novo programa/i }).click();
      
      // Fill some data
      await page.getByLabel(/nome/i).fill('Cancelled Program');
      await page.getByLabel(/data/i).fill('2024-02-03');
      
      // Cancel form
      await page.getByRole('button', { name: /cancelar/i }).click();
      
      // Form should be hidden
      await expect(page.queryByText('Criar Novo Programa')).not.toBeVisible();
      
      // Program should not be created
      await expect(page.queryByText('Cancelled Program')).not.toBeVisible();
    });

    test('should display program information correctly', async ({ page }) => {
      // Create a program with specific data
      await page.getByRole('button', { name: /novo programa/i }).click();
      await page.getByLabel(/nome/i).fill('Display Test Program');
      await page.getByLabel(/data/i).fill('2024-02-04');
      await page.getByLabel(/hora de início/i).fill('13:00');
      await page.getByLabel(/programa público/i).check();
      await page.getByRole('button', { name: /criar/i }).click();
      
      // Wait for program to appear
      await expect(page.getByText('Display Test Program')).toBeVisible();
      
      // Check program details are displayed correctly
      await expect(page.getByText('04/02/2024')).toBeVisible();
      await expect(page.getByText('13:00')).toBeVisible();
      await expect(page.getByText('Público')).toBeVisible();
      await expect(page.getByText('0 atividades')).toBeVisible();
      await expect(page.getByText('0h 0min')).toBeVisible();
    });

    test('should handle empty programs list', async ({ page }) => {
      // If no programs exist, should show empty state
      const hasPrograms = await page.locator('[data-testid="program-card"]').count() > 0;
      
      if (!hasPrograms) {
        await expect(page.getByText(/ainda não tem programas/i)).toBeVisible();
        await expect(page.getByText(/crie o seu primeiro programa/i)).toBeVisible();
      }
    });

    test('should maintain responsive design', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Should still show all elements
      await expect(page.getByText('Meus Programas')).toBeVisible();
      await expect(page.getByRole('button', { name: /novo programa/i })).toBeVisible();
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.getByText('Meus Programas')).toBeVisible();
      
      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.getByText('Meus Programas')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/programs');
      
      // Check form accessibility
      await page.getByRole('button', { name: /novo programa/i }).click();
      
      await expect(page.getByLabel(/nome/i)).toBeVisible();
      await expect(page.getByLabel(/data/i)).toBeVisible();
      await expect(page.getByLabel(/hora de início/i)).toBeVisible();
      await expect(page.getByLabel(/programa público/i)).toBeVisible();
    });

    test('should have proper button roles', async ({ page }) => {
      await page.goto('/programs');
      
      // Check button accessibility
      await expect(page.getByRole('button', { name: /novo programa/i })).toBeVisible();
      
      // Create a program to test other buttons
      await page.getByRole('button', { name: /novo programa/i }).click();
      await page.getByLabel(/nome/i).fill('Accessibility Test');
      await page.getByLabel(/data/i).fill('2024-02-05');
      await page.getByLabel(/hora de início/i).fill('14:00');
      await page.getByRole('button', { name: /criar/i }).click();
      
      // Check program action buttons
      await expect(page.getByRole('button', { name: /ver/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /editar/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /excluir/i })).toBeVisible();
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/programs');
      
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: /novo programa/i })).toBeFocused();
      
      // Enter to activate
      await page.keyboard.press('Enter');
      await expect(page.getByText('Criar Novo Programa')).toBeVisible();
      
      // Tab through form fields
      await page.keyboard.press('Tab');
      await expect(page.getByLabel(/nome/i)).toBeFocused();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/programs', route => route.abort());
      
      await page.goto('/programs');
      
      // Should show error state
      await expect(page.getByText(/erro ao carregar programas/i)).toBeVisible();
    });

    test('should handle server errors gracefully', async ({ page }) => {
      // Mock server error
      await page.route('**/api/programs', route => 
        route.fulfill({ status: 500, body: 'Internal Server Error' })
      );
      
      await page.goto('/programs');
      
      // Should show error state
      await expect(page.getByText(/erro ao carregar programas/i)).toBeVisible();
    });
  });
});
