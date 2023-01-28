import { defaultCodec } from "./codec";
import type { InitOptions } from "./types";

export const defaultOptions: Required<InitOptions<any>> = {
  codec: defaultCodec,
};
