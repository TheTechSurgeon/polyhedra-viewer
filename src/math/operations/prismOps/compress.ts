import { Polyhedron } from 'math/polyhedra';
import makeOperation from '../makeOperation';
import { getTransformedVertices } from '../operationUtils';

function doCompress(polyhedron: Polyhedron) {
  if (!polyhedron.name.includes(' prism')) {
    throw new Error('non-prisms not yet supported');
  }

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
}

export const compress = makeOperation('compress', {
  apply(polyhedron) {
    return doCompress(polyhedron);
  },
});
