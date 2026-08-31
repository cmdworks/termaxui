import React, { ReactNode } from 'react';
import { useTerminalContext } from './TerminalContext.js';

export interface TerminalDropZoneProps {
  children?: ((props: { isOver: boolean }) => ReactNode) | ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function TerminalDropZone({
  children,
  className,
  style,
}: TerminalDropZoneProps) {
  const { isDropTarget, theme } = useTerminalContext();

  if (!isDropTarget) return null;

  if (typeof children === 'function') {
    return <>{children({ isOver: isDropTarget })}</>;
  }

  if (children) {
    return <>{children}</>;
  }

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 40,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(88, 166, 255, 0.12)',
        border: `2px dashed ${theme.blue || '#58a6ff'}`,
        borderRadius: '6px',
        backdropFilter: 'blur(2px)',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '8px',
          backgroundColor: theme.background || '#18181b',
          color: theme.foreground || '#fafafa',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
          fontSize: '13px',
          fontWeight: 500,
        }}
      >
        <span>📁</span>
        <span>Drop files or folders to insert path</span>
      </div>
    </div>
  );
}
