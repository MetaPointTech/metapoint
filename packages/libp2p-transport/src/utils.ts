import type { IncomingStreamData } from "@libp2p/interface-registrar";
import type { Channel } from "queueable";

export const newChan = <T>(c: Channel<T>, i: IncomingStreamData) => {
  let open = true;
  return {
    send: async (value: T) => {
      if (!open) {
        throw "channel has already open";
      }
      await c.push(value);
    },
    done: async () => {
      await c.return();
      open = false;
    },
    ctx: {
      id: {
        connection: i.connection.id,
        stream: i.stream.id,
      },
      stat: {
        connection: i.connection.stat,
        stream: i.stream.stat,
      },
      remoteAddr: i.connection.remoteAddr,
      remotePeer: i.connection.remotePeer,
      tags: i.connection.tags,
      metadata: i.stream.metadata,
    },
  };
};
