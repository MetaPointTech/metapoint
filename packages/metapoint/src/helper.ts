import { ServerInitOptions } from "libp2p-transport";
import type { HandlerMeta, ServiceMeta, Unpick } from "./types";

export const h = <I extends T, O extends T, T = any, S extends {} = {}>(
  opts?: ServerInitOptions<I, O, T, S>,
) => {
  const { codec, context, middleware } = opts ?? {};

  const handler = <HI extends T = I, HO extends T = O, HS extends S = S>(
    meta: Unpick<HandlerMeta<HS, T, HI, HO>, "type">,
  ) => {
    if (codec && meta.codec === undefined) meta.codec = codec;
    if (context && meta.context === undefined) meta.context = context as unknown as typeof meta["context"];
    if (middleware && meta.middleware === undefined) {
      meta.middleware = middleware as unknown as typeof meta["middleware"];
    }

    return {
      type: "handler" as const,
      ...meta,
    };
  };

  const service = <HI extends T = I, HO extends T = O, HS extends S = S>(
    meta: Unpick<ServiceMeta<HS, T, HI, HO>, "type">,
  ) => {
    if (codec && meta.codec === undefined) meta.codec = codec;
    if (context && meta.context === undefined) meta.context = context as unknown as typeof meta["context"];
    if (middleware && meta.middleware === undefined) {
      meta.middleware = middleware as unknown as typeof meta["middleware"];
    }

    return {
      type: "service" as const,
      ...meta,
    };
  };

  return {
    handler,
    service,
  };
};
