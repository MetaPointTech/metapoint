import type { Channel } from "queueable";

export const newChan = <T>(c: Channel<T>) => {
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
  };
};
