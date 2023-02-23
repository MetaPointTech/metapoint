# MetaPoint

Meta first and low-code.

Peer-to-Peer typesafe APIs or Channels made easy.

## Intro

MetaPoint allows you to easily build typesafe APIs or Channels wherever
JavaScript runs.

## Quickstart

```typescript
import { h, MetaType, peer, z } from "metapoint";

const g = h();

// node1(nodejs/web/deno)
const node1 = await peer({
  numberAdd: g.handler({
    func: async (data, send, done) => {
      await send(data + 1);
      await done();
    },
    input: z.number(),
    output: z.number(),
  }),
});
export type meta = MetaType<typeof node1>;

// node2(nodejs/web/deno)
const node2 = await peer();
const channel = await node2.connect<meta>(node1.meta().addrs);
const add = await channel("numberAdd");
console.log(await add(1)); // [2]
```
