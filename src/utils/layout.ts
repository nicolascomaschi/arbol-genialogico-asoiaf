import { Character, Connection } from '../types';

/**
 * A simple auto-layout algorithm for family trees.
 *
 * Strategy:
 * 1. Assign layers based on generation.
 * 2. Within each generation, order nodes to minimize edge crossings.
 * 3. Assign X coordinates based on relative parent positions.
 */
export function calculateAutoLayout(
  characters: Character[],
  connections: Connection[]
): Character[] {
  // Deep clone to avoid mutating original state in place
  const newCharacters: Character[] = JSON.parse(JSON.stringify(characters));

  if (newCharacters.length === 0) return [];

  // 1. Group by generation
  const layers: Record<number, Character[]> = {};
  let minGen = Infinity;
  let maxGen = -Infinity;

  newCharacters.forEach((char) => {
    const gen = char.generation;
    if (!layers[gen]) layers[gen] = [];
    layers[gen].push(char);
    if (gen < minGen) minGen = gen;
    if (gen > maxGen) maxGen = gen;
  });

  // 2. Process layers from top to bottom
  for (let gen = minGen; gen <= maxGen; gen++) {
    const layer = layers[gen];
    if (!layer || layer.length === 0) continue;

    // Calculate ideal X position based on parents (center of parents)
    layer.forEach((char: any) => {
      const parents = findParents(char.id, connections, newCharacters);
      if (parents.length > 0) {
        const avgParentX = parents.reduce((sum, p) => sum + p.x, 0) / parents.length;
        char._idealX = avgParentX;
      } else {
        // If no parents in this view, keep current X or default to 0
        char._idealX = char.x !== undefined ? char.x : 0;
      }
    });

    // Sort layer by ideal X position
    layer.sort((a: any, b: any) => (a._idealX || 0) - (b._idealX || 0));

    // Resolve overlaps (simple collision avoidance)
    if (layer.length > 0) {
        // Find the center of gravity for this layer based on ideal positions
        const totalIdealX = layer.reduce((sum, c: any) => sum + (c._idealX || 0), 0);
        const center = totalIdealX / layer.length;

        // Calculate spread width
        const GAP = 1.2; // Minimum distance between nodes
        const totalWidth = (layer.length - 1) * GAP;
        const startX = center - (totalWidth / 2);

        layer.forEach((char: any, index: number) => {
            // Apply new X coordinate
            char.x = startX + (index * GAP);
            delete char._idealX;
        });
    }
  }

  return newCharacters;
}

function findParents(charId: string, connections: Connection[], allChars: Character[]): Character[] {
    const parentIds = new Set<string>();
    connections.forEach(conn => {
        if (conn.children.includes(charId)) {
            conn.parents.forEach(p => parentIds.add(p));
        }
    });
    return allChars.filter(c => parentIds.has(c.id));
}
