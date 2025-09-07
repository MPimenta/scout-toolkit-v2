import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/server';
import { programs, programEntries, activities, activityTypes, user } from '../../../../../../../drizzle/schema';
import { eq, asc } from 'drizzle-orm';
import * as XLSX from 'xlsx';
import { 
  apiErrors, 
  logApiRequest, 
  logApiResponse,
  withApiErrorHandler 
} from '@/lib/errors';
import { validateUUID } from '@/lib/errors/error-handler';

/**
 * Excel export endpoint for programs
 * Exports program data to Excel format with multiple sheets
 * @param request - The Next.js request object
 * @param params - Route parameters containing program ID
 * @returns Excel file download response
 */
export const GET = withApiErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  logApiRequest('GET', '/api/programs/[id]/export/excel');
  
  // Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return apiErrors.unauthorized();
  }

  const { id: programId } = await params;
  
  // Validate program ID
  const uuidValidation = validateUUID(programId);
  if (!uuidValidation.success) {
    return apiErrors.validation('id', 'ID do programa inválido');
  }

  // Fetch program with user info
  const [programData] = await db
    .select({
      id: programs.id,
      name: programs.name,
      date: programs.date,
      start_time: programs.start_time,
      is_public: programs.is_public,
      user_id: programs.user_id,
      created_at: programs.created_at,
      updated_at: programs.updated_at,
      user_name: user.name,
    })
    .from(programs)
    .leftJoin(user, eq(programs.user_id, user.id))
    .where(eq(programs.id, programId));

  if (!programData) {
    return apiErrors.notFound('Programa não encontrado');
  }

  // Check if user owns the program or if it's public
  if (programData.user_id !== session.user.id && !programData.is_public) {
    return apiErrors.forbidden('Acesso negado a este programa');
  }

  // Fetch program entries with activity data
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
      activity_description: activities.description,
      activity_materials: activities.materials,
      activity_duration: activities.approximate_duration_minutes,
      activity_group_size: activities.group_size,
      activity_effort_level: activities.effort_level,
      activity_location: activities.location,
      activity_type_name: activityTypes.name,
    })
    .from(programEntries)
    .leftJoin(activities, eq(programEntries.activity_id, activities.id))
    .leftJoin(activityTypes, eq(activities.activity_type_id, activityTypes.id))
    .where(eq(programEntries.program_id, programId))
    .orderBy(asc(programEntries.position));

  // Create program object for compatibility
  const program = {
    ...programData,
    user: { name: programData.user_name },
    entries: entries.map(entry => ({
      id: entry.id,
      position: entry.position,
      start_time: entry.start_time,
      end_time: entry.end_time,
      entry_type: entry.entry_type,
      custom_title: entry.custom_title,
      custom_duration_minutes: entry.custom_duration_minutes,
      activity: entry.activity_id ? {
        id: entry.activity_id,
        name: entry.activity_name,
        description: entry.activity_description,
        materials: entry.activity_materials,
        approximate_duration_minutes: entry.activity_duration,
        group_size: entry.activity_group_size,
        effort_level: entry.activity_effort_level,
        location: entry.activity_location,
        activityType: { name: entry.activity_type_name },
        educationalGoals: [],
        sdgs: [],
      } : null,
    })),
  };

  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Program Summary
  const summaryData = [
    ['Program Summary', ''],
    ['Program Name', program.name],
    ['Date', program.date || 'Not specified'],
    ['Start Time', program.start_time],
    ['Created By', program.user.name],
    ['Created At', new Date(program.created_at).toLocaleDateString('pt-PT')],
    ['Total Entries', program.entries.length],
    ['Total Duration', calculateTotalDuration(program.entries)],
    ['', ''],
    ['Educational Goals', ''],
    ...getEducationalGoals(program.entries).map(goal => ['', goal]),
    ['', ''],
    ['SDGs', ''],
    ...getSDGs(program.entries).map(sdg => ['', `SDG ${sdg.number}: ${sdg.name}`]),
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Sheet 2: Schedule
  const scheduleData = [
    ['Position', 'Start Time', 'End Time', 'Type', 'Title', 'Duration (min)', 'Group Size', 'Effort Level', 'Location', 'Activity Type', 'Educational Goals', 'SDGs'],
  ];

  program.entries.forEach((entry, index) => {
    const row = [
      (index + 1).toString(),
      entry.start_time,
      entry.end_time,
      entry.entry_type === 'activity' ? 'Activity' : 'Custom Block',
      entry.entry_type === 'activity' 
        ? entry.activity?.name || 'Unknown Activity'
        : entry.custom_title || 'Untitled',
      (entry.entry_type === 'activity' 
        ? entry.activity?.approximate_duration_minutes || 0
        : entry.custom_duration_minutes || 0).toString(),
      entry.entry_type === 'activity' ? entry.activity?.group_size || '' : '',
      entry.entry_type === 'activity' ? entry.activity?.effort_level || '' : '',
      entry.entry_type === 'activity' ? entry.activity?.location || '' : '',
      entry.entry_type === 'activity' ? entry.activity?.activityType?.name || '' : '',
      entry.entry_type === 'activity' ? 'N/A' : '',
      entry.entry_type === 'activity' ? 'N/A' : '',
    ];
    scheduleData.push(row);
  });

  const scheduleSheet = XLSX.utils.aoa_to_sheet(scheduleData);
  XLSX.utils.book_append_sheet(workbook, scheduleSheet, 'Schedule');

  // Sheet 3: Activity Details (only for activities)
  const activityDetailsData = [
    ['Activity Name', 'Description', 'Materials', 'Group Size', 'Effort Level', 'Location', 'Activity Type', 'Educational Goals', 'SDGs'],
  ];

  const activityEntries = program.entries
    .filter(entry => entry.entry_type === 'activity' && entry.activity)
    .map(entry => entry.activity!);

  activityEntries.forEach(activity => {
    const row = [
      activity.name || '',
      activity.description || '',
      activity.materials || '',
      activity.group_size || '',
      activity.effort_level || '',
      activity.location || '',
      activity.activityType?.name || '',
      'N/A',
      'N/A',
    ];
    activityDetailsData.push(row);
  });

  if (activityEntries.length > 0) {
    const activityDetailsSheet = XLSX.utils.aoa_to_sheet(activityDetailsData);
    XLSX.utils.book_append_sheet(workbook, activityDetailsSheet, 'Activity Details');
  }

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  // Set response headers for file download
  const filename = `programa_${program.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  const response = new NextResponse(excelBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': excelBuffer.length.toString(),
    },
  });

  logApiResponse('GET', '/api/programs/[id]/export/excel', 200, { filename });
  return response;
});

/**
 * Calculate total duration of program entries in hours and minutes
 * @param entries - Array of program entries
 * @returns Formatted duration string
 */
function calculateTotalDuration(entries: Array<{ entry_type: string; activity?: { approximate_duration_minutes?: number | null } | null; custom_duration_minutes?: number | null }>): string {
  const totalMinutes = entries.reduce((total, entry) => {
    if (entry.entry_type === 'activity' && entry.activity) {
      return total + (entry.activity.approximate_duration_minutes || 0);
    } else if (entry.entry_type === 'custom') {
      return total + (entry.custom_duration_minutes || 0);
    }
    return total;
  }, 0);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}

/**
 * Get unique educational goals from program entries
 * @param entries - Array of program entries
 * @returns Array of unique educational goal names
 */
function getEducationalGoals(entries: Array<{ entry_type: string; activity?: { educationalGoals?: Array<{ educationalGoal: { name: string } }> } | null }>): string[] {
  const goals = new Set<string>();
  
  entries.forEach(entry => {
    if (entry.entry_type === 'activity' && entry.activity?.educationalGoals) {
      entry.activity.educationalGoals.forEach((eg) => {
        goals.add(eg.educationalGoal.name);
      });
    }
  });
  
  return Array.from(goals);
}

/**
 * Get unique SDGs from program entries
 * @param entries - Array of program entries
 * @returns Array of unique SDG objects
 */
function getSDGs(entries: Array<{ entry_type: string; activity?: { sdgs?: Array<{ sdg: { number: number; name: string } }> } | null }>): Array<{ number: number; name: string }> {
  const sdgMap = new Map<number, string>();
  
  entries.forEach(entry => {
    if (entry.entry_type === 'activity' && entry.activity?.sdgs) {
      entry.activity.sdgs.forEach((sdg) => {
        sdgMap.set(sdg.sdg.number, sdg.sdg.name);
      });
    }
  });
  
  return Array.from(sdgMap.entries()).map(([number, name]) => ({ number, name }));
}
