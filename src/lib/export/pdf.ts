import { chromium } from 'playwright';
import { generateProgramPDFHTML } from './pdf-html';
import type { ProgramForExport } from './types';

/**
 * Launches Chromium for PDF rendering. Uses Playwright's bundled browser,
 * then falls back to an installed Chrome or Edge if browsers were not downloaded.
 */
async function launchPdfBrowser() {
  try {
    return await chromium.launch();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("Executable doesn't exist")) {
      throw error;
    }

    for (const channel of ['chrome', 'msedge'] as const) {
      try {
        return await chromium.launch({ channel });
      } catch {
        // try next channel
      }
    }

    throw error;
  }
}

/**
 * The program PDF, rendered once for both the download and the Orgo attachment.
 * The caller must have checked access to the program first.
 */
export async function renderProgramPdf(program: ProgramForExport): Promise<Buffer> {
  const browser = await launchPdfBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(generateProgramPDFHTML(program), { waitUntil: 'networkidle' });
    return await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });
  } finally {
    await browser.close();
  }
}
