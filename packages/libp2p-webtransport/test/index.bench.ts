import { client } from "../src";
import { bench, describe } from "vitest";
import { startServer } from "./handler";
import { jsonCodec } from "./jsonCodec";
import type { Data, Json } from "./types";
import { startHttp } from "./http";
import { newNode } from "./node";

const libp2p = await newNode();
const addr = await startServer();
let num = Math.floor(Math.random() * 100);

const defaultClient = await client(libp2p, addr);
const channelAddChannel = await defaultClient<number, number>("channelAdd");
const addChannel = await defaultClient<number, number>("add");
const jsonClient = await client(libp2p, addr, { codec: jsonCodec });
const addJsonChannel = await jsonClient<Data, Data, Json>("addJson");

describe("json/xobj codec simple benchmark", async () => {
  bench("xobj codec", async () => {
    const c = await addChannel();
    await c.send(num);
    for await (const _ of c) {}
  });

  bench("JSON codec", async () => {
    const c = await addJsonChannel();
    await c.send({ value: num });
    for await (const _ of c) {}
  });
});

describe("libp2p-transport/http simple benchmark", async () => {
  await startHttp();
  const ca = await channelAddChannel();
  bench("libp2p-transport", async () => {
    for (let index = 0; index < 6; index++) {
      const c = await addChannel();
      await c.send(num);
      for await (const _ of c) {}
    }
  });

  bench("libp2p-transport(channel)", async () => {
    ca.send(num);
    ca.send(num);
    ca.send(num);
    ca.send(num);
    ca.send(num);
    ca.send(num);
    await ca.next();
    await ca.next();
    await ca.next();
    await ca.next();
    await ca.next();
    await ca.next();
  });

  bench("http", async () => {
    await (await fetch("http://localhost:3000/1")).json();
    await (await fetch("http://localhost:3000/1")).json();
    await (await fetch("http://localhost:3000/1")).json();
    await (await fetch("http://localhost:3000/1")).json();
    await (await fetch("http://localhost:3000/1")).json();
    await (await fetch("http://localhost:3000/1")).json();
  });
});
