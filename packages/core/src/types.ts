import type { AnyIterable } from "streaming-iterables";

export type IteratorFunc<I, O> = (
  input: AnyIterable<I>,
) => AnyIterable<O>;

export type Func<I, O> = (
  input: I,
  send: (value: O) => Promise<void>,
) => Promise<O> | O;

export interface Codec<T> {
  encoder: (data: T) => Uint8Array | Promise<Uint8Array>;
  decoder: (data: Uint8Array) => T | Promise<T>;
}

export interface InitOptions<T> {
  // custom codec
  codec?: Codec<T>;
}

export interface TransportChannel<I, O> extends AsyncIterableIterator<O> {
  send: (value: I) => Promise<void>;
}
