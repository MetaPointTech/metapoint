import { ServerInitOptions } from "libp2p-transport";
import type { HandlerMeta, ServiceMeta, Unpick } from "./types";

export const h = <I extends T, O extends T, T = any, S extends {} = {}>(
  opts?: ServerInitOptions<I, O, T, S>,
) => {
  const { codec, context, middleware } = opts ?? {};

  const handler = (
    meta: Unpick<HandlerMeta<S, T, I, O>, "type">,
  ): HandlerMeta<S, T, I, O> => {
    if (codec && meta.codec === undefined) meta.codec = codec;
    if (context && meta.context === undefined) meta.context = context;
    if (middleware && meta.middleware === undefined) {
      meta.middleware = middleware;
    }

    return {
      type: "handler",
      ...meta,
    };
  };

  const service = (
    meta: Unpick<ServiceMeta<S, T, I, O>, "type">,
  ): ServiceMeta<S, T, I, O> => {
    if (codec && meta.codec === undefined) meta.codec = codec;
    if (context && meta.context === undefined) meta.context = context;
    if (middleware && meta.middleware === undefined) {
      meta.middleware = middleware;
    }

    return {
      type: "service",
      ...meta,
    };
  };

  return {
    handler,
    service,
  };
};
