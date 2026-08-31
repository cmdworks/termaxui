import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { usePanelGroupContext } from './PanelContext.js';
export function TerminalResizeHandle({ index = 0, className, style, }) {
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
    return (_jsx("div", { role: "separator", tabIndex: 0, className: className, onPointerDown: handlePointerDown, onDoubleClick: handleDoubleClick, onMouseEnter: () => setIsHovered(true), onMouseLeave: () => setIsHovered(false), style: {
            position: 'relative',
            flexShrink: 0,
            zIndex: 20,
            width: isHorizontal ? '4px' : '100%',
            height: isHorizontal ? '100%' : '4px',
            cursor: isHorizontal ? 'col-resize' : 'row-resize',
            backgroundColor: isHovered ? 'rgba(88, 166, 255, 0.7)' : 'rgba(255, 255, 255, 0.08)',
            transition: 'background-color 0.15s ease',
            userSelect: 'none',
            touchAction: 'none',
            ...style,
        } }));
}
