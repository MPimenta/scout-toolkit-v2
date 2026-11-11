import type { OrgoMember } from './client';

/** Lower case without accents, so "joao" finds "João". */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Members matching a search typed by the leader: every word of the query must appear in the
 * name (accents and case ignored), or the query must be part of the card number.
 * Runs on the server over members of the leader's own group only.
 */
export function filterMembers(members: OrgoMember[], query: string): OrgoMember[] {
  const text = normalizeSearchText(query);
  if (!text) return members;
  const words = text.split(/\s+/).filter(Boolean);
  return members.filter((member) => {
    if (member.cardId && member.cardId.toLowerCase().includes(text)) return true;
    const name = normalizeSearchText(member.name);
    return words.every((word) => name.includes(word));
  });
}
