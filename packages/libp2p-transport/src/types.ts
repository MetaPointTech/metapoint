import type { AnyIterable } from "streaming-iterables";
import type { Multiaddr } from "@multiformats/multiaddr";
import type { PeerId } from "@libp2p/interface-peer-id";
import type { newChannel } from "./utils";
import type { IncomingStreamData } from "@libp2p/interface-registrar";

export type Chan<T, S> = ReturnType<typeof newChannel<T, S>>;

export type IterableFunc<I, O> = (
  input: AnyIterable<I>,
  incomingData: IncomingStreamData,
) => AnyIterable<O> | Promise<AnyIterable<O>>;

export type PeerAddr = string | Multiaddr | PeerId;

export type Func<I, O, S extends {} = {}> = (
  input: I,
  chan: Chan<O, S>,
) => Promise<void> | void;

export type Service<I, O, S extends {} = {}> = (
  chan: Chan<O, S>,
) => Promise<Func<I, O, S>> | Func<I, O, S> | void | Promise<void>;

export interface Codec<T> {
  encoder: (data: T) => Uint8Array | Promise<Uint8Array>;
  decoder: (data: Uint8Array) => T | Promise<T>;
}

export interface InitOptions<T, S> {
  // custom codec
  codec?: Codec<T>;
  store?: S;
}

export interface TransportChannel<I, O, S>
  extends AsyncIterableIterator<I>, Chan<O, S> {}

export interface MetaPointError extends Error {
  type: "error";
  id: StreamID;
}

export interface MetaPointSuccess {
  type: "success";
  id: StreamID;
}

export type ControlMsg = MetaPointError | MetaPointSuccess;

export interface StreamID {
  connection: string;
  stream: string;
}
