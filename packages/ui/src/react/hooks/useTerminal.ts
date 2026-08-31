import { useCallback, useEffect, useRef, useState } from 'react';
import { Terminal } from '../../Terminal.js';
import { FitAddon } from '../../addons/xterm-compat.js';
import { ITerminalOptions, TerminalTheme } from '../../types.js';
import { BUILTIN_THEMES, BuiltinThemeName } from '../themes.js';

export interface UseTerminalOptions extends Omit<ITerminalOptions, 'theme'> {
  theme?: TerminalTheme | BuiltinThemeName;
  autoFocus?: boolean;
  onData?: (data: string) => void;
  onResize?: (size: { cols: number; rows: number }) => void;
  onTitleChange?: (title: string) => void;
  onCwdChange?: (cwd: string) => void;
}

export function useTerminal(options: UseTerminalOptions = {}) {
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const resolvedTheme: TerminalTheme = typeof options.theme === 'string'
    ? (BUILTIN_THEMES[options.theme as BuiltinThemeName] || BUILTIN_THEMES.termax)
    : (options.theme || BUILTIN_THEMES.termax);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const term = new Terminal({
      ...optionsRef.current,
      theme: resolvedTheme,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    fitAddonRef.current = fitAddon;

    if (optionsRef.current.onData) {
      term.onData(optionsRef.current.onData);
    }
    if (optionsRef.current.onResize) {
      term.onResize(optionsRef.current.onResize);
    }
    if (optionsRef.current.onTitleChange) {
      term.onTitleChange(optionsRef.current.onTitleChange);
    }

    if (optionsRef.current.onCwdChange) {
      term.parser.registerOscHandler(7, (data) => {
        let url = data;
        if (url.startsWith('file://')) url = url.slice(7);
        const slash = url.indexOf('/');
        if (slash !== -1 && !url.startsWith('/')) url = url.slice(slash);
        optionsRef.current.onCwdChange?.(decodeURIComponent(url));
        return true;
      });
    }

    setTerminal(term);

    return () => {
      term.dispose();
      fitAddon.dispose();
      setTerminal(null);
    };
  }, []);

  // Update theme when changed
  useEffect(() => {
    if (terminal) {
      terminal.updateTheme(resolvedTheme);
    }
  }, [terminal, resolvedTheme]);

  const bindContainer = useCallback(
    (node: HTMLDivElement | null) => {
      if (node && terminal && !terminal.element) {
        containerRef.current = node;
        terminal.open(node);
        fitAddonRef.current?.fit();
        if (optionsRef.current.autoFocus) {
          terminal.focus();
        }
      }
    },
    [terminal]
  );

  const write = useCallback(
    (data: string | Uint8Array) => {
      terminal?.write(data);
    },
    [terminal]
  );

  const writeln = useCallback(
    (data: string | Uint8Array) => {
      terminal?.writeln(data);
    },
    [terminal]
  );

  const clear = useCallback(() => {
    terminal?.clear();
  }, [terminal]);

  const focus = useCallback(() => {
    terminal?.focus();
  }, [terminal]);

  const blur = useCallback(() => {
    terminal?.blur();
  }, [terminal]);

  const fit = useCallback(() => {
    fitAddonRef.current?.fit();
  }, []);

  return {
    terminal,
    containerRef: bindContainer,
    fitAddon: fitAddonRef.current,
    write,
    writeln,
    clear,
    focus,
    blur,
    fit,
  };
}
