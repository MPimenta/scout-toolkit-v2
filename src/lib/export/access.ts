import type { ProgramForExport } from './types';

export function canAccessProgramExport(
  program: Pick<ProgramForExport, 'user_id' | 'is_public'>,
  userId: string
): boolean {
  return program.user_id === userId || program.is_public;
}
