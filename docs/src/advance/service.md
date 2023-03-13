---
title: Service
index: true
order: 6
icon: app
category:
  - Guide
---

For stateful services, you can use service to define endpoints:

For example, a simple access counting endpoint:

```ts {6-17}
import { h, MetaType, peer, z } from "metapoint";

const group = h();

const endpoint = {
  accessCount: group.service({
    func: () => {
      let count = 0;
      return async ({ send, done }) => { 
        count += 1;
        await send(count)
        await done();
      }
    },
    input: z.void(),
    output: z.number(),
  })
};

const node = await peer({ endpoint });

export type Meta = MetaType<typeof node>;
console.log("MetaPoint addr: ", node.meta().addrs);
// /ipv4/127.0.0.1/xxxxxx (it's your server's connect addr)
```

`func` in service endpoint is actually a handler factory.
