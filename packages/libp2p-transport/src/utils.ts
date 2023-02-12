import type { IncomingStreamData } from "@libp2p/interface-registrar";
import { nanoid } from "nanoid";
import type { Channel } from "queueable";
import type { ControlMsg, MetaPointError, MetaPointSuccess } from "./types";

export const newChan = <T>(
  c: Channel<T>,
  i: IncomingStreamData,
  ctrl?: Channel<ControlMsg>,
  id?: string,
) => {
  if (id === undefined) id = nanoid();
  let open = true;
  return {
    send: async (value: T) => {
      if (!open) {
        throw "channel has already open";
      }
      await c.push(value);
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
            stack: err.stack,
          });
        } else {
          await ctrl.push({
            type: "success",
            id: id as string,
          });
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
