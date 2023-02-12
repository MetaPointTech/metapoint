import type { IncomingStreamData } from "@libp2p/interface-registrar";
import type { Channel } from "queueable";
import { debug, logger } from ".";
import type { ControlMsg } from "./types";

const newChan = <T>(
  c: Channel<T>,
  i: IncomingStreamData,
  ctrl?: Channel<ControlMsg>,
  id?: string,
) => {
  if (id === undefined) id = `${i.connection.id}-${i.stream.id}`;
  let open = true;
  return {
    send: async (value: T) => {
      if (!open) {
        throw "channel has already closed";
      }
      await c.push(value);
      logger.trace(`Send ${JSON.stringify(value)} to ${id}`);
    },
    done: async (err?: Error) => {
      await c.return();
      if (ctrl) {
        if (err) {
          await ctrl.push({
            type: "error",
            id: id as string,
            name: err.name,
            message: err.message,
            stack: debug ? err.stack : undefined,
          });
          logger.debug(`${id} chan done with error`);
        } else {
          await ctrl.push({
            type: "success",
            id: id as string,
          });
          logger.trace(`${id} chan done with success`);
        }
      }
      open = false;
    },
    ctx: {
      id,
      stat: {
        ...i.connection.stat,
        ...i.stream.stat,
      },
      remoteAddr: i.connection.remoteAddr,
      remotePeer: i.connection.remotePeer,
      tags: i.connection.tags,
      metadata: i.stream.metadata,
    },
  };
};

type Chan<T> = ReturnType<typeof newChan<T>>;

// server
function newChannel<T>(
  c: Channel<T>,
  i: IncomingStreamData,
  ctrl: Channel<ControlMsg>,
  id: string,
): Chan<T>;
// client
function newChannel<T>(
  c: Channel<T>,
  i: IncomingStreamData,
): Chan<T>;
function newChannel<T>(
  c: Channel<T>,
  i: IncomingStreamData,
  ctrl?: Channel<ControlMsg>,
  id?: string,
): Chan<T> {
  return newChan(c, i, ctrl, id);
}

export { newChannel };
