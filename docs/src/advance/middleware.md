---
title: Middleware
index: true
order: 4
icon: sort
category:
  - Guide
---

You can define middleware in endpoint group.

In Middleware, you can add logic before and after handler execution, or even
stop handler running.

```ts {3-13}
import { h, MetaType, peer, z } from "metapoint";

const group = h({ middleware: async ({ next, data }) => {
    // modify data
    newData = data + "addition strings"
    if (data === undefined) {
        throw new Error("Something went wrong!");
    }
    // overwrite the original data
    await next({ data: newData });
    console.log("Run successful!")
  }
});

const endpoint = {
  helloworld: group.handler({
    func: async ({ data, send, done }) => {
      await send("hello world!");
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
