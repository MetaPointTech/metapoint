import { h, peer, z } from "../src";
import { describe, expect, test } from "vitest";

const g = h({
  context: { name: 1 },
  middleware: (p) => p.next({ data: p.data + 1 }),
});

const endpoint = {
  numberAdd: g.handler({
    func: async ({ data, chan: { send, done, ctx } }) => {
      await send(data);
      await done();
    },
    input: z.number(),
    output: z.number(),
  }),
  addChan: g.service({
    func: () => async ({ data, chan: { send, done, ctx } }) => {
      await send(data);
    },
    input: z.number(),
    output: z.number(),
  }),
};

const node1 = await peer({ endpoint });
const node2 = await peer();
const channel = await node2.connect<typeof endpoint>(node1.meta().addrs);

describe("test metapoint server/client", async () => {
  test("number test", async () => {
    const n = await channel("numberAdd");
    expect(await n(1)).toStrictEqual([2]);
  });
  test("string add chan", async () => {
    const c = await channel("addChan");
    await c.send(1);
    expect((await c.next()).value).toBe(2);
  });
});
