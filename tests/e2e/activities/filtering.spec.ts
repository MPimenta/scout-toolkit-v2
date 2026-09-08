import { test, expect } from '@playwright/test';
import { expandActivityFilters } from '../helpers/session';

test.describe('Activities filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/activities');
    await expect(page.getByRole('heading', { name: 'Atividades' })).toBeVisible();
  });

  test('shows search before advanced filters are expanded', async ({ page }) => {
    await expect(page.getByText('Filtros de Atividades')).toBeVisible();
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
    await expect(page.getByText('Desafios')).toBeVisible();
    await expect(page.getByText('Duração (minutos)')).toBeVisible();

    await page.getByRole('checkbox', { name: 'Pequeno (2-6)' }).check();
    await expect(page.getByText('Grupo: Pequeno (2-6)')).toBeVisible();
  });

  test('clears filters', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Advanced filters are in a sheet on mobile');

    await expandActivityFilters(page);
    await page.getByRole('checkbox', { name: 'Pequeno (2-6)' }).check();
    await page.getByRole('checkbox', { name: 'Baixo' }).check();
    await expect(page.getByText('Grupo: Pequeno (2-6)')).toBeVisible();

    await page.getByRole('button', { name: 'Limpar Filtros' }).click();
    await expect(page.getByText('Pesquisa:')).toHaveCount(0);
    await expect(page.getByRole('checkbox', { name: 'Pequeno (2-6)' })).not.toBeChecked();
  });

  test('filters Portuguese age and effort labels', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Advanced filters are in a sheet on mobile');

    await expandActivityFilters(page);
    await expect(page.getByRole('checkbox', { name: 'Lobitos (6-10)' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Escoteiros (10-14)' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Exploradores (14-17)' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Baixo' })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Alto' })).toBeVisible();
  });
});
