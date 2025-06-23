export function getGameEndTime(gameTimeUTC: string) {
  const start = new Date(gameTimeUTC)
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000) // add 3 hours
  return end.toISOString()
}