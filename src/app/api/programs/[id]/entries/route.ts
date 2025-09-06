import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/server';
import { programs, programEntries } from '../../../../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: programId } = await params;
    const body = await request.json();
    const { 
      position, 
      start_time, 
      end_time, 
      entry_type, 
      activity_id, 
      custom_title, 
      custom_duration_minutes 
    } = body;

    // Validate required fields
    if (!position || !start_time || !end_time || !entry_type) {
      return NextResponse.json(
        { error: 'Position, start_time, end_time, and entry_type are required' },
        { status: 400 }
      );
    }

    // Check if program exists and belongs to user
    const [existingProgram] = await db
      .select()
      .from(programs)
      .where(and(
        eq(programs.id, programId),
        eq(programs.user_id, session.user.id)
      ));

    if (!existingProgram) {
      return NextResponse.json({ error: 'Program not found or access denied' }, { status: 404 });
    }

    // Insert new program entry
    const [newEntry] = await db
      .insert(programEntries)
      .values({
        program_id: programId,
        position,
        start_time,
        end_time,
        entry_type,
        activity_id: entry_type === 'activity' ? activity_id : null,
        custom_title: entry_type === 'custom' ? custom_title : null,
        custom_duration_minutes: entry_type === 'custom' ? custom_duration_minutes : null,
      })
      .returning();

    return NextResponse.json({ entry: newEntry }, { status: 201 });
  } catch (error) {
    console.error('Error creating program entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: programId } = await params;
    const body = await request.json();
    const { entries } = body;

    if (!Array.isArray(entries)) {
      return NextResponse.json(
        { error: 'Entries must be an array' },
        { status: 400 }
      );
    }

    // Check if program exists and belongs to user
    const [existingProgram] = await db
      .select()
      .from(programs)
      .where(and(
        eq(programs.id, programId),
        eq(programs.user_id, session.user.id)
      ));

    if (!existingProgram) {
      return NextResponse.json({ error: 'Program not found or access denied' }, { status: 404 });
    }

    // Delete existing entries
    await db
      .delete(programEntries)
      .where(eq(programEntries.program_id, programId));

    // Insert new entries
    if (entries.length > 0) {
      await db
        .insert(programEntries)
        .values(entries.map(entry => ({
          id: entry.id,
          program_id: programId,
          position: entry.position,
          start_time: entry.start_time,
          end_time: entry.end_time,
          entry_type: entry.entry_type,
          activity_id: entry.entry_type === 'activity' ? entry.activity_id : null,
          custom_title: entry.entry_type === 'custom' ? entry.custom_title : null,
          custom_duration_minutes: entry.entry_type === 'custom' ? entry.custom_duration_minutes : null,
        })));
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error updating program entries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
