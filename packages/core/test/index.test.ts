import { createLibp2p } from "libp2p";
import { mplex } from "@libp2p/mplex";
import { noise } from "@chainsafe/libp2p-noise";
import { tcp } from "@libp2p/tcp";
import { fetch, open } from "../src";
import { describe, expect, test } from "vitest";
import { startServer } from "./handler";
import { Evt } from "evt";
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

describe("Simple benchmark", async () => {
  test("Default codec", async () => {
    const stream = await libp2p.dialProtocol(addr, "add");
    console.time("Default codec add 100 times");
    for (let index = 0; index < 100; index++) {
      await fetch<number, number>(stream, 1);
    }
    console.timeEnd("Default codec add 100 times");
  });

  test("Default codec (channel)", async () => {
    const stream = await libp2p.dialProtocol(addr, "add");

    const { inputChannel, outputChannel } = open<number, number>(stream);

    for (let index = 0; index < 10; index++) {
      inputChannel.post(1);
    }

    const a: Promise<number>[] = [];
    // todo 去除 EVT 使用异步迭代器作为 channel
    for (let index = 0; index < 100; index++) {
      a.push(outputChannel.waitFor());
    }
    console.time("Default codec add 10 times(channel)");

    await Promise.allSettled(a);
    console.timeEnd("Default codec add 10 times(channel)");
  });

  test("JSON codec", async () => {
    const stream = await libp2p.dialProtocol(addr, "addJson");
    console.time("JSON codec add 100 times");
    for (let index = 0; index < 100; index++) {
      await fetch<Data, Data, Json>(stream, {
        value: 1,
      }, {
        codec: jsonCodec,
      });
    }
    console.timeEnd("JSON codec add 100 times");
  });
});

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

describe("Server JSON codec", async () => {
  test("test handler", async () => {
    const stream = await libp2p.dialProtocol(addr, "addJson");
    describe("fetch input style", async () => {
      expect(
        await fetch<Data, Data, Json>(stream, {
          value: 1,
        }, {
          codec: jsonCodec,
        }),
      ).toBe({
        value: 2,
      });
      expect(
        await fetch<Data, Data, Json>(stream, {
          value: 2,
        }, {
          codec: jsonCodec,
        }),
      ).toBe({
        value: 3,
      });
    });

    describe("open channel", async () => {
      const { inputChannel, outputChannel } = open<Data, Data, Json>(stream, {
        codec: jsonCodec,
      });
      inputChannel.post({
        value: 2,
      });
      expect(await outputChannel.waitFor()).toBe({
        value: 3,
      });
      inputChannel.post({
        value: 3,
      });
      expect(await outputChannel.waitFor()).toBe({
        value: 4,
      });
    });
  });

  test("test channel", async () => {
    const stream = await libp2p.dialProtocol(addr, "addingJson");
    const ctx = Evt.newCtx();
    const { inputChannel, outputChannel } = open<Data, Data, Json>(stream, {
      codec: jsonCodec,
      ctx,
    });
    let count = 0;
    const my_num = Math.floor(Math.random() * 100);
    inputChannel.post({ value: my_num });
    for await (const msg of outputChannel) {
      count += 1;
      expect(my_num + count).toBe(msg.value);
      if (count === 3) {
        ctx.done();
      }
    }
    expect(count).toBe(3);
  });
});
