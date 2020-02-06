import { Polyhedron, Cap, VEList, VertexList } from 'math/polyhedra';
import makeOperation from '../makeOperation';
import { getTransformedVertices } from '../operationUtils';
import { inColumn } from '../../polyhedra/tableUtils';
import { Vec3D } from '../../geom';

interface CompressArgs<VL extends VertexList> {
  /** The face-like regular polygon to reference when contracting */
  base: VEList;
  /** The list of `VertexList`s to apply compression to. */
  compressSets: VL[];
  /** The direction vector to push each Vertex set. Must be a unit vector. */
  getDirVec: (set: VL) => Vec3D;
}

function compressVertices<VL extends VertexList>({
  base,
  compressSets,
  getDirVec,
}: CompressArgs<VL>) {
  const resApothem =
    base.sideLength() / (2 * Math.tan((2 * Math.PI) / base.numSides));
  const scale = base.apothem() - resApothem;
  const endVertices = getTransformedVertices(compressSets, set => {
    return v => v.add(getDirVec(set).scale(scale));
  });
  return {
    animationData: {
      start: compressSets[0].polyhedron,
      endVertices,
    },
  };
}

function doCompress(polyhedron: Polyhedron) {
  if (inColumn(polyhedron.name, 'prisms', 'prism')) {
    const base = polyhedron.largestFace();
    return compressVertices({
      base,
      compressSets: base.adjacentFaces().filter((_, index) => index % 2),
      getDirVec: face => face.normal().getInverted(),
    });
  }
  if (inColumn(polyhedron.name, 'capstones', '--')) {
    const base = polyhedron.largestFace();
    return compressVertices({
      base,
      // compressSets: base.adjacentFaces().filter(face => face.numSides === 3),
      compressSets: base.edges
        .filter(e => e.twinFace().numSides === 3)
        .map(edge => ({
          edge: edge.twin(),
          vertices: edge.twinFace().vertices,
          polyhedron,
        })),
      getDirVec: ({ edge }) => {
        return base
          .centroid()
          .sub(edge.midpoint())
          .getNormalized();
      },
    });
  }
  if (inColumn(polyhedron.name, 'capstones', 'elongated')) {
    const cap = Cap.getAll(polyhedron)[0];
    const base = cap.boundary();
    return compressVertices({
      base,
      compressSets: base.edges
        .filter(e => e.face.numSides === 3)
        .map(e => {
          return {
            face: e.twinFace(),
            vertices: [...e.twinFace().vertices, e.next().v2],
            polyhedron,
          };
        }),
      getDirVec: ({ face }) => face.normal().getInverted(),
    });
  }
  if (inColumn(polyhedron.name, 'capstones', 'bi-')) {
    const cap = Cap.getAll(polyhedron)[0];
    const base = cap.boundary();
    return compressVertices({
      base,
      compressSets: base.edges
        .filter(e => e.face.numSides === 3)
        .map(e => {
          return {
            vertices: [...e.twinFace().vertices, e.next().v2],
            polyhedron,
            edge: e,
          };
        }),
      getDirVec: ({ edge }) =>
        base
          .centroid()
          .sub(edge.midpoint())
          .getNormalized(),
    });
  }
  if (inColumn(polyhedron.name, 'capstones', 'elongated bi-')) {
    const cap = Cap.getAll(polyhedron)[0];
    const base = cap.boundary();
    return compressVertices({
      base,
      compressSets: base.edges
        .filter(e => e.face.numSides === 3)
        .map(edge => ({
          edge,
          polyhedron,
          vertices: [
            edge.next().v2,
            ...edge.twinFace().vertices,
            edge
              .twin()
              .next()
              .next()
              .twin()
              .next().v2,
          ],
        })),
      getDirVec: ({ edge }) =>
        base
          .centroid()
          .sub(edge.midpoint())
          .getNormalized(),
    });
  }
  throw new Error('Unsupported polyhedron');
}

export const compress = makeOperation('compress', {
  apply(polyhedron) {
    return doCompress(polyhedron);
  },
});
