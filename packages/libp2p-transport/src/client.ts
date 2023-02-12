import { Stream } from "@libp2p/interface-connection";
import { AnyIterable, transform } from "streaming-iterables";
import { control_name, defaultInitOptions } from "./common";
import type {
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
import { newChan } from "./utils";
import type { IncomingStreamData } from "@libp2p/interface-registrar";
import { consume } from "streaming-iterables";
import { runtimeError } from "./error";
import { logger } from ".";

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
  switch (msg.type) {
    case "error":
      const err = new Error(msg.message);
      err.name = msg.name;
      err.stack = msg.stack;
      throw err;

    default:
      break;
  }
};

const channel = async <I extends T, O extends T, T = any>(
  incomeingData: IncomingStreamData,
  options?: InitOptions<T>,
): Promise<
  & ((value: I) => Promise<O[]>)
  & TransportChannel<O, I>
> => {
  const runtimeOptions = {
    ...defaultInitOptions,
    ...options,
  };
  const inputChannel = new Channel<I>();
  const outputIterator = fetchStream<T, I, O>(
    incomeingData.stream,
    inputChannel,
    runtimeOptions.codec,
  );
  const cc = new Channel<ControlMsg>();
  const chan = newChan(inputChannel, incomeingData);
  // receive first value as id
  await chan.send(chan.ctx.id as I);
  ccs.set(chan.ctx.id, cc);

  const transportChannel = new Proxy({
    ...outputIterator,
    ...chan,
  }, {
    get(target, p) {
      if (p === Symbol.asyncIterator) {
        return async function* () {
          for await (const v of target[Symbol.asyncIterator]()) {
            yield v;
          }
          await chan.done();
          await handleControlMsg(cc);
        };
      }
      if (p === "next") {
        return async () => {
          const result = await outputIterator.next();
          if (result.done === true) {
            await chan.done();
            await handleControlMsg(cc);
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
        await channel<void, string>(
          { connection, stream: await connection.newStream(control_name) },
          runtimeOptions,
        ),
      ));

      return async <I extends T, O extends T>(name: string) => {
        logger.trace(`new stream to protocol ${name}`);
        return await channel<I, O, T>({
          connection,
          stream: await connection.newStream(name),
        }, runtimeOptions);
      };
    } catch (e) {
      logger.trace(`Skip addr ${item} because of ${e}`);
      continue;
    }
  }
  throw runtimeError("ConnectError", "cannot connect to" + peer);
};
