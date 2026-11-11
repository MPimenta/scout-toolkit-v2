/** "Reflexão/Debriefing" -> "reflexao-debriefing": the stable code of a format or focus. */
export function slugCode(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
