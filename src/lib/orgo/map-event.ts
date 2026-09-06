import { resolveTimezone } from './config';

export type ProgramEntryForOrgo = {
  end_time: string;
  custom_title?: string | null;
  activity?: { name?: string | null } | null;
};

export type ProgramForOrgo = {
  name: string;
  date: string | null;
  start_time: string;
  is_public: boolean;
  userName?: string | null;
  entries: ProgramEntryForOrgo[];
};

export type OrgoDialogInput = {
  dateTimeBegin?: string | null;
  dateTimeEnd: string;
  location: string;
  unit: string;
  maxCapacity?: number | null;
  publish: boolean;
  timezone?: string | null;
};

export type OrgoEventPayload = {
  name: string;
  description: string;
  dateTimeBegin: string;
  dateTimeEnd: string;
  timezone: string;
  location: string;
  unit: string;
  isPublic: boolean;
  hasEventTicketing: false;
  status: 'DRAFT';
  maxCapacity?: number;
};

function normalizeTime(value: string): string {
  const parts = value.split(':');
  const hours = parts[0] ?? '00';
  const minutes = parts[1] ?? '00';
  const seconds = (parts[2] ?? '00').slice(0, 2);
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
}

function addHour(time: string): string {
  const [h = '0', m = '0', s = '0'] = normalizeTime(time).split(':');
  const date = new Date(Date.UTC(2000, 0, 1, Number(h), Number(m), Number(s)));
  date.setUTCHours(date.getUTCHours() + 1);
  return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}:${String(date.getUTCSeconds()).padStart(2, '0')}`;
}

export function wallDateTime(date: string, time: string): string {
  return `${date}T${normalizeTime(time)}`;
}

export function defaultEndDateTime(program: ProgramForOrgo): string | null {
  if (!program.date) {
    return null;
  }
  const last = program.entries[program.entries.length - 1];
  const endTime = last?.end_time ?? addHour(program.start_time);
  return wallDateTime(program.date, endTime);
}

export function defaultBeginDateTime(program: ProgramForOrgo): string | null {
  if (!program.date) {
    return null;
  }
  return wallDateTime(program.date, program.start_time);
}

function entryTitle(entry: ProgramEntryForOrgo): string {
  return entry.custom_title || entry.activity?.name || 'Bloco';
}

export function toOrgoEventPayload(
  program: ProgramForOrgo,
  dialog: OrgoDialogInput
): OrgoEventPayload {
  const timezone = resolveTimezone(dialog.timezone);
  const dateTimeBegin = dialog.dateTimeBegin || defaultBeginDateTime(program);
  const dateTimeEnd = dialog.dateTimeEnd;

  if (!dateTimeBegin) {
    throw new Error('É necessário indicar o início do evento');
  }
  if (!dateTimeEnd) {
    throw new Error('É necessário indicar o fim do evento');
  }
  if (!dialog.unit) {
    throw new Error('É necessário escolher uma unidade Orgo');
  }

  const titles = program.entries.map(entryTitle);
  const descriptionParts = [
    program.userName ? `Programa criado por ${program.userName} no Kit de Atividades.` : 'Programa criado no Kit de Atividades.',
    titles.length ? `Atividades: ${titles.join(', ')}.` : null,
  ].filter(Boolean);

  const payload: OrgoEventPayload = {
    name: program.name,
    description: descriptionParts.join(' '),
    dateTimeBegin,
    dateTimeEnd,
    timezone,
    location: dialog.location,
    unit: dialog.unit,
    isPublic: program.is_public,
    hasEventTicketing: false,
    status: 'DRAFT',
  };

  if (dialog.maxCapacity != null && dialog.maxCapacity > 0) {
    payload.maxCapacity = dialog.maxCapacity;
  }

  return payload;
}
