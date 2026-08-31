import { Terminal } from '../Terminal.js';
import { FitAddon, SearchAddon, SerializeAddon } from '../addons/xterm-compat.js';

export interface TerminalSlot {
  readonly id: number;
  readonly terminal: Terminal;
  readonly fitAddon: FitAddon;
  readonly searchAddon: SearchAddon;
  readonly serializeAddon: SerializeAddon;
  readonly host: HTMLDivElement;
  currentSessionId: string | null;
  lastUsedAt: number;
}

export interface SlotPoolOptions {
  maxSlots?: number;
  scrollbackCap?: number;
}

export class TerminalSlotPool {
  private slots: TerminalSlot[] = [];
  private maxSlots: number;
  private scrollbackCap: number;

  constructor(options: SlotPoolOptions = {}) {
    this.maxSlots = options.maxSlots ?? 5;
    this.scrollbackCap = options.scrollbackCap ?? 10_000;
  }

  acquire(sessionId: string, container: HTMLElement): TerminalSlot {
    let slot = this.slots.find((s) => s.currentSessionId === sessionId);
    if (slot) {
      slot.lastUsedAt = performance.now();
      if (slot.host.parentNode !== container) {
        container.appendChild(slot.host);
      }
      slot.fitAddon.fit();
      return slot;
    }

    slot = this.slots.find((s) => s.currentSessionId === null);
    if (!slot && this.slots.length < this.maxSlots) {
      slot = this.createSlot();
    }

    if (!slot) {
      // LRU Eviction of oldest idle slot
      let oldestIdx = -1;
      let oldestTime = Number.POSITIVE_INFINITY;
      for (let i = 0; i < this.slots.length; i++) {
        if (this.slots[i].lastUsedAt < oldestTime) {
          oldestTime = this.slots[i].lastUsedAt;
          oldestIdx = i;
        }
      }
      slot = this.slots[oldestIdx];
      this.evict(slot);
    }

    slot.currentSessionId = sessionId;
    slot.lastUsedAt = performance.now();
    if (slot.host.parentNode !== container) {
      container.appendChild(slot.host);
    }
    slot.fitAddon.fit();
    return slot;
  }

  park(sessionId: string): void {
    const slot = this.slots.find((s) => s.currentSessionId === sessionId);
    if (slot) {
      slot.lastUsedAt = performance.now();
    }
  }

  release(sessionId: string): string | null {
    const slot = this.slots.find((s) => s.currentSessionId === sessionId);
    if (!slot) return null;
    const snapshot = slot.serializeAddon.serialize({ scrollback: this.scrollbackCap });
    this.evict(slot);
    return snapshot;
  }

  private createSlot(): TerminalSlot {
    const terminal = new Terminal({
      scrollback: this.scrollbackCap,
      allowProposedApi: true,
    });
    const fitAddon = new FitAddon();
    const searchAddon = new SearchAddon();
    const serializeAddon = new SerializeAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(searchAddon);
    terminal.loadAddon(serializeAddon);

    const host = document.createElement('div');
    host.style.cssText = 'width:100%;height:100%;position:relative;box-sizing:border-box;';
    host.setAttribute('data-termax-slot', String(this.slots.length));
    terminal.open(host);

    const slot: TerminalSlot = {
      id: this.slots.length,
      terminal,
      fitAddon,
      searchAddon,
      serializeAddon,
      host,
      currentSessionId: null,
      lastUsedAt: performance.now(),
    };

    this.slots.push(slot);
    return slot;
  }

  private evict(slot: TerminalSlot): void {
    slot.currentSessionId = null;
    slot.terminal.clear();
    slot.terminal.reset();
    if (slot.host.parentNode) {
      slot.host.parentNode.removeChild(slot.host);
    }
  }

  dispose(): void {
    for (const slot of this.slots) {
      slot.terminal.dispose();
      if (slot.host.parentNode) {
        slot.host.parentNode.removeChild(slot.host);
      }
    }
    this.slots = [];
  }
}
