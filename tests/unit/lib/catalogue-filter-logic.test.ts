import { describe, expect, it } from 'vitest';
import {
  DURATION_STOPS,
  boundsToIndexes,
  durationReadout,
  indexesToBounds,
  isFullRange,
  nearestStop,
  validateDuration,
} from '@/lib/activities/duration';
import {
  EMPTY_SELECTION,
  applyDivisions,
  applySearch,
  buildTree,
  coveredCount,
  dropInapplicableGoals,
  leafCount,
  nodeState,
  removeNode,
  toggleNode,
  type GoalOption,
} from '@/lib/activities/objective-tree';

const t = (path: string, vars?: Record<string, string | number>) =>
  ({ 'filters.durationAny': 'Qualquer duração', 'filters.durationUpTo': `≤${vars?.max} min`, 'filters.durationFrom': `≥${vars?.min} min`, 'filters.durationRange': `${vars?.min}–${vars?.max} min` })[path] ?? path;

describe('duration helpers', () => {
  it('finds the nearest stop', () => {
    expect(DURATION_STOPS[nearestStop(25)]).toBe(20); // 25 is 5 from 20 and from 30: the first wins
    expect(DURATION_STOPS[nearestStop(40)]).toBe(45);
    expect(DURATION_STOPS[nearestStop(1000)]).toBe(120);
    expect(DURATION_STOPS[nearestStop(0)]).toBe(5);
  });

  it('maps bounds to handle positions and back, with open ends at the extremes', () => {
    expect(boundsToIndexes({ min: '', max: '' })).toEqual([0, 8]);
    expect(boundsToIndexes({ min: '15', max: '45' })).toEqual([2, 5]);
    expect(indexesToBounds(0, 8)).toEqual({ min: '', max: '' });
    expect(indexesToBounds(2, 5)).toEqual({ min: '15', max: '45' });
    expect(indexesToBounds(5, 2)).toEqual({ min: '15', max: '45' }); // handles crossed
    expect(indexesToBounds(0, 4)).toEqual({ min: '', max: '30' });
    expect(indexesToBounds(6, 8)).toEqual({ min: '60', max: '' });
  });

  it('treats the full range as no filter', () => {
    expect(isFullRange({ min: '', max: '' })).toBe(true);
    expect(isFullRange({ min: '10', max: '' })).toBe(false);
  });

  it('validates the bounds', () => {
    expect(validateDuration({ min: '15', max: '45' })).toEqual({ ok: true });
    expect(validateDuration({ min: '', max: '30' })).toEqual({ ok: true });
    expect(validateDuration({ min: '45', max: '15' })).toEqual({ ok: false, reason: 'min-above-max' });
    expect(validateDuration({ min: 'abc', max: '' })).toEqual({ ok: false, reason: 'not-a-number' });
    expect(validateDuration({ min: '-5', max: '' })).toEqual({ ok: false, reason: 'not-a-number' });
  });

  it('writes the readout', () => {
    expect(durationReadout({ min: '', max: '' }, t)).toBe('Qualquer duração');
    expect(durationReadout({ min: '', max: '30' }, t)).toBe('≤30 min');
    expect(durationReadout({ min: '60', max: '' }, t)).toBe('≥60 min');
    expect(durationReadout({ min: '15', max: '45' }, t)).toBe('15–45 min');
  });
});

const area = (id: string, name: string) => ({ id, name });
const gen = (id: string, code: string) => ({ id, code, title: `Geral ${code}` });
const goals: GoalOption[] = [
  { id: 'f1', code: '4F.1.2', title: 'Relacionar a alimentação com a saúde', age_groups: ['scouts'], area: area('F', 'Físico'), general_objective: gen('g4F', '4F') },
  { id: 'f2', code: '4F.3.2', title: 'Relacionar a atividade física com a saúde', age_groups: ['scouts'], area: area('F', 'Físico'), general_objective: gen('g4F', '4F') },
  { id: 'f3', code: '4F.3.3-4', title: 'Atividade física diária', age_groups: ['adventurers', 'rovers'], area: area('F', 'Físico'), general_objective: gen('g4F', '4F') },
  { id: 's1', code: '4S.1.2', title: 'Expressar apreço pelo trabalho dos outros', age_groups: ['scouts'], area: area('S', 'Social'), general_objective: gen('g4S', '4S') },
  { id: 's2', code: '5S.2', title: 'Assegurar o cumprimento das suas tarefas', age_groups: ['scouts'], area: area('S', 'Social'), general_objective: gen('g5S', '5S') },
];
const tree = buildTree(goals);

describe('objective tree', () => {
  it('groups by area and general objective in order', () => {
    expect(tree.map((a) => a.name)).toEqual(['Físico', 'Social']);
    expect(tree[0]!.generals.map((g) => g.code)).toEqual(['4F']);
    expect(tree[1]!.generals.map((g) => g.code)).toEqual(['4S', '5S']);
    expect(leafCount({ kind: 'area', id: 'F' }, tree)).toBe(3);
    expect(leafCount({ kind: 'general', id: 'g4S' }, tree)).toBe(1);
  });

  it('lists only objectives of the selected divisions', () => {
    const scouts = applyDivisions(tree, ['scouts']);
    expect(leafCount({ kind: 'area', id: 'F' }, scouts)).toBe(2);
    const rovers = applyDivisions(tree, ['rovers']);
    expect(rovers.map((a) => a.name)).toEqual(['Físico']);
    expect(applyDivisions(tree, []).length).toBe(2);
  });

  it('searches code, title and general objective, ignoring case and accents', () => {
    expect(applySearch(tree, 'ALIMENTACAO')[0]!.generals[0]!.leaves.map((l) => l.code)).toEqual(['4F.1.2']);
    expect(applySearch(tree, '5S.2').map((a) => a.name)).toEqual(['Social']);
    expect(applySearch(tree, 'geral 4S')[0]!.generals[0]!.leaves.map((l) => l.code)).toEqual(['4S.1.2']);
    expect(applySearch(tree, 'zzz')).toEqual([]);
    expect(applySearch(tree, '  ').length).toBe(2);
  });

  it('selecting an area is on and counts every objective in it', () => {
    const sel = toggleNode({ kind: 'area', id: 'F' }, tree, EMPTY_SELECTION);
    expect(sel.areas).toEqual(['F']);
    expect(nodeState({ kind: 'area', id: 'F' }, tree, sel)).toBe('on');
    expect(coveredCount({ kind: 'area', id: 'F' }, tree, sel)).toBe(3);
    expect(nodeState({ kind: 'area', id: 'S' }, tree, sel)).toBe('off');
  });

  it('selecting a leaf under a selected area replaces the area and leaves it partial', () => {
    let sel = toggleNode({ kind: 'area', id: 'F' }, tree, EMPTY_SELECTION);
    sel = toggleNode({ kind: 'goal', id: 'f2' }, tree, sel);
    expect(sel).toEqual({ areas: [], generals: [], goals: ['f2'] });
    expect(nodeState({ kind: 'area', id: 'F' }, tree, sel)).toBe('partial');
    expect(nodeState({ kind: 'general', id: 'g4F' }, tree, sel)).toBe('partial');
    expect(nodeState({ kind: 'goal', id: 'f2' }, tree, sel)).toBe('on');
  });

  it('selecting a parent clears the selection below it', () => {
    let sel = toggleNode({ kind: 'goal', id: 'f1' }, tree, EMPTY_SELECTION);
    sel = toggleNode({ kind: 'goal', id: 'f2' }, tree, sel);
    sel = toggleNode({ kind: 'general', id: 'g4F' }, tree, sel);
    expect(sel).toEqual({ areas: [], generals: ['g4F'], goals: [] });
    sel = toggleNode({ kind: 'area', id: 'F' }, tree, sel);
    expect(sel).toEqual({ areas: ['F'], generals: [], goals: [] });
  });

  it('clicking a selected node, or removing its chip, clears it', () => {
    const sel = toggleNode({ kind: 'general', id: 'g4S' }, tree, EMPTY_SELECTION);
    expect(toggleNode({ kind: 'general', id: 'g4S' }, tree, sel)).toEqual(EMPTY_SELECTION);
    expect(removeNode({ kind: 'general', id: 'g4S' }, sel)).toEqual(EMPTY_SELECTION);
  });

  it('a partial parent becomes on when clicked', () => {
    const sel = toggleNode({ kind: 'goal', id: 's1' }, tree, EMPTY_SELECTION);
    expect(nodeState({ kind: 'area', id: 'S' }, tree, sel)).toBe('partial');
    const next = toggleNode({ kind: 'area', id: 'S' }, tree, sel);
    expect(next).toEqual({ areas: ['S'], generals: [], goals: [] });
  });

  it('drops selected objectives that no longer fit the divisions but keeps areas and general objectives', () => {
    const sel = { areas: ['S'], generals: ['g4F'], goals: ['f3', 'f1'] };
    expect(dropInapplicableGoals(sel, tree, ['scouts'])).toEqual({ areas: ['S'], generals: ['g4F'], goals: ['f1'] });
    expect(dropInapplicableGoals(sel, tree, [])).toEqual(sel);
  });

  it('counts only the objectives listed for the selected divisions', () => {
    const scouts = applyDivisions(tree, ['scouts']);
    const sel = toggleNode({ kind: 'area', id: 'F' }, scouts, EMPTY_SELECTION);
    expect(coveredCount({ kind: 'area', id: 'F' }, scouts, sel)).toBe(2);
  });
});
