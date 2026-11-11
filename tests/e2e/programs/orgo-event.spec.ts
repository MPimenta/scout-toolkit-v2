import { expect, test } from '@playwright/test';
import { signInE2E, signOutE2E } from '../helpers/session';

test.describe('Create Orgo event dialog', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Orgo dialog E2E runs on desktop Chromium only');
  });

  test('owner opens the dialog and sees end and unit, not timezone or tickets', async ({ page }) => {
    const login = await signInE2E(page.request, { name: 'Chefe Orgo' });
    if (login.status() === 404) {
      test.skip(true, 'E2E session helper is disabled (production)');
    }
    expect(login.ok()).toBeTruthy();

    const created = await page.request.post('/api/programs', {
      data: { name: `E2E Orgo ${Date.now()}`, date: '2026-07-12', start_time: '09:00', is_public: false },
    });
    expect(created.status()).toBe(201);
    const body = (await created.json()) as { program: { id: string } };

    try {
      await page.goto(`/programs/${body.program.id}`);
      await page.getByRole('button', { name: 'Criar evento no eAEP' }).click();
      await expect(page.getByRole('heading', { name: 'Criar evento no eAEP' })).toBeVisible();
      await expect(page.getByLabel('Fim')).toBeVisible();
      await expect(page.getByLabel('Unidade Orgo')).toBeVisible();
      await expect(page.getByLabel('Local')).toBeVisible();
      await expect(page.getByText(/timezone|preço|bilhete|ticket/i)).toHaveCount(0);
      await expect(page).toHaveURL(new RegExp(`/programs/${body.program.id}`));
    } finally {
      await page.request.delete(`/api/programs/${body.program.id}`).catch(() => undefined);
      await signOutE2E(page.request);
    }
  });

  test('creating the event shows a success view with a link, and the page then links to it', async ({ page }) => {
    expect((await signInE2E(page.request, { name: 'Chefe Sucesso' })).ok()).toBeTruthy();
    const created = await page.request.post('/api/programs', {
      data: { name: `E2E Orgo OK ${Date.now()}`, date: '2026-07-12', start_time: '09:00', is_public: false },
    });
    const programId = ((await created.json()) as { program: { id: string } }).program.id;

    try {
      await page.goto(`/programs/${programId}`);
      await page.getByRole('button', { name: 'Criar evento no eAEP' }).click();
      // Dates read in pt-PT whatever the browser language (12/07/2026 is a Sunday).
      await expect(page.getByText(/domingo, 12\/07\/2026/).first()).toBeVisible();

      await page.getByLabel('Unidade Orgo').click();
      await page.getByRole('option').first().click();
      await page.getByRole('button', { name: 'Criar no eAEP' }).click();

      await expect(page.getByRole('heading', { name: 'Evento criado no eAEP' })).toBeVisible();
      const link = page.getByRole('link', { name: 'Abrir evento no eAEP' });
      // The event page in eAEP is /event/<uuid>; the attendance page is /events/attend/<uuid>.
      await expect(link).toHaveAttribute('href', new RegExp(`/event/e2e-${programId}$`));
      await expect(page.getByRole('link', { name: 'Presenças no eAEP' }).first()).toHaveAttribute(
        'href',
        new RegExp(`/events/attend/e2e-${programId}$`)
      );

      await page.getByRole('button', { name: 'Fechar' }).first().click();
      await expect(page.getByRole('link', { name: 'Ver evento no eAEP' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Presenças no eAEP' })).toBeVisible();
    } finally {
      await page.request.delete(`/api/programs/${programId}`).catch(() => undefined);
      await signOutE2E(page.request);
    }
  });

  test('publishing first lets the owner invite members, and nobody is invited by default', async ({ page }) => {
    expect((await signInE2E(page.request, { name: 'Chefe Convites' })).ok()).toBeTruthy();
    const created = await page.request.post('/api/programs', {
      data: { name: `E2E Orgo convites ${Date.now()}`, date: '2026-07-12', start_time: '09:00', is_public: false },
    });
    const programId = ((await created.json()) as { program: { id: string } }).program.id;

    try {
      await page.goto(`/programs/${programId}`);
      await page.getByRole('button', { name: 'Criar evento no eAEP' }).click();
      await page.getByLabel('Unidade Orgo').click();
      await page.getByRole('option').first().click();

      // Participants need a published event: the tab says so until publishing is on.
      await page.getByRole('tab', { name: /Participantes/ }).click();
      await expect(page.getByText(/Só é possível convidar participantes num evento publicado/)).toBeVisible();

      await page.getByRole('tab', { name: 'Evento' }).click();
      await page.getByRole('switch', { name: 'Publicar agora' }).click();
      await expect(page.getByText(/são notificados/)).toBeVisible();

      await page.getByRole('tab', { name: /Participantes/ }).click();
      await expect(page.getByText(/A convidar: 0 de/)).toBeVisible();
      await page.getByLabel('Convidar Ana Exemplo').check();
      await expect(page.getByText(/A convidar: 1 de/)).toBeVisible();

      await page.getByRole('button', { name: 'Criar no eAEP' }).click();
      await expect(page.getByRole('heading', { name: 'Evento criado no eAEP' })).toBeVisible();
      await expect(page.getByText('Convites: 1 de 1 adicionados')).toBeVisible();
      await expect(page.getByText(/Ana Exemplo/)).toHaveCount(0);
    } finally {
      await page.request.delete(`/api/programs/${programId}`).catch(() => undefined);
      await signOutE2E(page.request);
    }
  });

  test('guest does not see the create control', async ({ page }) => {
    await page.goto('/programs');
    await expect(page.getByRole('button', { name: 'Criar evento no eAEP' })).toHaveCount(0);
  });
});
