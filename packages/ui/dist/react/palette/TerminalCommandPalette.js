import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
export function TerminalCommandPalette({ isOpen, onClose, groups, placeholder = 'Type a command or search (Esc to close)...', className, style, }) {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);
    const filteredGroups = useMemo(() => {
        if (!query.trim())
            return groups;
        const lower = query.toLowerCase();
        return groups
            .map((g) => ({
            ...g,
            items: g.items.filter((i) => i.label.toLowerCase().includes(lower) ||
                (i.description && i.description.toLowerCase().includes(lower))),
        }))
            .filter((g) => g.items.length > 0);
    }, [groups, query]);
    const flatItems = useMemo(() => filteredGroups.flatMap((g) => g.items), [filteredGroups]);
    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onClose();
        }
        else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % (flatItems.length || 1));
        }
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + flatItems.length) % (flatItems.length || 1));
        }
        else if (e.key === 'Enter') {
            e.preventDefault();
            if (flatItems[selectedIndex]) {
                flatItems[selectedIndex].onSelect();
                onClose();
            }
        }
    };
    if (!isOpen)
        return null;
    let currentFlatIdx = 0;
    return (_jsx("div", { onClick: onClose, style: {
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '15vh',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
        }, children: _jsxs("div", { className: className, onClick: (e) => e.stopPropagation(), style: {
                width: '100%',
                maxWidth: '560px',
                backgroundColor: '#161920',
                color: '#e6edf3',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                ...style,
            }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }, children: [_jsx("span", { style: { opacity: 0.5, marginRight: '10px' }, children: "\uD83D\uDD0D" }), _jsx("input", { ref: inputRef, type: "text", placeholder: placeholder, value: query, onChange: (e) => {
                                setQuery(e.target.value);
                                setSelectedIndex(0);
                            }, onKeyDown: handleKeyDown, style: {
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                color: 'inherit',
                                fontSize: '14px',
                            } })] }), _jsx("div", { style: { maxHeight: '320px', overflowY: 'auto', padding: '8px' }, children: filteredGroups.length === 0 ? (_jsx("div", { style: { padding: '24px', textAlign: 'center', opacity: 0.5, fontSize: '13px' }, children: "No commands found" })) : (filteredGroups.map((group) => (_jsxs("div", { style: { marginBottom: '8px' }, children: [_jsx("div", { style: { fontSize: '11px', fontWeight: 600, opacity: 0.5, padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }, children: group.heading }), group.items.map((item) => {
                                const idx = currentFlatIdx++;
                                const isSelected = idx === selectedIndex;
                                return (_jsxs("div", { onClick: () => {
                                        item.onSelect();
                                        onClose();
                                    }, onMouseEnter: () => setSelectedIndex(idx), style: {
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        backgroundColor: isSelected ? 'rgba(88, 166, 255, 0.2)' : 'transparent',
                                        color: isSelected ? '#58a6ff' : 'inherit',
                                    }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [item.icon && _jsx("span", { children: item.icon }), _jsx("span", { children: item.label }), item.description && (_jsx("span", { style: { opacity: 0.5, fontSize: '11px', marginLeft: '6px' }, children: item.description }))] }), item.shortcut && (_jsx("span", { style: { fontSize: '11px', opacity: 0.6, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }, children: item.shortcut }))] }, item.id));
                            })] }, group.heading)))) })] }) }));
}
