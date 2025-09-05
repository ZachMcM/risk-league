import { Response } from "express";
import { logger } from "../logger";

export function handleError(
  error: unknown,
  res: Response,
  routeName: string = "Route"
): void {
  logger.error(
    `${routeName} error:`,
    error instanceof Error ? error.message : String(error),
    error instanceof Error ? error.stack : ""
  );

  res.status(500).json({
    error: error instanceof Error ? error.message : String(error),
  });
}
