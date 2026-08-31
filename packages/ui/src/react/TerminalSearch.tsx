import React, { useEffect, useRef } from 'react';
import { useTerminalContext } from './TerminalContext.js';

export interface TerminalSearchProps {
  position?: 'top-right' | 'top-left' | 'bottom-right';
  className?: string;
  style?: React.CSSProperties;
}

export function TerminalSearch({
  position = 'top-right',
  className,
  style,
}: TerminalSearchProps) {
  const { search, theme } = useTerminalContext();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (search.isOpen) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [search.isOpen]);

  if (!search.isOpen) return null;

  const positionStyles: React.CSSProperties = {
    top: position.startsWith('top') ? 12 : undefined,
    bottom: position.startsWith('bottom') ? 12 : undefined,
    right: position.endsWith('right') ? 16 : undefined,
    left: position.endsWith('left') ? 16 : undefined,
  };

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px',
        backgroundColor: theme.background || '#18181b',
        color: theme.foreground || '#fafafa',
        border: `1px solid ${theme.selectionBackground || 'rgba(255, 255, 255, 0.2)'}`,
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(12px)',
        fontSize: '12px',
        ...positionStyles,
        ...style,
      }}
    >
      <input
        ref={inputRef}
        type="text"
        placeholder="Find..."
        value={search.query}
        onChange={(e) => {
          search.setQuery(e.target.value);
          search.findNext(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (e.shiftKey) search.findPrevious();
            else search.findNext();
          } else if (e.key === 'Escape') {
            search.close();
          }
        }}
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '4px',
          color: 'inherit',
          padding: '3px 8px',
          fontSize: '12px',
          width: '140px',
          outline: 'none',
        }}
      />

      {search.resultCount > 0 && (
        <span style={{ fontSize: '11px', opacity: 0.65, minWidth: '40px', textAlign: 'center' }}>
          {search.resultIndex + 1}/{search.resultCount}
        </span>
      )}
      {search.query && search.resultCount === 0 && (
        <span style={{ fontSize: '11px', opacity: 0.5, minWidth: '40px', textAlign: 'center' }}>
          0/0
        </span>
      )}

      <button
        type="button"
        title="Match Case"
        onClick={() => {
          const next = !search.useCase;
          search.setUseCase(next);
          search.findNext(undefined, { caseSensitive: next });
        }}
        style={{
          background: search.useCase ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '4px',
          color: 'inherit',
          padding: '2px 6px',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 600,
        }}
      >
        Aa
      </button>

      <button
        type="button"
        title="Match Whole Word"
        onClick={() => {
          const next = !search.useWord;
          search.setUseWord(next);
          search.findNext(undefined, { wholeWord: next });
        }}
        style={{
          background: search.useWord ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '4px',
          color: 'inherit',
          padding: '2px 6px',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 600,
        }}
      >
        \b
      </button>

      <button
        type="button"
        title="Use Regular Expression"
        onClick={() => {
          const next = !search.useRegex;
          search.setUseRegex(next);
          search.findNext(undefined, { regex: next });
        }}
        style={{
          background: search.useRegex ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '4px',
          color: 'inherit',
          padding: '2px 6px',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 600,
        }}
      >
        .*
      </button>

      <button
        type="button"
        title="Previous Match (Shift+Enter)"
        onClick={() => search.findPrevious()}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: '2px 4px',
          fontSize: '13px',
        }}
      >
        ↑
      </button>

      <button
        type="button"
        title="Next Match (Enter)"
        onClick={() => search.findNext()}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: '2px 4px',
          fontSize: '13px',
        }}
      >
        ↓
      </button>

      <button
        type="button"
        title="Close (Escape)"
        onClick={() => search.close()}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          padding: '2px 6px',
          fontSize: '13px',
          opacity: 0.7,
        }}
      >
        ✕
      </button>
    </div>
  );
}
