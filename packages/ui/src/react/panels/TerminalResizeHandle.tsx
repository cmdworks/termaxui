import React, { useState } from 'react';
import { usePanelGroupContext } from './PanelContext.js';

export interface TerminalResizeHandleProps {
  index?: number;
  withHandle?: boolean;
  isCollapsed?: boolean;
  onHandleClick?: (e: React.MouseEvent) => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export function TerminalResizeHandle({
  index = 0,
  withHandle,
  isCollapsed,
  onHandleClick,
  className,
  style,
  children,
}: TerminalResizeHandleProps) {
  const { direction, startDragging, equalizeSizes } = usePanelGroupContext();
  const [isHovered, setIsHovered] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const clientPos = direction === 'horizontal' ? e.clientX : e.clientY;
    startDragging(index, clientPos);
  };

  const handleDoubleClick = () => {
    equalizeSizes();
  };

  const isHorizontal = direction === 'horizontal';

  return (
    <div
      role="separator"
      tabIndex={0}
      data-slot="resizable-handle"
      className={className}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        zIndex: 20,
        width: isHorizontal ? '3px' : '100%',
        height: isHorizontal ? '100%' : '3px',
        cursor: isHorizontal ? 'col-resize' : 'row-resize',
        backgroundColor: isHovered ? 'rgba(88, 166, 255, 0.7)' : 'rgba(255, 255, 255, 0.08)',
        transition: 'background-color 0.15s ease',
        userSelect: 'none',
        touchAction: 'none',
        ...style,
      }}
    >
      {children}
      {withHandle && (
        <div
          onClick={onHandleClick}
          style={{
            position: 'absolute',
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '12px',
            height: '40px',
            borderRadius: '9999px',
            backgroundColor: isHovered ? '#58a6ff' : 'rgba(255, 255, 255, 0.2)',
            color: '#fff',
            fontSize: '9px',
            fontWeight: 'bold',
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'all 0.15s ease',
          }}
        >
          {isCollapsed !== undefined ? (isCollapsed ? '›' : '‹') : ''}
        </div>
      )}
    </div>
  );
}
