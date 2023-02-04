import type { Endpoint, EndpointMeta } from "./types";

const router = <T extends Endpoint<any, any>>(meta: T): T => meta;

const endpoint = <I, O>(
  endpoint: EndpointMeta<I, O>,
): EndpointMeta<I, O> => endpoint;

export const h = {
  router,
  endpoint,
};
