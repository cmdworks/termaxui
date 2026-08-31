import React, { ReactNode } from 'react';
export interface TerminalStatusBarProps {
    branch?: string | null;
    cwd?: string | null;
    ptyState?: 'running' | 'idle' | 'stopped';
    agentStatus?: {
        state: 'idle' | 'working' | 'finished' | 'error';
        label?: string;
    };
    stats?: {
        fps?: number;
        throughput?: string;
        rows?: number;
        cols?: number;
    };
    actions?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
}
export declare function TerminalStatusBar({ branch, cwd, ptyState, agentStatus, stats, actions, className, style, }: TerminalStatusBarProps): React.JSX.Element;
//# sourceMappingURL=TerminalStatusBar.d.ts.map