import { createContext, useContext } from 'react';
export const TerminalContext = createContext(null);
export function useTerminalContext() {
    const ctx = useContext(TerminalContext);
    if (!ctx) {
        throw new Error('useTerminalContext must be used within a <TerminalRoot />');
    }
    return ctx;
}
