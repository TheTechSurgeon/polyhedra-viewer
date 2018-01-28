import _ from 'lodash'

import { johnsonSolids } from 'data'

export const escapeName = name => name.replace(/ /g, '-')

export const unescapeName = name => name.replace(/-/g, ' ')

const prismNames = {
  3: 'triangular',
  4: 'square',
  5: 'pentagonal',
  6: 'hexagonal',
  8: 'octagonal',
  10: 'decagonal',
}

const inversePrismNames = _.invert(prismNames)

const platonicMapping = {
  T: 'tetrahedron',
  C: 'cube',
  O: 'octahedron',
  D: 'dodecahedron',
  I: 'icosahedron',
}

const inversePlatonicMapping = _.invert(platonicMapping)

const archimedeanMapping = {
  tT: 'truncated tetrahedron',
  aC: 'cuboctahedron',
  tC: 'truncated cube',
  tO: 'truncated octahedron',
  eC: 'rhombicuboctahedron',
  bC: 'truncated cuboctahedron',
  sC: 'snub cube',
  aD: 'icosidodecahedron',
  tD: 'truncated dodecahedron',
  tI: 'truncated icosahedron',
  eD: 'rhombicosidodecahedron',
  bD: 'truncated icosidodecahedron',
  sD: 'snub dodecahedron',
}

const inverseArchimedeanMapping = _.invert(archimedeanMapping)

const fromConwayNotationUnescaped = notation => {
  const prefix = notation[0]
  const number = notation.substring(1)
  if (platonicMapping[notation]) {
    return platonicMapping[notation]
  }
  if (archimedeanMapping[notation]) {
    return archimedeanMapping[notation]
  }
  if (prefix === 'J') {
    return johnsonSolids[number - 1]
  }
  if (prefix === 'P') {
    return `${prismNames[number]} prism`
  }
  if (prefix === 'A') {
    return `${prismNames[number]} antiprism`
  }
  return ''
}

export const fromConwayNotation = notation =>
  escapeName(fromConwayNotationUnescaped(notation))

export const toConwayNotation = solid => {
  const name = unescapeName(solid)
  if (inversePlatonicMapping[name]) {
    return inversePlatonicMapping[name]
  }
  if (inverseArchimedeanMapping[name]) {
    return inverseArchimedeanMapping[name]
  }
  if (_.includes(johnsonSolids, name)) {
    return 'J' + (johnsonSolids.indexOf(name) + 1)
  }
  if (name.includes('antiprism')) {
    const [prefix] = name.split(' ')
    return 'A' + inversePrismNames[prefix]
  }
  if (name.includes('prism')) {
    const [prefix] = name.split(' ')
    return 'P' + inversePrismNames[prefix]
  }
  return null
}