import { z } from "zod";
import { h, peer } from "../src";
import { describe, expect, test } from "vitest";

const meta = h.router({
  numberAdd: h.endpoint({
    type: "handler",
    func: async (data, send, done) => {
      await send(data + 1);
      await done();
    },
    input: z.number(),
    output: z.number(),
  }),
  stringAdd: h.endpoint({
    type: "handler",
    func: async (data, send, done) => {
      await send(data + "!");
      await done();
    },
    input: z.string(),
    output: z.string(),
  }),
});

const node1 = await peer(meta);
const node2 = await peer();

describe("test metapoint server/client", async () => {
  const channel = await node2.connect<typeof meta>(node1.meta().addrs[0]);
  test("number test", async () => {
    const n = await channel("numberAdd");
    expect(await n(1)).toStrictEqual([2]);
  });
  test("string test", async () => {
    const s = await channel("stringAdd");
    expect(await s("Hello world")).toStrictEqual(["Hello world!"]);
  });
});
