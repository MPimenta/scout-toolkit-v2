/**
 * What the Orgo dialog shows when choosing participants. Names and card numbers go to the
 * owner's browser for this one dialog; the app never stores or logs them.
 */
export interface ParticipantMember {
  /** Opaque Orgo user id, sent back only to invite that member. */
  id: string;
  name: string;
  cardId: string | null;
  divisionId: string;
}

export interface ParticipantDivision {
  /** The Orgo unit id of the divisão, or "none" for members without a matching divisão. */
  id: string;
  name: string;
  /** Member type this divisão holds (Lobito, Explorador, …). */
  userType: string | null;
  count: number;
}

export interface ParticipantTree {
  /** Name of the leader's own local group. */
  groupName: string | null;
  divisions: ParticipantDivision[];
  members: ParticipantMember[];
  /** Members in the whole group, before any search. */
  total: number;
}
