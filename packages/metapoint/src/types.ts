import type {
  Func,
  InitOptions,
  ServerInitOptions,
  Service,
} from "libp2p-transport";
import type { Libp2p } from "libp2p";
import type { z, ZodType } from "zod";

type IsEqual<T, U> = (<T1>() => T1 extends T ? 1 : 2) extends
  (<T2>() => T2 extends U ? 1 : 2) ? true
  : false;

export type InferIOType<Meta extends ZodType | undefined, T> =
  IsEqual<Meta, undefined> extends true ? T : z.infer<Exclude<Meta, undefined>>;

export type HandlerFunc<I, O, S extends {}> = Func<
  InferIOType<ZodType<I>, I>,
  InferIOType<ZodType<O>, O>,
  S
>;

export type ServiceFunc<I, O, S extends {}> = Service<
  InferIOType<ZodType<I>, I>,
  InferIOType<ZodType<O>, O>,
  S
>;

export interface MetaBase<I, O> {
  info?: Json;
  input?: ZodType<I>;
  output?: ZodType<O>;
}

interface Meta<S extends {}, T, I extends T, O extends T>
  extends MetaBase<I, O>, ServerInitOptions<I, O, T, S> {}

type Simplify<T> = {
  [P in keyof T]: T[P];
};

export type Unpick<T, K extends keyof T> = Simplify<
  Pick<T, Exclude<keyof T, K>>
>;

export interface HandlerMeta<S extends {}, T, I extends T, O extends T>
  extends Meta<S, T, I, O> {
  type: "handler";
  func: HandlerFunc<I, O, S>;
}

export interface ServiceMeta<S extends {}, T, I extends T, O extends T>
  extends Meta<S, T, I, O> {
  type: "service";
  func: ServiceFunc<I, O, S>;
}

export type EndpointMeta<S extends {}, T, I extends T, O extends T> =
  | HandlerMeta<S, T, I, O>
  | ServiceMeta<S, T, I, O>;

export interface Endpoint<S extends {}, T> {
  [name: string]: EndpointMeta<S, T, any, any>;
}

export interface ConnectEndpoint<I, O> {
  [name: string]: MetaBase<I, O>;
}

export interface PeerInitOptions<S extends {}, T> {
  endpoint?: Endpoint<S, T>;
  libp2p?: Libp2p;
  initStart?: boolean;
}

export type UnPromisify<T> = T extends Promise<infer U> ? U : never;

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];
