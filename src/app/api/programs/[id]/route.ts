import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/server';
import { programs, programEntries, activities, user, activityTypes } from '../../../../../drizzle/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(
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

    // Fetch program with user info - only show programs owned by the authenticated user
    const [programData] = await db
      .select({
        id: programs.id,
        name: programs.name,
        date: programs.date,
        start_time: programs.start_time,
        is_public: programs.is_public,
        created_at: programs.created_at,
        updated_at: programs.updated_at,
        user: {
          id: user.id,
          name: user.name
        }
      })
      .from(programs)
      .leftJoin(user, eq(programs.user_id, user.id))
      .where(and(eq(programs.id, programId), eq(programs.user_id, session.user.id)));

    if (!programData) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Fetch program entries with activity details
    const entries = await db
      .select({
        id: programEntries.id,
        position: programEntries.position,
        start_time: programEntries.start_time,
        end_time: programEntries.end_time,
        entry_type: programEntries.entry_type,
        custom_title: programEntries.custom_title,
        custom_duration_minutes: programEntries.custom_duration_minutes,
        activity_id: activities.id,
        activity_name: activities.name,
        activity_duration: activities.approximate_duration_minutes,
        activity_group_size: activities.group_size,
        activity_effort_level: activities.effort_level,
        activity_location: activities.location,
        activity_type_name: activityTypes.name
      })
      .from(programEntries)
      .leftJoin(activities, eq(programEntries.activity_id, activities.id))
      .leftJoin(activityTypes, eq(activities.activity_type_id, activityTypes.id))
      .where(eq(programEntries.program_id, programId))
      .orderBy(asc(programEntries.position));

    // Transform the flat structure to the nested structure expected by the interface
    const transformedEntries = entries.map(entry => ({
      id: entry.id,
      position: entry.position,
      start_time: entry.start_time,
      end_time: entry.end_time,
      entry_type: entry.entry_type,
      custom_title: entry.custom_title,
      custom_duration_minutes: entry.custom_duration_minutes,
      activity: entry.activity_id ? {
        id: entry.activity_id,
        name: entry.activity_name || '',
        approximate_duration_minutes: entry.activity_duration || 0,
        group_size: entry.activity_group_size || '',
        effort_level: entry.activity_effort_level || '',
        location: entry.activity_location || '',
        activity_type: {
          name: entry.activity_type_name || ''
        }
      } : null
    }));

    // Calculate summary statistics
    const totalDuration = transformedEntries.reduce((total, entry) => {
      if (entry.entry_type === 'activity' && entry.activity) {
        return total + (entry.activity.approximate_duration_minutes || 0);
      } else if (entry.entry_type === 'custom') {
        return total + (entry.custom_duration_minutes || 0);
      }
      return total;
    }, 0);

    // For now, we'll skip the complex educational goals and SDGs queries
    // and focus on the core functionality. This can be enhanced later.
    const educationalGoalsData: Array<{
      id: string;
      title: string;
      code: string;
    }> = [];
    const sdgsData: Array<{
      id: string;
      number: number;
      name: string;
      icon_url: string;
    }> = [];

    return NextResponse.json({
      program: {
        ...programData,
        entries: transformedEntries,
        summary: {
          total_duration_minutes: totalDuration,
          entry_count: transformedEntries.length,
          educational_goals: educationalGoalsData,
          sdgs: sdgsData
        }
      }
    });

  } catch (error) {
    console.error('Error fetching program:', error);
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
    const { name, date, start_time, is_public } = body;

    // Validate required fields
    if (!name || !start_time) {
      return NextResponse.json(
        { error: 'Name and start time are required' },
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
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Update program
    const [updatedProgram] = await db
      .update(programs)
      .set({
        name,
        date: date || null,
        start_time,
        is_public,
        updated_at: new Date()
      })
      .where(eq(programs.id, programId))
      .returning();

    return NextResponse.json({
      success: true,
      program: updatedProgram
    });

  } catch (error) {
    console.error('Error updating program:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check if program exists and belongs to user
    const [existingProgram] = await db
      .select()
      .from(programs)
      .where(and(
        eq(programs.id, programId),
        eq(programs.user_id, session.user.id)
      ));

    if (!existingProgram) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Delete program (cascades to entries due to foreign key constraint)
    await db
      .delete(programs)
      .where(eq(programs.id, programId));

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Error deleting program:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
