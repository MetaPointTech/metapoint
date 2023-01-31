import { Stream } from "@libp2p/interface-connection";
import { AnyIterable, transform } from "streaming-iterables";
import { defaultInitOptions } from "./common";
import type { Codec, InitOptions, TransportChannel } from "./types";
import { Channel } from "queueable";
import { isMultiaddr, Multiaddr, multiaddr } from "@multiformats/multiaddr";
import { isPeerId, PeerId } from "@libp2p/interface-peer-id";
import { peerIdFromString } from "@libp2p/peer-id";
import { Libp2p } from "libp2p";

const fetchStream = <T, I extends T, O extends T>(
  stream: Stream,
  input: AnyIterable<I>,
  codec: Codec<T>,
) => {
  const inputIterator = transform(
    Infinity,
    (data) => codec.encoder(data),
    input,
  );
  const outputIterator = transform(
    Infinity,
    async (data) => await codec.decoder(data.subarray()) as Awaited<O>,
    stream.source,
  );
  stream.sink(inputIterator);
  return outputIterator;
};

const channel = <I extends T, O extends T, T = any>(
  stream: Stream,
  options?: InitOptions<T>,
): TransportChannel<O, I> => {
  const runtimeOptions = {
    ...defaultInitOptions,
    ...options,
  };
  const inputChannel = new Channel<I>();
  const outputIterator = fetchStream<T, I, O>(
    stream,
    inputChannel,
    runtimeOptions.codec,
  );
  let open = true;
  const send = async (value: I) => {
    if (!open) {
      throw "This channel has already closed";
    }
    await inputChannel.push(value);
  };
  const done = async () => {
    await inputChannel.return();
    open = false;
  };

  return {
    ...outputIterator,
    [Symbol.asyncIterator]: async function* () {
      for await (const v of outputIterator[Symbol.asyncIterator]()) {
        yield v;
      }
      await done();
    },
    next: async (...args: [] | [undefined]) => {
      const result = await outputIterator.next(...args);
      if (result.done === true) {
        await done();
      }
      return result;
    },
    send,
    done,
  };
};

export const client = async <DT = any>(
  node: Libp2p,
  peer: string | Multiaddr | PeerId,
  options?: InitOptions<DT>,
) => {
  const runtimeOptions = {
    ...defaultInitOptions,
    ...options,
  };
  let peerToDail: Multiaddr | PeerId;
  if (!(isPeerId(peer) || isMultiaddr(peer))) {
    try {
      const addr = multiaddr(peer);
      if (typeof addr.getPeerId() === "string") {
        peerToDail = addr;
      } else {
        throw "Invalid addr: no peerid in addr";
      }
    } catch (e) {
      try {
        const peerid = peerIdFromString(peer);
        peerToDail = peerid;
      } catch (error) {
        throw "Invalid peerid: " + peer;
      }
    }
  } else {
    peerToDail = peer;
  }
  const conn = await node.dial(peerToDail);

  return async <I extends T, O extends T, T = DT>(
    name: string,
    options?: InitOptions<T>,
  ) => {
    const fetchOptions = {
      ...runtimeOptions,
      ...options,
    } as InitOptions<T>;
    return async () =>
      channel<I, O, T>(await conn.newStream(name), fetchOptions);
  };
};
