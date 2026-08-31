import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
import { TerminalContext } from './TerminalContext.js';
import { useTerminal } from './hooks/useTerminal.js';
import { useTerminalDrop } from './hooks/useTerminalDrop.js';
import { useTerminalSearch } from './hooks/useTerminalSearch.js';
import { useTerminalSelection } from './hooks/useTerminalSelection.js';
import { BUILTIN_THEMES } from './themes.js';
export function TerminalRoot({ children, className, style, onDropFiles, ...options }) {
    const terminalHook = useTerminal(options);
    const searchHook = useTerminalSearch(terminalHook.terminal);
    const selectionHook = useTerminalSelection(terminalHook.terminal);
    const dropHook = useTerminalDrop(terminalHook.terminal, {
        onDrop: onDropFiles,
    });
    const resolvedTheme = typeof options.theme === 'string'
        ? (BUILTIN_THEMES[options.theme] || BUILTIN_THEMES.termax)
        : (options.theme || BUILTIN_THEMES.termax);
    const contextValue = useMemo(() => ({
        ...terminalHook,
        theme: resolvedTheme,
        search: searchHook,
        selection: selectionHook,
        isDropTarget: dropHook.isDropTarget,
    }), [terminalHook, resolvedTheme, searchHook, selectionHook, dropHook.isDropTarget]);
    return (_jsx(TerminalContext.Provider, { value: contextValue, children: _jsx("div", { className: className, style: {
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                backgroundColor: resolvedTheme.background || '#0f1217',
                color: resolvedTheme.foreground || '#e6edf3',
                overflow: 'hidden',
                ...style,
            }, children: children }) }));
}
