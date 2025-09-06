import { and, desc, eq, gte, lte } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import {
  battlePass,
  battlePassTier,
  userBattlePassProgress,
} from "../db/schema";
import { authMiddleware } from "../middleware";
import { handleError } from "../utils/handleError";

export const battlePassRoute = Router();

// Get all active battle passes
battlePassRoute.get("/battle-pass/active", authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const activeBattlePasses = await db.query.battlePass.findMany({
      where: and(
        eq(battlePass.isActive, true),
        lte(battlePass.startDate, now),
        gte(battlePass.endDate, now)
      ),
      with: {
        tiers: {
          with: {
            cosmetic: true,
          },
          orderBy: battlePassTier.tier,
        },
      },
    });

    res.json(activeBattlePasses);
  } catch (error) {
    handleError(error, res, "Battle pass active route");
  }
});

// Get user's progress for a specific battle pass
battlePassRoute.get("/battle-pass/progress/:battlePassId", authMiddleware, async (req, res) => {
  try {
    const battlePassId = parseInt(req.params.battlePassId);
    const userId = res.locals.userId!;

    const userProgress = await db.query.userBattlePassProgress.findFirst({
      where: and(
        eq(userBattlePassProgress.userId, userId),
        eq(userBattlePassProgress.battlePassId, battlePassId)
      ),
      with: {
        battlePass: {
          with: {
            tiers: {
              with: {
                cosmetic: true,
              },
              orderBy: battlePassTier.tier,
            },
          },
        },
      },
    });

    if (!userProgress) {
      // User hasn't started this battle pass yet
      const battlePassData = await db.query.battlePass.findFirst({
        where: eq(battlePass.id, battlePassId),
        with: {
          tiers: {
            with: {
              cosmetic: true,
            },
            orderBy: battlePassTier.tier,
          },
        },
      });

      if (!battlePassData) {
        res.status(404).json({ error: "Battle pass not found" });
        return;
      }

      res.json({
        battlePass: battlePassData,
        currentXp: 0,
        currentTier: 0,
      });
      return;
    }

    res.json(userProgress);
  } catch (error) {
    handleError(error, res, "Battle pass progress route");
  }
});

// Get all user's battle pass progress
battlePassRoute.get("/battle-pass/progress", authMiddleware, async (req, res) => {
  try {
    const userId = res.locals.userId!;

    const userProgressList = await db.query.userBattlePassProgress.findMany({
      where: eq(userBattlePassProgress.userId, userId),
      with: {
        battlePass: {
          with: {
            tiers: {
              with: {
                cosmetic: true,
              },
              orderBy: battlePassTier.tier,
            },
          },
        },
      },
      orderBy: desc(userBattlePassProgress.createdAt),
    });

    res.json(userProgressList);
  } catch (error) {
    handleError(error, res, "Battle pass progress list route");
  }
});