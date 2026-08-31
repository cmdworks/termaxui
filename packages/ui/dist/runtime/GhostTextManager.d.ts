import { Terminal } from '../Terminal.js';
export interface GhostTextOptions {
    textColor?: string;
    backgroundColor?: string;
    opacity?: number;
}
export declare class GhostTextManager {
    private terminal;
    private currentSuggestion;
    private overlayElement;
    private options;
    constructor(terminal: Terminal, options?: GhostTextOptions);
    setSuggestion(text: string | null): void;
    getSuggestion(): string | null;
    acceptSuggestion(): string | null;
    private render;
    dispose(): void;
}
//# sourceMappingURL=GhostTextManager.d.ts.map