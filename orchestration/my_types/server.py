from typing import TypedDict, Literal


class Team(TypedDict):
    """Team from API response"""

    teamId: int
    league: Literal["MLB", "NBA", "NFL", "NCAAFB", "NCAABB"]
    fullName: str
    abbreviation: str
    location: str
    mascot: str
    arena: str
    conference: str


class Player(TypedDict):
    """Player from API response"""

    number: int | None
    playerId: int
    status: str
    name: str
    teamId: int
    league: Literal["MLB", "NBA", "NFL", "NCAAFB", "NCAABB"]
    position: str
    updatedAt: str
    height: str | None
    weight: int | None


class BaseballPlayerStats(TypedDict):
    """Baseball player stats from API response"""

    id: int
    errors: int
    hits: int
    runs: int
    singles: int
    doubles: int
    triples: int
    atBats: int
    walks: int
    caughtStealing: int
    homeRuns: int
    putouts: int
    stolenBases: int
    strikeouts: int
    hitByPitch: int
    intentionalWalks: int
    rbis: int
    outs: int
    hitsAllowed: int
    pitchingStrikeouts: int
    losses: int
    earnedRuns: int
    saves: int
    runsAllowed: int
    wins: int
    singlesAllowed: int
    doublesAllowed: int
    triplesAllowed: int
    pitchingWalks: int
    balks: int
    blownSaves: int
    pitchingCaughtStealing: int
    homeRunsAllowed: int
    inningsPitched: float
    pitchingPutouts: int
    stolenBasesAllowed: int
    wildPitches: int
    pitchingHitByPitch: int
    holds: int
    pitchingIntentionalWalks: int
    pitchesThrown: int
    strikes: int
    gameId: str
    playerId: int
    league: Literal["MLB"]
    status: str
    # Extended stats added by the API
    battingAvg: float
    sluggingPct: float
    obp: float
    ops: float
    hitsRunsRbis: int


class BaseballTeamStats(TypedDict):
    """Baseball team stats from API response"""

    gameId: str
    teamId: int
    league: Literal["MLB"]
    errors: int
    hits: int
    runs: int
    doubles: int
    triples: int
    atBats: int
    walks: int
    caughtStealing: int
    homeRuns: int
    stolenBases: int
    strikeouts: int
    rbis: int
    # Extended stats added by the API
    homeRunsAllowed: int
    pitchingStrikeouts: int
    pitchingWalks: int
    doublesAllowed: int
    hitsAllowed: int
    triplesAllowed: int
    runsAllowed: int
    strikes: int
    pitchesThrown: int
    battingAvg: float
    ops: float
    pitchingCaughtStealing: int
    stolenBasesAllowed: int
    earnedRuns: int


class BasketballPlayerStats(TypedDict):
    """Basketball player stats from API response"""

    id: int
    playerId: int
    gameId: str
    league: Literal["NBA", "NCAABB"]
    fouls: int
    blocks: int
    points: int
    steals: int
    assists: int
    minutes: float
    turnovers: int
    rebounds: int
    twoPointsMade: int
    fieldGoalsMade: int
    freeThrowsMade: int
    threePointsMade: int
    defensiveRebounds: int
    offensiveRebounds: int
    twoPointPercentage: float
    twoPointsAttempted: int
    fieldGoalsAttempted: int
    freeThrowsAttempted: int
    threePointsAttempted: int
    status: str
    # Extended stats added by the API
    trueShootingPct: float
    usageRate: float
    reboundsPct: float
    assistsPct: float
    blocksPct: float
    stealsPct: float
    threePct: float
    pointsReboundsAssists: int
    pointsRebounds: int
    pointsAssists: int
    reboundsAssists: int


class FootballPlayerStats(TypedDict):
    """Football player stats from API response"""

    id: int
    playerId: int
    gameId: str
    league: Literal["NFL", "NCAAFB"]
    completions: int
    fumblesLost: float
    rushingLong: float
    receivingLong: float
    passerRating: float
    passingYards: float
    rushingYards: float
    receivingYards: float
    passingAttempts: int
    rushingAttempts: int
    fumbleRecoveries: int
    passingTouchdowns: int
    rushingTouchdowns: int
    receivingTouchdowns: int
    passingInterceptions: int
    receptions: int
    fieldGoalsAttempted: int
    fieldGoalsMade: int
    fieldGoalsLong: float
    extraPointsAttempted: int
    extraPointsMade: int
    status: str
    # Extended stats added by the API
    receivingRushingTouchdowns: int
    passingRushingTouchdowns: int


class BasketballTeamStats(TypedDict):
    """Basketball team stats from API response"""

    id: int
    teamId: int
    gameId: str
    league: Literal["NBA", "NCAABB"]
    score: int
    fouls: int
    blocks: int
    steals: int
    assists: int
    turnovers: int
    rebounds: int
    twoPointsMade: int
    fieldGoalsMade: int
    freeThrowsMade: int
    threePointsMade: int
    defensiveRebounds: int
    offensiveRebounds: int
    twoPointPercentage: float
    twoPointsAttempted: int
    fieldGoalsAttempted: int
    freeThrowsAttempted: int
    threePointsAttempted: int
    # Extended stats added by the API
    pace: float
    offensiveRating: float
    defensiveRating: float


class FootballTeamStats(TypedDict):
    """Football team stats from API response"""

    id: int
    teamId: int
    gameId: str
    league: Literal["NFL", "NCAAFB"]
    score: int
    sacks: float
    safeties: int
    penaltiesTotal: int
    penaltiesYards: int
    turnovers: int
    firstDowns: int
    totalYards: int
    blockedKicks: int
    blockedPunts: int
    kicksBlocked: int
    passingYards: int
    puntsBlocked: int
    rushingYards: int
    defenseTouchdowns: int
    defenseInterceptions: int
    kickReturnTouchdowns: int
    puntReturnTouchdowns: int
    blockedKickTouchdowns: int
    blockedPuntTouchdowns: int
    interceptionTouchdowns: int
    fumbleReturnTouchdowns: int
    defenseFumbleRecoveries: int
    fieldGoalReturnTouchdowns: int
    twoPointConversionReturns: int
    twoPointConversionAttempts: int
    twoPointConversionSucceeded: int
    pointsAgainstDefenseSpecialTeams: int
    passingTouchdowns: int | None
    rushingTouchdowns: int | None
    specialTeamsTouchdowns: int | None
    passingYardsAllowed: int | None
    rushingYardsAllowed: int | None
    offenseTouchdowns: int | None
    # Extended stats added by the API
    completionsAllowed: int
    passingTouchdownsAllowed: int
    rushingTouchdownsAllowed: int


class LeagueAverages(TypedDict):
    """League averages response from API"""

    stat: str
    average: float
    sampleSize: int
    dataSource: Literal["current season", "current + previous season"]
