import { bimap } from 'utils';
const polygons = [3, 4, 5, 6, 8, 10];
export default polygons;

export type PolygonMap<T> = { [n: number]: T };

export const polygonNames = bimap({
  3: 'triangle',
  4: 'square',
  5: 'pentagon',
  6: 'hexagon',
  8: 'octagon',
  10: 'decagon',
});

export const polygonPrefixes = bimap({
  2: 'digonal',
  3: 'triangular',
  4: 'square',
  5: 'pentagonal',
  6: 'hexagonal',
  8: 'octagonal',
  10: 'decagonal',
});

/**
 * Return the apothem of an `n`-gon of side length `s`
 */
export function apothem(n: number, s: number) {
  return s / (2 * Math.tan(Math.PI / n));
}
