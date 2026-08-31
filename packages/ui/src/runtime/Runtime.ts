import { TerminalSlotPool, SlotPoolOptions } from './SlotPool.js';
import { DormantRing } from './DormantRing.js';
import { ShellStateManager } from './ShellStateManager.js';
import { GhostTextManager } from './GhostTextManager.js';

export interface TerminalSessionOptions {
  id: string;
  initialCwd?: string;
  onData?: (bytes: Uint8Array) => void;
  onCwdChange?: (cwd: string) => void;
}

export class TerminalSession {
  readonly id: string;
  readonly dormantRing: DormantRing;
  shellState: ShellStateManager | null = null;
  ghostText: GhostTextManager | null = null;
  private onDataCallback?: (bytes: Uint8Array) => void;
  private onCwdCallback?: (cwd: string) => void;

  constructor(options: TerminalSessionOptions) {
    this.id = options.id;
    this.dormantRing = new DormantRing();
    this.onDataCallback = options.onData;
    this.onCwdCallback = options.onCwdChange;
  }

  write(data: string | Uint8Array): void {
    if (typeof data === 'string') {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(data);
      this.onDataCallback?.(bytes);
    } else {
      this.onDataCallback?.(data);
    }
  }

  setCwd(cwd: string): void {
    this.onCwdCallback?.(cwd);
  }
}

export interface TerminalRuntimeOptions extends SlotPoolOptions {
  enableAiGhostText?: boolean;
}

export class TerminalRuntime {
  readonly slotPool: TerminalSlotPool;
  private sessions: Map<string, TerminalSession> = new Map();
  private options: TerminalRuntimeOptions;

  constructor(options: TerminalRuntimeOptions = {}) {
    this.options = options;
    this.slotPool = new TerminalSlotPool(options);
  }

  createSession(options: TerminalSessionOptions): TerminalSession {
    const session = new TerminalSession(options);
    this.sessions.set(options.id, session);
    return session;
  }

  getSession(id: string): TerminalSession | undefined {
    return this.sessions.get(id);
  }

  mountSession(sessionId: string, container: HTMLElement) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const slot = this.slotPool.acquire(sessionId, container);
    session.dormantRing.drain((chunk) => slot.terminal.write(chunk));

    if (!session.shellState) {
      session.shellState = new ShellStateManager(slot.terminal);
      session.shellState.addListener({
        onCwdChange: (cwd) => session.setCwd(cwd),
      });
    }

    if (this.options.enableAiGhostText && !session.ghostText) {
      session.ghostText = new GhostTextManager(slot.terminal);
    }

    return slot;
  }

  parkSession(sessionId: string): void {
    this.slotPool.park(sessionId);
  }

  disposeSession(sessionId: string): void {
    this.slotPool.release(sessionId);
    const session = this.sessions.get(sessionId);
    if (session) {
      session.shellState?.dispose();
      session.ghostText?.dispose();
      this.sessions.delete(sessionId);
    }
  }

  dispose(): void {
    for (const [id] of this.sessions) {
      this.disposeSession(id);
    }
    this.slotPool.dispose();
  }
}

export function createTerminalRuntime(options?: TerminalRuntimeOptions): TerminalRuntime {
  return new TerminalRuntime(options);
}
