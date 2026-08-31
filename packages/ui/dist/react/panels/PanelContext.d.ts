export interface PanelGroupContextValue {
    direction: 'horizontal' | 'vertical';
    registerPanel: (id: string, defaultSize: number, minSize: number) => void;
    unregisterPanel: (id: string) => void;
    getPanelSize: (id: string) => number;
    startDragging: (handleIndex: number, clientPos: number) => void;
    equalizeSizes: () => void;
}
export declare const PanelGroupContext: import("react").Context<PanelGroupContextValue | null>;
export declare function usePanelGroupContext(): PanelGroupContextValue;
//# sourceMappingURL=PanelContext.d.ts.map