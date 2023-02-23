import { InitOptions } from "libp2p-transport";
import type { Endpoint, HandlerMeta, ServiceMeta, Unpick } from "./types";

export const h = <T, S extends {}>(opts?: InitOptions<T, S>) => {
  const { codec, context } = opts ?? {};

  const handler = <I extends T, O extends T>(
    meta: Unpick<HandlerMeta<S, T, I, O>, "type">,
  ): HandlerMeta<S, T, I, O> => {
    if (codec && meta.codec === undefined) meta.codec = codec;
    if (context && meta.context === undefined) meta.context = context;

    return {
      type: "handler",
      ...meta,
    };
  };

  const service = <I extends T, O extends T>(
    meta: Unpick<ServiceMeta<S, T, I, O>, "type">,
  ): ServiceMeta<S, T, I, O> => {
    if (codec && meta.codec === undefined) meta.codec = codec;
    if (context && meta.context === undefined) meta.context = context;

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
