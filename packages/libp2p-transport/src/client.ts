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

const handleControlMsg = async (id: string, cc?: Channel<ControlMsg>) => {
  if (cc === undefined) cc = ccs.get(id) as Channel<ControlMsg>;
  const msg = (await cc.next()).value as ControlMsg;
  cc.close();
  // maybe has been done already
  if (msg) {
    try {
      switch (msg.type) {
        case "error":
          const err = new Error(msg.message);
          err.name = msg.name;
          err.stack = msg.stack;
          throw err;

        default:
          break;
      }
    } finally {
      ccs.delete(id);
    }
  }
};

const channel = async <I extends T, O extends T, T, S>(
  name: string,
  connection: Connection,
  options?: InitOptions<T, S>,
): Promise<
  & ((value: I) => Promise<O[]>)
  & TransportChannel<O, I, S>
> => {
  const runtimeOptions = {
    ...defaultInitOptions,
    ...options,
  };

  logger.trace(`new connecting to protocol ${name}`);
  let inputChannel: Channel<I> = new Channel<I>();
  let stream: Stream = await connection.newStream(name);
  let outputIterator: AsyncIterableIterator<O> = fetchStream<T, I, O>(
    stream,
    inputChannel,
    runtimeOptions.codec,
  );
  let cc: Channel<ControlMsg> = new Channel<ControlMsg>();
  let chan: Chan<I, S> = newChannel(
    inputChannel,
    { connection, stream },
    undefined,
    runtimeOptions.store,
  );

  const jid = JSON.stringify(chan.ctx.id);
  // receive first value as id
  await chan.send(jid as I);
  if (name !== control_name) ccs.set(jid, cc);
  logger.trace(`protocol ${name} connected`);

  // Connect iterator end to end
  const op = new Proxy({
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
          await handleControlMsg(jid, cc);
        };
      }
      if (p === "next") {
        return async () => {
          const result = await target.next();
          if (result.done === true) {
            await target.done();
            await handleControlMsg(jid, cc);
          }
          return result;
        };
      }
      return target[p];
    },
  });

  return Object.assign(async (value: I): Promise<O[]> => {
    await op.send(value);
    return await collect(op);
  }, op);
};

export const client = async <T = any, S extends {} = {}>(
  node: Libp2p,
  peer: PeerAddr | PeerAddr[],
  options?: InitOptions<T, S>,
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

      const controlChan = await channel<undefined, string, any, S>(
        control_name,
        connection,
        runtimeOptions,
      );

      // collect error
      consume(transform(
        Infinity,
        async (i) => {
          const msg: ControlMsg = JSON.parse(i);
          const cc = ccs.get(JSON.stringify(msg.id));
          await cc?.push(msg);
          logger.trace(`Send control msg ${JSON.stringify(msg)} to ${msg.id}`);
        },
        controlChan,
      ));

      return Object.assign(
        async <I extends T, O extends T, Context extends S = S>(
          name: string,
        ) => {
          let chan = await channel<I, O, T, Context>(
            name,
            connection,
            runtimeOptions,
          );
          // auto reopen
          return new Proxy(chan, {
            async apply(_, __, argArray) {
              if (chan.ctx.stat.status() === "CLOSED") {
                chan = await channel(name, connection, {
                  ...options,
                  store: chan.ctx.store,
                });
              }
              return await chan(argArray.at(0));
            },
            get(_, p) {
              if (p === "send") {
                return async (v: I) => {
                  if (chan.ctx.stat.status() === "CLOSED") {
                    chan = await channel(name, connection, {
                      ...options,
                      store: chan.ctx.store,
                    });
                  }
                  await chan.send(v);
                };
              }
              return chan[p];
            },
          });
        },
        {
          close: () => connection.close(),
        },
      );
    } catch (e) {
      logger.trace(`Skip addr ${item} because of ${e}`);
      continue;
    }
  }
  throw runtimeError("ConnectError", "cannot connect to" + peer);
};
