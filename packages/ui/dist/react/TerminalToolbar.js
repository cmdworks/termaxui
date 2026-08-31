import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTerminalContext } from './TerminalContext.js';
export function TerminalToolbar({ title = 'termaxui ~ zsh', showTrafficLights = true, actions = [], className, style, }) {
    const { clear, search, theme } = useTerminalContext();
    return (_jsxs("div", { className: className, style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '38px',
            padding: '0 12px',
            borderBottom: `1px solid ${theme.selectionBackground || 'rgba(255, 255, 255, 0.1)'}`,
            backgroundColor: theme.black || '#0f1217',
            userSelect: 'none',
            fontSize: '12px',
            ...style,
        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [showTrafficLights && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px' }, children: [_jsx("span", { style: { width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ff5f56' } }), _jsx("span", { style: { width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ffbd2e' } }), _jsx("span", { style: { width: 10, height: 10, borderRadius: '50%', backgroundColor: '#27c93f' } })] })), _jsx("span", { style: { fontWeight: 500, opacity: 0.85, marginLeft: showTrafficLights ? 6 : 0 }, children: title })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [actions, _jsx("button", { type: "button", onClick: () => search.toggle(), style: {
                            padding: '3px 8px',
                            fontSize: '11px',
                            borderRadius: '4px',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            background: search.isOpen ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                            color: 'inherit',
                            cursor: 'pointer',
                        }, children: "Find" }), _jsx("button", { type: "button", onClick: () => clear(), style: {
                            padding: '3px 8px',
                            fontSize: '11px',
                            borderRadius: '4px',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            background: 'transparent',
                            color: 'inherit',
                            cursor: 'pointer',
                        }, children: "Clear" })] })] }));
}
