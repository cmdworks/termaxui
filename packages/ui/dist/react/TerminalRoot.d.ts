import React, { ReactNode } from 'react';
import { UseTerminalOptions } from './hooks/useTerminal.js';
export interface TerminalRootProps extends UseTerminalOptions {
    children?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
    onDropFiles?: (paths: string[]) => void;
}
export declare function TerminalRoot({ children, className, style, onDropFiles, ...options }: TerminalRootProps): React.JSX.Element;
//# sourceMappingURL=TerminalRoot.d.ts.map