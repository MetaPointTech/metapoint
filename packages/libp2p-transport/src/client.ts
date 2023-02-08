import { Stream } from "@libp2p/interface-connection";
import { AnyIterable, transform } from "streaming-iterables";
import { defaultInitOptions } from "./common";
import type { Codec, InitOptions, PeerAddr, TransportChannel } from "./types";
import { Channel } from "queueable";
import { isMultiaddr, Multiaddr, multiaddr } from "@multiformats/multiaddr";
import { isPeerId, PeerId } from "@libp2p/interface-peer-id";
import { peerIdFromString } from "@libp2p/peer-id";
import { Libp2p } from "libp2p";
import { collect } from "streaming-iterables";

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
): ((value: I) => Promise<O[]>) & TransportChannel<O, I> => {
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

  const transportChannel = new Proxy({
    ...outputIterator,
    send,
    done,
  }, {
    get(target, p) {
      if (p === Symbol.asyncIterator) {
        return async function* () {
          for await (const v of target[Symbol.asyncIterator]()) {
            yield v;
          }
          await done();
        };
      }
      if (p === "next") {
        return async () => {
          const result = await outputIterator.next();
          if (result.done === true) {
            await done();
          }
          return result;
        };
      }
      return target[p];
    },
  });

  return Object.assign(
    async (value: I): Promise<O[]> => {
      await transportChannel.send(value);
      return await collect(transportChannel);
    },
    transportChannel,
  );
};

export const client = async <T = any>(
  node: Libp2p,
  peer: PeerAddr | PeerAddr[],
  options?: InitOptions<T>,
) => {
  const runtimeOptions = {
    ...defaultInitOptions,
    ...options,
  };
  let peerToDail: Multiaddr | PeerId;

  if (!(peer instanceof Array)) {
    peer = [peer];
  }
  for (const item of peer) {
    if (!(isPeerId(item) || isMultiaddr(item))) {
      try {
        const addr = multiaddr(item);
        if (typeof addr.getPeerId() === "string") {
          peerToDail = addr;
        } else {
          throw "Invalid addr: no peerid in addr";
        }
      } catch (e) {
        try {
          const peerid = peerIdFromString(item);
          peerToDail = peerid;
        } catch (error) {
          throw "Invalid peerid: " + item;
        }
      }
    } else {
      peerToDail = item;
    }
    const conn = await node.dial(peerToDail);

    return async <I extends T, O extends T>(name: string) =>
      channel<I, O, T>(await conn.newStream(name), runtimeOptions);
  }
};
