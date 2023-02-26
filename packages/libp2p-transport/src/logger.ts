import pino from "pino";
import { debug } from "./const";

export const logger = pino();

if (debug) logger.level = "trace";
