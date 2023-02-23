import { Func, server, Service } from "../src";
import { jsonCodec } from "./jsonCodec";
import type { Data } from "./types";
import { newNode } from "./node";

const repeatingService: Service<number, number> = async (chan) => {
  const { send, done } = chan;
  let num: number = 0;
  let task: NodeJS.Timeout;

  const func: Func<number, number> = async ({ data }) => {
    num = data;
    clearInterval(task);
    task = setInterval(() => send(num), 1000);
  };
  return func;
};

export const startServer = async () => {
  const libp2p = await newNode();

  // default codec
  const { handle, serve } = await server(libp2p);

  // test context and middleware
  await handle(
    "add",
    async ({ data, chan }) => {
      await chan.send(data + 1 - chan.ctx.store.other);
      await chan.done();
    },
    {
      middleware: async (params) => {
        await params.next({
          data: params.data + 1,
        });
      },
      context: { other: 1 },
    },
  );

  await handle<number, number>(
    "error",
    async () => {
      throw new Error("some error");
    },
  );

  await handle<number, number>(
    "adding",
    async ({ data, chan }) => {
      await chan.send(data + 1);
      await chan.send(data + 2);
      await chan.send(data + 3);
      await chan.done();
    },
  );

  // Infinity push handler
  await serve<number, number>(
    "repeating",
    repeatingService,
  );

  await serve<number, number>(
    "channelAdd",
    () => ({ data, chan }) => chan.send(data + 1),
  );

  // json codec
  const json = await server(libp2p);

  await json.handle<Data, Data>("addJson", async ({ data, chan }) => {
    await chan.send({ value: data.value + 1 });
    await chan.done();
  }, { codec: jsonCodec });

  await json.handle<Data, Data>(
    "addingJson",
    async ({ data, chan }) => {
      await chan.send({ value: data.value + 1 });
      await chan.send({ value: data.value + 2 });
      await chan.send({ value: data.value + 3 });
      await chan.done();
    },
    { codec: jsonCodec },
  );

  return libp2p.getMultiaddrs()[0];
};
