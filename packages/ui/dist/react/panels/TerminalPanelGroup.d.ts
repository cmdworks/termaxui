import React, { ReactNode } from 'react';
export interface TerminalPanelGroupProps {
    direction?: 'horizontal' | 'vertical';
    snapToGrid?: boolean;
    cellWidth?: number;
    cellHeight?: number;
    onLayout?: (sizes: number[]) => void;
    children?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
}
export declare function TerminalPanelGroup({ direction, snapToGrid, cellWidth, cellHeight, onLayout, children, className, style, }: TerminalPanelGroupProps): React.JSX.Element;
//# sourceMappingURL=TerminalPanelGroup.d.ts.map