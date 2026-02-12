import dagre from 'dagre';
import { Character, Connection } from '../types';
import { CARD_WIDTH, CARD_HEIGHT, X_SPACING, Y_SPACING } from '../constants/config';

/**
 * Calculates a clean layout for the family tree using the Dagre library.
 * This is a deterministic layout algorithm that tries to minimize edge crossings.
 */
export function calculateAutoLayout(
  characters: Character[],
  connections: Connection[]
): Character[] {
  if (characters.length === 0) return [];

  // Create a new directed graph
  const g = new dagre.graphlib.Graph();

  // Set default graph options
  g.setGraph({
    rankdir: 'TB', // Top-to-Bottom layout
    nodesep: 100,  // Horizontal separation between nodes (pixels)
    ranksep: 200,  // Vertical separation between ranks (pixels)
    marginx: 50,
    marginy: 50,
  });

  // Default to assigning a new object for the edge label
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to the graph
  characters.forEach((char) => {
    g.setNode(char.id, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT
    });
  });

  // Add edges to the graph
  // Strategy: Connect each parent to each child directly.
  connections.forEach((conn) => {
    conn.parents.forEach((parentId) => {
      conn.children.forEach((childId) => {
         if (g.hasNode(parentId) && g.hasNode(childId)) {
             g.setEdge(parentId, childId);
         }
      });
    });
  });

  // Calculate the layout
  dagre.layout(g);

  // Map back to our Character objects
  return characters.map((char) => {
    const node = g.node(char.id);

    // Dagre returns CENTER coordinates (x, y) in pixels.
    // Our app uses TOP-LEFT coordinates normalized to X_SPACING/Y_SPACING units.

    // 1. Shift from Center to Top-Left
    const pixelX = node.x - (CARD_WIDTH / 2);
    const pixelY = node.y - (CARD_HEIGHT / 2);

    // 2. Normalize to grid units
    const gridX = parseFloat((pixelX / X_SPACING).toFixed(2));
    const gridY = parseFloat((pixelY / Y_SPACING).toFixed(2));

    return {
      ...char,
      x: gridX,
      generation: gridY // Use Dagre's calculated rank (Y) to ensure proper layering
    };
  });
}
