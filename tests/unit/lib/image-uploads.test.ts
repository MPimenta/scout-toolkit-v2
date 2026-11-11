// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { detectImageType, STORED_IMAGE_NAME } from '@/lib/storage/image-type';

const session: { user: { id: string } | null } = { user: { id: 'user-1' } };
vi.mock('@/lib/auth/config', () => ({ auth: async () => session.user && { user: session.user } }));

const uploadData = vi.fn(async () => undefined);
const download = vi.fn();
const container = {
  createIfNotExists: vi.fn(async () => undefined),
  getBlockBlobClient: vi.fn(() => ({ uploadData })),
  getBlobClient: vi.fn(() => ({ download })),
};
let storageConfigured = true;
vi.mock('@/lib/storage/images', async () => {
  const actual = await vi.importActual<typeof import('@/lib/storage/images')>('@/lib/storage/images');
  return {
    ...actual,
    getImageContainer: () => {
      if (!storageConfigured) throw new actual.StorageNotConfiguredError();
      return container;
    },
  };
});

import { POST } from '@/app/api/uploads/activity-image/route';
import { GET } from '@/app/media/activity-images/[name]/route';
import { resetUploadLimitForTests } from '@/lib/storage/images';

const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0];
const WEBP = [0x52, 0x49, 0x46, 0x46, 1, 0, 0, 0, 0x57, 0x45, 0x42, 0x50];
const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31];

function uploadRequest(files: Array<{ bytes: number[]; name: string }>) {
  const body = new FormData();
  for (const file of files) body.append('file', new File([new Uint8Array(file.bytes)], file.name));
  return new NextRequest('http://localhost/api/uploads/activity-image', { method: 'POST', body });
}

beforeEach(() => {
  session.user = { id: 'user-1' };
  storageConfigured = true;
  uploadData.mockClear();
  resetUploadLimitForTests();
});

describe('detectImageType', () => {
  it('recognises JPEG, PNG and WebP by content', () => {
    expect(detectImageType(new Uint8Array(JPEG))).toBe('jpeg');
    expect(detectImageType(new Uint8Array(PNG))).toBe('png');
    expect(detectImageType(new Uint8Array(WEBP))).toBe('webp');
  });

  it('rejects other content, truncated and empty files', () => {
    expect(detectImageType(new Uint8Array(PDF))).toBeNull();
    expect(detectImageType(new Uint8Array([0xff, 0xd8]))).toBeNull();
    expect(detectImageType(new Uint8Array(WEBP.slice(0, 10)))).toBeNull();
    expect(detectImageType(new Uint8Array([]))).toBeNull();
  });
});

describe('POST /api/uploads/activity-image', () => {
  it('refuses guests and stores nothing', async () => {
    session.user = null;
    const response = await POST(uploadRequest([{ bytes: PNG, name: 'a.png' }]));
    expect(response.status).toBe(401);
    expect(uploadData).not.toHaveBeenCalled();
  });

  it('rejects a PDF renamed to png', async () => {
    const response = await POST(uploadRequest([{ bytes: PDF, name: 'foto.png' }]));
    expect(response.status).toBe(400);
    expect(uploadData).not.toHaveBeenCalled();
  });

  it('rejects images over 5 MB', async () => {
    const big = [...PNG, ...new Array(5 * 1024 * 1024).fill(0)];
    const response = await POST(uploadRequest([{ bytes: big, name: 'big.png' }]));
    expect(response.status).toBe(413);
    expect(uploadData).not.toHaveBeenCalled();
  });

  it('rejects several files', async () => {
    const response = await POST(
      uploadRequest([
        { bytes: PNG, name: 'a.png' },
        { bytes: JPEG, name: 'b.jpg' },
      ])
    );
    expect(response.status).toBe(400);
    expect(uploadData).not.toHaveBeenCalled();
  });

  it('stores under a server-generated name, ignoring a hostile file name', async () => {
    const response = await POST(uploadRequest([{ bytes: PNG, name: '../../x.jpg' }]));
    expect(response.status).toBe(201);
    const { url } = (await response.json()) as { url: string };
    expect(url.startsWith('/media/activity-images/')).toBe(true);
    const stored = url.replace('/media/activity-images/', '');
    expect(STORED_IMAGE_NAME.test(stored)).toBe(true);
    expect(stored.endsWith('.png')).toBe(true);
    expect(uploadData).toHaveBeenCalledWith(expect.anything(), {
      blobHTTPHeaders: { blobContentType: 'image/png' },
    });
  });

  it('answers 503 with a Portuguese message when storage is not configured', async () => {
    storageConfigured = false;
    const response = await POST(uploadRequest([{ bytes: PNG, name: 'a.png' }]));
    expect(response.status).toBe(503);
    const body = (await response.json()) as { error: { message: string } };
    expect(body.error.message).toMatch(/imagens/);
  });
});

describe('GET /media/activity-images/[name]', () => {
  const ctx = (name: string) => ({ params: Promise.resolve({ name }) });
  const req = new NextRequest('http://localhost/media/activity-images/x');
  const goodName = '0b9f3e6e-7c1a-4f0e-9a52-1f2d3c4b5a69.png';

  it('answers 404 for malformed names without touching storage', async () => {
    for (const name of ['..', '../secret.png', 'a.png', `${goodName}/x`, 'x.svg']) {
      const response = await GET(req, ctx(name));
      expect(response.status).toBe(404);
    }
    expect(download).not.toHaveBeenCalled();
  });

  it('answers 404 for an unknown image', async () => {
    download.mockRejectedValueOnce({ statusCode: 404 });
    const response = await GET(req, ctx(goodName));
    expect(response.status).toBe(404);
  });

  it('streams the image with content type and cache headers', async () => {
    const { Readable } = await import('node:stream');
    download.mockResolvedValueOnce({
      readableStreamBody: Readable.from([Buffer.from(PNG)]),
      contentType: 'image/png',
      contentLength: PNG.length,
    });
    const response = await GET(req, ctx(goodName));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    expect(response.headers.get('cache-control')).toContain('immutable');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });
});
