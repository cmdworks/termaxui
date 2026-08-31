import React, { ReactNode } from 'react';
import { PanelImperativeHandle } from './PanelContext.js';
export interface TerminalPanelProps {
    id?: string;
    defaultSize?: number;
    minSize?: number;
    maxSize?: number;
    collapsible?: boolean;
    onCollapse?: () => void;
    onExpand?: () => void;
    onResize?: (size: number) => void;
    children?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
}
export declare const TerminalPanel: React.ForwardRefExoticComponent<TerminalPanelProps & React.RefAttributes<PanelImperativeHandle>>;
//# sourceMappingURL=TerminalPanel.d.ts.map