import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef, useEffect, useId, useImperativeHandle, } from 'react';
import { usePanelGroupContext } from './PanelContext.js';
export const TerminalPanel = forwardRef(function TerminalPanel({ id: customId, defaultSize = 50, minSize = 10, maxSize = 100, children, className, style, }, ref) {
    const autoId = useId();
    const id = customId || autoId;
    const { direction, registerPanel, unregisterPanel, getPanelSize, setPanelSize, collapsePanel, expandPanel, } = usePanelGroupContext();
    useEffect(() => {
        registerPanel(id, defaultSize, minSize, maxSize);
        return () => unregisterPanel(id);
    }, [id, defaultSize, minSize, maxSize, registerPanel, unregisterPanel]);
    const size = getPanelSize(id);
    useImperativeHandle(ref, () => ({
        collapse: () => collapsePanel(id),
        expand: () => expandPanel(id),
        resize: (newSize) => setPanelSize(id, newSize),
        getSize: () => ({ asPercentage: size, asPixels: 0 }),
        isCollapsed: () => size <= 0,
        isExpanded: () => size > 0,
    }), [id, size, collapsePanel, expandPanel, setPanelSize]);
    const isCollapsed = size <= 0;
    const dimensionStyle = direction === 'horizontal'
        ? { width: `${size}%`, height: '100%', display: isCollapsed ? 'none' : 'flex' }
        : { height: `${size}%`, width: '100%', display: isCollapsed ? 'none' : 'flex' };
    return (_jsx("div", { id: id, className: className, style: {
            position: 'relative',
            flexDirection: 'column',
            minWidth: direction === 'horizontal' && !isCollapsed ? `${minSize}%` : '0',
            minHeight: direction === 'vertical' && !isCollapsed ? `${minSize}%` : '0',
            overflow: 'hidden',
            ...dimensionStyle,
            ...style,
        }, children: children }));
});
