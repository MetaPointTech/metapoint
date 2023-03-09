---
title: Error Catching
index: true
order: 5
icon: discover
category:
  - Guide
---

You can throw an Error directly in the endpoint, and the Error will be passed directly to the client and then thrown.

It's like the client is calling a local function.

In the following example, the server finds that the request has not been verified and throws an Unauthorized exception, and the client receives it.

**server**
```ts {3-10}
import { h, MetaType, peer, z } from "metapoint";

const group = h({ context: { auth: "xxxxxxxxxxxx" }, middleware: async ({ context, next }) => {
    if (context.auth === "xxxxxxxxxxxx") { 
        await next() 
    } else {
        throw new Error("Unauthorized")
    }
  }
});

const endpoint = {
  helloworld: group.handler({
    func: async ({ data, send, done }) => {
      await send(data);
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

**client**
```ts {6-10}
import { peer } from "metapoint";
import type { Meta } from "./server";
const node = await peer();
const channel = await node.connect<Meta>("your server addr");
const helloworld = await channel("helloworld");
try {
    console.log(await helloworld("sovlookup"));
} catch (e) {
    console.log(e.msg) // Unauthorized
}
```
