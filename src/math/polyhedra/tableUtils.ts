import _ from 'lodash';
import { sections } from './tables';
import { toConwayNotation } from './names';

// TODO do some thinking and make a smarter table data structure,
// and come up with a better API for this stuff.
//
// useful operations:
//
// * Rows along a section like "cupola" or "pyramid"
// * Multiple rows

type Comparator = (s1: string, s2: string) => boolean;
const defaultComparator = (s1: string, s2: string) => s1 === s2;

function hasDeep(
  collection: any,
  value: string,
  comparator: Comparator = defaultComparator,
): boolean {
  if (collection instanceof Array) {
    return _.some(collection, item => hasDeep(item, value, comparator));
  } else if (collection instanceof Object) {
    return _.some(_.values(collection), item =>
      hasDeep(item, value, comparator),
    );
  } else {
    return comparator(collection, value);
  }
}

const dataComparator: Comparator = (s1, s2) => s1.replace('!', '') === s2;

export function inRow(solid: string, sectionName: string, rowName: string) {
  const { rows, data } = sections[sectionName];
  const rowIndex = _.indexOf(rows, rowName);
  const row = data[rowIndex];
  return hasDeep(row, toConwayNotation(solid), dataComparator);
}

export function inColumn(solid: string, sectionName: string, colName: string) {
  const { columns, data } = sections[sectionName];
  const colIndex = _.findIndex(columns, col => {
    if (typeof col === 'string') {
      return col === colName;
    } else {
      // TODO make more robust, maybe support array of strings?
      return col.name === colName;
    }
  });
  return _.some(data, row =>
    hasDeep(row[colIndex], toConwayNotation(solid), dataComparator),
  );
}

export function inSection(solid: string, sectionName: string) {
  const { data } = sections[sectionName];
  return _.some(data, row =>
    hasDeep(row, toConwayNotation(solid), dataComparator),
  );
}
