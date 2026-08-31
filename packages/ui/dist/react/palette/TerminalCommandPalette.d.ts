import React from 'react';
export interface CommandItem {
    id: string;
    label: string;
    description?: string;
    icon?: string;
    shortcut?: string;
    onSelect: () => void;
}
export interface CommandGroup {
    heading: string;
    items: CommandItem[];
}
export interface TerminalCommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    groups: CommandGroup[];
    placeholder?: string;
    className?: string;
    style?: React.CSSProperties;
}
export declare function TerminalCommandPalette({ isOpen, onClose, groups, placeholder, className, style, }: TerminalCommandPaletteProps): React.JSX.Element | null;
//# sourceMappingURL=TerminalCommandPalette.d.ts.map