import { test, expect } from '@playwright/test';
import { expandActivityFilters } from '../helpers/session';

test.describe('Activities filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/activities');
    await expect(page.getByRole('heading', { name: 'Atividades' })).toBeVisible();
  });

  test('shows search before advanced filters are expanded', async ({ page }) => {
    await expect(page.getByRole('searchbox', { name: 'Pesquisar atividades...' })).toBeVisible();
    await expect(
      page.getByPlaceholder('Pesquisar atividades por nome, descrição ou materiais...')
    ).toBeVisible();
    await expect(page.getByText('Tamanho do Grupo')).toHaveCount(0);
  });

  test('expands and applies search plus group size', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Advanced filters are in a sheet on mobile');

    await page
      .getByPlaceholder('Pesquisar atividades por nome, descrição ou materiais...')
      .fill('jogo');
    await expect(page.getByText('Pesquisa: jogo')).toBeVisible();

    await expandActivityFilters(page);
    await expect(page.getByText('Tamanho do Grupo')).toBeVisible();
    await expect(page.getByText('Nível de Esforço')).toBeVisible();
    await expect(page.getByText('Localização')).toBeVisible();
    await expect(page.getByText('Faixa Etária')).toBeVisible();
    await expect(page.getByText('Objetivos de Desenvolvimento Sustentável (ODS)')).toBeVisible();
    await expect(page.getByText('Duração (minutos)')).toBeVisible();

    await page.getByRole('checkbox', { name: 'Pequeno (2-6)' }).check();
    await expect(page.getByRole('button', { name: 'Remover filtro: Pequeno (2-6)' })).toBeVisible();
  });

  test('clears filters', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Advanced filters are in a sheet on mobile');

    await expandActivityFilters(page);
    await page.getByRole('checkbox', { name: 'Pequeno (2-6)' }).check();
    await page.getByRole('checkbox', { name: 'Baixo' }).check();
    await expect(page.getByRole('button', { name: 'Remover filtro: Pequeno (2-6)' })).toBeVisible();

    await page.getByRole('button', { name: 'Limpar Todos' }).click();
    await expect(page.getByText('Pesquisa:')).toHaveCount(0);
    await expect(page.getByRole('checkbox', { name: 'Pequeno (2-6)' })).not.toBeChecked();
  });

  test('filters Portuguese age and effort labels', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Advanced filters are in a sheet on mobile');

    await expandActivityFilters(page);
    await expect(page.getByRole('button', { name: 'Lobitos (6-10)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Escoteiros (10-14)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Exploradores (14-17)' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Baixo' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Alto' })).toBeVisible();
  });
});

test.describe('Catalogue filter refresh', () => {
  test('division toggles, duration range and objective tree', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Advanced filters are in a sheet on mobile');
    await page.goto('/activities');
    await expandActivityFilters(page);

    const scouts = page.getByRole('button', { name: 'Escoteiros (10-14)', exact: true });
    await expect(scouts).toHaveAttribute('aria-pressed', 'false');
    await scouts.click();
    await expect(scouts).toHaveAttribute('aria-pressed', 'true');

    await page.getByLabel('Mínimo (minutos)').fill('15');
    await page.getByLabel('Máximo (minutos)').fill('45');
    await expect(page.getByTestId('duration-readout')).toHaveText('15–45 min');
    await page.getByLabel('Mínimo (minutos)').fill('60');
    await expect(page.getByText('O mínimo não pode ser superior ao máximo.')).toBeVisible();

    await expect(page.getByTestId('objective-tree')).toBeVisible();
  });
});
