import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors';
import { listFocusesWithCounts } from '@/lib/activities/format-focus';

/** Public list of the activity focuses, with the number of approved activities that use each one (main or secondary). */
export async function GET() {
  try {
    return NextResponse.json({ activity_focuses: await listFocusesWithCounts() });
  } catch (error) {
    return handleApiError(error, 'Error fetching activity focuses:');
  }
}
