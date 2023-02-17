import { h, peer, z } from "../src";
import { describe, expect, test } from "vitest";

const meta = h.router({
  numberAdd: h.handler({
    func: async (data, { send, done }) => {
      await send(data + 1);
      await done();
    },
    input: z.number(),
    output: z.number(),
  }),
  stringAdd: h.handler({
    func: async (data, { send, done }) => {
      await send(data + "!");
      await done();
    },
    input: z.string(),
    output: z.string(),
  }),
  addChan: h.service({
    func: () => async (data, { send }) => {
      await send(data + 1);
    },
    input: z.number(),
    output: z.number(),
  }),
});

const node1 = await peer(meta);
const node2 = await peer();

describe("test metapoint server/client", async () => {
  const channel = await node2.connect<typeof meta>(node1.meta().addrs);
  test("number test", async () => {
    const n = await channel("numberAdd");
    expect(await n(1)).toStrictEqual([2]);
  });
  test("string test", async () => {
    const s = await channel("stringAdd");
    expect(await s("Hello world")).toStrictEqual(["Hello world!"]);
    expect(await s("Hello world")).toStrictEqual(["Hello world!"]);
  });
  test("string add chan", async () => {
    const c = await channel("addChan");
    await c.send(1);
    expect((await c.next()).value).toBe(2);
  });
});
