import { asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { computeSchedule } from '@/lib/programs/schedule';
import {
  activities,
  activityChallenges,
  activityEducationalGoals,
  challengeGoals,
  challenges,
  programEntries,
} from '../../../drizzle/schema';
import type {
  AgeGroupValue,
  DescriptionBlock,
  DescriptionChallenge,
  DescriptionProgram,
} from './description';

export interface BlockForChallenges extends DescriptionBlock {
  activityId: string | null;
}

export interface ChallengeLinkRow {
  activityId: string;
  challengeId: string;
  code: string;
  shortTitle: string | null;
  title: string;
  ageGroup: AgeGroupValue;
  integrationAgeGroups: string[];
}

export interface BehaviourRow {
  activityId: string;
  challengeId: string;
  behaviour: string;
}

/**
 * Pure assembly of the desafios section. A desafio is listed when a block's activity is linked
 * to it; the blocks that contribute are those activities' blocks; a behaviour is listed under it
 * only when the activity is linked to that desafio, the objective is one of the desafio's
 * objectives and the behaviour is for the desafio's division (the query already matched those two).
 */
export function assembleChallenges(
  blocks: BlockForChallenges[],
  links: ChallengeLinkRow[],
  behaviours: BehaviourRow[]
): DescriptionChallenge[] {
  const linked = new Set(links.map((link) => `${link.activityId}:${link.challengeId}`));
  const byChallenge = new Map<string, DescriptionChallenge>();

  for (const link of links) {
    let challenge = byChallenge.get(link.challengeId);
    if (!challenge) {
      challenge = {
        code: link.code,
        shortTitle: link.shortTitle?.trim() || link.title,
        ageGroup: link.ageGroup,
        mandatory: link.integrationAgeGroups.includes(link.ageGroup),
        blocks: [],
        behaviours: [],
      };
      byChallenge.set(link.challengeId, challenge);
    }
  }

  // Walk the blocks in program order so each desafio lists its blocks in that order,
  // whatever order the database returned the links in.
  for (const block of blocks) {
    if (!block.activityId) continue;
    for (const link of links) {
      if (link.activityId !== block.activityId) continue;
      const challenge = byChallenge.get(link.challengeId);
      if (challenge && !challenge.blocks.includes(block.title)) challenge.blocks.push(block.title);
    }
  }

  for (const row of behaviours) {
    if (!linked.has(`${row.activityId}:${row.challengeId}`)) continue;
    const text = row.behaviour.trim();
    const challenge = byChallenge.get(row.challengeId);
    if (text && challenge && !challenge.behaviours.includes(text)) challenge.behaviours.push(text);
  }

  return [...byChallenge.values()];
}

/** Loads a program's blocks and the desafios its activities could earn, for the event description. */
export async function loadDescriptionProgram(program: {
  id: string;
  name: string;
  start_time: string;
}): Promise<DescriptionProgram> {
  const rows = await db
    .select({
      entry_type: programEntries.entry_type,
      custom_title: programEntries.custom_title,
      custom_duration_minutes: programEntries.custom_duration_minutes,
      activity_id: programEntries.activity_id,
      activity_name: activities.name,
      activity_duration_minutes: activities.approximate_duration_minutes,
    })
    .from(programEntries)
    .leftJoin(activities, eq(programEntries.activity_id, activities.id))
    .where(eq(programEntries.program_id, program.id))
    .orderBy(asc(programEntries.position));

  const blocks: BlockForChallenges[] = computeSchedule(program.start_time, rows).entries.map(
    (entry) => ({
      start: entry.start_time,
      end: entry.end_time,
      durationMinutes: entry.duration_minutes,
      title: entry.custom_title || entry.activity_name || 'Bloco',
      activityId: entry.activity_id,
    })
  );

  const activityIds = [
    ...new Set(blocks.map((block) => block.activityId).filter((id): id is string => Boolean(id))),
  ];
  if (activityIds.length === 0) {
    return { name: program.name, blocks: blocks.map(stripActivity), challenges: [] };
  }

  const links: ChallengeLinkRow[] = (
    await db
      .select({
        activityId: activityChallenges.activity_id,
        challengeId: challenges.id,
        code: challenges.code,
        shortTitle: challenges.short_title,
        title: challenges.title,
        ageGroup: challenges.age_group,
        integrationAgeGroups: challenges.integration_age_groups,
      })
      .from(activityChallenges)
      .innerJoin(challenges, eq(activityChallenges.challenge_id, challenges.id))
      .where(inArray(activityChallenges.activity_id, activityIds))
  ).map((row) => ({ ...row, integrationAgeGroups: row.integrationAgeGroups ?? [] }));

  if (links.length === 0) {
    return { name: program.name, blocks: blocks.map(stripActivity), challenges: [] };
  }

  const behaviourRows = await db
    .select({
      activityId: activityEducationalGoals.activity_id,
      challengeId: challengeGoals.challenge_id,
      behaviour: activityEducationalGoals.observable_behaviour,
      goalAgeGroup: activityEducationalGoals.age_group,
      challengeAgeGroup: challenges.age_group,
    })
    .from(activityEducationalGoals)
    .innerJoin(challengeGoals, eq(challengeGoals.goal_id, activityEducationalGoals.goal_id))
    .innerJoin(challenges, eq(challenges.id, challengeGoals.challenge_id))
    .where(inArray(activityEducationalGoals.activity_id, activityIds));

  const behaviours: BehaviourRow[] = behaviourRows
    .filter((row) => row.behaviour && row.goalAgeGroup === row.challengeAgeGroup)
    .map((row) => ({
      activityId: row.activityId,
      challengeId: row.challengeId,
      behaviour: row.behaviour as string,
    }));

  return {
    name: program.name,
    blocks: blocks.map(stripActivity),
    challenges: assembleChallenges(blocks, links, behaviours),
  };
}

function stripActivity(block: BlockForChallenges): DescriptionBlock {
  return {
    start: block.start,
    end: block.end,
    durationMinutes: block.durationMinutes,
    title: block.title,
  };
}
