import React, { ReactNode } from 'react';
import { ContextMenuItem } from './TerminalContextMenu.js';
import { TerminalRootProps } from './TerminalRoot.js';
export interface TermaxTerminalProps extends TerminalRootProps {
    title?: string;
    showToolbar?: boolean;
    showTrafficLights?: boolean;
    toolbarActions?: ReactNode[];
    enableSearch?: boolean;
    searchPosition?: 'top-right' | 'top-left' | 'bottom-right';
    enableDrop?: boolean;
    enableContextMenu?: boolean;
    customMenuItems?: ContextMenuItem[];
}
export declare function TermaxTerminal({ title, showToolbar, showTrafficLights, toolbarActions, enableSearch, searchPosition, enableDrop, enableContextMenu, customMenuItems, className, style, ...rootProps }: TermaxTerminalProps): React.JSX.Element;
//# sourceMappingURL=TermaxTerminal.d.ts.map