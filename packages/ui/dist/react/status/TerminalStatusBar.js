import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function TerminalStatusBar({ branch, cwd, ptyState = 'running', agentStatus, stats, actions, className, style, }) {
    const agentColors = {
        idle: '#6e7681',
        working: '#e3b341',
        finished: '#3fb950',
        error: '#ff7b72',
    };
    return (_jsxs("div", { className: className, style: {
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
        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [agentStatus && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '5px' }, children: [_jsx("span", { style: {
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    backgroundColor: agentColors[agentStatus.state] || agentColors.idle,
                                } }), _jsx("span", { style: { color: '#c9d1d9' }, children: agentStatus.label || agentStatus.state })] })), branch && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx("span", { children: "\u2387" }), _jsx("span", { style: { color: '#58a6ff' }, children: branch })] })), cwd && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: [_jsx("span", { children: "\uD83D\uDCC2" }), _jsx("span", { children: cwd })] }))] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [stats && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8 }, children: [stats.cols && stats.rows && _jsxs("span", { children: [stats.cols, "\u00D7", stats.rows] }), stats.fps !== undefined && _jsxs("span", { children: [stats.fps, " FPS"] }), stats.throughput && _jsx("span", { children: stats.throughput })] })), actions] })] }));
}
