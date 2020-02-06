import { Polyhedron } from 'math/polyhedra';
import makeOperation from '../makeOperation';

function duplicateVertices(polyhedron: Polyhedron) {
  // for prism: duplicate all vertices and edges

  // cupola: duplicate across the triangles
  return polyhedron;
}

// Hmm... seems like the operations are the opposite of the other one

// 1. find the result
// 2. align and scale it
// 3. apply compress on it and reverse it
function doEnlarge(polyhedron: Polyhedron) {
  return duplicateVertices(polyhedron);
}

export const enlarge = makeOperation('enlarge', {
  apply(polyhedron) {
    return doEnlarge(polyhedron);
  },
});
