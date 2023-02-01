import type { Func, InitOptions, Service } from "libp2p-transport";
import type { Libp2p } from "libp2p";
import type { z, ZodType } from "zod";

type IsEqual<T, U> = (<T1>() => T1 extends T ? 1 : 2) extends
  (<T2>() => T2 extends U ? 1 : 2) ? true
  : false;

export interface Meta<I, O> {
  name: string;
  version: number;
  description?: string;
  input?: ZodType<I>;
  output?: ZodType<O>;
}

interface HandlerMeta<I, O> extends Meta<I, O> {
  type: "handler";
  func: Func<
    InferIOType<ZodType<I>, I>,
    InferIOType<ZodType<O>, O>
  >;
}

interface ServiceMeta<I, O> extends Meta<I, O> {
  type: "service";
  func: Service<
    InferIOType<ZodType<I>, I>,
    InferIOType<ZodType<O>, O>
  >;
}

type Unpick<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type InferIOType<Meta extends ZodType | undefined, T> =
  IsEqual<Meta, undefined> extends true ? T : z.infer<Exclude<Meta, undefined>>;

export type EndpointMetaServer<I, O> =
  | HandlerMeta<I, O>
  | ServiceMeta<I, O>;

export type EndpointMeta<I, O> = Unpick<EndpointMetaServer<I, O>, "func">;

export interface ServerMeta<I, O> {
  addrs: string[];
  endpoint: EndpointMeta<I, O>[];
}

export interface PeerInitOptions<T> extends InitOptions<T> {
  libp2p?: Libp2p;
}
