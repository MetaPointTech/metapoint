import type { AnyIterable } from "streaming-iterables";
import type { Multiaddr } from "@multiformats/multiaddr";
import type { PeerId } from "@libp2p/interface-peer-id";
import type { newChannel } from "./utils";
import type { IncomingStreamData } from "@libp2p/interface-registrar";

export type Chan<T> = ReturnType<typeof newChannel<T>>;

export type IterableFunc<I, O> = (
  input: AnyIterable<I>,
  incomingData: IncomingStreamData,
) => AnyIterable<O> | Promise<AnyIterable<O>>;

export type PeerAddr = string | Multiaddr | PeerId;

export type Func<I, O> = (
  input: I,
  chan: Chan<O>,
) => Promise<void> | void;

export type Service<I, O> = (
  chan: Chan<O>,
) => Promise<Func<I, O>> | Func<I, O> | void | Promise<void>;

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

export interface MetaPointError extends Error {
  type: "error";
  id: string;
}

export interface MetaPointSuccess {
  type: "success";
  id: string;
}

export type ControlMsg = MetaPointError | MetaPointSuccess;
