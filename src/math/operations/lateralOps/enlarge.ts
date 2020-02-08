import _ from 'lodash';
import { apothem } from 'math/polygons';
import { Polyhedron, Cap, Edge, VEList } from 'math/polyhedra';
import makeOperation from '../makeOperation';
import { inColumn, inRow } from '../../polyhedra/tableUtils';

import { expandEdges, getTransformedVertices } from '../operationUtils';
import {
  everyOtherEdge,
  hasAntiprism,
  getVertexFunction,
} from './lateralUtils';

function calculateScale(polyhedron: Polyhedron) {
  let base: VEList;
  if (hasAntiprism(polyhedron)) {
    throw new Error('antiprisms not yet supported');
  }
  // Here the base is only used to calculate the scale
  const caps = Cap.getAll(polyhedron);
  if (caps.length === 0) {
    base = polyhedron.faces.find(f => f.numSides !== 4) ?? polyhedron.getFace();
    // TODO handle augmented triangular prism
  } else {
    base = caps[0].boundary();
  }
  const resApothem = apothem(2 * base.numSides, base.sideLength());
  return resApothem - base.apothem();
}

function getExpandEdges(polyhedron: Polyhedron) {
  if (inColumn(polyhedron.name, 'prisms', 'prism')) {
    const face =
      polyhedron.faces.find(f => f.numSides !== 4) ?? polyhedron.getFace();
    return face.edges.map(e => e.twin().next());
  }
  const caps = Cap.getAll(polyhedron);
  if (inColumn(polyhedron.name, 'capstones', '--')) {
    return caps[0].boundary().edges.map(e => e.next());
  }
  if (inColumn(polyhedron.name, 'capstones', 'elongated')) {
    return _.flatMap(caps[0].boundary().edges, e => [
      e.next(),
      e.twin().prev(),
    ]);
  }
  if (inColumn(polyhedron.name, 'capstones', 'bi-')) {
    return _.flatMap(caps, cap => cap.boundary().edges.map(e => e.next()));
  }
  if (inColumn(polyhedron.name, 'capstones', 'elongated bi-')) {
    return _.flatMap(caps, cap =>
      cap.boundary().edges.map(e => e.next()),
    ).concat(caps[0].boundary().edges.map(e => e.twin().prev()));
  }
  if (inRow(polyhedron.name, 'augmented', 'hexagonal prism')) {
    throw new Error('augmented prisms arent supported yet');
  }
  throw new Error('Unsupported polyhedron ' + polyhedron.name);
}

// FIXME octahedron can be enlarged two ways!!!
function doEnlarge(polyhedron: Polyhedron) {
  const scale = calculateScale(polyhedron);
  // handle only pyramids for now
  const duplicated = expandEdges(polyhedron, getExpandEdges(polyhedron));
  // const edges = duplicated.largestFace().edges.filter(e => e.length() > 0.001);
  let base: VEList, edges: Edge[];
  const caps = Cap.getAll(duplicated, {
    noFaceCheck: true,
    noBoundaryCheck: true,
  });
  if (caps.length === 0) {
    console.log('found no caps');
    // If we don't have access to a cupola (i.e., we are a prism)
    // Use the largest face as a base and just pick every other edge
    base = duplicated.largestFace();
    // edges = base.edges.filter((_, i) => i % 2 === 0);
    edges = base.edges.filter(e => e.length() > 0.001);
  } else if (caps[0].type === 'pyramid') {
    console.log('found only pyramids');
    // If we are an augmented prism, use the largest face and make sure
    // the augmentee is one of the edges
    base = duplicated.largestFace();
    edges = everyOtherEdge(base.edges.find(e => e.twinFace().numSides === 3)!);
  } else {
    console.log('found', caps.length, 'cupolae');
    // If we are a cupola, use the cupola boundary as a base
    // and pick the edges adjacent to triangles, since those are the ones
    // that need to get compressed

    const cap = caps.find(
      cap =>
        // make sure every triangular face in the cap is valid
        // (rules out bad ones in triangular bipyramid)
        _.every(
          cap.boundary().edges.filter(e => e.face.numSides === 3),
          e => e.length() > 0.001,
        ) &&
        // make sure every square face in the cap is invalid
        // (rules out bado ones in elongated bicupolae)
        _.every(
          cap.boundary().edges.filter(e => e.face.numSides === 4),
          e => e.length() < 0.001,
        ),
    );
    base = cap!.boundary();
    edges = base.edges.filter(e => e.face.numSides === 3);
  }

  const vertexFunc = getVertexFunction(polyhedron);
  const compressSets = edges.map(e => ({
    dirVec: e
      .midpoint()
      .sub(base.centroid())
      .getNormalized(),
    vertices: vertexFunc(e),
    polyhedron: duplicated,
  }));
  const endVertices = getTransformedVertices(compressSets, ({ dirVec }) => v =>
    v.add(dirVec.scale(scale)),
  );
  return {
    animationData: {
      start: duplicated,
      endVertices,
    },
  };
}

export const enlarge = makeOperation('enlarge', {
  apply(polyhedron) {
    return doEnlarge(polyhedron);
  },
});
