/**
 * Gets the multiplier for a perfect play parlay given the number of picks
 */
export function getPerfectPlayMultiplier(pickCount: number): number {
  const multipliers: Record<number, number> = {
    2: 3.0,
    3: 5.0,
    4: 10.0,
    5: 20.0,
    6: 37.5,
  };

  return multipliers[pickCount] || 0;
}

/**
 * Gets the multiplier for a flex play given the number of picks and hits
 */
export function getFlexMultiplier(pickCount: number, hitCount: number): number {
  const flexPayouts: Record<string, number> = {
    // 3-pick flex
    "3-3": 2.25,
    "3-2": 1.25,

    // 4-pick flex
    "4-4": 5,
    "4-3": 1.5,

    // 5-pick flex
    "5-5": 10.0,
    "5-4": 2.0,
    "5-3": 0.4,

    // 6-pick flex
    "6-6": 25.0,
    "6-5": 2.0,
    "6-4": 0.4,
  };

  const key = `${pickCount}-${hitCount}`;
  return flexPayouts[key] || 0;
}
