export function getMaxKey(map: Map<any, number>): null | any {
  if (map.size === 0) return null;
  const maxKey = [...map.entries()].reduce((a, b) => (a[1] > b[1] ? a : b))[0];
  return maxKey;
}
