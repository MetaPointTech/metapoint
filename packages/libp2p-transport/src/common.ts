import { defaultCodec } from "./codec";
import type { ServerInitOptions } from "./types";

export const defaultInitOptions: Omit<
  Required<
    ServerInitOptions<any, any, any, any>
  >,
  "middleware"
> = {
  codec: defaultCodec,
  context: {},
};

export const control_name = "libp2p-transport/control";
