import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { emptyReactionCounts } from '@/lib/ratings';

const ACTIVITY_ID = '550e8400-e29b-41d4-a716-446655440003';
const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const OTHER_ID = '550e8400-e29b-41d4-a716-446655440001';
const REVIEW_ID = '550e8400-e29b-41d4-a716-446655440099';
const REPLY_ID = '550e8400-e29b-41d4-a716-446655440088';

const mockAuth = vi.fn();
const mockActivityExists = vi.fn();
const mockFindReviewById = vi.fn();
const mockUpsertVote = vi.fn();
const mockUpsertReviewReaction = vi.fn();
const mockUpsertReplyReaction = vi.fn();
const mockListReplies = vi.fn();
const mockInsertReply = vi.fn();
const mockFindReply = vi.fn();
const mockUpdateReply = vi.fn();
const mockDeleteReply = vi.fn();

vi.mock('@/lib/auth/config', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/ratings/store', () => ({
  activityExists: (...args: unknown[]) => mockActivityExists(...args),
  findReviewById: (...args: unknown[]) => mockFindReviewById(...args),
  upsertVote: (...args: unknown[]) => mockUpsertVote(...args),
  upsertReviewReaction: (...args: unknown[]) => mockUpsertReviewReaction(...args),
  upsertReplyReaction: (...args: unknown[]) => mockUpsertReplyReaction(...args),
  listReplies: (...args: unknown[]) => mockListReplies(...args),
  insertReply: (...args: unknown[]) => mockInsertReply(...args),
  findReply: (...args: unknown[]) => mockFindReply(...args),
  updateReply: (...args: unknown[]) => mockUpdateReply(...args),
  deleteReply: (...args: unknown[]) => mockDeleteReply(...args),
}));

function requestFor(path: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`http://localhost:3000${path}`, init);
}

const params = Promise.resolve({ id: ACTIVITY_ID, reviewId: REVIEW_ID });
const replyParams = Promise.resolve({
  id: ACTIVITY_ID,
  reviewId: REVIEW_ID,
  replyId: REPLY_ID,
});

describe('Review discussion API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: USER_ID, name: 'Chefe Ana' } });
    mockActivityExists.mockResolvedValue(true);
    mockFindReviewById.mockResolvedValue({ id: REVIEW_ID, activity_id: ACTIVITY_ID });
    mockUpsertVote.mockResolvedValue('up');
    mockUpsertReviewReaction.mockResolvedValue('adorei');
    mockUpsertReplyReaction.mockResolvedValue('gosto');
    mockListReplies.mockResolvedValue([]);
    mockInsertReply.mockResolvedValue(REPLY_ID);
    mockFindReply.mockResolvedValue({ id: REPLY_ID, user_id: USER_ID, review_id: REVIEW_ID });
  });

  it('rejects guest votes with 401', async () => {
    mockAuth.mockResolvedValue(null);
    const { POST } = await import('@/app/api/activities/[id]/ratings/[reviewId]/vote/route');
    const response = await POST(
      requestFor(`/api/activities/${ACTIVITY_ID}/ratings/${REVIEW_ID}/vote`, {
        method: 'POST',
        body: JSON.stringify({ value: 'up' }),
      }),
      { params }
    );
    expect(response.status).toBe(401);
    expect(mockUpsertVote).not.toHaveBeenCalled();
  });

  it('upserts an upvote', async () => {
    const { POST } = await import('@/app/api/activities/[id]/ratings/[reviewId]/vote/route');
    const response = await POST(
      requestFor(`/api/activities/${ACTIVITY_ID}/ratings/${REVIEW_ID}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: 'up' }),
      }),
      { params }
    );
    expect(response.status).toBe(200);
    expect(mockUpsertVote).toHaveBeenCalledWith(REVIEW_ID, USER_ID, 'up');
    await expect(response.json()).resolves.toEqual({ myVote: 'up' });
  });

  it('clears a vote when the helper returns null', async () => {
    mockUpsertVote.mockResolvedValue(null);
    const { POST } = await import('@/app/api/activities/[id]/ratings/[reviewId]/vote/route');
    const response = await POST(
      requestFor(`/api/activities/${ACTIVITY_ID}/ratings/${REVIEW_ID}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: 'up' }),
      }),
      { params }
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ myVote: null });
  });

  it('rejects unknown reaction keys', async () => {
    const { POST } = await import('@/app/api/activities/[id]/ratings/[reviewId]/reactions/route');
    const response = await POST(
      requestFor(`/api/activities/${ACTIVITY_ID}/ratings/${REVIEW_ID}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'raiva' }),
      }),
      { params }
    );
    expect(response.status).toBe(400);
    expect(mockUpsertReviewReaction).not.toHaveBeenCalled();
  });

  it('rejects guest reactions', async () => {
    mockAuth.mockResolvedValue(null);
    const { POST } = await import('@/app/api/activities/[id]/ratings/[reviewId]/reactions/route');
    const response = await POST(
      requestFor(`/api/activities/${ACTIVITY_ID}/ratings/${REVIEW_ID}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ key: 'gosto' }),
      }),
      { params }
    );
    expect(response.status).toBe(401);
  });

  it('replaces a review reaction', async () => {
    const { POST } = await import('@/app/api/activities/[id]/ratings/[reviewId]/reactions/route');
    const response = await POST(
      requestFor(`/api/activities/${ACTIVITY_ID}/ratings/${REVIEW_ID}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'adorei' }),
      }),
      { params }
    );
    expect(response.status).toBe(200);
    expect(mockUpsertReviewReaction).toHaveBeenCalledWith(REVIEW_ID, USER_ID, 'adorei');
  });

  it('reacts to a reply', async () => {
    const { POST } = await import(
      '@/app/api/activities/[id]/ratings/[reviewId]/replies/[replyId]/reactions/route'
    );
    const response = await POST(
      requestFor(
        `/api/activities/${ACTIVITY_ID}/ratings/${REVIEW_ID}/replies/${REPLY_ID}/reactions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'gosto' }),
        }
      ),
      { params: replyParams }
    );
    expect(response.status).toBe(200);
    expect(mockUpsertReplyReaction).toHaveBeenCalledWith(REPLY_ID, USER_ID, 'gosto');
  });

  it('lists replies oldest-first from the store', async () => {
    mockListReplies.mockResolvedValue([
      {
        id: REPLY_ID,
        reviewId: REVIEW_ID,
        userId: USER_ID,
        userName: 'Ana',
        body: 'Primeira',
        mentionUserId: null,
        createdAt: '2026-09-05T10:00:00.000Z',
        reactions: emptyReactionCounts(),
        myReaction: null,
      },
    ]);
    const { GET } = await import('@/app/api/activities/[id]/ratings/[reviewId]/replies/route');
    const response = await GET(
      requestFor(`/api/activities/${ACTIVITY_ID}/ratings/${REVIEW_ID}/replies`),
      { params }
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.replies[0].body).toBe('Primeira');
  });

  it('rejects guest replies', async () => {
    mockAuth.mockResolvedValue(null);
    const { POST } = await import('@/app/api/activities/[id]/ratings/[reviewId]/replies/route');
    const response = await POST(
      requestFor(`/api/activities/${ACTIVITY_ID}/ratings/${REVIEW_ID}/replies`, {
        method: 'POST',
        body: JSON.stringify({ body: 'Olá' }),
      }),
      { params }
    );
    expect(response.status).toBe(401);
    expect(mockInsertReply).not.toHaveBeenCalled();
  });

  it('creates a sibling reply with an optional mention', async () => {
    const { POST } = await import('@/app/api/activities/[id]/ratings/[reviewId]/replies/route');
    const response = await POST(
      requestFor(`/api/activities/${ACTIVITY_ID}/ratings/${REVIEW_ID}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: '@Ana também', mentionUserId: OTHER_ID }),
      }),
      { params }
    );
    expect(response.status).toBe(201);
    expect(mockInsertReply).toHaveBeenCalledWith({
      reviewId: REVIEW_ID,
      userId: USER_ID,
      body: '@Ana também',
      mentionUserId: OTHER_ID,
    });
  });

  it('forbids deleting another user reply', async () => {
    mockFindReply.mockResolvedValue({ id: REPLY_ID, user_id: OTHER_ID, review_id: REVIEW_ID });
    const { DELETE } = await import(
      '@/app/api/activities/[id]/ratings/[reviewId]/replies/[replyId]/route'
    );
    const response = await DELETE(
      requestFor(`/api/activities/${ACTIVITY_ID}/ratings/${REVIEW_ID}/replies/${REPLY_ID}`, {
        method: 'DELETE',
      }),
      { params: replyParams }
    );
    expect(response.status).toBe(403);
    expect(mockDeleteReply).not.toHaveBeenCalled();
  });
});
