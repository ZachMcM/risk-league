import { User } from "better-auth/*";
import "express";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}