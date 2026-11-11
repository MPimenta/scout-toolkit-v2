import { BlobServiceClient, type ContainerClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';

const CONTAINER = 'activity-images';

export class StorageNotConfiguredError extends Error {
  constructor() {
    super('Armazenamento de imagens não configurado.');
    this.name = 'StorageNotConfiguredError';
  }
}

let cached: ContainerClient | null = null;

/**
 * Azure: AZURE_STORAGE_ACCOUNT plus the managed identity of the Web App (no key or connection string).
 * Local: AZURE_STORAGE_CONNECTION_STRING pointing at Azurite.
 */
export function getImageContainer(): ContainerClient {
  if (cached) return cached;
  const connectionString = process.env['AZURE_STORAGE_CONNECTION_STRING'];
  const account = process.env['AZURE_STORAGE_ACCOUNT'];
  let service: BlobServiceClient;
  if (connectionString) {
    service = BlobServiceClient.fromConnectionString(connectionString);
  } else if (account) {
    service = new BlobServiceClient(`https://${account}.blob.core.windows.net`, new DefaultAzureCredential());
  } else {
    throw new StorageNotConfiguredError();
  }
  cached = service.getContainerClient(CONTAINER);
  return cached;
}

export function resetImageContainerForTests(): void {
  cached = null;
}

const uploadsByUser = new Map<string, number[]>();
export const UPLOAD_LIMIT = 20;
export const UPLOAD_WINDOW_MS = 60 * 60 * 1000;

/** Small in-memory per-user limit (per instance), enough to stop casual abuse. */
export function allowUpload(userId: string, now = Date.now()): boolean {
  const recent = (uploadsByUser.get(userId) ?? []).filter((t) => now - t < UPLOAD_WINDOW_MS);
  if (recent.length >= UPLOAD_LIMIT) {
    uploadsByUser.set(userId, recent);
    return false;
  }
  recent.push(now);
  uploadsByUser.set(userId, recent);
  return true;
}

export function resetUploadLimitForTests(): void {
  uploadsByUser.clear();
}
