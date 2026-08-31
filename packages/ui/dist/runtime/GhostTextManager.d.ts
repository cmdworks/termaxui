import { Terminal } from '../Terminal.js';
export interface GhostTextOptions {
    textColor?: string;
    backgroundColor?: string;
    opacity?: number;
    enableKeyboardInterception?: boolean;
}
export type GhostTextListener = {
    onAccept?: (text: string) => void;
    onDismiss?: () => void;
    onChange?: (suggestion: string | null) => void;
};
export declare class GhostTextManager {
    private terminal;
    private currentSuggestion;
    private overlayElement;
    private options;
    private listeners;
    private keyDisposable?;
    constructor(terminal: Terminal, options?: GhostTextOptions);
    addListener(listener: GhostTextListener): () => void;
    setSuggestion(text: string | null): void;
    appendSuggestion(delta: string): void;
    getSuggestion(): string | null;
    hasSuggestion(): boolean;
    accept(): string | null;
    acceptWord(): string | null;
    dismiss(): void;
    private attachKeyHandler;
    render(): void;
    dispose(): void;
}
//# sourceMappingURL=GhostTextManager.d.ts.map