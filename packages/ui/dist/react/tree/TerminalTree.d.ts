import React from 'react';
export interface TreeNode {
    id: string;
    name: string;
    isFolder?: boolean;
    children?: TreeNode[];
    icon?: string;
    badge?: string | number;
}
export interface TerminalTreeProps {
    data: TreeNode[];
    activeId?: string;
    onSelect?: (node: TreeNode) => void;
    onToggleFolder?: (node: TreeNode, expanded: boolean) => void;
    className?: string;
    style?: React.CSSProperties;
}
export declare function TerminalTree({ data, activeId, onSelect, onToggleFolder, className, style, }: TerminalTreeProps): React.JSX.Element;
//# sourceMappingURL=TerminalTree.d.ts.map