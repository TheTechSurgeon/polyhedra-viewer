import { Polyhedron, Cap, VEList, Edge, Vertex } from 'math/polyhedra';
import { withOrigin } from 'math/geom';
import makeOperation from '../makeOperation';
import { getTransformedVertices } from '../operationUtils';
import { inColumn } from '../../polyhedra/tableUtils';

interface CompressArgs {
  /** The regular polygonal base used to calculate the distance to compress */
  base: VEList;
  /** The list of edges of the base to compress: should be every other edge of the base */
  edges: Edge[];
  /** The vertices to compress for each edge */
  vertexListForEdge: (e: Edge) => Vertex[];
  /** Whether to apply a twist to the compression (for antiprisms) */
  twist?: boolean;
}

// FIXME octahedron can be enlarged two ways!!!
function compressVertices({
  twist,
  base,
  edges,
  vertexListForEdge,
}: CompressArgs) {
  const polyhedron = base.polyhedron;
  const resApothem =
    base.sideLength() / (2 * Math.tan((2 * Math.PI) / base.numSides));
  const scale = base.apothem() - resApothem;

  const compressSets = edges.map(e => ({
    dirVec: base
      .centroid()
      .sub(e.midpoint())
      .getNormalized(),
    vertices: vertexListForEdge(e),
    polyhedron,
  }));

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

// TODO we can generalize this even further based on whether the base is a Face or a capstone boundary
// but I want to wait until we have the antiprisms in there
function doCompress(polyhedron: Polyhedron) {
  if (inColumn(polyhedron.name, 'prisms', 'prism')) {
    const base = polyhedron.largestFace();
    return compressVertices({
      base,
      edges: base.edges.filter((e, index) => index % 2 === 0),
      vertexListForEdge: e => e.twinFace().vertices,
    });
  }
  if (inColumn(polyhedron.name, 'capstones', '--')) {
    const cap = Cap.getAll(polyhedron)[0];
    const base = cap.boundary();
    return compressVertices({
      base,
      edges: base.edges.filter(e => e.face.numSides === 3),
      vertexListForEdge: e => e.face.vertices,
    });
  }
  if (inColumn(polyhedron.name, 'capstones', 'elongated')) {
    const cap = Cap.getAll(polyhedron)[0];
    const base = cap.boundary();
    return compressVertices({
      base,
      edges: base.edges.filter(e => e.face.numSides === 3),
      vertexListForEdge: e => [...e.twinFace().vertices, e.next().v2],
    });
  }
  if (inColumn(polyhedron.name, 'capstones', 'bi-')) {
    const cap = Cap.getAll(polyhedron)[0];
    const base = cap.boundary();
    return compressVertices({
      base,
      edges: base.edges.filter(e => e.face.numSides === 3),
      vertexListForEdge: e => [...e.twinFace().vertices, e.next().v2],
    });
  }
  if (inColumn(polyhedron.name, 'capstones', 'elongated bi-')) {
    const cap = Cap.getAll(polyhedron)[0];
    const base = cap.boundary();
    return compressVertices({
      base,
      edges: base.edges.filter(e => e.face.numSides === 3),
      vertexListForEdge: e => [
        ...e.twinFace().vertices,
        e.next().v2,
        e
          .twin()
          .next()
          .next()
          .twin()
          .next().v2,
      ],
    });
  }
  throw new Error('Unsupported polyhedron');
}

export const compress = makeOperation('compress', {
  apply(polyhedron) {
    return doCompress(polyhedron);
  },
});
