import { Func, Send, server } from "../src";
import { jsonCodec } from "./jsonCodec";
import type { Data } from "./types";
import { newNode } from "./node";

const repeatingService = async () => {
  let num: number = 0;
  let sender: Send<number>;
  let task: NodeJS.Timeout;

  const func: Func<number, number> = async (data, send, done) => {
    if (sender === undefined) sender = send;
    if (data !== 0) {
      // send data instead of num
      num = data;
      clearInterval(task);
      task = setInterval(() => {
        send(num);
      }, 1000);
    } else {
      clearInterval(task);
      await done();
    }
  };
  return func;
};

export const startServer = async () => {
  const libp2p = await newNode();

  // default codec
  const { handle, handleX } = server(libp2p);

  await handle<number, number>(
    "add",
    async (data, send, done) => {
      await send(data + 1);
      await done();
    },
  );

  await handle<number, number>(
    "adding",
    async (data, send, done) => {
      await send(data + 1);
      await send(data + 2);
      await send(data + 3);
      await done();
    },
  );

  // Infinity push handler
  await handleX<number, number>(
    "repeating",
    repeatingService,
  );

  await handleX<number, number>(
    "channelAdd",
    () => (data, send) => send(data + 1),
  );

  // json codec
  const json = server(libp2p, { codec: jsonCodec });

  await json.handle<Data, Data>("addJson", async (data, send, done) => {
    await send({ value: data.value + 1 });
    await done();
  });

  await json.handle<Data, Data>(
    "addingJson",
    async (input, send, done) => {
      await send({ value: input.value + 1 });
      await send({ value: input.value + 2 });
      await send({ value: input.value + 3 });
      await done();
    },
  );

  return libp2p.getMultiaddrs()[0];
};
