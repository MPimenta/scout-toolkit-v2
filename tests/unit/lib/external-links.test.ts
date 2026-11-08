import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * In the installed app, a link that leaves the app must open in the system browser and must not
 * hand the new page a reference to this one (openspec: mobile-pwa, task 4.3). Every link that opens
 * a new window carries rel="noopener noreferrer", and no literal other-origin link opens in the
 * same window.
 */
const SRC = join(process.cwd(), 'src');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx$/.test(name) ? [full] : [];
  });
}

/** Every opening anchor tag, however many lines it spans. */
function anchors(source: string): string[] {
  return source.match(/<a\b[^>]*>/g) ?? [];
}

describe('external links', () => {
  const found = sourceFiles(SRC).flatMap((file) =>
    anchors(readFileSync(file, 'utf8')).map((tag) => ({ file: relative(process.cwd(), file), tag }))
  );
  const describeTag = (a: { file: string; tag: string }) => `${a.file}: ${a.tag.replace(/\s+/g, ' ')}`;

  it('finds the links this test is about', () => {
    expect(found.length).toBeGreaterThan(5);
    expect(found.some((a) => a.tag.includes('target="_blank"'))).toBe(true);
  });

  it('opens every new-window link with rel="noopener noreferrer"', () => {
    const bad = found.filter((a) => a.tag.includes('target="_blank"') && !a.tag.includes('rel="noopener noreferrer"'));
    expect(bad.map(describeTag)).toEqual([]);
  });

  it('opens every literal other-origin link in a new window', () => {
    const bad = found.filter((a) => /href="https?:\/\//.test(a.tag) && !a.tag.includes('target="_blank"'));
    expect(bad.map(describeTag)).toEqual([]);
  });
});
