import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export function TerminalTree({ data, activeId, onSelect, onToggleFolder, className, style, }) {
    const [expandedIds, setExpandedIds] = useState(new Set(['root']));
    const toggleExpand = (node) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            const isCurrentlyExpanded = next.has(node.id);
            if (isCurrentlyExpanded) {
                next.delete(node.id);
            }
            else {
                next.add(node.id);
            }
            onToggleFolder?.(node, !isCurrentlyExpanded);
            return next;
        });
    };
    const renderNodes = (nodes, depth = 0) => {
        return nodes.map((node) => {
            const isExpanded = expandedIds.has(node.id);
            const isActive = node.id === activeId;
            return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column' }, children: [_jsxs("div", { onClick: () => {
                            if (node.isFolder) {
                                toggleExpand(node);
                            }
                            onSelect?.(node);
                        }, style: {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '4px 8px',
                            paddingLeft: `${depth * 14 + 8}px`,
                            fontSize: '12px',
                            cursor: 'pointer',
                            userSelect: 'none',
                            backgroundColor: isActive ? 'rgba(88, 166, 255, 0.15)' : 'transparent',
                            color: isActive ? '#58a6ff' : 'inherit',
                            borderRadius: '4px',
                        }, onMouseEnter: (e) => {
                            if (!isActive)
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        }, onMouseLeave: (e) => {
                            if (!isActive)
                                e.currentTarget.style.backgroundColor = 'transparent';
                        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }, children: [node.isFolder && (_jsx("span", { style: { fontSize: '10px', width: '12px', opacity: 0.6 }, children: isExpanded ? '▼' : '▶' })), _jsx("span", { children: node.icon || (node.isFolder ? '📁' : '📄') }), _jsx("span", { style: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }, children: node.name })] }), node.badge !== undefined && (_jsx("span", { style: { fontSize: '10px', opacity: 0.5, padding: '1px 4px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }, children: node.badge }))] }), node.isFolder && isExpanded && node.children && (_jsx("div", { children: renderNodes(node.children, depth + 1) }))] }, node.id));
        });
    };
    return (_jsx("div", { className: className, style: {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            overflowY: 'auto',
            padding: '4px 0',
            fontSize: '12px',
            ...style,
        }, children: renderNodes(data) }));
}
