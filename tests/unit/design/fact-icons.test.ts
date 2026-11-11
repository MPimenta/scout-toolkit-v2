import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FACT_ICONS } from '@/lib/design/icons';

const FILES = [
  'src/components/features/activities/ActivityCard.tsx',
  'src/components/features/activities/ActivityDetail.tsx',
  'src/components/features/activities/ActivitiesTable.tsx',
  'src/components/features/activities/ActivityFilters.tsx',
  'src/components/features/activities/filters/FilterPanel.tsx',
  'src/components/features/activities/filters/ActiveFilterChips.tsx',
  'src/components/features/programs/ProgramEntryCard.tsx',
];

describe('fact icons', () => {
  it('maps the four facts to one icon each', () => {
    expect(Object.keys(FACT_ICONS).sort()).toEqual(['duration', 'effort', 'groupSize', 'location']);
  });

  it.each(FILES)('%s takes fact icons from the shared components, not from lucide', (file) => {
    const source = readFileSync(file, 'utf8');
    const lucide = source.match(/import \{([^}]*)\} from 'lucide-react'/)?.[1] ?? '';
    for (const icon of ['Clock', 'Users', 'Target', 'MapPin', 'TrendingUp']) {
      // Users and Target remain valid in ProgramEntryCard for non-fact uses (custom block, objectives).
      if (file.endsWith('ProgramEntryCard.tsx') && (icon === 'Users' || icon === 'Target')) continue;
      expect(lucide, `${file} imports ${icon}`).not.toMatch(new RegExp(`\b${icon}\b`));
    }
  });
});
