import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { matchUser, pick } from "../db/schema";
import { authMiddleware } from "../middleware";
import { handleError } from "../utils/handleError";
import { getPickRequirements, PickRequirement } from "../constants/draftRequirements";

export const draftRoute = Router();

// Zod schema for basic payload validation
const draftPickSchema = z.object({
  choice: z.enum(["over", "under"]),
  propId: z.number().int().positive(),
  position: z.enum([
    "guard",
    "forward",
    "center",
    "qb",
    "wr",
    "rb",
    "te",
    "flex",
    "pitcher",
    "batter",
  ]),
});

const draftPayloadSchema = z.array(draftPickSchema);

// Validate position requirements
function validatePositionRequirements(
  picks: Array<{ position: string }>,
  requirements: PickRequirement[]
): { valid: boolean; error?: string } {
  // Count picks by position
  const positionCounts = new Map<string, number>();
  picks.forEach((pick) => {
    positionCounts.set(
      pick.position,
      (positionCounts.get(pick.position) || 0) + 1
    );
  });

  // Check each requirement is met
  for (const req of requirements) {
    const count = positionCounts.get(req.name) || 0;
    if (count !== req.count) {
      return {
        valid: false,
        error: `Expected ${req.count} ${req.name} pick(s), got ${count}`,
      };
    }
  }

  // Check for unexpected positions
  const validPositions = new Set(requirements.map((r) => r.name));
  for (const [position] of positionCounts) {
    if (!validPositions.has(position)) {
      return {
        valid: false,
        error: `Unexpected position: ${position}`,
      };
    }
  }

  return { valid: true };
}

// Main validation function
function validateDraftPayload(
  payload: unknown,
  league: string
): {
  valid: boolean;
  error?: string;
  data?: Array<{ choice: "over" | "under"; propId: number; position: string }>;
} {
  // Validate schema
  const parseResult = draftPayloadSchema.safeParse(payload);
  if (!parseResult.success) {
    return { valid: false, error: "Invalid payload structure" };
  }

  const picks = parseResult.data;
  const requirements = getPickRequirements(league);

  // Validate position requirements
  const positionValidation = validatePositionRequirements(picks, requirements);
  if (!positionValidation.valid) {
    return positionValidation;
  }

  return { valid: true, data: picks };
}

draftRoute.post("/draft/:matchId", authMiddleware, async (req, res) => {
  try {
    const matchId = parseInt(req.params.matchId);
    if (isNaN(matchId)) {
      return res.status(400).json({ error: "Invalid matchId" });
    }

    const matchUserData = await db.query.matchUser.findFirst({
      where: and(
        eq(matchUser.matchId, matchId),
        eq(matchUser.userId, res.locals.userId!)
      ),
      with: {
        match: {
          columns: {
            league: true,
          },
        },
      },
    });

    if (!matchUserData) {
      return res.status(404).json({ error: "No matchUser found" });
    }

    // Validate the draft payload
    const validation = validateDraftPayload(
      req.body,
      matchUserData.match.league
    );

    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const payload = validation.data!;

    await db.transaction(async (tx) => {
      for (const { propId, choice } of payload) {
        await tx.insert(pick).values({
          matchUserId: matchUserData.id,
          choice,
          propId,
        });
      }
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    handleError(error, res, "Draft route");
  }
});
