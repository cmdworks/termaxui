import React, { ReactNode } from 'react';
export interface TerminalDropZoneProps {
    children?: ((props: {
        isOver: boolean;
    }) => ReactNode) | ReactNode;
    className?: string;
    style?: React.CSSProperties;
}
export declare function TerminalDropZone({ children, className, style, }: TerminalDropZoneProps): React.JSX.Element | null;
//# sourceMappingURL=TerminalDropZone.d.ts.map