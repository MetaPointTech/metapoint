---
title: Client
icon: tab
index: true
order: 3
next: ../advance/README.md
category:
  - Guide
tag:
  - client
---

::: tip Tips

We'll walk through the code line by line, so you can focus on only the
highlighted portion.

:::

First, you need to introduce metapoint and server's meta.

```ts {1-2}
import { peer } from "metapoint";
import type { Meta } from "./server";
const node = await peer();
const channel = await node.connect<Meta>("your server addr");
const helloworld = await channel("helloworld");
console.log(await helloworld("sovlookup")); // ["hi sovlookup", "hello world!"]
```

::: info What's meta?

- Meta is usually exported on the server side as a type definition.

- Meta is a typescript type definition that contains all callable functions on
  the server side and their signatures.

- Meta enables you to write client-side code with type hints and autocompletion.

:::

Then, start a metapoint local node(client) and connect to the remote
node(server).

```ts {3-4}
import { peer } from "metapoint";
import type { Meta } from "./server";
const node = await peer();
const channel = await node.connect<Meta>("your server addr");
const helloworld = await channel("helloworld");
console.log(await helloworld("sovlookup")); // ["hi sovlookup", "hello world!"]
```

Finally, select the handler that runs on the remote and use it like calling a
local function!

```ts {5-6}
import { peer } from "metapoint";
import type { Meta } from "./server";
const node = await peer();
const channel = await node.connect<Meta>("your server addr");
const helloworld = await channel("helloworld");
console.log(await helloworld("sovlookup")); // ["hi sovlookup", "hello world!"]
```

::: info Use MetaPoint with Web Frameworks

1. [Vue example](https://github.com/SOVLOOKUP/metapoint/tree/master/examples/example-vue)
2. [React example](https://github.com/SOVLOOKUP/metapoint/tree/master/examples/example-react)
3. [Svelte example](https://github.com/SOVLOOKUP/metapoint/tree/master/examples/example-svelte)
4. [Vue example with custom server addr](https://github.com/SOVLOOKUP/metapoint/tree/master/examples/example-svelte)

:::
