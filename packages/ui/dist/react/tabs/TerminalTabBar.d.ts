import React, { ReactNode } from 'react';
export interface TabItem {
    id: string;
    title: string;
    icon?: ReactNode;
    statusDot?: 'idle' | 'working' | 'error' | 'success';
    badge?: string | number;
}
export interface TerminalTabBarProps {
    tabs?: TabItem[];
    activeId?: string;
    onSelectTab?: (id: string) => void;
    onCloseTab?: (id: string) => void;
    onNewTab?: () => void;
    actions?: ReactNode;
    children?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
}
export declare function TerminalTabBar({ tabs, activeId, onSelectTab, onCloseTab, onNewTab, actions, children, className, style, }: TerminalTabBarProps): React.JSX.Element;
//# sourceMappingURL=TerminalTabBar.d.ts.map