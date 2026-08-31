import { useEffect, useState } from 'react';
export function useTerminalDrop(terminal, options = {}) {
    const [isDropTarget, setIsDropTarget] = useState(false);
    useEffect(() => {
        if (!terminal || !terminal.element)
            return;
        const container = terminal.element;
        let dragCounter = 0;
        const handleDragEnter = (e) => {
            e.preventDefault();
            dragCounter++;
            setIsDropTarget(true);
        };
        const handleDragOver = (e) => {
            e.preventDefault();
            if (e.dataTransfer)
                e.dataTransfer.dropEffect = 'copy';
        };
        const handleDragLeave = () => {
            dragCounter--;
            if (dragCounter <= 0) {
                dragCounter = 0;
                setIsDropTarget(false);
            }
        };
        const handleDrop = (e) => {
            e.preventDefault();
            dragCounter = 0;
            setIsDropTarget(false);
            if (!e.dataTransfer)
                return;
            const files = Array.from(e.dataTransfer.files);
            const paths = files.map((f) => {
                const path = f.path || f.name;
                return /[\s"'\\]/.test(path) ? `'${path.replace(/'/g, `'\\''`)}'` : path;
            });
            if (paths.length > 0) {
                options.onDrop?.(paths);
                if (options.autoPaste ?? true) {
                    terminal.paste(paths.join(' ') + ' ');
                }
            }
        };
        container.addEventListener('dragenter', handleDragEnter);
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('dragleave', handleDragLeave);
        container.addEventListener('drop', handleDrop);
        return () => {
            container.removeEventListener('dragenter', handleDragEnter);
            container.removeEventListener('dragover', handleDragOver);
            container.removeEventListener('dragleave', handleDragLeave);
            container.removeEventListener('drop', handleDrop);
        };
    }, [terminal, options.onDrop, options.autoPaste]);
    return {
        isDropTarget,
    };
}
