import type { Func, InitOptions, Service } from "libp2p-transport";
import type { Libp2p } from "libp2p";
import type { z, ZodType } from "zod";

type IsEqual<T, U> = (<T1>() => T1 extends T ? 1 : 2) extends
  (<T2>() => T2 extends U ? 1 : 2) ? true
  : false;

export type InferIOType<Meta extends ZodType | undefined, T> =
  IsEqual<Meta, undefined> extends true ? T : z.infer<Exclude<Meta, undefined>>;

export type HandlerFunc<I, O> = Func<
  InferIOType<ZodType<I>, I>,
  InferIOType<ZodType<O>, O>
>;

export type ServiceFunc<I, O> = Service<
  InferIOType<ZodType<I>, I>,
  InferIOType<ZodType<O>, O>
>;

export interface Meta<I, O> {
  info?: Json;
  input?: ZodType<I>;
  output?: ZodType<O>;
}

interface HandlerMeta<I, O> extends Meta<I, O> {
  type: "handler";
  func: HandlerFunc<I, O>;
}

interface ServiceMeta<I, O> extends Meta<I, O> {
  type: "service";
  func: ServiceFunc<I, O>;
}

export type EndpointMeta<I, O> = HandlerMeta<I, O> | ServiceMeta<I, O>;

export interface Endpoint<I, O> {
  [name: string]: EndpointMeta<I, O>;
}

export type UnPromisify<T> = T extends Promise<infer U> ? U : never;

export interface ServerMeta<T extends Endpoint<any, any>> {
  addrs: string[];
  endpoint: T;
}

export interface PeerInitOptions<T> extends InitOptions<T> {
  libp2p?: Libp2p;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];
