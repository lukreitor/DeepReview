import { afterEach, describe, expect, it } from 'vitest';

import { useReviewStore } from '@store/reviewStore';

describe('useReviewStore', () => {
  afterEach(() => {
    useReviewStore.getState().clear();
  });

  it('adds a new job when upserting an unknown id', () => {
    useReviewStore.getState().upsert({ id: 'job-1', status: 'pending' });
    expect(useReviewStore.getState().jobs).toHaveLength(1);
    expect(useReviewStore.getState().jobs[0]).toMatchObject({ id: 'job-1', status: 'pending' });
  });

  it('merges updates for an existing job', () => {
    const { upsert } = useReviewStore.getState();
    upsert({ id: 'job-1', status: 'pending' });
    upsert({ id: 'job-1', status: 'completed', score: 8.7 });

    const state = useReviewStore.getState();
    expect(state.jobs).toHaveLength(1);
    expect(state.jobs[0]).toMatchObject({ id: 'job-1', status: 'completed', score: 8.7 });
  });

  it('removes jobs individually and clears all jobs', () => {
    const { upsert, remove, clear } = useReviewStore.getState();
    upsert({ id: 'job-1', status: 'pending' });
    upsert({ id: 'job-2', status: 'processing' });

    remove('job-1');
    let state = useReviewStore.getState();
    expect(state.jobs).toHaveLength(1);
    expect(state.jobs[0].id).toBe('job-2');

    clear();
    state = useReviewStore.getState();
    expect(state.jobs).toHaveLength(0);
  });
});
