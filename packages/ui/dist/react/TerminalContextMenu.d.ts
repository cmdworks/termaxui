import React from 'react';
export interface ContextMenuItem {
    label: string;
    icon?: string;
    onClick: (selection: string) => void;
    shortcut?: string;
    destructive?: boolean;
}
export interface TerminalContextMenuProps {
    customItems?: ContextMenuItem[];
    className?: string;
    style?: React.CSSProperties;
}
export declare function TerminalContextMenu({ customItems, className, style, }: TerminalContextMenuProps): React.JSX.Element | null;
//# sourceMappingURL=TerminalContextMenu.d.ts.map