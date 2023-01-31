import type { Func, FuncFactory } from "libp2p-transport";
import type { z, ZodType } from "zod";

type IsEqual<T, U> = (<T1>() => T1 extends T ? 1 : 2) extends
  (<T2>() => T2 extends U ? 1 : 2) ? true
  : false;

interface HandleEndpointMeta<I, O> {
  type: "handle";
  meta: Meta<I, O>;
  func: Func<
    InferIOType<Meta<I, O>["input"], I>,
    InferIOType<Meta<I, O>["output"], O>
  >;
}

interface ChannelEndpointMeta<I, O> {
  type: "serve";
  meta: Meta<I, O>;
  func: EventFunc<
    InferIOType<Meta<I, O>["input"], I>,
    InferIOType<Meta<I, O>["output"], O>
  >;
}

type Simplify<T> = {
  [P in keyof T]: T[P];
};

type Unpick<T, K extends keyof T> = Simplify<
  Required<Pick<T, Exclude<keyof T, K>>>
>;

export interface Meta<I, O> {
  name: string;
  version: number;
  input?: ZodType<I>;
  output?: ZodType<O>;
}
export type InferIOType<Meta extends ZodType | undefined, T> =
  IsEqual<Meta, undefined> extends true ? T : z.infer<Exclude<Meta, undefined>>;

export type EndpointMeta<I, O> =
  | HandleEndpointMeta<I, O>
  | ChannelEndpointMeta<I, O>;

export type EndpointMetaNoFunc<I, O> = Unpick<EndpointMeta<I, O>, "func">;

export interface ServerMeta {
  addrs: string[];
  endpoint: EndpointMetaNoFunc<any, any>[];
}
