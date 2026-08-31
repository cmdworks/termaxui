import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { PanelGroupContext } from './PanelContext.js';

export interface TerminalPanelGroupProps {
  direction?: 'horizontal' | 'vertical';
  snapToGrid?: boolean;
  cellWidth?: number;
  cellHeight?: number;
  onLayout?: (sizes: number[]) => void;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface PanelRegistration {
  id: string;
  defaultSize: number;
  minSize: number;
  maxSize?: number;
}

export function TerminalPanelGroup({
  direction = 'horizontal',
  snapToGrid = false,
  cellWidth = 9,
  cellHeight = 17,
  onLayout,
  children,
  className,
  style,
}: TerminalPanelGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [panels, setPanels] = useState<PanelRegistration[]>([]);
  const [sizes, setSizes] = useState<number[]>([]);
  const lastExpandedSizes = useRef<Record<string, number>>({});

  const registerPanel = useCallback(
    (id: string, defaultSize: number, minSize: number, maxSize = 100) => {
      setPanels((prev) => {
        if (prev.some((p) => p.id === id)) return prev;
        return [...prev, { id, defaultSize, minSize, maxSize }];
      });
      lastExpandedSizes.current[id] = defaultSize;
    },
    []
  );

  const unregisterPanel = useCallback((id: string) => {
    setPanels((prev) => prev.filter((p) => p.id !== id));
    delete lastExpandedSizes.current[id];
  }, []);

  useEffect(() => {
    if (panels.length === 0) return;
    const count = panels.length;
    const equalSize = 100 / count;
    setSizes(panels.map((p) => p.defaultSize || equalSize));
  }, [panels.length]);

  const getPanelSize = useCallback(
    (id: string) => {
      const idx = panels.findIndex((p) => p.id === id);
      if (idx === -1) return 100 / (panels.length || 1);
      return sizes[idx] ?? (100 / panels.length);
    },
    [panels, sizes]
  );

  const setPanelSize = useCallback(
    (id: string, newSize: number) => {
      const idx = panels.findIndex((p) => p.id === id);
      if (idx === -1) return;
      setSizes((prev) => {
        const next = [...prev];
        next[idx] = newSize;
        onLayout?.(next);
        return next;
      });
      if (newSize > 0) {
        lastExpandedSizes.current[id] = newSize;
      }
    },
    [panels, onLayout]
  );

  const collapsePanel = useCallback(
    (id: string) => {
      const idx = panels.findIndex((p) => p.id === id);
      if (idx === -1) return;
      if (sizes[idx] > 0) {
        lastExpandedSizes.current[id] = sizes[idx];
      }
      setPanelSize(id, 0);
    },
    [panels, sizes, setPanelSize]
  );

  const expandPanel = useCallback(
    (id: string) => {
      const idx = panels.findIndex((p) => p.id === id);
      if (idx === -1) return;
      const targetSize = lastExpandedSizes.current[id] || panels[idx].defaultSize || 20;
      setPanelSize(id, targetSize);
    },
    [panels, setPanelSize]
  );

  const equalizeSizes = useCallback(() => {
    if (panels.length === 0) return;
    const equal = 100 / panels.length;
    const newSizes = panels.map(() => equal);
    setSizes(newSizes);
    onLayout?.(newSizes);
  }, [panels, onLayout]);

  const startDragging = useCallback(
    (handleIndex: number, startClientPos: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalDimension = direction === 'horizontal' ? rect.width : rect.height;
      const initialSizes = [...sizes];

      const handlePointerMove = (e: PointerEvent) => {
        const currentClientPos = direction === 'horizontal' ? e.clientX : e.clientY;
        let deltaPx = currentClientPos - startClientPos;

        if (snapToGrid) {
          const step = direction === 'horizontal' ? cellWidth : cellHeight;
          deltaPx = Math.round(deltaPx / step) * step;
        }

        const deltaPercent = (deltaPx / totalDimension) * 100;
        const leftIdx = handleIndex;
        const rightIdx = handleIndex + 1;

        if (leftIdx >= initialSizes.length || rightIdx >= initialSizes.length) return;

        const leftMin = panels[leftIdx]?.minSize || 0;
        const rightMin = panels[rightIdx]?.minSize || 0;

        let newLeft = initialSizes[leftIdx] + deltaPercent;
        let newRight = initialSizes[rightIdx] - deltaPercent;

        if (newLeft < leftMin) {
          const diff = leftMin - newLeft;
          newLeft = leftMin;
          newRight -= diff;
        } else if (newRight < rightMin) {
          const diff = rightMin - newRight;
          newRight = rightMin;
          newLeft -= diff;
        }

        const nextSizes = [...initialSizes];
        nextSizes[leftIdx] = Math.max(leftMin, newLeft);
        nextSizes[rightIdx] = Math.max(rightMin, newRight);

        setSizes(nextSizes);
        onLayout?.(nextSizes);
      };

      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [direction, snapToGrid, cellWidth, cellHeight, sizes, panels, onLayout]
  );

  return (
    <PanelGroupContext.Provider
      value={{
        direction,
        registerPanel,
        unregisterPanel,
        getPanelSize,
        setPanelSize,
        collapsePanel,
        expandPanel,
        startDragging,
        equalizeSizes,
      }}
    >
      <div
        ref={containerRef}
        className={className}
        style={{
          display: 'flex',
          flexDirection: direction === 'horizontal' ? 'row' : 'column',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          ...style,
        }}
      >
        {children}
      </div>
    </PanelGroupContext.Provider>
  );
}
