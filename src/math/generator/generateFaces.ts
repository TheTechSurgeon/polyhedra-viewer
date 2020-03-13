import { times, minBy, every } from "lodash-es"
import { Point } from "types"
import { Vec3D, vec, getCentroid, PRECISION } from "math/geom"

function sortAdjacentVertices(
  vecs: Vec3D[],
  vIndex: number,
  adjacentVertices: number[],
  centroid: Vec3D,
) {
  const v = vecs[vIndex]
  const v0Index = adjacentVertices.pop()!
  const v0 = vecs[v0Index]
  const sorted = []
  let v1Index = v0Index
  const normal = v.sub(centroid)
  // FIXME probably an off-by-one here
  while (adjacentVertices.length) {
    sorted.push(v1Index)
    v1Index = minBy(adjacentVertices, uIndex => {
      const u = vecs[uIndex]
      // calculate (v1 - v) x (u - v)
      const cross = vecs[v1Index].sub(v).cross(u.sub(v))
      // compare it to the normal of the vertex
      return cross.angleBetween(normal)
    })!
    adjacentVertices.splice(adjacentVertices.indexOf(v1Index), 1)
  }
  return sorted
}

export default function generateFaces(vertices: Point[], length: number) {
  const vecs = vertices.map(vec)

  // Find the adjacent vertices of each vertex based on side length.
  const adjacentVertexSets = times<number[]>(vecs.length, () => [])
  for (let i = 0; i < vecs.length; i++) {
    const v1 = vecs[i]
    for (let j = i + 1; j < vecs.length; j++) {
      const v2 = vecs[j]
      if (Math.abs(v1.distanceTo(v2) - length) < PRECISION) {
        adjacentVertexSets[i].push(j)
        adjacentVertexSets[j].push(i)
      }
    }
  }
  const centroid = getCentroid(vecs)
  const adjacentVertexLists = adjacentVertexSets.map((adj, i) =>
    sortAdjacentVertices(vecs, i, adj, centroid),
  )
  const counts = adjacentVertexLists.map(list => list.length)
  const faces: number[][] = []
  while (every(counts, count => count > 0)) {
    let vIndex0 = counts.findIndex(count => count > 0)
    const adjacent = adjacentVertexLists[vIndex0]
    let vIndex1 = adjacent.findIndex(vIndex => counts[vIndex] > 0)
    const face = [vIndex0]
    while (vIndex1 !== vIndex0) {
      face.push(vIndex1)
      const newAdjacent = adjacentVertexLists[vIndex1]
      const vIndex2 = newAdjacent[newAdjacent.indexOf(vIndex0) - 1] // FIXME cyclic
      vIndex0 = vIndex1
      vIndex1 = vIndex2
    }
    faces.push(face)
  }
  return faces
}
