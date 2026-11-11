import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { listFormatsWithCounts } from '@/lib/activities/format-focus';

/** Public list of the activity formats, with the number of approved activities that use each one. */
export async function GET() {
  try {
    return NextResponse.json({ activity_formats: await listFormatsWithCounts() });
  } catch (error) {
    return handleApiError(error, 'Error fetching activity formats:');
  }
}
