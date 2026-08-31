import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTerminalContext } from './TerminalContext.js';
export function TerminalDropZone({ children, className, style, }) {
    const { isDropTarget, theme } = useTerminalContext();
    if (!isDropTarget)
        return null;
    if (typeof children === 'function') {
        return _jsx(_Fragment, { children: children({ isOver: isDropTarget }) });
    }
    if (children) {
        return _jsx(_Fragment, { children: children });
    }
    return (_jsx("div", { className: className, style: {
            position: 'absolute',
            inset: 0,
            zIndex: 40,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(88, 166, 255, 0.12)',
            border: `2px dashed ${theme.blue || '#58a6ff'}`,
            borderRadius: '6px',
            backdropFilter: 'blur(2px)',
            ...style,
        }, children: _jsxs("div", { style: {
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: theme.background || '#18181b',
                color: theme.foreground || '#fafafa',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                fontSize: '13px',
                fontWeight: 500,
            }, children: [_jsx("span", { children: "\uD83D\uDCC1" }), _jsx("span", { children: "Drop files or folders to insert path" })] }) }));
}
