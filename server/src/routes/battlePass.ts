import { and, desc, eq, gte, lte } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db";
import {
  battlePass,
  battlePassTier,
  userBattlePassProgress,
  userCosmetic,
} from "../db/schema";
import { authMiddleware } from "../middleware";
import { handleError } from "../utils/handleError";
import { invalidateQueries } from "../utils/invalidateQueries";
import { logger } from "../logger";

export const battlePassRoute = Router();

battlePassRoute.post(
  "/battle-pass/:battlePassId",
  authMiddleware,
  async (req, res) => {
    try {
      const battlePassId = parseInt(req.params.battlePassId);

      await db.insert(userBattlePassProgress).values({
        battlePassId,
        userId: res.locals.userId!,
      });

      invalidateQueries(["battle-pass", battlePassId, "progress", res.locals.userId!]);
      res.json({ success: true });
    } catch (error) {
      handleError(error, res, "Battle Pass");
    }
  }
);

battlePassRoute.get("/battle-pass/active", authMiddleware, async (_, res) => {
  try {
    const now = (new Date()).toISOString();
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

battlePassRoute.post(
  "/battle-pass/:battlePassId/tier/:tierId/claim",
  authMiddleware,
  async (req, res) => {
    try {
      const battlePassId = parseInt(req.params.battlePassId);
      const tierId = parseInt(req.params.tierId);

      const userProgress = await db.query.userBattlePassProgress.findFirst({
        where: and(
          eq(userBattlePassProgress.battlePassId, battlePassId),
          eq(userBattlePassProgress.userId, res.locals.userId!)
        ),
      });

      if (!userProgress) {
        res.status(409).json({ error: "You don't have this battle pass" });
        return;
      }

      const tier = await db.query.battlePassTier.findFirst({
        where: and(
          eq(battlePassTier.battlePassId, battlePassId),
          eq(battlePassTier.id, tierId)
        ),
      });

      if (!tier) {
        res.status(404).json({ error: "No tier found" });
        return;
      }

      if (userProgress.currentXp < tier?.xpRequired) {
        res.status(409).json({ error: "You do not have enough XP" });
        return;
      }

      const userHasCosmetic = await db.query.userCosmetic.findFirst({
        where: and(
          eq(userCosmetic.cosmeticId, tier.cosmeticId),
          eq(userCosmetic.userId, res.locals.userId!)
        ),
      });

      if (userHasCosmetic) {
        res.status(409).json({ error: "You already have this cosmetic" });
        return;
      }

      await db.insert(userCosmetic).values({
        userId: res.locals.userId!,
        cosmeticId: tier.cosmeticId,
      });

      invalidateQueries(["user", res.locals.userId!, "cosmetics"]);

      res.json({ success: true });
    } catch (error) {
      handleError(error, res, "Battle Pass");
    }
  }
);

battlePassRoute.get(
  "/battle-pass/:battlePassId/progress",
  authMiddleware,
  async (req, res) => {
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
          currentXp: null,
        });
        return;
      }

      res.json(userProgress);
    } catch (error) {
      handleError(error, res, "Battle pass progress route");
    }
  }
);
