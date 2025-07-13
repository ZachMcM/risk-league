import { Router } from "express";
import { authMiddleware } from "./auth";
import { db } from "../drizzle";
import { gt } from "drizzle-orm";
import { parlayPicks, props } from "../drizzle/schema";

export const propsRouter = Router();

propsRouter.get("/props", authMiddleware, async (req, res) => {
  try {
    const availableProps = await db.query.props.findMany({
      where: gt(props.gameStartTime, new Date().toISOString()),
      limit: parseInt(process.env.INITIAL_PROPS_COUNT!),
      with: {
        player: true,
        parlayPicks: true
      }
    });

    const availablePropsWithPickCount = availableProps.map(prop => (
      {
        ...prop,
        parlayPicksCount: prop.parlayPicks.length
      }
    )) 
    
    res.json();
  } catch (err) {
    res.status(500).json({ error: "Server Error", message: err });
  }
});
