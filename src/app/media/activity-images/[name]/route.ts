import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'node:stream';
import { STORED_IMAGE_NAME } from '@/lib/storage/image-type';
import { getImageContainer, StorageNotConfiguredError } from '@/lib/storage/images';

export const runtime = 'nodejs';

function notFound(): NextResponse {
  return new NextResponse('Não encontrado', { status: 404 });
}

export async function GET(_request: NextRequest, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  if (!STORED_IMAGE_NAME.test(name)) return notFound();

  let container;
  try {
    container = getImageContainer();
  } catch (error) {
    if (error instanceof StorageNotConfiguredError) return notFound();
    throw error;
  }

  try {
    const download = await container.getBlobClient(name).download();
    if (!download.readableStreamBody) return notFound();
    const body = Readable.toWeb(download.readableStreamBody as Readable) as unknown as ReadableStream;
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': download.contentType ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        ...(download.contentLength ? { 'Content-Length': String(download.contentLength) } : {}),
      },
    });
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 404) return notFound();
    throw error;
  }
}
