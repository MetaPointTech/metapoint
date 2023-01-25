import { createLibp2p } from "libp2p";
import { mplex } from "@libp2p/mplex";
import { noise } from "@chainsafe/libp2p-noise";
import { tcp } from "@libp2p/tcp";
import { newPRPC } from "../src";
import { expect, test } from "vitest";
import { startServer } from "./handler";

const addr = await startServer();
const libp2p = await createLibp2p({
  transports: [tcp()],
  streamMuxers: [mplex()],
  addresses: {
    listen: ["/ip4/0.0.0.0/tcp/0"],
  },
  connectionEncryption: [noise()],
});

const { fetch } = newPRPC(libp2p);

test("log handler", async () => {
  const stream = await libp2p.dialProtocol(addr, "log");
  // fetch input style
  expect(await fetch<number, number>(stream, 1)).toBe(2);

  // fetch event style
  const { inputChannel, outputChannel } = fetch<number, number>(stream);
  inputChannel.post(2);
  expect(await outputChannel.waitFor()).toBe(3);
});
