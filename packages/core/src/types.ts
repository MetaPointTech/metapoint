import type { Evt } from "evt";
import { Ctx } from "evt";

export type IteratorFunc<I, O> = (
  input: AsyncIterable<I> | Iterable<I>,
) => AsyncIterable<O> | Iterable<O>;

export type Func<I, O> = (
  input: I,
) => Promise<O> | O;

export type EventFunc<I, O> = (
  { inputChannel, outputChannel }: {
    inputChannel: Evt<I>;
    outputChannel: Evt<O>;
  },
) => Promise<void> | void;

export interface Codec<T> {
  encoder: (data: T) => Uint8Array;
  decoder: (array: Uint8Array) => T;
}

export interface InitOptions<T> {
  // custom codec
  codec?: Codec<T>;
  // todo 断言校验器
}

export interface OpenInitOptions<C, T> extends InitOptions<T> {
  ctx?: Ctx<C>;
}
