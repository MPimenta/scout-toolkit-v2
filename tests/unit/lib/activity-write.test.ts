import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/server', () => ({ db: {} }));

import { parseActivityWrite } from '@/lib/activities/write';

const valid = {
  name: 'Jogo',
  description: 'Desc',
  materials: 'Nada',
  approximate_duration_minutes: 30,
  group_size: 'small',
  effort_level: 'low',
  location: 'outside',
  age_group: 'scouts',
  activity_type_id: '550e8400-e29b-41d4-a716-446655440000',
};

describe('parseActivityWrite', () => {
  it('accepts an HTTPS image URL', () => {
    const parsed = parseActivityWrite({
      ...valid,
      image_url: 'https://utfs.io/image.jpg',
    });
    expect(parsed).toMatchObject({ image_url: 'https://utfs.io/image.jpg' });
  });

  it('rejects a non-HTTPS image URL', () => {
    expect(parseActivityWrite({ ...valid, image_url: 'http://example.com/a.jpg' })).toBe(
      'A imagem deve usar um URL HTTPS'
    );
  });
});
