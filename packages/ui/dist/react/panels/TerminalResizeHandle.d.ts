import React from 'react';
export interface TerminalResizeHandleProps {
    index?: number;
    withHandle?: boolean;
    isCollapsed?: boolean;
    onHandleClick?: (e: React.MouseEvent) => void;
    className?: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
}
export declare function TerminalResizeHandle({ index, withHandle, isCollapsed, onHandleClick, className, style, children, }: TerminalResizeHandleProps): React.JSX.Element;
//# sourceMappingURL=TerminalResizeHandle.d.ts.map