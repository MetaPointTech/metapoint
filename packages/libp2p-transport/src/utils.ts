import type { Channel } from "queueable";

export const newChan = <T>(c: Channel<T>) => ({
  send: async (value: T) => {
    await c.push(value);
  },
  done: async () => {
    await c.return();
  },
});
