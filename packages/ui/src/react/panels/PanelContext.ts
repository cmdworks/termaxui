import { createContext, useContext } from 'react';

export interface PanelGroupContextValue {
  direction: 'horizontal' | 'vertical';
  registerPanel: (id: string, defaultSize: number, minSize: number) => void;
  unregisterPanel: (id: string) => void;
  getPanelSize: (id: string) => number;
  startDragging: (handleIndex: number, clientPos: number) => void;
  equalizeSizes: () => void;
}

export const PanelGroupContext = createContext<PanelGroupContextValue | null>(null);

export function usePanelGroupContext(): PanelGroupContextValue {
  const ctx = useContext(PanelGroupContext);
  if (!ctx) {
    throw new Error('usePanelGroupContext must be used within a <TerminalPanelGroup />');
  }
  return ctx;
}
