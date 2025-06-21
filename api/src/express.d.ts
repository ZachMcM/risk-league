import "express";

declare global {
  namespace Express {
    interface Locals {
      userId: string; // or `number`, depending on your ID type
    }
  }
}