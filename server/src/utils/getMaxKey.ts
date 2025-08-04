export function getMaxKey(map: Map<any, number>) {
  const maxKey = [...map.entries()].reduce((a, b) => a[1] > b[1] ? a : b)[0]
  return maxKey
}