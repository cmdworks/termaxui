import React, { ReactNode } from 'react';
import { TerminalContextMenu, ContextMenuItem } from './TerminalContextMenu.js';
import { TerminalDropZone } from './TerminalDropZone.js';
import { TerminalRoot, TerminalRootProps } from './TerminalRoot.js';
import { TerminalScreen } from './TerminalScreen.js';
import { TerminalSearch } from './TerminalSearch.js';
import { TerminalToolbar } from './TerminalToolbar.js';

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

export function TermaxTerminal({
  title,
  showToolbar = true,
  showTrafficLights = true,
  toolbarActions,
  enableSearch = true,
  searchPosition = 'top-right',
  enableDrop = true,
  enableContextMenu = true,
  customMenuItems,
  className,
  style,
  ...rootProps
}: TermaxTerminalProps) {
  return (
    <TerminalRoot className={className} style={style} {...rootProps}>
      {showToolbar && (
        <TerminalToolbar
          title={title}
          showTrafficLights={showTrafficLights}
          actions={toolbarActions}
        />
      )}
      <div style={{ position: 'relative', flex: 1, display: 'flex', minHeight: 0 }}>
        <TerminalScreen />
        {enableSearch && <TerminalSearch position={searchPosition} />}
        {enableDrop && <TerminalDropZone />}
        {enableContextMenu && <TerminalContextMenu customItems={customMenuItems} />}
      </div>
    </TerminalRoot>
  );
}
