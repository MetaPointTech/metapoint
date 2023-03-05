import { h, MetaType, peer, z } from "metapoint";

const group = h({ context: { addnum: 1 } });

const endpoint = {
  plus: group.handler({
    func: async ({ data, send, done, context }) => {
      await send(data + context.addnum);
      await done();
    },
    input: z.number(),
    output: z.number(),
  }),
};

const node = await peer({ endpoint });
export type Meta = MetaType<typeof node>;
export default node.meta().addrs;
