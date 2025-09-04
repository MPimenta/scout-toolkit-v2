import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/server';
import { programs, programEntries, activities, users } from '../../../../drizzle/schema';
import { eq, and, desc, asc, sql, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') as 'name' | 'date' | 'created_at' | undefined;
    const order = searchParams.get('order') as 'asc' | 'desc' | undefined;

    // Build order by clause
    let orderByClause;
    if (sort === 'date') {
      orderByClause = order === 'desc' ? desc(programs.date) : asc(programs.date);
    } else if (sort === 'created_at') {
      orderByClause = order === 'desc' ? desc(programs.created_at) : asc(programs.created_at);
    } else {
      // Default: sort by name
      orderByClause = order === 'desc' ? desc(programs.name) : asc(programs.name);
    }

    // Get total count for pagination
    const totalCount = await db
      .select({ count: count() })
      .from(programs)
      .where(eq(programs.user_id, session.user.id));

    const total = totalCount[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Fetch programs with entry count and total duration
    const programsData = await db
      .select({
        id: programs.id,
        name: programs.name,
        date: programs.date,
        start_time: programs.start_time,
        is_public: programs.is_public,
        created_at: programs.created_at,
        updated_at: programs.updated_at,
        entry_count: sql<number>`(
          SELECT COUNT(*) FROM ${programEntries} 
          WHERE ${programEntries.program_id} = ${programs.id}
        )`,
        total_duration_minutes: sql<number>`(
          SELECT COALESCE(SUM(
            CASE 
              WHEN ${programEntries.entry_type} = 'activity' THEN (
                SELECT ${activities.approximate_duration_minutes} 
                FROM ${activities} 
                WHERE ${activities.id} = ${programEntries.activity_id}
              )
              WHEN ${programEntries.entry_type} = 'custom' THEN ${programEntries.custom_duration_minutes}
              ELSE 0
            END
          ), 0) FROM ${programEntries} 
          WHERE ${programEntries.program_id} = ${programs.id}
        )`
      })
      .from(programs)
      .where(eq(programs.user_id, session.user.id))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      programs: programsData,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages
      }
    });

  } catch (error) {
    console.error('Error fetching programs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, date, start_time, is_public = false } = body;

    // Validate required fields
    if (!name || !start_time) {
      return NextResponse.json(
        { error: 'Name and start time are required' },
        { status: 400 }
      );
    }

    // Create new program
    const [newProgram] = await db
      .insert(programs)
      .values({
        name,
        date: date || null,
        start_time,
        user_id: session.user.id,
        is_public
      })
      .returning();

    return NextResponse.json({
      success: true,
      program: newProgram
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating program:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
