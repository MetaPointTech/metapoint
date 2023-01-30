import { createLibp2p } from "libp2p";
import { mplex } from "@libp2p/mplex";
import { noise } from "@chainsafe/libp2p-noise";
import { tcp } from "@libp2p/tcp";
import { client } from "../src";
import { bench, describe } from "vitest";
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
let num = Math.floor(Math.random() * 100);
const addStream = await libp2p.dialProtocol(addr, "add");
const addJsonStream = await libp2p.dialProtocol(addr, "addJson");
const add = client<number, number>(addStream);
const addJson = client<Data, Data, Json>(addJsonStream, {
  codec: jsonCodec,
});

describe("json/xobj codec simple benchmark", async () => {
  bench("xobj codec", async () => {
    await add.send(num);
    await add.next();
  });

  bench("JSON codec", async () => {
    await addJson.send({ value: num });
    await addJson.next();
  });
});
