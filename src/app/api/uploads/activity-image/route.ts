import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { apiErrors, withApiErrorHandler } from '@/lib/errors';
import { detectImageType, IMAGE_MAX_BYTES, IMAGE_TYPES, MEDIA_PATH_PREFIX } from '@/lib/storage/image-type';
import { allowUpload, getImageContainer, StorageNotConfiguredError } from '@/lib/storage/images';

export const runtime = 'nodejs';

function tooLarge(): NextResponse {
  return NextResponse.json(
    { error: { code: 'PAYLOAD_TOO_LARGE', message: 'A imagem é demasiado grande (máximo 5 MB).' } },
    { status: 413 }
  );
}

export const POST = withApiErrorHandler(async (request: NextRequest) => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return apiErrors.unauthorized('Inicia sessão para carregar imagens.');
  }

  // Cheap early refusal; the real size is checked on the file below.
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > IMAGE_MAX_BYTES + 64 * 1024) return tooLarge();

  if (!allowUpload(userId)) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMIT', message: 'Demasiados carregamentos. Tenta mais tarde.' } },
      { status: 429 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiErrors.validation('file', 'Pedido inválido.');
  }

  const files = form.getAll('file').filter((value): value is File => typeof value !== 'string');
  if (files.length !== 1) {
    return apiErrors.validation('file', 'Envia uma única imagem.');
  }
  const file = files[0]!;
  if (file.size > IMAGE_MAX_BYTES) return tooLarge();

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) {
    return apiErrors.validation('file', 'Formato não suportado. Usa JPEG, PNG ou WebP.');
  }

  let container;
  try {
    container = getImageContainer();
  } catch (error) {
    if (error instanceof StorageNotConfiguredError) {
      return apiErrors.unavailable('O carregamento de imagens não está disponível neste momento.');
    }
    throw error;
  }

  // Azurite starts empty; in Azure the container is created by the infrastructure.
  if (process.env['AZURE_STORAGE_CONNECTION_STRING']) await container.createIfNotExists();

  const { extension, contentType } = IMAGE_TYPES[type];
  const name = `${randomUUID()}.${extension}`;
  await container.getBlockBlobClient(name).uploadData(bytes, {
    blobHTTPHeaders: { blobContentType: contentType },
  });

  return NextResponse.json({ url: `${MEDIA_PATH_PREFIX}${name}` }, { status: 201 });
});
