import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';
import { auth } from '@/lib/auth/config';

const f = createUploadthing();

export const ourFileRouter = {
  activityImage: f({
    // UploadThing FileSize is powers of two; 8MB is the smallest value that still accepts a 5MB image.
    image: { maxFileSize: '8MB', maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) {
        throw new UploadThingError('Unauthorized');
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl ?? file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
