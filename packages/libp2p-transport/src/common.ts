import { defaultCodec } from "./codec";
import type { ServerInitOptions } from "./types";

export const defaultInitOptions: Required<
  ServerInitOptions<any, any, any, any>
> = {
  codec: defaultCodec,
  context: {},
  middleware: null,
};

export const control_name = "libp2p-transport/control";
