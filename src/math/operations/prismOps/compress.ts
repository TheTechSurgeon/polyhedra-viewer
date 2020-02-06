import { Polyhedron, Cap, VEList, Edge, Vertex } from 'math/polyhedra';
import makeOperation from '../makeOperation';
import { getTransformedVertices } from '../operationUtils';
import { inColumn } from '../../polyhedra/tableUtils';

/**
 * Return a function that calculate the vertices in a "facet" to compress
 * per edge-to-compress.
 */
function getVertexFunction(polyhedron: Polyhedron): (e: Edge) => Vertex[] {
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
  throw new Error('Invalid polyhedron type');
}

// FIXME octahedron can be enlarged two ways!!!
function doCompress(polyhedron: Polyhedron) {
  let base: VEList, edges: Edge[];

  const caps = Cap.getAll(polyhedron);
  if (caps.length === 0) {
    // If we don't have access to a cupola (i.e., we are a prism)
    // Use the largest face as a base and just pick every other edge
    base = polyhedron.largestFace();
    edges = base.edges.filter((_, i) => i % 2 === 0);
  } else {
    // If we are a cupola, use the cupola boundary as a base
    // and pick the edges adjacent to triangles, since those are the ones
    // that need to get compressed
    base = caps[0].boundary();
    edges = base.edges.filter(e => e.face.numSides === 3);
  }

  // Determine the facets that need to be pushed in, depending on what kind of polyhedron
  // we are dealing with
  const vertexFunc = getVertexFunction(polyhedron);
  const compressSets = edges.map(e => ({
    dirVec: base
      .centroid()
      .sub(e.midpoint())
      .getNormalized(),
    vertices: vertexFunc(e),
    polyhedron,
  }));

  // How far each facet needs to be pushed in
  const resApothem =
    base.sideLength() / (2 * Math.tan((2 * Math.PI) / base.numSides));
  const scale = base.apothem() - resApothem;

  // Push the vertices in and return the updated data
  const endVertices = getTransformedVertices(compressSets, ({ dirVec }) => v =>
    v.add(dirVec.scale(scale)),
  );
  return {
    animationData: {
      start: polyhedron,
      endVertices,
    },
  };
}

export const compress = makeOperation('compress', {
  apply(polyhedron) {
    return doCompress(polyhedron);
  },
});
