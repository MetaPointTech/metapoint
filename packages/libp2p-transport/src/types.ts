import type { AnyIterable } from "streaming-iterables";
import type { Multiaddr } from "@multiformats/multiaddr";
import type { PeerId } from "@libp2p/interface-peer-id";
import type { newChan } from "./utils";
import type { IncomingStreamData } from "@libp2p/interface-registrar";

export type Chan<T> = ReturnType<typeof newChan<T>>;

export type IterableFunc<I, O> = (
  input: AnyIterable<I>,
  incomingData: IncomingStreamData,
) => AnyIterable<O> | Promise<AnyIterable<O>>;

export type PeerAddr = string | Multiaddr | PeerId;

export type Func<I, O> = (
  input: I,
  chan: Chan<O>,
) => Promise<void> | void;

export type Service<I, O> = (chan: Chan<O>) => Promise<Func<I, O>> | Func<I, O>;

export interface Codec<T> {
  encoder: (data: T) => Uint8Array | Promise<Uint8Array>;
  decoder: (data: Uint8Array) => T | Promise<T>;
}

export interface InitOptions<T> {
  // custom codec
  codec?: Codec<T>;
}

export interface TransportChannel<I, O>
  extends AsyncIterableIterator<I>, Chan<O> {}
