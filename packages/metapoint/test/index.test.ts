// todo

import { z } from "zod";
import { h, MetaType, peer } from "../src";

const meta = h.router({
  sss: h.endpoint({
    type: "handler",
    func: (data, send) => {
      send(data + 1);
    },
    input: z.number(),
    output: z.number(),
  }),
  sssd: h.endpoint({
    type: "handler",
    func: (data, send) => {
      send(data + 1);
    },
    input: z.string(),
    output: z.string(),
  }),
});

const node = await peer(meta);

const channel = await node.connect<MetaType<typeof node>>(
  "",
);
await channel.sss;
