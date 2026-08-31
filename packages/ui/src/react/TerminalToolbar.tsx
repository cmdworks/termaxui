import React, { ReactNode } from 'react';
import { useTerminalContext } from './TerminalContext.js';

export interface TerminalToolbarProps {
  title?: string;
  showTrafficLights?: boolean;
  actions?: ReactNode[];
  className?: string;
  style?: React.CSSProperties;
}

export function TerminalToolbar({
  title = 'termaxui ~ zsh',
  showTrafficLights = true,
  actions = [],
  className,
  style,
}: TerminalToolbarProps) {
  const { clear, search, theme } = useTerminalContext();

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '38px',
        padding: '0 12px',
        borderBottom: `1px solid ${theme.selectionBackground || 'rgba(255, 255, 255, 0.1)'}`,
        backgroundColor: theme.black || '#0f1217',
        userSelect: 'none',
        fontSize: '12px',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {showTrafficLights && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ff5f56' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#27c93f' }} />
          </div>
        )}
        <span style={{ fontWeight: 500, opacity: 0.85, marginLeft: showTrafficLights ? 6 : 0 }}>
          {title}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {actions}
        <button
          type="button"
          onClick={() => search.toggle()}
          style={{
            padding: '3px 8px',
            fontSize: '11px',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            background: search.isOpen ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
            color: 'inherit',
            cursor: 'pointer',
          }}
        >
          Find
        </button>
        <button
          type="button"
          onClick={() => clear()}
          style={{
            padding: '3px 8px',
            fontSize: '11px',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
