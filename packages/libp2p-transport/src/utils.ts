import type { IncomingStreamData } from "@libp2p/interface/stream-handler";
import type { Channel } from "queueable";
import { debug } from "./const";
import { logger } from "./logger";
import type { ControlMsg, Func, FuncParams, StreamID } from "./types";

const newChannel = <T, S>(
  c: Channel<T>,
  i: IncomingStreamData,
  ctrl?: Channel<ControlMsg>,
  context?: S,
) => {
  const id: StreamID = { connection: i.connection.id, stream: i.stream.id };
  let open = true;
  return {
    send: async (value: T) => {
      if (!open) {
        throw "channel has already closed";
      }
      await c.push(value);
      logger.trace(`Send ${JSON.stringify(value)} to ${JSON.stringify(id)}`);
    },
    done: async (err?: Error) => {
      await c.return();
      if (ctrl) {
        if (err) {
          await ctrl.push({
            type: "error",
            id,
            name: err.name,
            message: err.message,
            stack: debug ? err.stack : undefined,
          });
          logger.debug(`${JSON.stringify(id)} chan done with error`);
        } else {
          await ctrl.push({
            type: "success",
            id,
          });
          logger.trace(`${JSON.stringify(id)} chan done with success`);
        }
      }
      open = false;
    },
    id,
    protocol: i.stream.protocol,
    context: context as S,
    stat: {
      remoteAddr: i.connection.remoteAddr,
      remotePeer: i.connection.remotePeer,
      encryption: i.connection.encryption,
      multiplexer: i.connection.multiplexer,
      direction: i.stream.direction,
      open: () => open,
    },
  };
};

const makeNext = <I, O, S extends {}>(
  defaultParams: FuncParams<I, O, S> & { next: Func<I, O, S> },
) =>
async (params?: Partial<FuncParams<I, O, S>>) => {
  const { next, ...pp } = defaultParams;

  await next({
    ...pp,
    ...params,
  });
};

export { makeNext, newChannel };
