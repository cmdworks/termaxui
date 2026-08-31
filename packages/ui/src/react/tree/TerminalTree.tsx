import React, { useState } from 'react';

export interface TreeNode {
  id: string;
  name: string;
  isFolder?: boolean;
  children?: TreeNode[];
  icon?: string;
  badge?: string | number;
}

export interface TerminalTreeProps {
  data: TreeNode[];
  activeId?: string;
  onSelect?: (node: TreeNode) => void;
  onToggleFolder?: (node: TreeNode, expanded: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function TerminalTree({
  data,
  activeId,
  onSelect,
  onToggleFolder,
  className,
  style,
}: TerminalTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['root']));

  const toggleExpand = (node: TreeNode) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      const isCurrentlyExpanded = next.has(node.id);
      if (isCurrentlyExpanded) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
      onToggleFolder?.(node, !isCurrentlyExpanded);
      return next;
    });
  };

  const renderNodes = (nodes: TreeNode[], depth = 0) => {
    return nodes.map((node) => {
      const isExpanded = expandedIds.has(node.id);
      const isActive = node.id === activeId;

      return (
        <div key={node.id} style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            onClick={() => {
              if (node.isFolder) {
                toggleExpand(node);
              }
              onSelect?.(node);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 8px',
              paddingLeft: `${depth * 14 + 8}px`,
              fontSize: '12px',
              cursor: 'pointer',
              userSelect: 'none',
              backgroundColor: isActive ? 'rgba(88, 166, 255, 0.15)' : 'transparent',
              color: isActive ? '#58a6ff' : 'inherit',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
              {node.isFolder && (
                <span style={{ fontSize: '10px', width: '12px', opacity: 0.6 }}>
                  {isExpanded ? '▼' : '▶'}
                </span>
              )}
              <span>{node.icon || (node.isFolder ? '📁' : '📄')}</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {node.name}
              </span>
            </div>

            {node.badge !== undefined && (
              <span style={{ fontSize: '10px', opacity: 0.5, padding: '1px 4px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                {node.badge}
              </span>
            )}
          </div>

          {node.isFolder && isExpanded && node.children && (
            <div>{renderNodes(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        padding: '4px 0',
        fontSize: '12px',
        ...style,
      }}
    >
      {renderNodes(data)}
    </div>
  );
}
