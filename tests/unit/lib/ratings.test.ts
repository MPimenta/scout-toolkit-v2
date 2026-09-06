import { describe, expect, it } from 'vitest';
import {
  computeAverage,
  computeVoteScore,
  emptyReactionCounts,
  mentionPrefix,
  nextReaction,
  nextVote,
  parseRating,
  parseReactionKey,
  parseReplyBody,
  parseVote,
  toPublicReview,
} from '@/lib/ratings';

const REVIEW_ID = '550e8400-e29b-41d4-a716-446655440099';

describe('ratings helpers', () => {
  it('accepts integer ratings from 1 to 5', () => {
    expect(parseRating(1)).toBe(1);
    expect(parseRating(5)).toBe(5);
    expect(parseRating('3')).toBe(3);
  });

  it('rejects out-of-range and non-integer ratings', () => {
    expect(parseRating(0)).toBeNull();
    expect(parseRating(6)).toBeNull();
    expect(parseRating(3.5)).toBeNull();
    expect(parseRating('boa')).toBeNull();
  });

  it('computes an empty average as zero', () => {
    expect(computeAverage([])).toEqual({ average: 0, count: 0 });
  });

  it('rounds the mean to one decimal', () => {
    expect(computeAverage([5, 4, 4])).toEqual({ average: 4.3, count: 3 });
  });

  it('maps a review row to a UUID public payload', () => {
    const createdAt = new Date('2026-09-05T10:00:00.000Z');
    expect(
      toPublicReview({
        id: REVIEW_ID,
        activity_id: 'act-1',
        user_id: 'user-1',
        rating: 4,
        comment: 'Boa',
        created_at: createdAt,
        user_name: 'Chefe Ana',
        user_email: 'ana@example.com',
        score: 2,
        my_vote: 'up',
        reactions: { ...emptyReactionCounts(), gosto: 1 },
        my_reaction: 'gosto',
        reply_count: 3,
      })
    ).toEqual({
      id: REVIEW_ID,
      userId: 'user-1',
      userName: 'Chefe Ana',
      userEmail: 'ana@example.com',
      rating: 4,
      comment: 'Boa',
      createdAt: createdAt.toISOString(),
      score: 2,
      myVote: 'up',
      reactions: { ...emptyReactionCounts(), gosto: 1 },
      myReaction: 'gosto',
      replyCount: 3,
    });
  });
});

describe('vote and reaction toggles', () => {
  it('toggles a vote off when the same value is sent again', () => {
    expect(nextVote(null, 'up')).toBe('up');
    expect(nextVote('up', 'up')).toBeNull();
    expect(nextVote('up', 'down')).toBe('down');
  });

  it('computes score as upvotes minus downvotes', () => {
    expect(computeVoteScore(['up', 'up', 'down'])).toBe(1);
  });

  it('parses and toggles reaction keys', () => {
    expect(parseReactionKey('adorei')).toBe('adorei');
    expect(parseReactionKey('raiva')).toBeNull();
    expect(nextReaction('adorei', 'haha')).toBe('haha');
    expect(nextReaction('haha', 'haha')).toBeNull();
  });

  it('rejects empty or overlong replies', () => {
    expect(parseReplyBody('  ')).toBeNull();
    expect(parseReplyBody('ok')).toBe('ok');
    expect(parseReplyBody('x'.repeat(2001))).toBeNull();
  });

  it('builds a mention prefix', () => {
    expect(mentionPrefix('Ana')).toBe('@Ana ');
    expect(parseVote('up')).toBe('up');
    expect(parseVote('sideways')).toBeNull();
  });
});
