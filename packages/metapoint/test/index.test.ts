import { z } from "zod";
import { h, peer } from "../src";
import { describe } from "vitest";

const meta = h.router({
  add: h.endpoint({
    type: "handler",
    func: async (data, send, done) => {
      await send(data + 1);
      await done();
    },
    input: z.number(),
    output: z.number(),
  }),
  w: h.endpoint({
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

describe("", async () => {
  console.log(node1.meta());

  // const channel = await node2.connect<typeof meta>(node1.meta().addrs[0]);

  // const a = await channel.add;

  // console.log(
  //   await a(1),
  // );
});
