import { pino } from "pino";

export const logger = pino();
export const debug = false;

if (debug) logger.level = "trace";

export * from "./client";
export * from "./server";
export * from "./types";
