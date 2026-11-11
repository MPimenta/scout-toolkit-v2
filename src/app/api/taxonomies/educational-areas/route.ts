import { NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { educationalAreas, educationalPaths, generalObjectives } from '../../../../../drizzle/schema';

export async function GET() {
  const [areas, paths, objectives] = await Promise.all([
    db.select().from(educationalAreas).orderBy(asc(educationalAreas.position), asc(educationalAreas.name)),
    db.select().from(educationalPaths).orderBy(asc(educationalPaths.position)),
    db.select().from(generalObjectives).orderBy(asc(generalObjectives.position)),
  ]);
  const pathName = new Map(paths.map((path) => [path.id, path.name]));
  return NextResponse.json({
    educational_areas: areas.map((area) => ({
      ...area,
      paths: paths.filter((path) => path.area_id === area.id).map(({ id, code, name }) => ({ id, code, name })),
      general_objectives: objectives
        .filter((objective) => objective.area_id === area.id)
        .map((objective) => ({
          id: objective.id,
          code: objective.code,
          title: objective.title,
          path_id: objective.path_id,
          path: objective.path_id ? pathName.get(objective.path_id) ?? null : null,
        })),
    })),
  });
}
