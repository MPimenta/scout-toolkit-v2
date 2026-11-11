/**
 * What happened to each step after an Orgo event was created from a program.
 * Stored as JSON on the program. It holds counts and times only: never names, ids or emails.
 */
export type OrgoStepStatus = 'done' | 'failed' | 'skipped';

export interface OrgoStepBase {
  status: OrgoStepStatus;
  /** ISO time of the last attempt. */
  at: string;
  /** Short Portuguese reason shown to the owner when the step failed or was skipped. */
  reason?: string;
}

export interface OrgoInvitationsStep extends OrgoStepBase {
  requested: number;
  added: number;
  failed: number;
}

export interface OrgoSteps {
  publish?: OrgoStepBase;
  invitations?: OrgoInvitationsStep;
  attachment?: OrgoStepBase;
}

export const ORGO_STEP_NAMES = ['publish', 'invitations', 'attachment'] as const;
export type OrgoStepName = (typeof ORGO_STEP_NAMES)[number];
