import { h, MetaType, peer, z } from "metapoint";

const g = h();

const endpoint = {
  numberAdd: g.handler({
    input: z.number(),
    output: z.number(),
    func: async ({ data, send, done }) => {
      const result = data + 1;
      await send(result);
      await done();
    },
  }),
  numberAdd1: g.handler({
    input: z.number(),
    output: z.number(),
    func: async ({ data, send, done }) => {
      const result = data + 1;
      await send(result);
      await done();
    },
  }),
  numberAdd2: g.handler({
    input: z.number(),
    output: z.number(),
    func: async ({ data, send, done }) => {
      const result = data + 1;
      await send(result);
      await done();
    },
  }),
  numberAdd3: g.handler({
    input: z.number(),
    output: z.number(),
    func: async ({ data, send, done }) => {
      const result = data + 1;
      await send(result);
      await done();
    },
  }),
};

const server = await peer({ endpoint });

export type meta = MetaType<typeof server>;
const addrs = server.meta().addrs;

console.log(addrs);
