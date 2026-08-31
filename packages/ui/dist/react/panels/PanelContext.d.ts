export interface PanelImperativeHandle {
    collapse: () => void;
    expand: () => void;
    resize: (size: number) => void;
    getSize: () => {
        asPercentage: number;
        asPixels: number;
    };
    isCollapsed: () => boolean;
    isExpanded: () => boolean;
}
export interface PanelGroupContextValue {
    direction: 'horizontal' | 'vertical';
    registerPanel: (id: string, defaultSize: number, minSize: number, maxSize?: number) => void;
    unregisterPanel: (id: string) => void;
    getPanelSize: (id: string) => number;
    setPanelSize: (id: string, size: number) => void;
    collapsePanel: (id: string) => void;
    expandPanel: (id: string) => void;
    startDragging: (handleIndex: number, clientPos: number) => void;
    equalizeSizes: () => void;
}
export declare const PanelGroupContext: import("react").Context<PanelGroupContextValue | null>;
export declare function usePanelGroupContext(): PanelGroupContextValue;
//# sourceMappingURL=PanelContext.d.ts.map