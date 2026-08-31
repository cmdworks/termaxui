import { Terminal } from '../../Terminal.js';
export declare function useTerminalSelection(terminal: Terminal | null): {
    hasSelection: boolean;
    selectionText: string;
    copyToClipboard: () => Promise<boolean>;
    selectAll: () => void;
    clearSelection: () => void;
};
//# sourceMappingURL=useTerminalSelection.d.ts.map