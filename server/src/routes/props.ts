import { Router } from "express";
import { authMiddleware } from "./auth";
import { db } from "../drizzle";
import { and, gt, gte, lt } from "drizzle-orm";
import { props } from "../drizzle/schema";

export const propsRoute = Router();

propsRoute.get("/props", authMiddleware, async (req, res) => {
  try {
    const availableProps = await db.query.props.findMany({
      where: and(
        gt(props.gameStartTime, new Date().toISOString()),
        gte(props.gameStartTime, new Date().toISOString().split('T')[0] + 'T00:00:00.000Z'),
        lt(props.gameStartTime, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T00:00:00.000Z')
      ),
      limit: parseInt(process.env.INITIAL_PROPS_COUNT!),
      with: {
        player: true,
        parlayPicks: true,
        team: true
      }
    });

    const availablePropsWithPickCount = availableProps.map(prop => (
      {
        ...prop,
        parlayPicksCount: prop.parlayPicks.length,
        oppTeam: prop.team
      }
    )) 
    
    res.json(availablePropsWithPickCount);
  } catch (err) {
    res.status(500).json({ error: "Server Error", message: err });
  }
});
