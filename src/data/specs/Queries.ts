import { isFunction, isMatch, some } from "lodash-es"
import { getSingle } from "utils"
import type Specs from "./PolyhedronSpecs"

type QueryFilter<Data extends {}> = Partial<Data> | ((data: Data) => boolean)

function applyFilter<Data extends {}>(item: Data, filter: QueryFilter<Data>) {
  if (isFunction(filter)) {
    return filter(item)
  }
  return isMatch(item, filter)
}

export default class Queries<S extends Specs> {
  entries: S[]
  nameMapping: Map<string, S[]>
  constructor(entries: Iterable<S>) {
    this.entries = [...entries]
    this.nameMapping = new Map()
    for (const entry of this.entries) {
      const name = entry.canonicalName()
      if (!this.nameMapping.has(name)) {
        this.nameMapping.set(name, [])
      }
      this.nameMapping.set(name, [...this.nameMapping.get(name)!, entry])
    }
  }

  hasName(name: string) {
    return this.nameMapping.has(name)
  }

  withData(data: S["data"]) {
    return getSingle(this.entries.filter((item) => isMatch(item.data, data)))
  }

  /**
   * Get the entry with the given canonical name.
   */
  withName(name: string) {
    if (!this.nameMapping.has(name)) {
      throw new Error(`Could not find entry with canonical name ${name}`)
    }
    return this.nameMapping.get(name)![0]
  }

  where(filter: QueryFilter<S["data"]>) {
    return this.entries.filter((entry) => applyFilter(entry.data, filter))
  }

  hasNameWhere(name: string, filter: QueryFilter<S["data"]>) {
    return some(
      this.nameMapping.get(name)!,
      (entry) =>
        entry.canonicalName() === name && applyFilter(entry.data, filter),
    )
  }
}