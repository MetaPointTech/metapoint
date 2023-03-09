---
title: Channel
index: true
order: 2
icon: discover
category:
  - Guide
---

This is the "function style" code we wrote earlier in [guide](../guide/client.md).

```ts {5-6}
import { peer } from "metapoint";
import type { Meta } from "./server";
const node = await peer();
const channel = await node.connect<Meta>("your server addr");
const helloworld = await channel("helloworld");
console.log(await helloworld("sovlookup")); // ["hi sovlookup", "hello world!"]
```

You can also write in the "chennel style":

```ts {6-8}
import { peer } from "metapoint";
import type { Meta } from "./server";
const node = await peer();
const channel = await node.connect<Meta>("your server addr");
const helloworld = await channel("helloworld");
for await (const msg of helloworld) {
    console.log(msg); // "hi sovlookup", "hello world!"
}
```

This is useful for receiving response from endpoints that send multiple returns or infinite returns.

It is recommended to use the "function style" for one return, and use the "channel style" for multiple returns or infinite returns.