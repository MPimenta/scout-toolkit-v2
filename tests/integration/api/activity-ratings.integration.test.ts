import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { emptyDiscussionSummary } from '@/lib/ratings';

const ACTIVITY_ID = '550e8400-e29b-41d4-a716-446655440003';
const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const REVIEW_ID = '550e8400-e29b-41d4-a716-446655440099';

const mockAuth = vi.fn();
const mockActivityExists = vi.fn();
const mockListActivityReviews = vi.fn();
const mockFindOwnReview = vi.fn();
const mockInsertReview = vi.fn();
const mockUpdateReview = vi.fn();
const mockListDiscussionSummaries = vi.fn();

vi.mock('@/lib/auth/config', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/ratings/store', () => ({
  activityExists: (...args: unknown[]) => mockActivityExists(...args),
  listActivityReviews: (...args: unknown[]) => mockListActivityReviews(...args),
  findOwnReview: (...args: unknown[]) => mockFindOwnReview(...args),
  insertReview: (...args: unknown[]) => mockInsertReview(...args),
  updateReview: (...args: unknown[]) => mockUpdateReview(...args),
  listDiscussionSummaries: (...args: unknown[]) => mockListDiscussionSummaries(...args),
}));

function requestFor(path: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`http://localhost:3000${path}`, init);
}

describe('Activity ratings API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(null);
    mockActivityExists.mockResolvedValue(true);
    mockListActivityReviews.mockResolvedValue([]);
    mockFindOwnReview.mockResolvedValue(undefined);
    mockInsertReview.mockResolvedValue(REVIEW_ID);
    mockUpdateReview.mockResolvedValue(undefined);
    mockListDiscussionSummaries.mockResolvedValue({});
  });

  it('returns an empty public average without auth', async () => {
    const { GET } = await import('@/app/api/activities/[id]/ratings/route');
    const response = await GET(requestFor(`/api/activities/${ACTIVITY_ID}/ratings`), {
      params: Promise.resolve({ id: ACTIVITY_ID }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      average: 0,
      count: 0,
      reviews: [],
      mine: null,
    });
  });

  it('includes mine and a discussion summary when reviews exist', async () => {
    mockAuth.mockResolvedValue({ user: { id: USER_ID, name: 'Chefe Ana', email: 'ana@example.com' } });
    mockListActivityReviews.mockResolvedValue([
      {
        id: REVIEW_ID,
        activity_id: ACTIVITY_ID,
        user_id: USER_ID,
        rating: 4,
        comment: 'Boa',
        created_at: new Date('2026-09-05T10:00:00.000Z'),
        user_name: 'Chefe Ana',
        user_email: 'ana@example.com',
      },
    ]);
    mockListDiscussionSummaries.mockResolvedValue({
      [REVIEW_ID]: {
        score: 2,
        myVote: 'up',
        reactions: { ...emptyDiscussionSummary().reactions, gosto: 1 },
        myReaction: 'gosto',
        replyCount: 3,
      },
    });

    const { GET } = await import('@/app/api/activities/[id]/ratings/route');
    const response = await GET(requestFor(`/api/activities/${ACTIVITY_ID}/ratings`), {
      params: Promise.resolve({ id: ACTIVITY_ID }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.average).toBe(4);
    expect(body.count).toBe(1);
    expect(body.mine.rating).toBe(4);
    expect(body.mine.id).toBe(REVIEW_ID);
    expect(body.reviews[0].score).toBe(2);
    expect(body.reviews[0].reactions.gosto).toBe(1);
    expect(body.reviews[0].replyCount).toBe(3);
  });

  it('returns 404 for an unknown activity', async () => {
    mockActivityExists.mockResolvedValue(false);
    const { GET } = await import('@/app/api/activities/[id]/ratings/route');
    const response = await GET(requestFor(`/api/activities/${ACTIVITY_ID}/ratings`), {
      params: Promise.resolve({ id: ACTIVITY_ID }),
    });

    expect(response.status).toBe(404);
  });

  it('rejects anonymous submits', async () => {
    const { POST } = await import('@/app/api/activities/[id]/ratings/route');
    const response = await POST(
      requestFor(`/api/activities/${ACTIVITY_ID}/ratings`, {
        method: 'POST',
        body: JSON.stringify({ rating: 4 }),
      }),
      { params: Promise.resolve({ id: ACTIVITY_ID }) }
    );

    expect(response.status).toBe(401);
    expect(mockInsertReview).not.toHaveBeenCalled();
  });

  it('rejects ratings outside 1–5', async () => {
    mockAuth.mockResolvedValue({ user: { id: USER_ID, name: 'Chefe Ana' } });
    const { POST } = await import('@/app/api/activities/[id]/ratings/route');
    const response = await POST(
      requestFor(`/api/activities/${ACTIVITY_ID}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 6 }),
      }),
      { params: Promise.resolve({ id: ACTIVITY_ID }) }
    );

    expect(response.status).toBe(400);
    expect(mockInsertReview).not.toHaveBeenCalled();
  });

  it('creates a first rating with 201', async () => {
    mockAuth.mockResolvedValue({ user: { id: USER_ID, name: 'Chefe Ana', email: 'ana@example.com' } });
    const { POST } = await import('@/app/api/activities/[id]/ratings/route');
    const response = await POST(
      requestFor(`/api/activities/${ACTIVITY_ID}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 4, comment: 'Boa' }),
      }),
      { params: Promise.resolve({ id: ACTIVITY_ID }) }
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.review.rating).toBe(4);
    expect(body.review.id).toBe(REVIEW_ID);
    expect(mockInsertReview).toHaveBeenCalledWith({
      activityId: ACTIVITY_ID,
      userId: USER_ID,
      rating: 4,
      comment: 'Boa',
    });
  });

  it('updates an existing rating with 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: USER_ID, name: 'Chefe Ana' } });
    mockFindOwnReview.mockResolvedValue({ id: REVIEW_ID, user_id: USER_ID });
    const { POST } = await import('@/app/api/activities/[id]/ratings/route');
    const response = await POST(
      requestFor(`/api/activities/${ACTIVITY_ID}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 5 }),
      }),
      { params: Promise.resolve({ id: ACTIVITY_ID }) }
    );

    expect(response.status).toBe(200);
    expect(mockUpdateReview).toHaveBeenCalled();
    expect(mockInsertReview).not.toHaveBeenCalled();
  });
});
