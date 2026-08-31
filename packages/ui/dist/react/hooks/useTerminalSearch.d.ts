import { Terminal } from '../../Terminal.js';
import { ISearchOptions } from '../../addons/xterm-compat.js';
export declare function useTerminalSearch(terminal: Terminal | null): {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
    query: string;
    setQuery: import("react").Dispatch<import("react").SetStateAction<string>>;
    useRegex: boolean;
    setUseRegex: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    useCase: boolean;
    setUseCase: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    useWord: boolean;
    setUseWord: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    resultIndex: number;
    resultCount: number;
    findNext: (term?: string, opts?: ISearchOptions) => boolean;
    findPrevious: (term?: string, opts?: ISearchOptions) => boolean;
    clearSearch: () => void;
};
//# sourceMappingURL=useTerminalSearch.d.ts.map