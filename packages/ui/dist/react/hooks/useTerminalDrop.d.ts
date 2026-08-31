import { Terminal } from '../../Terminal.js';
export interface UseTerminalDropOptions {
    onDrop?: (paths: string[]) => void;
    autoPaste?: boolean;
}
export declare function useTerminalDrop(terminal: Terminal | null, options?: UseTerminalDropOptions): {
    isDropTarget: boolean;
};
//# sourceMappingURL=useTerminalDrop.d.ts.map