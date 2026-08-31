import React, { ReactNode } from 'react';

export interface TerminalTabProps {
  id: string;
  title: string;
  isActive?: boolean;
  icon?: ReactNode;
  statusDot?: 'idle' | 'working' | 'error' | 'success';
  badge?: string | number;
  onSelect?: (id: string) => void;
  onClose?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function TerminalTab({
  id,
  title,
  isActive = false,
  icon,
  statusDot,
  badge,
  onSelect,
  onClose,
  className,
  style,
}: TerminalTabProps) {
  const statusColors = {
    idle: '#6e7681',
    working: '#e3b341',
    error: '#ff7b72',
    success: '#3fb950',
  };

  return (
    <div
      role="tab"
      aria-selected={isActive}
      tabIndex={0}
      onClick={() => onSelect?.(id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.(id);
        }
      }}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        height: '32px',
        fontSize: '12px',
        fontWeight: isActive ? 600 : 400,
        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        borderBottom: isActive ? '2px solid #58a6ff' : '2px solid transparent',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.15s ease',
        ...style,
      }}
    >
      {statusDot && (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: statusColors[statusDot] || statusColors.idle,
          }}
        />
      )}
      {icon}
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
        {title}
      </span>
      {badge !== undefined && (
        <span
          style={{
            padding: '1px 5px',
            fontSize: '10px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
          }}
        >
          {badge}
        </span>
      )}
      {onClose && (
        <button
          type="button"
          aria-label="Close Tab"
          onClick={(e) => {
            e.stopPropagation();
            onClose(id);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '16px',
            height: '16px',
            marginLeft: '4px',
            border: 'none',
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
            opacity: 0.6,
            borderRadius: '3px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
        >
          ✕
        </button>
      )}
    </div>
  );
}
