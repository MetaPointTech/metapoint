import { createLibp2p } from "libp2p";
import { mplex } from "@libp2p/mplex";
import { noise } from "@chainsafe/libp2p-noise";
import { tcp } from "@libp2p/tcp";
import { fetch, open } from "../src";
import { describe, expect, test } from "vitest";
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

test("test handler", async () => {
  const stream = await libp2p.dialProtocol(addr, "add");
  describe("fetch input style", async () => {
    expect(await fetch<number, number>(stream, 1)).toBe(2);
    expect(await fetch<number, number>(stream, 2)).toBe(3);
  });

  describe("open channel", async () => {
    const { inputChannel, outputChannel } = open<number, number>(stream);
    inputChannel.post(2);
    inputChannel.post(3);
    expect(await outputChannel.waitFor()).toBe(3);
    expect(await outputChannel.waitFor()).toBe(4);
  });
});

test("test channel", async () => {
  const stream = await libp2p.dialProtocol(addr, "adding");

  const { inputChannel, outputChannel } = open<number, number>(stream);

  inputChannel.post(1);
  inputChannel.post(2);

  // for await (const msg of outputChannel) {
  //   console.log(msg);
  // }
  expect(await outputChannel.waitFor()).toBe(2);
  expect(await outputChannel.waitFor()).toBe(3);
  expect(await outputChannel.waitFor()).toBe(3);
  expect(await outputChannel.waitFor()).toBe(4);
  expect(await outputChannel.waitFor()).toBe(4);
  expect(await outputChannel.waitFor()).toBe(5);
});
