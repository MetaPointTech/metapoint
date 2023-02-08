import type { AnyIterable } from "streaming-iterables";
import type { Multiaddr } from "@multiformats/multiaddr";
import type { PeerId } from "@libp2p/interface-peer-id";

export type IterableFunc<I, O> = (
  input: AnyIterable<I>,
) => AnyIterable<O> | Promise<AnyIterable<O>>;

export type Send<T> = (value: T) => Promise<void>;
export type PeerAddr = string | Multiaddr | PeerId;

export type Func<I, O> = (
  input: I,
  send: Send<O>,
  done: () => Promise<void>,
) => Promise<void> | void;

export type Service<I, O> = () => Promise<Func<I, O>> | Func<I, O>;

export interface Codec<T> {
  encoder: (data: T) => Uint8Array | Promise<Uint8Array>;
  decoder: (data: Uint8Array) => T | Promise<T>;
}

export interface InitOptions<T> {
  // custom codec
  codec?: Codec<T>;
}

export interface TransportChannel<I, O> extends AsyncIterableIterator<I> {
  send: Send<O>;
  done: () => Promise<void>;
}
