import { NextResponse } from 'next/server';
import { db } from '@/lib/db/server';
import { sdgs } from '../../../../../drizzle/schema';
import { handleApiError } from '@/lib/errors';

export async function GET() {
  try {
    const sdgData = await db
      .select({
        id: sdgs.id,
        number: sdgs.number,
        name: sdgs.name,
        description: sdgs.description,
        icon_url: sdgs.icon_url,
      })
      .from(sdgs)
      .orderBy(sdgs.number);

    return NextResponse.json({ sdgs: sdgData });
  } catch (error) {
    return handleApiError(error, 'Error fetching SDGs:');
  }
}
