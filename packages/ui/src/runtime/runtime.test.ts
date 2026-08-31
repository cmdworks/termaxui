import { describe, it, expect, beforeEach } from 'vitest';
import { DormantRing } from './DormantRing.js';
import { createTerminalRuntime, TerminalRuntime } from './Runtime.js';

describe('DormantRing Buffer', () => {
  it('should push and drain bytes in FIFO order', () => {
    const ring = new DormantRing(1024);
    const chunk1 = new Uint8Array([1, 2, 3]);
    const chunk2 = new Uint8Array([4, 5, 6]);

    ring.push(chunk1);
    ring.push(chunk2);
    expect(ring.byteLength()).toBe(6);

    const received: number[] = [];
    ring.drain((chunk) => {
      received.push(...chunk);
    });

    expect(received).toEqual([1, 2, 3, 4, 5, 6]);
    expect(ring.byteLength()).toBe(0);
  });

  it('should evict oldest chunks when max capacity is reached', () => {
    const ring = new DormantRing(5);
    ring.push(new Uint8Array([1, 2, 3]));
    ring.push(new Uint8Array([4, 5, 6])); // Exceeds 5 bytes

    expect(ring.byteLength()).toBeLessThanOrEqual(5);
    const received: number[] = [];
    ring.drain((chunk) => received.push(...chunk));
    expect(received).toEqual([4, 5, 6]);
  });
});

describe('TerminalRuntime Headless Engine', () => {
  let runtime: TerminalRuntime;

  beforeEach(() => {
    runtime = createTerminalRuntime({ maxSlots: 3 });
  });

  it('should create and retrieve sessions', () => {
    const session = runtime.createSession({ id: 'test-session-1' });
    expect(session.id).toBe('test-session-1');
    expect(runtime.getSession('test-session-1')).toBe(session);
  });

  it('should handle session disposal', () => {
    runtime.createSession({ id: 'session-to-dispose' });
    runtime.disposeSession('session-to-dispose');
    expect(runtime.getSession('session-to-dispose')).toBeUndefined();
  });
});
