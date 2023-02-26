<div align="center">
<a href="https://metapoint.sovlookup.top/" target="_blank" rel="noopener" >
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/53158137/219955869-b5da5805-2557-45d1-a02e-15caa827a862.png" />
    <img alt="metapoint" height="200" src="https://user-images.githubusercontent.com/53158137/219955869-b5da5805-2557-45d1-a02e-15caa827a862.png" />
  </picture>
</a>
</div>

<div align="center">
  <h1>MetaPoint</h1>
  <h3>Meta first and low-code.<br />Peer-to-Peer typesafe APIs or Channels made easy.</h3>
  <a href="https://github.com/sovlookup/metapoint/blob/main/LICENSE">
    <img alt="Apache-2.0 License" src="https://img.shields.io/github/license/sovlookup/metapoint" />
  </a>
  <a href="https://discord.gg/wGSABhbCzN">
    <img alt="Discord" src="https://img.shields.io/discord/813599680713457665?color=7389D8&label&logo=discord&logoColor=ffffff" />
  </a>
  <br />
  <!-- <figure>
    <img src="https://assets.trpc.io/www/v10/v10-dark-landscape.gif" alt="Demo" />
    <figcaption>
      <p align="center">
        The client above is <strong>not</strong> importing any code from the server, only its type declarations.
      </p>
    </figcaption>
  </figure> -->
</div>

<br />

## Intro

MetaPoint allows you to easily build typesafe APIs or Channels wherever
JavaScript runs.

## Quickstart

```typescript
import { h, MetaType, peer, z } from "metapoint";

// router group
const g = h();

// node1(nodejs/web/deno)
const node1 = await peer({
  numberAdd: g.handler({
    func: async ({ data, send, done }) => {
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
