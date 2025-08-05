import { calculateProgression } from "./calculateProgression";
import { findRank } from "./findRank";

export function calculateProgressionDelta(
  pointsSnapshot: number,
  pointsDelta: number
) {
  const oldRank = findRank(pointsSnapshot);
  const newRank = findRank(pointsSnapshot + pointsDelta);

  if (
    !oldRank ||
    !newRank ||
    oldRank.tier == "Legend" ||
    newRank.tier == "Legend"
  ) {
    return null;
  }

  if (oldRank == newRank) {
    return (
      calculateProgression(pointsSnapshot + pointsDelta)! -
      calculateProgression(pointsSnapshot)!
    );
  }

  const oldProgression = calculateProgression(pointsSnapshot)!;
  const newProgression = calculateProgression(pointsSnapshot + pointsDelta)!;

  if (pointsDelta > 0) {
    return 100 - oldProgression + newProgression;
  } else {
    return -(oldProgression + (100 - newProgression));
  }
}
