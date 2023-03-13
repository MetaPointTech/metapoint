---
title: Context
index: true
order: 3
icon: float
category:
  - Guide
---

You can define context that are shared in the endpoint group, and you can read
or modify the context in endpoint handlers.

```ts {3,8}
import { h, MetaType, peer, z } from "metapoint";

const group = h({ context: { world: "world" } });

const endpoint = {
  helloworld: group.handler({
    func: async ({ data, send, done, context }) => {
      await send("hello " + context.world + "!");
      await send("hi " + data);
      await done();
    },
    input: z.string(),
    output: z.string(),
  }),
};

const node = await peer({ endpoint });

export type Meta = MetaType<typeof node>;
console.log("MetaPoint addr: ", node.meta().addrs);
// /ipv4/127.0.0.1/xxxxxx (it's your server's connect addr)
```
