import { Polyhedron, Vertex, Edge } from '../../polyhedra';
import { inColumn, inRow } from '../../polyhedra/tableUtils';

export function everyOtherEdge(e0: Edge) {
  const result = [e0];
  let e = e0.next().next();
  while (!e.equals(e0)) {
    result.push(e);
    e = e.next().next();
  }
  return result;
}

export function hasAntiprism(polyhedron: Polyhedron) {
  return (
    inColumn(polyhedron.name, 'prisms', 'antiprism') ||
    inColumn(polyhedron.name, 'capstones', 'gyroelongated') ||
    inColumn(polyhedron.name, 'capstones', 'gyroelongated bi-')
  );
}

/**
 * Return a function that calculate the vertices in a "facet" to compress
 * per edge-to-compress.
 */
export function getVertexFunction(
  polyhedron: Polyhedron,
): (e: Edge) => Vertex[] {
  // For prisms, return the square faces
  if (inColumn(polyhedron.name, 'prisms', 'prism')) {
    return e => e.twinFace().vertices;
  }
  // For cupolae, return the cupola triangles
  if (inColumn(polyhedron.name, 'capstones', '--')) {
    return e => e.face.vertices;
  }
  // For elongated cupolae, return the square and the cupola tip
  if (inColumn(polyhedron.name, 'capstones', 'elongated')) {
    return e => [...e.twinFace().vertices, e.next().v2];
  }
  // For bicupolae, return the vertices of the two triangles
  if (inColumn(polyhedron.name, 'capstones', 'bi-')) {
    return e => [...e.twinFace().vertices, e.next().v2];
  }
  // For elongated bicupolae, return the square prism side and
  // the two cupola triangle tips
  if (inColumn(polyhedron.name, 'capstones', 'elongated bi-')) {
    return e => [
      ...e.twinFace().vertices,
      e.next().v2,
      e
        .twin()
        .next()
        .next()
        .twin()
        .next().v2,
    ];
  }
  // For an augmented hexagonal prism, check if the edge is attached to
  // a square or a pyramid
  if (inRow(polyhedron.name, 'augmented', 'hexagonal prism')) {
    return e => {
      if (e.twinFace().numSides === 4) {
        return e.twinFace().vertices;
      } else {
        const tip = e.twin().next().v2;
        return [tip, ...tip.adjacentVertices()];
      }
    };
  }
  throw new Error('Invalid polyhedron type');
}
