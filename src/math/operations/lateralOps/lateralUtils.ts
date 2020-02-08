import _ from 'lodash';
import { Polyhedron, Vertex, Edge, VEList, Cap } from '../../polyhedra';
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

export function getBaseAndTransformEdges(
  polyhedron: Polyhedron,
  allowInvalid?: boolean,
) {
  const options = allowInvalid
    ? {
        noFaceCheck: true,
        noBoundaryCheck: true,
      }
    : {};
  let base: VEList, edges: Edge[];
  const caps = Cap.getAll(polyhedron, options);
  if (caps.length === 0) {
    // If we don't have access to a cupola (i.e., we are a prism)
    // Use the largest face as a base
    base = polyhedron.largestFace();
    // If we are enlarging, pick the valid edges
    edges = base.edges.filter(e => e.isValid());
    // Otherwise, we're compressing and we can pick every other edge
    if (edges.length === base.numSides) {
      edges = base.edges.filter((_, i) => i % 2 === 0);
    }
  } else if (caps[0].type === 'pyramid') {
    // If we are an augmented prism, use the largest face and make sure
    // the augmentee is one of the edges
    base = polyhedron.largestFace();
    edges = everyOtherEdge(base.edges.find(e => e.twinFace().numSides === 3)!);
  } else {
    // If we are a cupola, use the cupola boundary as a base
    // and pick the edges adjacent to triangles, since those are the ones
    // that need to get pushed
    const cap = caps.find(cap =>
      // make sure every square face in the cap is invalid
      // (rules out bad ones in elongated bicupolae)
      _.every(
        cap.boundary().edges.filter(e => e.face.numSides === 4),
        e => !e.isValid(),
      ),
    );
    base = (cap ?? caps[0]).boundary();
    edges = base.edges.filter(e => e.face.numSides === 3);
  }
  return { base, edges };
}
