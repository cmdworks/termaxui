import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function TerminalTabBar({ tabs = [], activeId, onSelectTab, onCloseTab, onNewTab, actions, children, className, style, }) {
    return (_jsxs("div", { role: "tablist", className: className, style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '36px',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '0 4px',
            overflowX: 'auto',
            userSelect: 'none',
            ...style,
        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, overflowX: 'auto' }, children: [children, tabs.map((tab) => (_jsxs("div", { onClick: () => onSelectTab?.(tab.id), style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            height: '32px',
                            fontSize: '12px',
                            fontWeight: tab.id === activeId ? 600 : 400,
                            backgroundColor: tab.id === activeId ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                            borderRight: '1px solid rgba(255, 255, 255, 0.06)',
                            borderBottom: tab.id === activeId ? '2px solid #58a6ff' : '2px solid transparent',
                            cursor: 'pointer',
                        }, children: [tab.icon, _jsx("span", { children: tab.title }), onCloseTab && (_jsx("button", { type: "button", onClick: (e) => {
                                    e.stopPropagation();
                                    onCloseTab(tab.id);
                                }, style: {
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'inherit',
                                    cursor: 'pointer',
                                    opacity: 0.6,
                                    marginLeft: 4,
                                }, children: "\u2715" }))] }, tab.id))), onNewTab && (_jsx("button", { type: "button", "aria-label": "New Tab", onClick: onNewTab, style: {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '28px',
                            height: '28px',
                            marginLeft: '4px',
                            border: 'none',
                            borderRadius: '4px',
                            background: 'transparent',
                            color: 'inherit',
                            cursor: 'pointer',
                            opacity: 0.7,
                            fontSize: '15px',
                        }, onMouseEnter: (e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'), onMouseLeave: (e) => (e.currentTarget.style.backgroundColor = 'transparent'), children: "+" }))] }), actions && _jsx("div", { style: { display: 'flex', alignItems: 'center', gap: '6px', padding: '0 8px' }, children: actions })] }));
}
