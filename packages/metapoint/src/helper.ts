import { ServerInitOptions } from "libp2p-transport";
import type { HandlerMeta, ServiceMeta, Unpick } from "./types";

export const h = <I extends T, O extends T, T = any, S extends {} = {}>(
  opts?: ServerInitOptions<I, O, T, S>,
) => {
  const { codec, context, middleware } = opts ?? {};

  const handler = <HI extends T = I, HO extends T = O>(
    meta: Unpick<HandlerMeta<S, T, HI, HO>, "type">,
  ) => {
    if (codec && meta.codec === undefined) meta.codec = codec;
    if (context && meta.context === undefined) meta.context = context;
    if (middleware && meta.middleware === undefined) {
      meta.middleware = middleware as unknown as typeof meta["middleware"];
    }

    return {
      type: "handler" as const,
      ...meta,
    };
  };

  const service = <HI extends T = I, HO extends T = O>(
    meta: Unpick<ServiceMeta<S, T,  HI, HO>, "type">,
  ) => {
    if (codec && meta.codec === undefined) meta.codec = codec;
    if (context && meta.context === undefined) meta.context = context;
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
