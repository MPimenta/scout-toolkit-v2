import type { ParticipantTree } from './orgo-participants';
import type { OrgoSteps } from './orgo-steps';

/** What GET /api/programs/[id]/orgo/options returns to the owner's browser. */
export interface OrgoOptions {
  pending: boolean;
  stub: boolean;
  units: Array<{ iri: string; name: string }>;
  groupName: string | null;
  /** The leader holds an event permission. Orgo is asked again when the event is published. */
  canPublish: boolean;
  /** Null when the leader's scope cannot be determined: the section is hidden. */
  participants: ParticipantTree | null;
  attachment: { allowed: boolean; fileName: string; reason: 'private' | null };
  descriptionSummary: { blocks: number; challenges: number };
}

/** What POST /api/programs/[id]/orgo returns after the event was created. */
export interface OrgoCreateResult {
  orgo_event_uuid: string;
  orgo_event_url: string;
  orgo_event_attendance_url: string;
  published: boolean;
  steps: OrgoSteps;
  warning?: string;
}
