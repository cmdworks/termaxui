import { Terminal } from '../../Terminal.js';
import { FitAddon } from '../../addons/xterm-compat.js';
import { ITerminalOptions, TerminalTheme } from '../../types.js';
import { BuiltinThemeName } from '../themes.js';
export interface UseTerminalOptions extends Omit<ITerminalOptions, 'theme'> {
    theme?: TerminalTheme | BuiltinThemeName;
    autoFocus?: boolean;
    onData?: (data: string) => void;
    onResize?: (size: {
        cols: number;
        rows: number;
    }) => void;
    onTitleChange?: (title: string) => void;
    onCwdChange?: (cwd: string) => void;
}
export declare function useTerminal(options?: UseTerminalOptions): {
    terminal: Terminal | null;
    containerRef: (node: HTMLDivElement | null) => void;
    fitAddon: FitAddon | null;
    write: (data: string | Uint8Array) => void;
    writeln: (data: string | Uint8Array) => void;
    clear: () => void;
    focus: () => void;
    blur: () => void;
    fit: () => void;
};
//# sourceMappingURL=useTerminal.d.ts.map