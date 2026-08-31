import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TerminalContextMenu } from './TerminalContextMenu.js';
import { TerminalDropZone } from './TerminalDropZone.js';
import { TerminalRoot } from './TerminalRoot.js';
import { TerminalScreen } from './TerminalScreen.js';
import { TerminalSearch } from './TerminalSearch.js';
import { TerminalToolbar } from './TerminalToolbar.js';
export function TermaxTerminal({ title, showToolbar = true, showTrafficLights = true, toolbarActions, enableSearch = true, searchPosition = 'top-right', enableDrop = true, enableContextMenu = true, customMenuItems, className, style, ...rootProps }) {
    return (_jsxs(TerminalRoot, { className: className, style: style, ...rootProps, children: [showToolbar && (_jsx(TerminalToolbar, { title: title, showTrafficLights: showTrafficLights, actions: toolbarActions })), _jsxs("div", { style: { position: 'relative', flex: 1, display: 'flex', minHeight: 0 }, children: [_jsx(TerminalScreen, {}), enableSearch && _jsx(TerminalSearch, { position: searchPosition }), enableDrop && _jsx(TerminalDropZone, {}), enableContextMenu && _jsx(TerminalContextMenu, { customItems: customMenuItems })] })] }));
}
