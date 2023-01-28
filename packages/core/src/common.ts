import { Evt } from "evt";
import { defaultCodec } from "./codec";
import type { InitOptions, OpenInitOptions } from "./types";

export const defaultInitOptions: Required<InitOptions<any>> = {
  codec: defaultCodec,
};

export const defaultOpenInitOptions: Required<OpenInitOptions<void, any>> = {
  codec: defaultCodec,
  ctx: Evt.newCtx(),
};
