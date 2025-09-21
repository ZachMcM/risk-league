import { and, eq, gte, gt, lt, notInArray, inArray } from "drizzle-orm";
import moment from "moment";
import { db } from "../db";
import {
  dynastyLeagueUser,
  game,
  leagueType,
  matchUser,
  prop,
} from "../db/schema";

export async function getAvailablePropsForUser({
  userId,
  matchId,
  dynastyLeagueId,
  fullData,
}: {
  userId: string;
  matchId?: number;
  dynastyLeagueId?: number;
  fullData: boolean;
}): Promise<{
  hasAvailableProps: boolean;
  availablePropsCount: number;
  league?: string;
  props?: any[];
}> {
  const propsPickedAlready: number[] = [];
  let league: string | undefined;

  if (matchId) {
    if (isNaN(matchId)) {
      throw new Error("Invalid matchId");
    }

    const matchUserResult = await db.query.matchUser.findFirst({
      where: and(eq(matchUser.userId, userId), eq(matchUser.matchId, matchId)),
      with: {
        parlays: {
          with: {
            picks: {
              columns: {
                propId: true,
              },
            },
          },
        },
        match: {
          columns: {
            league: true,
          },
        },
      },
    });

    if (!matchUserResult) {
      throw new Error("No matchUser found with the provided credentials");
    }

    league = matchUserResult.match.league;

    matchUserResult.parlays.forEach((parlay) => {
      parlay.picks.forEach((pick) => {
        propsPickedAlready.push(pick.propId);
      });
    });
  } else if (dynastyLeagueId) {
    if (isNaN(dynastyLeagueId)) {
      throw new Error("Invalid dynastyLeagueId");
    }

    const dynastyLeagueUserResult = await db.query.dynastyLeagueUser.findFirst({
      where: and(
        eq(dynastyLeagueUser.userId, userId),
        eq(dynastyLeagueUser.dynastyLeagueId, dynastyLeagueId)
      ),
      with: {
        parlays: {
          with: {
            picks: {
              columns: {
                propId: true,
              },
            },
          },
        },
        dynastyLeague: {
          columns: {
            league: true,
          },
        },
      },
    });

    if (!dynastyLeagueUserResult) {
      throw new Error("No dynastyLeagueUser found");
    }

    league = dynastyLeagueUserResult.dynastyLeague.league;

    dynastyLeagueUserResult.parlays.forEach((parlay) => {
      parlay.picks.forEach((pick) => {
        propsPickedAlready.push(pick.propId);
      });
    });
  } else {
    throw new Error("You must provide either a matchId or a dynastyLeagueId");
  }

  if (!league || !leagueType.enumValues.includes(league as any)) {
    throw new Error("Invalid league");
  }

  const now = moment();
  const startTime = now.clone().subtract(6, "hours").toISOString();
  const endTime = now.clone().add(18, "hours").toISOString();

  const availablePropIds = await db
    .select({
      id: prop.id,
    })
    .from(prop)
    .innerJoin(
      game,
      and(eq(prop.gameId, game.gameId), eq(prop.league, game.league))
    )
    .where(
      and(
        gte(game.startTime, startTime),
        lt(game.startTime, endTime),
        gt(game.startTime, new Date().toISOString()),
        eq(game.league, league as any),
        notInArray(
          prop.id,
          propsPickedAlready.length > 0 ? propsPickedAlready : [-1]
        )
      )
    );

  if (!fullData) {
    return {
      hasAvailableProps: availablePropIds.length > 0,
      availablePropsCount: availablePropIds.length,
      league,
    };
  }

  const extendedAvailableProps = await db.query.prop.findMany({
    where: inArray(
      prop.id,
      availablePropIds.map((p) => p.id)
    ),
    with: {
      game: {
        with: {
          homeTeam: true,
          awayTeam: true,
        },
      },
      player: {
        with: {
          team: true,
        },
      },
    },
  });

  return {
    hasAvailableProps: extendedAvailableProps.length > 0,
    availablePropsCount: extendedAvailableProps.length,
    league,
    props: extendedAvailableProps,
  };
}
