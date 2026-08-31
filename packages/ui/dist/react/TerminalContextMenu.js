import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useTerminalContext } from './TerminalContext.js';
export function TerminalContextMenu({ customItems = [], className, style, }) {
    const { terminal, selection, clear, theme } = useTerminalContext();
    const [menuPos, setMenuPos] = useState(null);
    useEffect(() => {
        if (!terminal || !terminal.element)
            return;
        const el = terminal.element;
        const handleContextMenu = (e) => {
            e.preventDefault();
            const x = Math.min(e.clientX, window.innerWidth - 180);
            const y = Math.min(e.clientY, window.innerHeight - 200);
            setMenuPos({ x, y });
        };
        const handleClickOutside = () => {
            setMenuPos(null);
        };
        el.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('click', handleClickOutside);
        return () => {
            el.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('click', handleClickOutside);
        };
    }, [terminal]);
    if (!menuPos)
        return null;
    const handleCopy = () => {
        selection.copyToClipboard();
        setMenuPos(null);
    };
    const handlePaste = async () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            try {
                const text = await navigator.clipboard.readText();
                if (text)
                    terminal?.paste(text);
            }
            catch { }
        }
        setMenuPos(null);
    };
    const handleSelectAll = () => {
        selection.selectAll();
        setMenuPos(null);
    };
    const handleClear = () => {
        clear();
        setMenuPos(null);
    };
    return (_jsxs("div", { className: className, style: {
            position: 'fixed',
            left: menuPos.x,
            top: menuPos.y,
            zIndex: 1000,
            minWidth: '160px',
            padding: '4px',
            backgroundColor: theme.background || '#18181b',
            color: theme.foreground || '#fafafa',
            border: `1px solid ${theme.selectionBackground || 'rgba(255, 255, 255, 0.15)'}`,
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(16px)',
            fontSize: '12px',
            userSelect: 'none',
            ...style,
        }, children: [_jsxs("div", { onClick: handleCopy, style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                }, onMouseEnter: (e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'), onMouseLeave: (e) => (e.currentTarget.style.backgroundColor = 'transparent'), children: [_jsx("span", { children: "Copy" }), _jsx("span", { style: { opacity: 0.5, fontSize: '11px' }, children: "Cmd+C" })] }), _jsxs("div", { onClick: handlePaste, style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                }, onMouseEnter: (e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'), onMouseLeave: (e) => (e.currentTarget.style.backgroundColor = 'transparent'), children: [_jsx("span", { children: "Paste" }), _jsx("span", { style: { opacity: 0.5, fontSize: '11px' }, children: "Cmd+V" })] }), _jsxs("div", { onClick: handleSelectAll, style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                }, onMouseEnter: (e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'), onMouseLeave: (e) => (e.currentTarget.style.backgroundColor = 'transparent'), children: [_jsx("span", { children: "Select All" }), _jsx("span", { style: { opacity: 0.5, fontSize: '11px' }, children: "Cmd+A" })] }), _jsx("div", { style: { height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '4px 0' } }), customItems.map((item, idx) => (_jsxs("div", { onClick: () => {
                    item.onClick(selection.selectionText);
                    setMenuPos(null);
                }, style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: item.destructive ? (theme.red || '#ff5555') : 'inherit',
                }, onMouseEnter: (e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'), onMouseLeave: (e) => (e.currentTarget.style.backgroundColor = 'transparent'), children: [_jsx("span", { children: item.label }), item.shortcut && _jsx("span", { style: { opacity: 0.5, fontSize: '11px' }, children: item.shortcut })] }, idx))), customItems.length > 0 && (_jsx("div", { style: { height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '4px 0' } })), _jsx("div", { onClick: handleClear, style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    color: theme.red || '#ff5555',
                }, onMouseEnter: (e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 85, 85, 0.15)'), onMouseLeave: (e) => (e.currentTarget.style.backgroundColor = 'transparent'), children: _jsx("span", { children: "Clear Output" }) })] }));
}
