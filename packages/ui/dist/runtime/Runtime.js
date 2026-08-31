import { TerminalSlotPool } from './SlotPool.js';
import { DormantRing } from './DormantRing.js';
import { ShellStateManager } from './ShellStateManager.js';
import { GhostTextManager } from './GhostTextManager.js';
export class TerminalSession {
    id;
    dormantRing;
    shellState = null;
    ghostText = null;
    onDataCallback;
    onCwdCallback;
    constructor(options) {
        this.id = options.id;
        this.dormantRing = new DormantRing();
        this.onDataCallback = options.onData;
        this.onCwdCallback = options.onCwdChange;
    }
    write(data) {
        if (typeof data === 'string') {
            const encoder = new TextEncoder();
            const bytes = encoder.encode(data);
            this.onDataCallback?.(bytes);
        }
        else {
            this.onDataCallback?.(data);
        }
    }
    setCwd(cwd) {
        this.onCwdCallback?.(cwd);
    }
}
export class TerminalRuntime {
    slotPool;
    sessions = new Map();
    options;
    constructor(options = {}) {
        this.options = options;
        this.slotPool = new TerminalSlotPool(options);
    }
    createSession(options) {
        const session = new TerminalSession(options);
        this.sessions.set(options.id, session);
        return session;
    }
    getSession(id) {
        return this.sessions.get(id);
    }
    mountSession(sessionId, container) {
        const session = this.sessions.get(sessionId);
        if (!session)
            throw new Error(`Session ${sessionId} not found`);
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
    parkSession(sessionId) {
        this.slotPool.park(sessionId);
    }
    disposeSession(sessionId) {
        this.slotPool.release(sessionId);
        const session = this.sessions.get(sessionId);
        if (session) {
            session.shellState?.dispose();
            session.ghostText?.dispose();
            this.sessions.delete(sessionId);
        }
    }
    dispose() {
        for (const [id] of this.sessions) {
            this.disposeSession(id);
        }
        this.slotPool.dispose();
    }
}
export function createTerminalRuntime(options) {
    return new TerminalRuntime(options);
}
