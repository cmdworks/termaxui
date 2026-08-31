import React, { ReactNode } from 'react';
export interface TerminalTabProps {
    id: string;
    title: string;
    isActive?: boolean;
    icon?: ReactNode;
    statusDot?: 'idle' | 'working' | 'error' | 'success';
    badge?: string | number;
    onSelect?: (id: string) => void;
    onClose?: (id: string) => void;
    className?: string;
    style?: React.CSSProperties;
}
export declare function TerminalTab({ id, title, isActive, icon, statusDot, badge, onSelect, onClose, className, style, }: TerminalTabProps): React.JSX.Element;
//# sourceMappingURL=TerminalTab.d.ts.map