import { Stream } from "@libp2p/interface-connection";
import { AnyIterable, transform } from "streaming-iterables";
import { control_name, defaultInitOptions } from "./common";
import type {
  Chan,
  Codec,
  ControlMsg,
  InitOptions,
  PeerAddr,
  TransportChannel,
} from "./types";
import { Channel } from "queueable";
import { isMultiaddr, Multiaddr, multiaddr } from "@multiformats/multiaddr";
import { isPeerId, PeerId } from "@libp2p/interface-peer-id";
import { peerIdFromString } from "@libp2p/peer-id";
import { Libp2p } from "libp2p";
import { collect } from "streaming-iterables";
import { newChannel } from "./utils";
import { consume } from "streaming-iterables";
import { runtimeError } from "./error";
import { logger } from ".";
import { Connection } from "@libp2p/interface-connection";

const ccs = new Map<string, Channel<ControlMsg>>();
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

const handleControlMsg = async (cc: Channel<ControlMsg>) => {
  const msg = (await cc.next()).value as ControlMsg;
  // maybe has been done already
  if (msg) {
    switch (msg.type) {
      case "error":
        const err = new Error(msg.message);
        err.name = msg.name;
        err.stack = msg.stack;
        throw err;

      default:
        break;
    }
  }
  cc.close();
};

const channel = async <I extends T, O extends T, T = any>(
  name: string,
  connection: Connection,
  options?: InitOptions<T>,
): Promise<
  & ((value: I) => Promise<O[]>)
  & TransportChannel<O, I>
> => {
  const runtimeOptions = {
    ...defaultInitOptions,
    ...options,
  };

  let inputChannel: Channel<I> = new Channel<I>();
  let stream: Stream = await connection.newStream(name);
  let outputIterator: AsyncIterableIterator<O> = fetchStream<T, I, O>(
    stream,
    inputChannel,
    runtimeOptions.codec,
  );
  let cc: Channel<ControlMsg> = new Channel<ControlMsg>();
  let chan: Chan<I> = newChannel(inputChannel, { connection, stream });

  // const init = async () => {
  //   console.log(chan?.ctx?.id);

  //   inputChannel = new Channel<I>();
  //   stream = await connection.newStream(name);
  //   outputIterator = fetchStream<T, I, O>(
  //     stream,
  //     inputChannel,
  //     runtimeOptions.codec,
  //   );
  //   cc = new Channel<ControlMsg>();
  //   chan = newChan(
  //     inputChannel,
  //     { connection, stream },
  //     undefined,
  //     chan?.ctx?.id,
  //     init,
  //   );
  // };
  // receive first value as id
  await chan.send(chan.ctx.id as I);
  ccs.set(chan.ctx.id, cc);

  const r: TransportChannel<O, I> = new Proxy({
    ...outputIterator,
    ...chan,
  }, {
    get(target, p) {
      if (p === Symbol.asyncIterator) {
        return async function* () {
          for await (const v of target[Symbol.asyncIterator]()) {
            yield v;
          }
          await target.done();
          await handleControlMsg(cc);
          ccs.delete(target.ctx.id);
        };
      }
      if (p === "next") {
        return async () => {
          const result = await target.next();
          if (result.done === true) {
            await target.done();
            await handleControlMsg(cc);
            ccs.delete(target.ctx.id);
          }
          return result;
        };
      }
      return target[p];
    },
  });

  return Object.assign(
    async (value: I): Promise<O[]> => {
      await r.send(value);
      return await collect(r);
    },
    r,
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
    try {
      if (!(isPeerId(item) || isMultiaddr(item))) {
        try {
          const addr = multiaddr(item);
          if (typeof addr.getPeerId() === "string") {
            peerToDail = addr;
          } else {
            throw runtimeError(
              "ConnectError",
              "Invalid addr: no peerid in addr",
            );
          }
        } catch (e) {
          try {
            const peerid = peerIdFromString(item);
            peerToDail = peerid;
          } catch (error) {
            throw runtimeError("ConnectError", "Invalid peerid: " + item);
          }
        }
      } else {
        peerToDail = item;
      }

      logger.trace(`Try to connect to ${peerToDail}`);
      const connection = await node.dial(peerToDail);
      logger.trace(`Succeed connect to ${peerToDail}`);

      // collect error
      consume(transform(
        Infinity,
        async (i) => {
          const msg: ControlMsg = JSON.parse(i);
          const cc = ccs.get(msg.id);
          await cc?.push(msg);
          logger.trace(`Send control msg ${JSON.stringify(msg)} to ${msg.id}`);
        },
        await channel<void, string>(control_name, connection, runtimeOptions),
      ));

      return async <I extends T, O extends T>(name: string) => {
        logger.trace(`new stream to protocol ${name}`);
        return await channel<I, O, T>(name, connection, runtimeOptions);
      };
    } catch (e) {
      logger.trace(`Skip addr ${item} because of ${e}`);
      continue;
    }
  }
  throw runtimeError("ConnectError", "cannot connect to" + peer);
};
