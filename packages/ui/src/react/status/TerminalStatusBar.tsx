import React, { ReactNode } from 'react';

export interface TerminalStatusBarProps {
  branch?: string | null;
  cwd?: string | null;
  ptyState?: 'running' | 'idle' | 'stopped';
  agentStatus?: {
    state: 'idle' | 'working' | 'finished' | 'error';
    label?: string;
  };
  stats?: {
    fps?: number;
    throughput?: string;
    rows?: number;
    cols?: number;
  };
  actions?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function TerminalStatusBar({
  branch,
  cwd,
  ptyState = 'running',
  agentStatus,
  stats,
  actions,
  className,
  style,
}: TerminalStatusBarProps) {
  const agentColors = {
    idle: '#6e7681',
    working: '#e3b341',
    finished: '#3fb950',
    error: '#ff7b72',
  };

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '24px',
        padding: '0 8px',
        backgroundColor: '#0a0d12',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        fontSize: '11px',
        color: '#8b949e',
        userSelect: 'none',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {agentStatus && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: agentColors[agentStatus.state] || agentColors.idle,
              }}
            />
            <span style={{ color: '#c9d1d9' }}>{agentStatus.label || agentStatus.state}</span>
          </div>
        )}

        {branch && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>⎇</span>
            <span style={{ color: '#58a6ff' }}>{branch}</span>
          </div>
        )}

        {cwd && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span>📂</span>
            <span>{cwd}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {stats && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8 }}>
            {stats.cols && stats.rows && <span>{stats.cols}×{stats.rows}</span>}
            {stats.fps !== undefined && <span>{stats.fps} FPS</span>}
            {stats.throughput && <span>{stats.throughput}</span>}
          </div>
        )}
        {actions}
      </div>
    </div>
  );
}
