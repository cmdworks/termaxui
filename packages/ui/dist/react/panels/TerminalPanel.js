import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useId } from 'react';
import { usePanelGroupContext } from './PanelContext.js';
export function TerminalPanel({ id: customId, defaultSize = 50, minSize = 10, children, className, style, }) {
    const autoId = useId();
    const id = customId || autoId;
    const { direction, registerPanel, unregisterPanel, getPanelSize } = usePanelGroupContext();
    useEffect(() => {
        registerPanel(id, defaultSize, minSize);
        return () => unregisterPanel(id);
    }, [id, defaultSize, minSize, registerPanel, unregisterPanel]);
    const size = getPanelSize(id);
    const dimensionStyle = direction === 'horizontal'
        ? { width: `${size}%`, height: '100%' }
        : { height: `${size}%`, width: '100%' };
    return (_jsx("div", { id: id, className: className, style: {
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            minWidth: direction === 'horizontal' ? `${minSize}%` : '0',
            minHeight: direction === 'vertical' ? `${minSize}%` : '0',
            overflow: 'hidden',
            ...dimensionStyle,
            ...style,
        }, children: children }));
}
