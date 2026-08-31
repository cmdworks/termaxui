import { useCallback, useEffect, useRef, useState } from 'react';
import { SearchAddon } from '../../addons/xterm-compat.js';
export function useTerminalSearch(terminal) {
    const searchAddonRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [useRegex, setUseRegex] = useState(false);
    const [useCase, setUseCase] = useState(false);
    const [useWord, setUseWord] = useState(false);
    const [resultIndex, setResultIndex] = useState(-1);
    const [resultCount, setResultCount] = useState(0);
    useEffect(() => {
        if (!terminal)
            return;
        const addon = new SearchAddon();
        terminal.loadAddon(addon);
        searchAddonRef.current = addon;
        const disposable = addon.onDidChangeResults((e) => {
            setResultIndex(e.resultIndex);
            setResultCount(e.resultCount);
        });
        return () => {
            disposable.dispose();
            addon.dispose();
            searchAddonRef.current = null;
        };
    }, [terminal]);
    const findNext = useCallback((term, opts) => {
        const q = term !== undefined ? term : query;
        if (!searchAddonRef.current || !q)
            return false;
        return searchAddonRef.current.findNext(q, {
            regex: opts?.regex ?? useRegex,
            caseSensitive: opts?.caseSensitive ?? useCase,
            wholeWord: opts?.wholeWord ?? useWord,
            ...opts,
        });
    }, [query, useRegex, useCase, useWord]);
    const findPrevious = useCallback((term, opts) => {
        const q = term !== undefined ? term : query;
        if (!searchAddonRef.current || !q)
            return false;
        return searchAddonRef.current.findPrevious(q, {
            regex: opts?.regex ?? useRegex,
            caseSensitive: opts?.caseSensitive ?? useCase,
            wholeWord: opts?.wholeWord ?? useWord,
            ...opts,
        });
    }, [query, useRegex, useCase, useWord]);
    const clearSearch = useCallback(() => {
        searchAddonRef.current?.clearDecorations();
        setResultIndex(-1);
        setResultCount(0);
    }, []);
    const open = useCallback(() => {
        setIsOpen(true);
    }, []);
    const close = useCallback(() => {
        setIsOpen(false);
        clearSearch();
        terminal?.focus();
    }, [clearSearch, terminal]);
    const toggle = useCallback(() => {
        if (isOpen)
            close();
        else
            open();
    }, [isOpen, open, close]);
    return {
        isOpen,
        open,
        close,
        toggle,
        query,
        setQuery,
        useRegex,
        setUseRegex,
        useCase,
        setUseCase,
        useWord,
        setUseWord,
        resultIndex,
        resultCount,
        findNext,
        findPrevious,
        clearSearch,
    };
}
