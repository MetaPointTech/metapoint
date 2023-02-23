import { client } from "../src";
import { bench, describe } from "vitest";
import { startServer } from "./handler";
import { jsonCodec } from "./jsonCodec";
import type { Data } from "./types";
import { startHttp } from "./http";
import { newNode } from "./node";

const libp2p = await newNode();
const addr = await startServer();
let num = Math.floor(Math.random() * 100);

const defaultClient = await client(libp2p, addr);
const jsonClient = await client(libp2p, addr);
const add = await defaultClient<number, number>("add");
const ca = await defaultClient<number, number>("channelAdd");
const c = await jsonClient<Data, Data>("addJson", { codec: jsonCodec });

describe("json/xobj codec simple benchmark", async () => {
  bench("xobj codec", async () => {
    await add(num);
  });

  bench("JSON codec", async () => {
    await c({ value: num });
  });
});

describe("libp2p-transport/http simple benchmark", async () => {
  await startHttp();
  const times = 200;
  bench("libp2p-transport", async () => {
    for (let index = 0; index < times; index++) {
      await add(num);
    }
  });

  bench("libp2p-transport(channel)", async () => {
    for (let index = 0; index < times; index++) {
      await ca.send(num);
    }
    for (let index = 0; index < times; index++) {
      await ca.next();
    }
  });

  bench("http", async () => {
    for (let index = 0; index < times; index++) {
      await (await fetch("http://localhost:3000/1")).json();
    }
  });
});
