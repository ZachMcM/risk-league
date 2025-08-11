import { Router } from "express";
import { apiKeyMiddleware } from "../middleware";
import { logger } from "../logger";
import { db } from "../db";
import { game, leagueType } from "../db/schema";

export const gamesRoute = Router();

interface GameData {
  id: string;
  startTime: string;
  homeTeamId: number;
  awayTeamId: number;
  league: (typeof leagueType.enumValues)[number];
}

function validateGameData(gameData: any): gameData is GameData {
  const validLeagues = leagueType.enumValues;
  return (
    typeof gameData.id === 'string' &&
    typeof gameData.startTime === 'string' &&
    typeof gameData.homeTeamId === 'number' &&
    typeof gameData.awayTeamId === 'number' &&
    typeof gameData.league === 'string' &&
    validLeagues.includes(gameData.league as any)
  );
}

gamesRoute.post("/games", apiKeyMiddleware, async (req, res) => {
  try {    
    const isBatch = Array.isArray(req.body.games);
    const gamesToInsert: GameData[] = isBatch ? req.body.games : [req.body];
    
    if (gamesToInsert.length === 0) {
      res.status(400).json({ error: "No games provided" });
      return;
    }

    const invalidGames = gamesToInsert.filter((gameData, index) => {
      if (!validateGameData(gameData)) {
        logger.warn(`Invalid game data at index ${index}`, { gameData });
        return true;
      }
      return false;
    });

    if (invalidGames.length > 0) {
      res.status(400).json({ 
        error: "Invalid game data provided",
        details: `${invalidGames.length} game(s) have invalid data. Required fields: id (string), startTime (string), homeTeamId (number), awayTeamId (number), league (string)`
      });
      return;
    }

    const result = await db.insert(game).values(gamesToInsert).returning({ id: game.id })

    logger.info(`Successfully inserted ${result.length} game(s)`, { gameIds: result.map(g => g.id) });
    
    res.json(isBatch ? result : result[0]);
  } catch (error) {
    logger.error('Error inserting games:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        res.status(409).json({ error: 'One or more games already exist' });
        return;
      }
      if (error.message.includes('foreign key')) {
        res.status(400).json({ error: 'Invalid team ID provided' });
        return;
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});
