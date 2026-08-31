import React, { createContext, useContext } from 'react';
import { Terminal } from '../Terminal.js';
import { TerminalTheme } from '../types.js';
import { useTerminalSearch } from './hooks/useTerminalSearch.js';
import { useTerminalSelection } from './hooks/useTerminalSelection.js';

export interface TerminalContextValue {
  terminal: Terminal | null;
  containerRef: (node: HTMLDivElement | null) => void;
  theme: TerminalTheme;
  write: (data: string | Uint8Array) => void;
  writeln: (data: string | Uint8Array) => void;
  clear: () => void;
  focus: () => void;
  blur: () => void;
  fit: () => void;
  search: ReturnType<typeof useTerminalSearch>;
  selection: ReturnType<typeof useTerminalSelection>;
  isDropTarget: boolean;
}

export const TerminalContext = createContext<TerminalContextValue | null>(null);

export function useTerminalContext(): TerminalContextValue {
  const ctx = useContext(TerminalContext);
  if (!ctx) {
    throw new Error('useTerminalContext must be used within a <TerminalRoot />');
  }
  return ctx;
}
