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
    async ({ data, send, done, context }) => {
      await send(data + 1 - context.other);
      await done();
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
    async ({ data, send, done }) => {
      await send(data + 1);
      await send(data + 2);
      await send(data + 3);
      await done();
    },
  );

  // Infinity push handler
  await serve<number, number>(
    "repeating",
    repeatingService,
  );

  await serve<number, number>(
    "channelAdd",
    () => ({ data, send }) => send(data + 1),
  );

  // json codec
  const json = await server(libp2p);

  await json.handle<Data, Data>("addJson", async ({ data, send, done }) => {
    await send({ value: data.value + 1 });
    await done();
  }, { codec: jsonCodec });

  await json.handle<Data, Data>(
    "addingJson",
    async ({ data, send, done }) => {
      await send({ value: data.value + 1 });
      await send({ value: data.value + 2 });
      await send({ value: data.value + 3 });
      await done();
    },
    { codec: jsonCodec },
  );

  return libp2p.getMultiaddrs()[0];
};
