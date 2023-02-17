import type { IncomingStreamData } from "@libp2p/interface-registrar";
import type { Channel } from "queueable";
import { debug, logger } from ".";
import type { ControlMsg, StreamID } from "./types";

const newChannel = <T>(
  c: Channel<T>,
  i: IncomingStreamData,
  ctrl?: Channel<ControlMsg>,
  id?: StreamID,
) => {
  if (id === undefined) {
    id = id ?? { connection: i.connection.id, stream: i.stream.id };
  }
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
            id: id as StreamID,
            name: err.name,
            message: err.message,
            stack: debug ? err.stack : undefined,
          });
          logger.debug(`${id} chan done with error`);
        } else {
          await ctrl.push({
            type: "success",
            id: id as StreamID,
          });
          logger.trace(`${id} chan done with success`);
        }
      }
      open = false;
    },
    ctx: {
      id,
      stat: {
        encryption: i.connection.stat.encryption,
        multiplexer: i.connection.stat.multiplexer,
        direction: i.stream.stat.direction,
        protocol: i.stream.stat.protocol,
        status: () => open ? "OPEN" : "CLOSED",
      },
      remoteAddr: i.connection.remoteAddr,
      remotePeer: i.connection.remotePeer,
      tags: i.connection.tags,
      metadata: i.stream.metadata,
    },
  };
};

export { newChannel };
