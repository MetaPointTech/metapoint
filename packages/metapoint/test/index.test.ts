// todo

import { z } from "zod";
import { MetaType, peer } from "../src";

const node = await peer({
  sss: {
    type: "handler",
    func: (data, send) => {
      send(data + 1);
    },
    input: z.number(),
    output: z.number(),
  },
  sssd: {
    type: "handler",
    func: (data, send) => {
      send(data + 1);
    },
    input: z.string(),
    output: z.string(),
  },
});

const channel = await node.connect<MetaType<typeof node>>(
  "",
);
await channel.sss;
