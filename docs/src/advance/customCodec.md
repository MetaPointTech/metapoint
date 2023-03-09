---
title: Custom Codec
index: true
order: 8
icon: discover
category:
  - Guide
---

You can customize codec used in the endpoint group.

JSON codec example:

```ts {6-9}
import { h, MetaType, peer, z } from "metapoint";
import { stringToUint8Array, uint8ArrayToString } from "binconv";
import destr from "destr";

const group = h({
    codec: {
        encoder: (data) => stringToUint8Array(JSON.stringify(data)),
        decoder: (data) => destr(uint8ArrayToString(data)),
    }
});

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

::: warning Attention

You need to change the codec of both the server and the client! Otherwise the data will not be recognized correctly.

:::