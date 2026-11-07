/**
 * The objective filter tree: area -> general objective -> specific objective (Matriz).
 * Pure functions: build the tree, compute node states, toggle selection, apply the
 * division filter and search. No rendering here.
 *
 * Selection model (what the API receives): sets of area ids, general objective ids and
 * specific objective ids. An activity matches when it is linked to ANY objective covered
 * by one of them.
 */

export interface GoalOption {
  id: string;
  code: string;
  title: string;
  age_groups?: string[];
  area: { id: string; name: string } | null;
  general_objective: { id: string; code: string; title: string } | null;
}

export interface Leaf {
  id: string;
  code: string;
  title: string;
  ageGroups: string[];
  generalId: string | null;
  areaId: string;
}
export interface General {
  /** Null for legacy objectives with no general objective. */
  id: string | null;
  code: string;
  title: string;
  areaId: string;
  leaves: Leaf[];
}
export interface Area {
  id: string;
  name: string;
  generals: General[];
}

export interface Selection {
  areas: string[];
  generals: string[];
  goals: string[];
}

export type NodeState = 'off' | 'partial' | 'on';
export type Node =
  | { kind: 'area'; id: string }
  | { kind: 'general'; id: string }
  | { kind: 'goal'; id: string };

export const EMPTY_SELECTION: Selection = { areas: [], generals: [], goals: [] };

export function isEmptySelection(selection: Selection): boolean {
  return selection.areas.length + selection.generals.length + selection.goals.length === 0;
}

/** Builds the tree in the order the goals arrive (the API orders by area, objective and code). */
export function buildTree(goals: readonly GoalOption[]): Area[] {
  const areas: Area[] = [];
  for (const goal of goals) {
    if (!goal.area) continue;
    let area = areas.find((a) => a.id === goal.area!.id);
    if (!area) {
      area = { id: goal.area.id, name: goal.area.name, generals: [] };
      areas.push(area);
    }
    const generalId = goal.general_objective?.id ?? null;
    let general = area.generals.find((g) => g.id === generalId);
    if (!general) {
      general = {
        id: generalId,
        code: goal.general_objective?.code ?? '',
        title: goal.general_objective?.title ?? '',
        areaId: area.id,
        leaves: [],
      };
      area.generals.push(general);
    }
    general.leaves.push({
      id: goal.id,
      code: goal.code,
      title: goal.title,
      ageGroups: goal.age_groups ?? [],
      generalId,
      areaId: area.id,
    });
  }
  return areas;
}

/** Leaves that belong to at least one selected division (all leaves when none is selected). */
export function applyDivisions(tree: readonly Area[], ageGroups: readonly string[]): Area[] {
  if (ageGroups.length === 0) return tree.map((area) => ({ ...area }));
  const keep = (leaf: Leaf) => leaf.ageGroups.some((group) => ageGroups.includes(group));
  return tree
    .map((area) => ({
      ...area,
      generals: area.generals
        .map((general) => ({ ...general, leaves: general.leaves.filter(keep) }))
        .filter((general) => general.leaves.length > 0),
    }))
    .filter((area) => area.generals.length > 0);
}

function normalise(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Keeps the leaves whose code, title or general-objective title contains the text. */
export function applySearch(tree: readonly Area[], search: string): Area[] {
  const needle = normalise(search.trim());
  if (!needle) return tree.map((area) => ({ ...area }));
  return tree
    .map((area) => ({
      ...area,
      generals: area.generals
        .map((general) => ({
          ...general,
          leaves: general.leaves.filter(
            (leaf) =>
              normalise(leaf.code).includes(needle) ||
              normalise(leaf.title).includes(needle) ||
              normalise(`${general.code} ${general.title}`).includes(needle)
          ),
        }))
        .filter((general) => general.leaves.length > 0),
    }))
    .filter((area) => area.generals.length > 0);
}

const has = (list: readonly string[], id: string | null) => id !== null && list.includes(id);

/** Whether a node is selected, partly selected (something below it is) or not. */
export function nodeState(node: Node, tree: readonly Area[], selection: Selection): NodeState {
  if (node.kind === 'area' && has(selection.areas, node.id)) return 'on';
  if (node.kind === 'general' && has(selection.generals, node.id)) return 'on';
  if (node.kind === 'goal' && has(selection.goals, node.id)) return 'on';
  if (node.kind === 'goal') return 'off';
  for (const area of tree) {
    if (node.kind === 'area' && area.id !== node.id) continue;
    for (const general of area.generals) {
      if (node.kind === 'general' && general.id !== node.id) continue;
      if (node.kind === 'area' && has(selection.generals, general.id)) return 'partial';
      if (general.leaves.some((leaf) => has(selection.goals, leaf.id))) return 'partial';
    }
  }
  return 'off';
}

function descendants(node: Node, tree: readonly Area[]): { generals: string[]; goals: string[] } {
  const generals: string[] = [];
  const goals: string[] = [];
  for (const area of tree) {
    if (node.kind === 'area' && area.id !== node.id) continue;
    for (const general of area.generals) {
      if (node.kind === 'general' && general.id !== node.id) continue;
      if (node.kind === 'area' && general.id) generals.push(general.id);
      for (const leaf of general.leaves) goals.push(leaf.id);
    }
  }
  return { generals, goals };
}

function ancestors(node: Node, tree: readonly Area[]): { areas: string[]; generals: string[] } {
  if (node.kind === 'area') return { areas: [], generals: [] };
  for (const area of tree) {
    for (const general of area.generals) {
      if (node.kind === 'general' && general.id === node.id) return { areas: [area.id], generals: [] };
      if (node.kind === 'goal' && general.leaves.some((leaf) => leaf.id === node.id)) {
        return { areas: [area.id], generals: general.id ? [general.id] : [] };
      }
    }
  }
  return { areas: [], generals: [] };
}

/**
 * Click on a node. A selected node is cleared. Otherwise it is selected as a whole: everything
 * below it is cleared (it already covers it) and a selected ancestor is replaced by it.
 */
export function toggleNode(node: Node, tree: readonly Area[], selection: Selection): Selection {
  const below = descendants(node, tree);
  const above = ancestors(node, tree);
  const without = (list: readonly string[], remove: readonly string[]) => list.filter((id) => !remove.includes(id));
  const next: Selection = {
    areas: [...selection.areas],
    generals: [...selection.generals],
    goals: [...selection.goals],
  };
  const lists = { area: 'areas', general: 'generals', goal: 'goals' } as const;
  if (nodeState(node, tree, selection) === 'on') {
    next[lists[node.kind]] = without(next[lists[node.kind]], [node.id]);
    return next;
  }
  next.areas = without(next.areas, above.areas);
  next.generals = without(next.generals, [...above.generals, ...below.generals]);
  next.goals = without(next.goals, below.goals);
  next[lists[node.kind]] = [...next[lists[node.kind]], node.id];
  return next;
}

/** Removes a node's own selection (used by the chips). */
export function removeNode(node: Node, selection: Selection): Selection {
  const key = node.kind === 'area' ? 'areas' : node.kind === 'general' ? 'generals' : 'goals';
  return { ...selection, [key]: selection[key].filter((id) => id !== node.id) };
}

/**
 * When the divisions change, selected specific objectives that belong to none of them are
 * dropped; areas and general objectives stay selected because they remain valid.
 */
export function dropInapplicableGoals(
  selection: Selection,
  tree: readonly Area[],
  ageGroups: readonly string[]
): Selection {
  if (ageGroups.length === 0) return selection;
  const valid = new Set<string>();
  for (const area of applyDivisions(tree, ageGroups)) {
    for (const general of area.generals) for (const leaf of general.leaves) valid.add(leaf.id);
  }
  return { ...selection, goals: selection.goals.filter((id) => valid.has(id)) };
}

/** Number of listed objectives covered by the selection under a node (for "k selecionados"). */
export function coveredCount(node: Node, tree: readonly Area[], selection: Selection): number {
  let count = 0;
  for (const area of tree) {
    if (node.kind === 'area' && area.id !== node.id) continue;
    for (const general of area.generals) {
      if (node.kind === 'general' && general.id !== node.id) continue;
      for (const leaf of general.leaves) {
        if (node.kind === 'goal' && leaf.id !== node.id) continue;
        if (has(selection.areas, area.id) || has(selection.generals, general.id) || has(selection.goals, leaf.id)) count++;
      }
    }
  }
  return count;
}

/** Number of listed objectives under a node. */
export function leafCount(node: Node, tree: readonly Area[]): number {
  return descendants(node, tree).goals.length || (node.kind === 'goal' ? 1 : 0);
}
