import _ from 'lodash';
import { apothem } from 'math/polygons';
import { Polyhedron, Cap, VEList } from 'math/polyhedra';
import makeOperation from '../makeOperation';
import { inColumn, inRow } from '../../polyhedra/tableUtils';

import { expandEdges, getTransformedVertices } from '../operationUtils';
import {
  // hasAntiprism,
  getBaseAndTransformEdges,
  getVertexFunction,
} from './lateralUtils';

function calculateScale(polyhedron: Polyhedron) {
  let base: VEList;
  // if (hasAntiprism(polyhedron)) {
  //   throw new Error('antiprisms not yet supported');
  // }
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
    return _.flatMap(caps[0].boundary().edges, e => [
      e.next(),
      e.twin().next(),
    ]);
  }
  if (inColumn(polyhedron.name, 'capstones', 'elongated bi-')) {
    return _.flatMap(caps, cap =>
      cap.boundary().edges.map(e => e.next()),
    ).concat(caps[0].boundary().edges.map(e => e.twin().prev()));
  }
  if (inRow(polyhedron.name, 'augmented', 'triangular prism')) {
    const tips = _.flatMap(caps.map(cap => cap.innerVertices())).map(
      v => v.index,
    );
    const face = polyhedron.faces.find(f =>
      _.every(
        f.edges,
        e =>
          e.twinFace().numSides === 4 ||
          tips.includes(e.twin().next().v2.index),
      ),
    );
    return face!.edges.map(e =>
      e.twinFace().numSides === 4
        ? e.twin().next()
        : e
            .twin()
            .next()
            .twin()
            .next(),
    );
  }
  throw new Error('Unsupported polyhedron ' + polyhedron.name);
}

// FIXME octahedron can be enlarged two ways!!!
function doEnlarge(polyhedron: Polyhedron) {
  const scale = calculateScale(polyhedron);
  const duplicated = expandEdges(polyhedron, getExpandEdges(polyhedron));
  const { base, edges } = getBaseAndTransformEdges(duplicated, true);

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
