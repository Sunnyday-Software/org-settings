export class ExtMap<K, V> extends Map<K, V> {
  getOrInsert(key: K, defaultValue: () => V): V {
    if (this.has(key)) {
      return this.get(key) as V;
    } else {
      const v = defaultValue();
      this.set(key, v);
      return v;
    }
  }
}
