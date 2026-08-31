import React, {
  ReactNode,
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
} from 'react';
import { PanelImperativeHandle, usePanelGroupContext } from './PanelContext.js';

export interface TerminalPanelProps {
  id?: string;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  collapsible?: boolean;
  onCollapse?: () => void;
  onExpand?: () => void;
  onResize?: (size: number) => void;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const TerminalPanel = forwardRef<PanelImperativeHandle, TerminalPanelProps>(
  function TerminalPanel(
    {
      id: customId,
      defaultSize = 50,
      minSize = 10,
      maxSize = 100,
      children,
      className,
      style,
    },
    ref
  ) {
    const autoId = useId();
    const id = customId || autoId;
    const {
      direction,
      registerPanel,
      unregisterPanel,
      getPanelSize,
      setPanelSize,
      collapsePanel,
      expandPanel,
    } = usePanelGroupContext();

    useEffect(() => {
      registerPanel(id, defaultSize, minSize, maxSize);
      return () => unregisterPanel(id);
    }, [id, defaultSize, minSize, maxSize, registerPanel, unregisterPanel]);

    const size = getPanelSize(id);

    useImperativeHandle(
      ref,
      () => ({
        collapse: () => collapsePanel(id),
        expand: () => expandPanel(id),
        resize: (newSize: number) => setPanelSize(id, newSize),
        getSize: () => ({ asPercentage: size, asPixels: 0 }),
        isCollapsed: () => size <= 0,
        isExpanded: () => size > 0,
      }),
      [id, size, collapsePanel, expandPanel, setPanelSize]
    );

    const isCollapsed = size <= 0;

    const dimensionStyle: React.CSSProperties = isCollapsed
      ? { display: 'none' }
      : direction === 'horizontal'
      ? {
          width: `${size}%`,
          height: '100%',
          flex: `${size} 1 0%`,
          display: 'flex',
        }
      : {
          height: `${size}%`,
          width: '100%',
          flex: `${size} 1 0%`,
          display: 'flex',
        };

    return (
      <div
        id={id}
        className={className}
        style={{
          position: 'relative',
          flexDirection: 'column',
          minWidth: direction === 'horizontal' && !isCollapsed ? `${minSize}%` : '0',
          minHeight: direction === 'vertical' && !isCollapsed ? `${minSize}%` : '0',
          overflow: 'hidden',
          ...dimensionStyle,
          ...style,
        }}
      >
        {children}
      </div>
    );
  }
);
