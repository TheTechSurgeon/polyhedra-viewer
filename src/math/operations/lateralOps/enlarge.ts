import _ from 'lodash';
import { apothem } from 'math/polygons';
import { withOrigin } from 'math/geom';
import { Polyhedron, Cap, Edge, VEList } from 'math/polyhedra';
import makeOperation from '../makeOperation';
import { inColumn, inRow } from '../../polyhedra/tableUtils';
import { antiprismHeight, getOppositePrismFaces } from '../prismOps/prismUtils';

import { expandEdges, getTransformedVertices } from '../operationUtils';
import {
  // hasAntiprism,
  everyOtherEdge,
  getBaseAndTransformEdges,
  getVertexFunction,
} from './lateralUtils';

export function hasAntiprism(polyhedron: Polyhedron) {
  return (
    // inColumn(polyhedron.name, 'prisms', 'antiprism') ||
    inColumn(polyhedron.name, 'capstones', 'gyroelongated') ||
    inColumn(polyhedron.name, 'capstones', 'gyroelongated bi-')
  );
}

function calculateScale(base: VEList) {
  const resApothem = apothem(2 * base.numSides, base.sideLength());
  return resApothem - base.apothem();
}

function _calculateScale(polyhedron: Polyhedron) {
  let base: VEList;
  // Here the base is only used to calculate the scale
  const caps = Cap.getAll(polyhedron);
  if (caps.length === 0) {
    base = getOppositePrismFaces(polyhedron)![0];
  } else {
    base = caps[0].boundary();
  }
  return calculateScale(base);
}

function getExpandEdges(polyhedron: Polyhedron) {
  if (inColumn(polyhedron.name, 'prisms', 'prism')) {
    const face =
      polyhedron.faces.find(f => f.numSides !== 4) ?? polyhedron.getFace();
    return face.edges.map(e => e.twin().next());
  }
  // if (inColumn(polyhedron.name, 'prisms', 'antiprism')) {
  //   const face =
  //     polyhedron.faces.find(f => f.numSides !== 3) ?? polyhedron.getFace();
  //   return face.edges.map(e => e.twin().next());
  // }
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
    // TODO this depends on chirality
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

function getExpandEdgesGyro(polyhedron: Polyhedron) {
  if (inColumn(polyhedron.name, 'prisms', 'antiprism')) {
    const face =
      polyhedron.faces.find(f => f.numSides !== 3) ?? polyhedron.getFace();
    return face.edges.map(e => e.twin().next());
  }
  const caps = Cap.getAll(polyhedron);
  if (inColumn(polyhedron.name, 'capstones', 'gyroelongated')) {
    return _.flatMap(caps[0].boundary().edges, e => [
      e.next(),
      e.twin().prev(),
    ]);
  }
  if (inColumn(polyhedron.name, 'capstones', 'gyroelongated bi-')) {
    return _.flatMap(caps, cap =>
      cap.boundary().edges.map(e => e.next()),
    ).concat(caps[0].boundary().edges.map(e => e.twin().prev()));
  }
  throw new Error('Unsupported polyhedron ' + polyhedron.name);
}

function getGyroOpposite(edge: Edge) {
  return edge
    .twin()
    .next()
    .twin()
    .prev()
    .twin();
}

function gyroCompressSets(edges: Edge[], base: VEList) {
  return edges.map(e => ({
    dirVec: e
      .midpoint()
      .sub(base.centroid())
      .getNormalized(),
    base,
    vertices: e.face.numSides === 3 ? e.face.vertices : e.vertices,
    polyhedron: base.polyhedron,
  }));
}

function doEnlargeGyro(polyhedron: Polyhedron) {
  // return polyhedron;
  const duplicated = expandEdges(polyhedron, getExpandEdgesGyro(polyhedron));
  const caps = Cap.getAll(duplicated, {
    noFaceCheck: true,
    noBoundaryCheck: true,
  });
  let bases: VEList[];
  let edges: Edge[];
  let edges2: Edge[];
  let isReverse = false;
  switch (caps.length) {
    // Prism, our bases are our largest faces
    case 0:
      bases = polyhedron.facesWithNumSides(polyhedron.largestFace().numSides);
      // edges = bases[0].edges.filter((e, i) => i % 2 === 0);
      edges = bases[0].edges.filter(e => e.isValid());
      edges2 = everyOtherEdge(getGyroOpposite(edges[0]));
      break;
    // gyroelongated cupola
    case 1:
      bases = [caps[0].boundary(), polyhedron.largestFace()];
      edges = bases[0].edges.filter(e => e.face.numSides === 3);
      edges2 = everyOtherEdge(getGyroOpposite(edges[0]));
      break;
    case 2:
      bases = caps.map(c => c.boundary());
      edges = bases[0].edges.filter(e => e.face.numSides === 3);
      edges2 = bases[1].edges.filter(e => e.face.numSides === 3);
      isReverse = getGyroOpposite(edges[0]).face.numSides !== 3;
      break;
    default:
      throw new Error('Invalid number of capstones');
  }
  const [base, base2] = bases;
  const n = base.numSides;
  const horizScale = _calculateScale(polyhedron);
  const vertScale =
    (base.sideLength() * (antiprismHeight(n * 2) - antiprismHeight(n))) / 2;
  const angle = (Math.PI / n / 2) * (isReverse ? 1 : -1);
  const compressSets = [
    ...gyroCompressSets(edges, base),
    ...gyroCompressSets(edges2, base2),
  ];
  const endVertices = getTransformedVertices(compressSets, ({ base, dirVec }) =>
    withOrigin(base.normalRay(), v =>
      v
        .add(dirVec.scale(horizScale))
        .sub(base.normal().scale(vertScale))
        .getRotatedAroundAxis(base.normal(), angle),
    ),
  );
  return {
    animationData: {
      start: polyhedron,
      endVertices,
    },
  };
}

// FIXME octahedron can be enlarged two ways!!!
function doEnlargeOrtho(polyhedron: Polyhedron) {
  const scale = _calculateScale(polyhedron);
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

function doEnlarge(polyhedron: Polyhedron) {
  if (hasAntiprism(polyhedron)) {
    return doEnlargeGyro(polyhedron);
  }
  return doEnlargeOrtho(polyhedron);
}

export const enlarge = makeOperation('enlarge', {
  apply(polyhedron) {
    return doEnlarge(polyhedron);
  },
});
