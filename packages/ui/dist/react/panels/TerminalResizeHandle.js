import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { usePanelGroupContext } from './PanelContext.js';
export function TerminalResizeHandle({ index = 0, withHandle, isCollapsed, onHandleClick, className, style, children, }) {
    const { direction, startDragging, equalizeSizes } = usePanelGroupContext();
    const [isHovered, setIsHovered] = useState(false);
    const handlePointerDown = (e) => {
        e.preventDefault();
        const clientPos = direction === 'horizontal' ? e.clientX : e.clientY;
        startDragging(index, clientPos);
    };
    const handleDoubleClick = () => {
        equalizeSizes();
    };
    const isHorizontal = direction === 'horizontal';
    return (_jsxs("div", { role: "separator", tabIndex: 0, "data-slot": "resizable-handle", className: className, onPointerDown: handlePointerDown, onDoubleClick: handleDoubleClick, onMouseEnter: () => setIsHovered(true), onMouseLeave: () => setIsHovered(false), style: {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            zIndex: 20,
            width: isHorizontal ? '3px' : '100%',
            height: isHorizontal ? '100%' : '3px',
            cursor: isHorizontal ? 'col-resize' : 'row-resize',
            backgroundColor: isHovered ? 'rgba(88, 166, 255, 0.7)' : 'rgba(255, 255, 255, 0.08)',
            transition: 'background-color 0.15s ease',
            userSelect: 'none',
            touchAction: 'none',
            ...style,
        }, children: [children, withHandle && (_jsx("div", { onClick: onHandleClick, style: {
                    position: 'absolute',
                    zIndex: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '12px',
                    height: '40px',
                    borderRadius: '9999px',
                    backgroundColor: isHovered ? '#58a6ff' : 'rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.15s ease',
                }, children: isCollapsed !== undefined ? (isCollapsed ? '›' : '‹') : '' }))] }));
}
