import type { Channel } from "queueable";

export const newCtx = <T>(c: Channel<T>) => ({
  send: async (value: T) => {
    await c.push(value);
  },
  done: async () => {
    await c.return();
  },
});