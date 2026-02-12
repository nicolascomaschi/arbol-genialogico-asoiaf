import React, { memo, useMemo } from 'react';
import { Character, Connection } from '../types';
import { CARD_WIDTH, CARD_HEIGHT, X_SPACING, Y_SPACING } from '../constants/config';

// Constants for configuration
const DISTANT_PARTNER_THRESHOLD = 1.1;
const ARC_HEIGHT = 40;
const ARC_RADIUS = 10;
const MARRIAGE_DOT_RADIUS = 3;
const MARRIAGE_DOT_RADIUS_HIGHLIGHT = 5;

interface ConnectionLinesProps {
  characters: Character[];
  connections: Connection[];
  hoveredNode: string | null;
}

const ConnectionLines: React.FC<ConnectionLinesProps> = ({ characters, connections, hoveredNode }) => {

  // Optimization: Create a map for O(1) character lookup
  const charMap = useMemo(() => {
    const map = new Map<string, Character>();
    characters.forEach(c => map.set(c.id, c));
    return map;
  }, [characters]);

  // Helper: Calculate path for child lines (stepped with rounded corners)
  const getChildPath = (x1: number, y1: number, x2: number, y2: number) => {
    const midY = y1 + (y2 - y1) / 2;

    // If vertical distance is too small, just straight line
    if (Math.abs(midY - y1) < ARC_RADIUS) {
        return `M ${x1} ${y1} L ${x2} ${y2}`;
    }

    // Direction for horizontal curve
    const direction = x2 > x1 ? 1 : -1;
    // If horizontal distance is small, reduce radius
    const effectiveRadius = Math.min(ARC_RADIUS, Math.abs(x2 - x1) / 2);

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

  // Helper: Calculate path for distant partners (U-shape over the top)
  const getDistantMarriagePath = (x1: number, x2: number, generation: number) => {
      const topY = generation * Y_SPACING; // Top of the card row
      const arcY = topY - ARC_HEIGHT;      // Apex of the arc
      const radius = ARC_RADIUS;

      const leftX = Math.min(x1, x2);
      const rightX = Math.max(x1, x2);

      // Start from top-center of the left card, go up, over, down to top-center of right card
      return {
          path: `
            M ${leftX} ${topY}
            L ${leftX} ${arcY + radius}
            Q ${leftX} ${arcY} ${leftX + radius} ${arcY}
            L ${rightX - radius} ${arcY}
            Q ${rightX} ${arcY} ${rightX} ${arcY + radius}
            L ${rightX} ${topY}
          `,
          midY: arcY
      };
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
        const parents = conn.parents.map(id => charMap.get(id)).filter(Boolean) as Character[];
        const children = conn.children.map(id => charMap.get(id)).filter(Boolean) as Character[];

        if (parents.length === 0) return null;

        // Calculate center point for parents (X axis)
        const parentX = parents.reduce((sum, p) => sum + (p.x * X_SPACING), 0) / parents.length + CARD_WIDTH/2;
        // Standard bottom of the parent row
        const parentBottomY = parents[0].generation * Y_SPACING + CARD_HEIGHT;

        // Determine if this connection group is highlighted
        const isHighlighted = hoveredNode && (
            conn.parents.includes(hoveredNode) ||
            conn.children.includes(hoveredNode)
        );

        const groupOpacity = hoveredNode
            ? (isHighlighted ? 1 : 0.1)
            : 0.5;

        const strokeColor = isHighlighted ? "#e4e4e7" : "#a1a1aa";
        const strokeWidth = isHighlighted ? 3 : 2;

        return (
          <g key={conn.id} style={{ opacity: groupOpacity, transition: 'opacity 0.3s ease' }}>

             {/* Parents Connector (Marriage Line) */}
             {parents.length > 1 && (() => {
               const p1 = parents[0];
               const p2 = parents[1]; // We assume 2 parents for marriage lines usually

               const p1Center = (p1.x * X_SPACING) + CARD_WIDTH/2;
               const p2Center = (p2.x * X_SPACING) + CARD_WIDTH/2;

               const isDistant = Math.abs(p1.x - p2.x) > DISTANT_PARTNER_THRESHOLD;

               let pathD = "";
               let marriageDotY = 0;

               if (isDistant) {
                   const { path, midY } = getDistantMarriagePath(p1Center, p2Center, p1.generation);
                   pathD = path;
                   marriageDotY = midY;
               } else {
                   // Standard straight line center-to-center
                   const yCenter = p1.generation * Y_SPACING + CARD_HEIGHT/2;
                   pathD = `M ${p1Center} ${yCenter} L ${p2Center} ${yCenter}`;
                   marriageDotY = yCenter;
               }

               return (
                 <>
                  <path
                    d={pathD}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray="4,4"
                    fill="none"
                  />
                  {/* Marriage Node Dot */}
                  <circle
                      cx={parentX}
                      cy={marriageDotY}
                      r={isHighlighted ? MARRIAGE_DOT_RADIUS_HIGHLIGHT : MARRIAGE_DOT_RADIUS}
                      fill={strokeColor}
                  />
                  {/* Vertical line from Marriage Node to Bottom of cards row (to start children lines) */}
                   <path
                      d={`M ${parentX} ${marriageDotY + (isDistant ? ARC_RADIUS : 0)} L ${parentX} ${parentBottomY}`}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                  />
                 </>
               );
             })()}

            {/* Children Lines */}
            {children.map(child => {
              const childX = (child.x * X_SPACING) + CARD_WIDTH / 2;
              const childY = child.generation * Y_SPACING;

              const startX = parentX;
              const startY = parentBottomY;

              const isBastardLine = child.isBastard;
              const pathD = getChildPath(startX, startY, childX, childY);

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
