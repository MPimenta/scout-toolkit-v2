import { describe, expect, it } from 'vitest';
import dataset from '../../../drizzle/seeds/data/progress-matrix.json';
import { MATRIX_PATHS } from '../../../drizzle/seeds/data/progress-matrix-structure';
import { parseObjectiveCode } from '@/lib/reference-data/objective-code';
import type { ProgressMatrixDataset } from '@/lib/reference-data/progress-matrix-types';

const data = dataset as unknown as ProgressMatrixDataset;

describe('parseObjectiveCode', () => {
  it('parses simple, sub-grouped and ranged codes', () => {
    expect(parseObjectiveCode('1A.2')).toMatchObject({ canonical: '1A.2', general: '1A', stages: [2], sub: null });
    expect(parseObjectiveCode('4F.1.1')).toMatchObject({ canonical: '4F.1.1', general: '4F', sub: 1, stages: [1] });
    expect(parseObjectiveCode('3A.3-4')).toMatchObject({ canonical: '3A.3-4', stages: [3, 4] });
    expect(parseObjectiveCode('4S.2.2-3')).toMatchObject({ canonical: '4S.2.2-3', stages: [2, 3], sub: 2 });
  });

  it('accepts the Regulamento spelling and a trailing dot', () => {
    expect(parseObjectiveCode('4F1.1')?.canonical).toBe('4F.1.1');
    expect(parseObjectiveCode('2F.3.')?.canonical).toBe('2F.3');
  });

  it('rejects anything else', () => {
    for (const bad of ['', '1X.1', '1A.5', '1A', 'A1.1', '1A.2-9', 'texto']) {
      expect(parseObjectiveCode(bad), bad).toBeNull();
    }
  });
});

describe('progress-matrix dataset', () => {
  it('has the Matriz totals', () => {
    expect(data.areas).toHaveLength(6);
    expect(data.paths).toHaveLength(20);
    expect(data.general_objectives).toHaveLength(40);
    expect(data.goals).toHaveLength(174);
    expect(data.challenge_types).toHaveLength(7);
    expect(data.challenges).toHaveLength(112);
    // 287 listed codes; one challenge lists a code twice.
    expect(data.challenges.reduce((n, c) => n + c.goal_codes.length, 0)).toBe(286);
  });

  it('names the six areas as the product owner confirmed', () => {
    expect(data.areas.map((a) => a.name)).toEqual([
      'Físico',
      'Afetivo',
      'Carácter',
      'Espiritual',
      'Intelectual',
      'Social',
    ]);
  });

  it('gives the 13 shared objectives two age groups and everything else one', () => {
    const shared = data.goals.filter((g) => g.age_groups.length > 1);
    expect(shared).toHaveLength(13);
    for (const goal of shared) expect(goal.age_groups).toHaveLength(2);
    expect(data.goals.filter((g) => g.age_groups.length === 1)).toHaveLength(161);
    expect(data.goals.find((g) => g.code === '3A.3-4')?.age_groups).toEqual(['adventurers', 'rovers']);
  });

  it('derives each goal age group from its code, never leaders', () => {
    for (const goal of data.goals) {
      const parsed = parseObjectiveCode(goal.code);
      expect(parsed, goal.code).not.toBeNull();
      expect(goal.age_groups, goal.code).not.toContain('leaders');
      expect(goal.age_groups, goal.code).toHaveLength(parsed!.stages.length);
    }
  });

  it('has no Alcateia objective for 7E', () => {
    const codes = data.goals.filter((g) => g.general_objective_code === '7E');
    expect(codes.map((g) => g.code)).toEqual(['7E.2', '7E.3', '7E.4']);
    expect(codes.every((g) => !g.age_groups.includes('cub_scouts'))).toBe(true);
  });

  it('has unique codes and consistent parents', () => {
    expect(new Set(data.goals.map((g) => g.code)).size).toBe(data.goals.length);
    const generalCodes = new Set(data.general_objectives.map((g) => g.code));
    const areaCodes = new Set(data.areas.map((a) => a.code));
    for (const goal of data.goals) {
      expect(generalCodes.has(goal.general_objective_code), goal.code).toBe(true);
      expect(goal.general_objective_code.endsWith(goal.area_code), goal.code).toBe(true);
      expect(areaCodes.has(goal.area_code)).toBe(true);
    }
  });

  it('assigns every general objective to exactly one path of its own area', () => {
    const owner = new Map<string, string[]>();
    for (const path of MATRIX_PATHS) {
      for (const code of path.generalObjectives) owner.set(code, [...(owner.get(code) ?? []), path.code]);
    }
    for (const general of data.general_objectives) {
      expect(owner.get(general.code), general.code).toEqual([general.path_code]);
      const path = data.paths.find((p) => p.code === general.path_code);
      expect(path?.area_code, general.code).toBe(general.area_code);
    }
  });

  it('resolves every challenge link and keeps stable codes', () => {
    const codes = new Set(data.goals.map((g) => g.code));
    const types = new Set(data.challenge_types.map((t) => t.code));
    expect(new Set(data.challenges.map((c) => c.code)).size).toBe(112);
    for (const challenge of data.challenges) {
      expect(types.has(challenge.type_code), challenge.code).toBe(true);
      expect(challenge.code.startsWith(`${challenge.type_code}-`)).toBe(true);
      expect(new Set(challenge.goal_codes).size).toBe(challenge.goal_codes.length);
      for (const code of challenge.goal_codes) expect(codes.has(code), `${challenge.code} -> ${code}`).toBe(true);
    }
  });

  it('gives each challenge the age group of its column band', () => {
    const bands = ['cub_scouts', 'scouts', 'adventurers', 'rovers'];
    for (const challenge of data.challenges) {
      expect(challenge.age_group).toBe(bands[Math.floor((challenge.position - 1) / 4)]);
    }
    expect(data.challenges.filter((c) => c.age_group === 'rovers')).toHaveLength(28);
  });
});
