import { createLibp2p } from "libp2p";
import { mplex } from "@libp2p/mplex";
import { noise } from "@chainsafe/libp2p-noise";
import { tcp } from "@libp2p/tcp";
import { client } from "../src";
import { describe, expect, test } from "vitest";
import { startServer } from "./handler";
import { jsonCodec } from "./jsonCodec";
import type { Data, Json } from "./types";

const libp2p = await createLibp2p({
  transports: [tcp()],
  streamMuxers: [mplex()],
  addresses: {
    listen: ["/ip4/0.0.0.0/tcp/0"],
  },
  connectionEncryption: [noise()],
});
const addr = await startServer();
const addStream = await libp2p.dialProtocol(addr, "add");
const addingStream = await libp2p.dialProtocol(addr, "adding");
const addJsonStream = await libp2p.dialProtocol(addr, "addJson");
const addingJsonStream = await libp2p.dialProtocol(addr, "addingJson");
const add = client<number, number>(addStream);
const adding = client<number, number>(addingStream);
const addJson = client<Data, Data, Json>(addJsonStream, {
  codec: jsonCodec,
});
const addingJson = client<Data, Data, Json>(addingJsonStream, {
  codec: jsonCodec,
});

describe("Server default codec", async () => {
  test("test add handler", async () => {
    await add.send(2);
    await add.send(3);
    expect((await add.next()).value).toBe(3);
    expect((await add.next()).value).toBe(4);
  });

  test("test adding handler", async () => {
    const my_num = Math.floor(Math.random() * 100);
    await adding.send(my_num);
    let n = 1;
    for await (const msg of adding) {
      expect(msg).toStrictEqual(my_num + n);
      n += 1;
      if (n > 3) break;
    }
  });
});

describe("Server JSON codec", async () => {
  test("test add handler", async () => {
    await addJson.send({ value: 2 });
    await addJson.send({ value: 3 });
    expect((await addJson.next()).value).toStrictEqual({ value: 3 });
    expect((await addJson.next()).value).toStrictEqual({ value: 4 });
  });

  test("test adding handler", async () => {
    const my_num = Math.floor(Math.random() * 100);
    await addingJson.send({ value: my_num });
    let n = 1;
    for await (const msg of addingJson) {
      expect(msg).toStrictEqual({ value: my_num + n });
      n += 1;
      if (n > 3) break;
    }
  });
});
