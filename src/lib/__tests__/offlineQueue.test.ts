import { describe, it, expect, beforeEach } from 'vitest';
import {
  queueMutation,
  getPendingMutations,
  clearMutation,
  clearAllMutations,
} from '../offlineQueue';

const QUEUE_KEY = 'crusade_sync_queue';

beforeEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// queueMutation
// ---------------------------------------------------------------------------
describe('queueMutation', () => {
  it('adds a mutation to localStorage', () => {
    queueMutation({ type: 'unit', action: 'create', data: { id: 'u1' } });
    const raw = localStorage.getItem(QUEUE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].type).toBe('unit');
    expect(parsed[0].action).toBe('create');
    expect(parsed[0].id).toBeDefined();
    expect(parsed[0].timestamp).toBeDefined();
  });

  it('appends multiple mutations', () => {
    queueMutation({ type: 'unit', action: 'create', data: { id: 'u1' } });
    queueMutation({ type: 'battle', action: 'create', data: { id: 'b1' } });
    const pending = getPendingMutations();
    expect(pending).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// getPendingMutations
// ---------------------------------------------------------------------------
describe('getPendingMutations', () => {
  it('returns empty array when queue is empty', () => {
    expect(getPendingMutations()).toEqual([]);
  });

  it('returns mutations sorted by timestamp', () => {
    // Queue two mutations — timestamps are auto-assigned by Date.now()
    queueMutation({ type: 'unit', action: 'create', data: { id: 'u1' } });
    queueMutation({ type: 'battle', action: 'create', data: { id: 'b1' } });

    const pending = getPendingMutations();
    expect(pending[0].timestamp).toBeLessThanOrEqual(pending[1].timestamp);
  });
});

// ---------------------------------------------------------------------------
// clearMutation
// ---------------------------------------------------------------------------
describe('clearMutation', () => {
  it('removes a specific mutation by id', () => {
    queueMutation({ type: 'unit', action: 'create', data: { id: 'u1' } });
    queueMutation({ type: 'battle', action: 'create', data: { id: 'b1' } });

    const pending = getPendingMutations();
    const idToRemove = pending[0].id;

    clearMutation(idToRemove);

    const remaining = getPendingMutations();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).not.toBe(idToRemove);
  });

  it('does nothing if id does not exist', () => {
    queueMutation({ type: 'unit', action: 'create', data: { id: 'u1' } });
    clearMutation('nonexistent-id');
    expect(getPendingMutations()).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// clearAllMutations
// ---------------------------------------------------------------------------
describe('clearAllMutations', () => {
  it('empties the queue', () => {
    queueMutation({ type: 'unit', action: 'create', data: { id: 'u1' } });
    queueMutation({ type: 'battle', action: 'create', data: { id: 'b1' } });
    expect(getPendingMutations()).toHaveLength(2);

    clearAllMutations();
    expect(getPendingMutations()).toEqual([]);
  });

  it('works on an already empty queue', () => {
    clearAllMutations();
    expect(getPendingMutations()).toEqual([]);
  });
});
