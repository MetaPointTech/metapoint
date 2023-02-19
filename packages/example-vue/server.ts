import { h, MetaType, peer, z } from "metapoint";

const meta = h.router({
  numberAdd: h.handler({
    input: z.number(),
    output: z.number(),
    func: async (data, chan) => {
      const result = data + 1;
      await chan.send(result);
      await chan.done();
    },
  }),
  numberAdd1: h.handler({
    input: z.number(),
    output: z.number(),
    func: async (data, chan) => {
      const result = data + 1;
      await chan.send(result);
      await chan.done();
    },
  }),
  numberAdd2: h.handler({
    input: z.number(),
    output: z.number(),
    func: async (data, chan) => {
      const result = data + 1;
      await chan.send(result);
      await chan.done();
    },
  }),
  numberAdd3: h.handler({
    input: z.number(),
    output: z.number(),
    func: async (data, chan) => {
      const result = data + 1;
      await chan.send(result);
      await chan.done();
    },
  }),
});

const server = await peer(meta);

export type meta = MetaType<typeof server>;
const addrs = server.meta().addrs;

console.log(addrs);
