<!-- <a href="https://trpc.io/" target="_blank" rel="noopener">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://assets.trpc.io/www/trpc-readme-dark.png" />
    <img alt="tRPC" src="https://assets.trpc.io/www/trpc-readme.png" />
  </picture>
</a> -->

<div align="center">
  <h1>MetaPoint</h1>
  <h3>Meta first and low-code.<br />Peer-to-Peer typesafe APIs or Channels made easy.</h3>
  <!-- <a href="https://codecov.io/gh/trpc/trpc">
    <img alt="codecov" src="https://codecov.io/gh/trpc/trpc/branch/main/graph/badge.svg?token=KPPS918B0G">
  </a>
  <a href="https://github.com/trpc/trpc/blob/main/LICENSE">
    <img alt="MIT License" src="https://img.shields.io/github/license/trpc/trpc" />
  </a>
  <a href="https://trpc.io/discord">
    <img alt="Discord" src="https://img.shields.io/discord/867764511159091230?color=7389D8&label&logo=discord&logoColor=ffffff" />
  </a>
  <br />
  <a href="https://twitter.com/alexdotjs">
    <img alt="Twitter" src="https://img.shields.io/twitter/url.svg?label=%40alexdotjs&style=social&url=https%3A%2F%2Ftwitter.com%2Falexdotjs" />
  </a>
  <a href="https://twitter.com/trpcio">
    <img alt="Twitter" src="https://img.shields.io/twitter/url.svg?label=%40trpcio&style=social&url=https%3A%2F%2Ftwitter.com%2Falexdotjs" />
  </a>
  <br /> -->
  <!-- <br /> -->
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
import { h, MetaType, peer } from "metapoint";
import { z } from "zod";

// node1
const node1 = await peer(h.router({
  numberAdd: h.handler({
    func: async (data, send, done) => {
      await send(data + 1);
      await done();
    },
    input: z.number(),
    output: z.number(),
  }),
}));
export type meta = MetaType<typeof node1>;

// node2
const node2 = await peer();
const channel = await node2.connect<meta>(node1.meta().addrs);
const add = await channel("numberAdd");
console.log(await add(1)); // [2]
```
