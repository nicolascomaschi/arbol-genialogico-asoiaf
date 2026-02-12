import React, { memo } from 'react';
import { Character, Connection } from '../types';
import { CARD_WIDTH, CARD_HEIGHT, X_SPACING, Y_SPACING } from '../constants/config';

interface ConnectionLinesProps {
  characters: Character[];
  connections: Connection[];
  hoveredNode: string | null;
}

const ConnectionLines: React.FC<ConnectionLinesProps> = ({ characters, connections, hoveredNode }) => {

  const getRoundedStepPath = (x1: number, y1: number, x2: number, y2: number) => {
    const midY = y1 + (y2 - y1) / 2;
    const radius = 10;

    // If vertical distance is too small, just straight line
    if (Math.abs(midY - y1) < radius) {
        return `M ${x1} ${y1} L ${x2} ${y2}`;
    }

    // Direction for horizontal curve
    const direction = x2 > x1 ? 1 : -1;
    // If horizontal distance is small, reduce radius
    const effectiveRadius = Math.min(radius, Math.abs(x2 - x1) / 2);

    // Path:
    // 1. Move to start
    // 2. Vertical down to midY - radius
    // 3. Quadratic curve to turn horizontal
    // 4. Line horizontal to x2 - radius
    // 5. Quadratic curve to turn vertical
    // 6. Vertical down to end

    if (Math.abs(x2 - x1) < 1) {
         // Same column, straight down
         return `M ${x1} ${y1} L ${x2} ${y2}`;
    }

    return `
      M ${x1} ${y1}
      V ${midY - effectiveRadius}
      Q ${x1} ${midY} ${x1 + direction * effectiveRadius} ${midY}
      H ${x2 - direction * effectiveRadius}
      Q ${x2} ${midY} ${x2} ${midY + effectiveRadius}
      V ${y2}
    `;
  };

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible filter drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]">
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="#71717a" />
        </marker>
        <marker id="arrowhead-highlight" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="#e4e4e7" />
        </marker>
      </defs>
      {connections.map((conn) => {
        const parents = conn.parents.map(id => characters.find(c => c.id === id)).filter(Boolean) as Character[];
        const children = conn.children.map(id => characters.find(c => c.id === id)).filter(Boolean) as Character[];

        if (parents.length === 0) return null;

        // Calculate center point for parents
        const parentX = parents.reduce((sum, p) => sum + (p.x * X_SPACING), 0) / parents.length + CARD_WIDTH/2;
        const parentY = parents[0].generation * Y_SPACING + CARD_HEIGHT;

        // Determine if this connection group is highlighted
        // Highlight if hoveredNode is one of the parents OR one of the children
        const isHighlighted = hoveredNode && (
            conn.parents.includes(hoveredNode) ||
            conn.children.includes(hoveredNode)
        );

        // Base opacity: if something is hovered, fade out others. If nothing hovered, show normal (but thin).
        // Request: "fina y semitransparente por defecto" -> opacity-30
        // Hover: "resaltar solo sus conexiones" -> opacity-100 for highlighted, opacity-10 for others
        const groupOpacity = hoveredNode
            ? (isHighlighted ? 1 : 0.1)
            : 0.5; // Default low opacity increased to 0.5 for better visibility

        const strokeColor = isHighlighted ? "#e4e4e7" : "#a1a1aa"; // Lighter gray for better visibility
        const strokeWidth = isHighlighted ? 3 : 2;

        return (
          <g key={conn.id} style={{ opacity: groupOpacity, transition: 'opacity 0.3s ease' }}>

             {/* Parents Connector (Marriage Line) */}
             {parents.length > 1 && (
               <>
                <path
                  d={`M ${(parents[0].x * X_SPACING) + CARD_WIDTH/2} ${parents[0].generation * Y_SPACING + CARD_HEIGHT/2}
                      L ${(parents[1].x * X_SPACING) + CARD_WIDTH/2} ${parents[1].generation * Y_SPACING + CARD_HEIGHT/2}`}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray="4,4"
                />
                {/* Marriage Node Dot */}
                <circle
                    cx={parentX}
                    cy={parentY - CARD_HEIGHT/2}
                    r={isHighlighted ? 5 : 3}
                    fill={strokeColor}
                />
                {/* Vertical line from Marriage Node to Bottom of cards row (to start children lines) */}
                 <path
                    d={`M ${parentX} ${parentY - CARD_HEIGHT/2} L ${parentX} ${parentY}`}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                />
               </>
            )}

            {/* Children Lines */}
            {children.map(child => {
              const childX = (child.x * X_SPACING) + CARD_WIDTH / 2;
              const childY = child.generation * Y_SPACING;

              // If we have multiple parents, start from the shared center.
              // If single parent, start from that parent's bottom.
              const startX = parentX;
              const startY = parentY;

              const isBastardLine = child.isBastard;
              const pathD = getRoundedStepPath(startX, startY, childX, childY);

              return (
                <path
                  key={`${conn.id}-${child.id}`}
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={isBastardLine ? "6,4" : "none"}
                  markerEnd={isHighlighted ? "url(#arrowhead-highlight)" : "url(#arrowhead)"}
                  className="transition-all duration-300"
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};

export default memo(ConnectionLines);
