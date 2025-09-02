import { test, expect } from '@playwright/test';

test.describe('Activities Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the activities page before each test
    await page.goto('/activities');
  });

  test('should display all filter sections correctly', async ({ page }) => {
    // Check that all basic filter sections are visible
    await expect(page.getByText('Filtros de Atividades')).toBeVisible();
    await expect(page.getByText('Tamanho do Grupo')).toBeVisible();
    await expect(page.getByText('Nível de Esforço')).toBeVisible();
    await expect(page.getByText('Localização')).toBeVisible();
    await expect(page.getByText('Faixa Etária')).toBeVisible();
    await expect(page.getByText('Tipo de Atividade')).toBeVisible();

    // Check that advanced filters are initially hidden
    await expect(page.getByText('Objetivos de Desenvolvimento Sustentável (ODS)')).not.toBeVisible();
    await expect(page.getByText('Objetivos Educativos')).not.toBeVisible();
    await expect(page.getByText('Duração (minutos)')).not.toBeVisible();
  });

  test('should expand advanced filters when expand button is clicked', async ({ page }) => {
    // Click the expand button
    const expandButton = page.getByRole('button', { name: /expandir/i });
    await expandButton.click();

    // Check that advanced filters are now visible
    await expect(page.getByText('Objetivos de Desenvolvimento Sustentável (ODS)')).toBeVisible();
    await expect(page.getByText('Objetivos Educativos')).toBeVisible();
    await expect(page.getByText('Duração (minutos)')).toBeVisible();
  });

  test('should handle search input correctly', async ({ page }) => {
    // Type in the search box
    const searchInput = page.getByPlaceholderText('Pesquisar atividades por nome, descrição ou materiais...');
    await searchInput.fill('jogo');

    // Wait for the search to be applied (debounced)
    await page.waitForTimeout(500);

    // Check that the search filter is applied
    await expect(page.getByText('Filtros Ativos')).toBeVisible();
    await expect(page.getByText('Pesquisa: jogo')).toBeVisible();
  });

  test('should handle group size filter selection', async ({ page }) => {
    // Select a group size
    const smallGroupCheckbox = page.getByLabelText('Pequeno (2-6)');
    await smallGroupCheckbox.check();

    // Check that the filter is applied
    await expect(page.getByText('Filtros Ativos')).toBeVisible();
    await expect(page.getByText('Grupo: Pequeno (2-6)')).toBeVisible();
  });

  test('should handle effort level filter selection', async ({ page }) => {
    // Select an effort level
    const mediumEffortCheckbox = page.getByLabelText('Médio');
    await mediumEffortCheckbox.check();

    // Check that the filter is applied
    await expect(page.getByText('Filtros Ativos')).toBeVisible();
    await expect(page.getByText('Esforço: Médio')).toBeVisible();
  });

  test('should handle location filter selection', async ({ page }) => {
    // Select a location
    const locationSelect = page.getByDisplayValue('Todas');
    await locationSelect.selectOption('outside');

    // Check that the filter is applied
    await expect(page.getByText('Filtros Ativos')).toBeVisible();
    await expect(page.getByText('Local: Exterior')).toBeVisible();
  });

  test('should handle age group filter selection', async ({ page }) => {
    // Select an age group
    const scoutsCheckbox = page.getByLabelText('Escoteiros (10-14)');
    await scoutsCheckbox.check();

    // Check that the filter is applied
    await expect(page.getByText('Filtros Ativos')).toBeVisible();
    await expect(page.getByText('Idade: Escoteiros (10-14)')).toBeVisible();
  });

  test('should handle activity type filter selection', async ({ page }) => {
    // Select an activity type
    const gameTypeCheckbox = page.getByLabelText('Jogo');
    await gameTypeCheckbox.check();

    // Check that the filter is applied
    await expect(page.getByText('Filtros Ativos')).toBeVisible();
    await expect(page.getByText('Tipo: Jogo')).toBeVisible();
  });

  test('should handle SDG filter selection', async ({ page }) => {
    // Expand advanced filters
    const expandButton = page.getByRole('button', { name: /expandir/i });
    await expandButton.click();

    // Select an SDG
    const sdg1Checkbox = page.getByLabelText(/ODS 1: Erradicar a Pobreza/);
    await sdg1Checkbox.check();

    // Check that the filter is applied
    await expect(page.getByText('Filtros Ativos')).toBeVisible();
    await expect(page.getByText('ODS 1: Erradicar a Pobreza')).toBeVisible();
  });

  test('should handle educational goals filter selection', async ({ page }) => {
    // Expand advanced filters
    const expandButton = page.getByRole('button', { name: /expandir/i });
    await expandButton.click();

    // Select an educational goal
    const teamworkCheckbox = page.getByLabelText(/SE1: Trabalho em Equipa/);
    await teamworkCheckbox.check();

    // Check that the filter is applied
    await expect(page.getByText('Filtros Ativos')).toBeVisible();
    await expect(page.getByText('Trabalho em Equipa')).toBeVisible();
  });

  test('should handle duration filter changes', async ({ page }) => {
    // Expand advanced filters
    const expandButton = page.getByRole('button', { name: /expandir/i });
    await expandButton.click();

    // Change duration values
    const durationMinInput = page.getByPlaceholderText('30');
    const durationMaxInput = page.getByPlaceholderText('120');
    
    await durationMinInput.fill('45');
    await durationMaxInput.fill('90');

    // Check that the filter is applied
    await expect(page.getByText('Filtros Ativos')).toBeVisible();
    await expect(page.getByText('Duração: 45 - 90 min')).toBeVisible();
  });

  test('should handle multiple filter selections', async ({ page }) => {
    // Select multiple filters
    const smallGroupCheckbox = page.getByLabelText('Pequeno (2-6)');
    const mediumEffortCheckbox = page.getByLabelText('Médio');
    const insideLocationSelect = page.getByDisplayValue('Todas');
    const scoutsCheckbox = page.getByLabelText('Escoteiros (10-14)');

    await smallGroupCheckbox.check();
    await mediumEffortCheckbox.check();
    await insideLocationSelect.selectOption('inside');
    await scoutsCheckbox.check();

    // Check that all filters are applied
    await expect(page.getByText('Filtros Ativos')).toBeVisible();
    await expect(page.getByText('Grupo: Pequeno (2-6)')).toBeVisible();
    await expect(page.getByText('Esforço: Médio')).toBeVisible();
    await expect(page.getByText('Local: Interior')).toBeVisible();
    await expect(page.getByText('Idade: Escoteiros (10-14)')).toBeVisible();
  });

  test('should clear individual filters when X button is clicked', async ({ page }) => {
    // Apply a filter first
    const smallGroupCheckbox = page.getByLabelText('Pequeno (2-6)');
    await smallGroupCheckbox.check();

    // Check that the filter is applied
    await expect(page.getByText('Grupo: Pequeno (2-6)')).toBeVisible();

    // Click the X button to remove the filter
    const filterBadge = page.getByText('Grupo: Pequeno (2-6)');
    const xButton = filterBadge.locator('button').first();
    await xButton.click();

    // Check that the filter is removed
    await expect(page.getByText('Grupo: Pequeno (2-6)')).not.toBeVisible();
  });

  test('should clear all filters when clear all button is clicked', async ({ page }) => {
    // Apply multiple filters
    const smallGroupCheckbox = page.getByLabelText('Pequeno (2-6)');
    const mediumEffortCheckbox = page.getByLabelText('Médio');
    
    await smallGroupCheckbox.check();
    await mediumEffortCheckbox.check();

    // Check that filters are applied
    await expect(page.getByText('Filtros Ativos')).toBeVisible();
    await expect(page.getByText('Grupo: Pequeno (2-6)')).toBeVisible();
    await expect(page.getByText('Esforço: Médio')).toBeVisible();

    // Click clear all button
    const clearAllButton = page.getByText('Limpar Todos');
    await clearAllButton.click();

    // Check that all filters are cleared
    await expect(page.getByText('Filtros Ativos')).not.toBeVisible();
    await expect(page.getByText('Grupo: Pequeno (2-6)')).not.toBeVisible();
    await expect(page.getByText('Esforço: Médio')).not.toBeVisible();
  });

  test('should display correct Portuguese text for all filter options', async ({ page }) => {
    // Check Portuguese labels are displayed correctly
    await expect(page.getByText('Lobitos (6-10)')).toBeVisible();
    await expect(page.getByText('Escoteiros (10-14)')).toBeVisible();
    await expect(page.getByText('Exploradores (14-17)')).toBeVisible();
    await expect(page.getByText('Caminheiros (17-21)')).toBeVisible();
    await expect(page.getByText('Dirigentes (21+)')).toBeVisible();
    await expect(page.getByText('Jogo')).toBeVisible();
    await expect(page.getByText('Atividade Manual')).toBeVisible();
    await expect(page.getByText('Exploração')).toBeVisible();
    await expect(page.getByText('Serviço')).toBeVisible();
  });

  test('should handle filter combinations and show results count', async ({ page }) => {
    // Apply a combination of filters
    const smallGroupCheckbox = page.getByLabelText('Pequeno (2-6)');
    const lowEffortCheckbox = page.getByLabelText('Baixo');
    const insideLocationSelect = page.getByDisplayValue('Todas');
    
    await smallGroupCheckbox.check();
    await lowEffortCheckbox.check();
    await insideLocationSelect.selectOption('inside');

    // Wait for results to update
    await page.waitForTimeout(500);

    // Check that results count is displayed
    const resultsText = page.getByText(/atividades encontradas/i);
    await expect(resultsText).toBeVisible();
  });

  test('should maintain filter state when navigating back', async ({ page }) => {
    // Apply some filters
    const smallGroupCheckbox = page.getByLabelText('Pequeno (2-6)');
    await smallGroupCheckbox.check();

    // Navigate to another page
    await page.goto('/about');

    // Navigate back to activities
    await page.goto('/activities');

    // Check that the filter is still applied
    await expect(page.getByText('Filtros Ativos')).toBeVisible();
    await expect(page.getByText('Grupo: Pequeno (2-6)')).toBeVisible();
  });

  test('should handle filter expansion and collapse correctly', async ({ page }) => {
    // Initially, advanced filters should be hidden
    await expect(page.getByText('Objetivos de Desenvolvimento Sustentável (ODS)')).not.toBeVisible();

    // Click expand button
    const expandButton = page.getByRole('button', { name: /expandir/i });
    await expandButton.click();

    // Advanced filters should now be visible
    await expect(page.getByText('Objetivos de Desenvolvimento Sustentável (ODS)')).toBeVisible();

    // Click collapse button
    const collapseButton = page.getByRole('button', { name: /colapsar/i });
    await collapseButton.click();

    // Advanced filters should be hidden again
    await expect(page.getByText('Objetivos de Desenvolvimento Sustentável (ODS)')).not.toBeVisible();
  });

  test('should display active filters in a visually appealing way', async ({ page }) => {
    // Apply multiple filters
    const smallGroupCheckbox = page.getByLabelText('Pequeno (2-6)');
    const mediumEffortCheckbox = page.getByLabelText('Médio');
    const gameTypeCheckbox = page.getByLabelText('Jogo');
    
    await smallGroupCheckbox.check();
    await mediumEffortCheckbox.check();
    await gameTypeCheckbox.check();

    // Check that active filters section has proper styling
    const activeFiltersSection = page.getByText('Filtros Ativos').locator('..').first();
    await expect(activeFiltersSection).toHaveClass(/border-primary/);
    await expect(activeFiltersSection).toHaveClass(/bg-primary/);
  });

  test('should handle edge cases gracefully', async ({ page }) => {
    // Test with very long search terms
    const searchInput = page.getByPlaceholderText('Pesquisar atividades por nome, descrição ou materiais...');
    const longSearchTerm = 'a'.repeat(1000);
    await searchInput.fill(longSearchTerm);

    // Wait for the search to be applied
    await page.waitForTimeout(500);

    // Should not crash and should show the long search term in active filters
    await expect(page.getByText(`Pesquisa: ${longSearchTerm}`)).toBeVisible();
  });
});
