import React, { ReactNode } from 'react';
export interface TerminalPanelProps {
    id?: string;
    defaultSize?: number;
    minSize?: number;
    maxSize?: number;
    children?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
}
export declare function TerminalPanel({ id: customId, defaultSize, minSize, children, className, style, }: TerminalPanelProps): React.JSX.Element;
//# sourceMappingURL=TerminalPanel.d.ts.map