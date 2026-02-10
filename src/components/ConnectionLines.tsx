import React from 'react';
import { Character, Connection } from '../types';
import { CARD_WIDTH, CARD_HEIGHT, X_SPACING, Y_SPACING } from '../constants/config';

interface ConnectionLinesProps {
  characters: Character[];
  connections: Connection[];
}

const ConnectionLines: React.FC<ConnectionLinesProps> = ({ characters, connections }) => {
  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible filter drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]">
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#71717a" />
        </marker>
      </defs>
      {connections.map((conn) => {
        const parents = conn.parents.map(id => characters.find(c => c.id === id)).filter(Boolean) as Character[];
        const children = conn.children.map(id => characters.find(c => c.id === id)).filter(Boolean) as Character[];

        if (parents.length === 0) return null;

        const parentX = parents.reduce((sum, p) => sum + (p.x * X_SPACING), 0) / parents.length + CARD_WIDTH/2;
        const parentY = parents[0].generation * Y_SPACING + CARD_HEIGHT;

        return (
          <g key={conn.id}>
             {/* Línea horizontal entre padres (parejas) */}
             {parents.length > 1 && (
              <path
                d={`M ${(parents[0].x * X_SPACING) + CARD_WIDTH/2} ${parents[0].generation * Y_SPACING + CARD_HEIGHT/2}
                    L ${(parents[1].x * X_SPACING) + CARD_WIDTH/2} ${parents[1].generation * Y_SPACING + CARD_HEIGHT/2}`}
                stroke="#71717a"
                strokeWidth="2"
                strokeDasharray="6,4"
                className="opacity-60"
              />
            )}
            {/* Líneas hacia hijos - Curvas Bezier elegantes */}
            {children.map(child => {
              const childX = (child.x * X_SPACING) + CARD_WIDTH / 2;
              const childY = child.generation * Y_SPACING;
              const startX = parentX;
              const startY = parentY;
              const midY = startY + (childY - startY) / 2;
              const isBastardLine = child.isBastard;

              return (
                <path
                  key={`${conn.id}-${child.id}`}
                  d={`M ${startX} ${startY} C ${startX} ${midY}, ${childX} ${midY}, ${childX} ${childY}`}
                  fill="none" stroke="#71717a" strokeWidth={isBastardLine ? "2" : "3"}
                  strokeDasharray={isBastardLine ? "8,6" : "none"} className="opacity-70"
                  markerEnd="url(#arrowhead)"
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};

export default ConnectionLines;
