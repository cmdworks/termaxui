import React, { useEffect, useState } from 'react';
import { useTerminalContext } from './TerminalContext.js';

export interface ContextMenuItem {
  label: string;
  icon?: string;
  onClick: (selection: string) => void;
  shortcut?: string;
  destructive?: boolean;
}

export interface TerminalContextMenuProps {
  customItems?: ContextMenuItem[];
  className?: string;
  style?: React.CSSProperties;
}

export function TerminalContextMenu({
  customItems = [],
  className,
  style,
}: TerminalContextMenuProps) {
  const { terminal, selection, clear, theme } = useTerminalContext();
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!terminal || !terminal.element) return;
    const el = terminal.element;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const x = Math.min(e.clientX, window.innerWidth - 180);
      const y = Math.min(e.clientY, window.innerHeight - 200);
      setMenuPos({ x, y });
    };

    const handleClickOutside = () => {
      setMenuPos(null);
    };

    el.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('click', handleClickOutside);

    return () => {
      el.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [terminal]);

  if (!menuPos) return null;

  const handleCopy = () => {
    selection.copyToClipboard();
    setMenuPos(null);
  };

  const handlePaste = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        const text = await navigator.clipboard.readText();
        if (text) terminal?.paste(text);
      } catch {}
    }
    setMenuPos(null);
  };

  const handleSelectAll = () => {
    selection.selectAll();
    setMenuPos(null);
  };

  const handleClear = () => {
    clear();
    setMenuPos(null);
  };

  return (
    <div
      className={className}
      style={{
        position: 'fixed',
        left: menuPos.x,
        top: menuPos.y,
        zIndex: 1000,
        minWidth: '160px',
        padding: '4px',
        backgroundColor: theme.background || '#18181b',
        color: theme.foreground || '#fafafa',
        border: `1px solid ${theme.selectionBackground || 'rgba(255, 255, 255, 0.15)'}`,
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(16px)',
        fontSize: '12px',
        userSelect: 'none',
        ...style,
      }}
    >
      <div
        onClick={handleCopy}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <span>Copy</span>
        <span style={{ opacity: 0.5, fontSize: '11px' }}>Cmd+C</span>
      </div>

      <div
        onClick={handlePaste}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <span>Paste</span>
        <span style={{ opacity: 0.5, fontSize: '11px' }}>Cmd+V</span>
      </div>

      <div
        onClick={handleSelectAll}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <span>Select All</span>
        <span style={{ opacity: 0.5, fontSize: '11px' }}>Cmd+A</span>
      </div>

      <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '4px 0' }} />

      {customItems.map((item, idx) => (
        <div
          key={idx}
          onClick={() => {
            item.onClick(selection.selectionText);
            setMenuPos(null);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            color: item.destructive ? (theme.red || '#ff5555') : 'inherit',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <span>{item.label}</span>
          {item.shortcut && <span style={{ opacity: 0.5, fontSize: '11px' }}>{item.shortcut}</span>}
        </div>
      ))}

      {customItems.length > 0 && (
        <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '4px 0' }} />
      )}

      <div
        onClick={handleClear}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          borderRadius: '4px',
          cursor: 'pointer',
          color: theme.red || '#ff5555',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 85, 85, 0.15)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <span>Clear Output</span>
      </div>
    </div>
  );
}
