import { createLibp2p } from "libp2p";
import { mplex } from "@libp2p/mplex";
import { noise } from "@chainsafe/libp2p-noise";
import { tcp } from "@libp2p/tcp";
import { fetch, open } from "../src";
import { describe, expect, test } from "vitest";
import { startServer } from "./handler";
import { Evt } from "evt";

const libp2p = await createLibp2p({
  transports: [tcp()],
  streamMuxers: [mplex()],
  addresses: {
    listen: ["/ip4/0.0.0.0/tcp/0"],
  },
  connectionEncryption: [noise()],
});
const addr = await startServer();

describe("Server default codec", async () => {
  test("test handler", async () => {
    const stream = await libp2p.dialProtocol(addr, "add");
    describe("fetch input style", async () => {
      expect(await fetch<number, number>(stream, 1)).toBe(2);
      expect(await fetch<number, number>(stream, 2)).toBe(3);
    });

    describe("open channel", async () => {
      const { inputChannel, outputChannel } = open<number, number>(stream);
      inputChannel.post(2);
      expect(await outputChannel.waitFor()).toBe(3);
      inputChannel.post(3);
      expect(await outputChannel.waitFor()).toBe(4);
    });
  });

  test("test channel", async () => {
    const stream = await libp2p.dialProtocol(addr, "adding");
    const ctx = Evt.newCtx();
    const { inputChannel, outputChannel } = open(stream, {
      ctx,
    });
    let count = 0;
    const my_num = Math.floor(Math.random() * 100);
    inputChannel.post(my_num);
    for await (const msg of outputChannel) {
      count += 1;
      expect(my_num + count).toBe(msg);
      if (count === 3) {
        ctx.done();
      }
    }
    expect(count).toBe(3);
  });
});
