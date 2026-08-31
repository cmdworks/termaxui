import { useCallback, useEffect, useState } from 'react';
import { Terminal } from '../../Terminal.js';

export function useTerminalSelection(terminal: Terminal | null) {
  const [hasSelection, setHasSelection] = useState(false);
  const [selectionText, setSelectionText] = useState('');

  useEffect(() => {
    if (!terminal) return;

    const disposable = terminal.onSelectionChange(() => {
      const selected = terminal.hasSelection();
      setHasSelection(selected);
      setSelectionText(selected ? terminal.getSelection() : '');
    });

    return () => {
      disposable.dispose();
    };
  }, [terminal]);

  const copyToClipboard = useCallback(async (): Promise<boolean> => {
    if (!terminal) return false;
    const text = terminal.getSelection();
    if (text && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }, [terminal]);

  const selectAll = useCallback(() => {
    terminal?.selectAll();
  }, [terminal]);

  const clearSelection = useCallback(() => {
    terminal?.clearSelection();
  }, [terminal]);

  return {
    hasSelection,
    selectionText,
    copyToClipboard,
    selectAll,
    clearSelection,
  };
}
