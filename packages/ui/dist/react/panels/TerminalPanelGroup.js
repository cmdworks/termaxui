import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from 'react';
import { PanelGroupContext } from './PanelContext.js';
export function TerminalPanelGroup({ direction = 'horizontal', snapToGrid = false, cellWidth = 9, cellHeight = 17, onLayout, children, className, style, }) {
    const containerRef = useRef(null);
    const [panels, setPanels] = useState([]);
    const [sizes, setSizes] = useState([]);
    const registerPanel = useCallback((id, defaultSize, minSize) => {
        setPanels((prev) => {
            if (prev.some((p) => p.id === id))
                return prev;
            return [...prev, { id, defaultSize, minSize }];
        });
    }, []);
    const unregisterPanel = useCallback((id) => {
        setPanels((prev) => prev.filter((p) => p.id !== id));
    }, []);
    // Compute normalized sizes
    useEffect(() => {
        if (panels.length === 0)
            return;
        const count = panels.length;
        const equalSize = 100 / count;
        setSizes(panels.map((p) => p.defaultSize || equalSize));
    }, [panels.length]);
    const getPanelSize = useCallback((id) => {
        const idx = panels.findIndex((p) => p.id === id);
        if (idx === -1)
            return 100 / (panels.length || 1);
        return sizes[idx] ?? (100 / panels.length);
    }, [panels, sizes]);
    const equalizeSizes = useCallback(() => {
        if (panels.length === 0)
            return;
        const equal = 100 / panels.length;
        const newSizes = panels.map(() => equal);
        setSizes(newSizes);
        onLayout?.(newSizes);
    }, [panels, onLayout]);
    const startDragging = useCallback((handleIndex, startClientPos) => {
        if (!containerRef.current)
            return;
        const rect = containerRef.current.getBoundingClientRect();
        const totalDimension = direction === 'horizontal' ? rect.width : rect.height;
        const initialSizes = [...sizes];
        const handlePointerMove = (e) => {
            const currentClientPos = direction === 'horizontal' ? e.clientX : e.clientY;
            let deltaPx = currentClientPos - startClientPos;
            if (snapToGrid) {
                const step = direction === 'horizontal' ? cellWidth : cellHeight;
                deltaPx = Math.round(deltaPx / step) * step;
            }
            const deltaPercent = (deltaPx / totalDimension) * 100;
            const leftIdx = handleIndex;
            const rightIdx = handleIndex + 1;
            if (leftIdx >= initialSizes.length || rightIdx >= initialSizes.length)
                return;
            const leftMin = panels[leftIdx]?.minSize || 10;
            const rightMin = panels[rightIdx]?.minSize || 10;
            let newLeft = initialSizes[leftIdx] + deltaPercent;
            let newRight = initialSizes[rightIdx] - deltaPercent;
            if (newLeft < leftMin) {
                const diff = leftMin - newLeft;
                newLeft = leftMin;
                newRight -= diff;
            }
            else if (newRight < rightMin) {
                const diff = rightMin - newRight;
                newRight = rightMin;
                newLeft -= diff;
            }
            const nextSizes = [...initialSizes];
            nextSizes[leftIdx] = Math.max(leftMin, newLeft);
            nextSizes[rightIdx] = Math.max(rightMin, newRight);
            setSizes(nextSizes);
            onLayout?.(nextSizes);
        };
        const handlePointerUp = () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    }, [direction, snapToGrid, cellWidth, cellHeight, sizes, panels, onLayout]);
    return (_jsx(PanelGroupContext.Provider, { value: {
            direction,
            registerPanel,
            unregisterPanel,
            getPanelSize,
            startDragging,
            equalizeSizes,
        }, children: _jsx("div", { ref: containerRef, className: className, style: {
                display: 'flex',
                flexDirection: direction === 'horizontal' ? 'row' : 'column',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                ...style,
            }, children: children }) }));
}
