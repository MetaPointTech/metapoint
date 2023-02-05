import type {
  Endpoint,
  EndpointMeta,
  HandlerMeta,
  ServiceMeta,
  Unpick,
} from "./types";

const router = <T extends Endpoint<any, any>>(meta: T): T => meta;

const endpoint = <I, O>(
  endpoint: EndpointMeta<I, O>,
): EndpointMeta<I, O> => endpoint;

const handler = <I, O>(
  meta: Unpick<HandlerMeta<I, O>, "type">,
): EndpointMeta<I, O> =>
  endpoint({
    ...meta,
    type: "handler",
  });

const service = <I, O>(
  meta: Unpick<ServiceMeta<I, O>, "type">,
): EndpointMeta<I, O> =>
  endpoint({
    ...meta,
    type: "service",
  });

export const h = {
  router,
  handler,
  service,
};
