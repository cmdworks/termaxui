import { createContext, useContext } from 'react';
export const PanelGroupContext = createContext(null);
export function usePanelGroupContext() {
    const ctx = useContext(PanelGroupContext);
    if (!ctx) {
        throw new Error('usePanelGroupContext must be used within a <TerminalPanelGroup />');
    }
    return ctx;
}
