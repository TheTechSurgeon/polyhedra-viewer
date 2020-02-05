import { Polyhedron, Cap } from 'math/polyhedra';
import makeOperation from '../makeOperation';
import { getTransformedVertices } from '../operationUtils';

function doCompress(polyhedron: Polyhedron) {
  if (polyhedron.name.includes(' prism')) {
    // can always be guaranteed a base is the largest face b/c we only do compress
    // on 6, 8, 10
    const base = polyhedron.largestFace();
    const compressFaces = base.adjacentFaces().filter((_, index) => index % 2);

    const resApothem =
      base.sideLength() / (2 * Math.tan((2 * Math.PI) / base.numSides));
    const scale = base.apothem() - resApothem;

    // move the vertices of these faces inward
    const endVertices = getTransformedVertices(compressFaces, face => v =>
      v.add(
        face
          .normal()
          .getInverted()
          .scale(scale),
      ),
    );

    return {
      animationData: {
        start: polyhedron,
        endVertices,
      },
    };
  } else if (
    polyhedron.name.includes(' cupola') &&
    !polyhedron.name.includes('elongated')
  ) {
    const base = polyhedron.largestFace();
    const compressFaces = base
      .adjacentFaces()
      .filter(face => face.numSides === 3);

    const resApothem =
      base.sideLength() / (2 * Math.tan((2 * Math.PI) / base.numSides));
    const scale = base.apothem() - resApothem;
    const endVertices = getTransformedVertices(compressFaces, face => {
      const edge = face.edges.find(
        e => e.twinFace().numSides === base.numSides,
      )!;
      const dir = base
        .centroid()
        .sub(edge.midpoint())
        .getNormalized();
      return v => v.add(dir.scale(scale));
    });
    return {
      animationData: {
        start: polyhedron,
        endVertices,
      },
    };
  } else if (
    polyhedron.name.includes(' cupola') &&
    polyhedron.name.includes('elongated')
  ) {
    // const cap = Cap.getAll(polyhedron)[0];
    // const base = cap.boundary();
    // const compressSets = base.edges
    //   .filter(e => e.face.numSides === 3)
    //   .map(e => {
    //     return {
    //       face: e.twinFace(),
    //       vertices: [...e.twinFace().vertices, e.next().v2],
    //     };
    //   });
    // const resApothem =
    //   base.sideLength() / (2 * Math.tan((2 * Math.PI) / base.numSides));
    // const scale = base.apothem() - resApothem;
    // const endVertices = getTransformedVertices(compressSets, ({ face }) => v =>
    //   v.add(
    //     face
    //       .normal()
    //       .getInverted()
    //       .scale(scale),
    //   ),
    // );

    // return {
    //   animationData: {
    //     start: polyhedron,
    //     endVertices,
    //   },
    // };
    return polyhedron;
  }
  throw new Error('Polyhedron not supported yet');
}

export const compress = makeOperation('compress', {
  apply(polyhedron) {
    return doCompress(polyhedron);
  },
});
