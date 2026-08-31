import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useTerminalContext } from './TerminalContext.js';
export function TerminalScreen({ className, style }) {
    const { containerRef, search } = useTerminalContext();
    // Keyboard shortcut: Cmd+F / Ctrl+F opens search
    useEffect(() => {
        const handleKeyDown = (e) => {
            const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
            const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
            if (cmdOrCtrl && (e.key === 'f' || e.key === 'F')) {
                e.preventDefault();
                search.toggle();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [search]);
    return (_jsx("div", { ref: containerRef, className: className, style: {
            position: 'relative',
            flex: 1,
            width: '100%',
            height: '100%',
            minHeight: 0,
            outline: 'none',
            overflow: 'hidden',
            ...style,
        } }));
}
