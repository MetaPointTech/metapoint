---
title: Server
icon: config
index: true
order: 2
next: ./client/README.md
category:
  - Guide
tag:
  - server
---

::: tip Tips

We'll walk through the code line by line, so you can focus on only the
highlighted portion

:::

First, you need to introduce metapoint and define an endpoint group

::: details Advanced about endpoint group

Endpoints within the same endpoint group have shared
[context](../../advance/channel.md) and
[middleware](../../advance/middleware.md)

:::

```ts {1-3}
import { h, MetaType, peer, z } from "metapoint";

const group = h();

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

Then, you write the endpoint function `helloworld` as a handler and define
`helloworld`'s input and output types

`helloworld` handler receives your name, response a `hello world!` and then say
hi to you

```ts {6-14}
import { h, MetaType, peer, z } from "metapoint";

const group = h();

const endpoint = {
  helloworld: group.handler({
    func: async ({ data, send, done }) => {
      await send("hello world!");
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

::: info Why done()?

Function `send` will not end the calling procedure of the handler, you need to
call the `done` function manually, because there may be multiple replies in one
handler.

:::

You can define more endpoints in the endpoint object:

```ts {11-17}
const endpoint = {
  helloworld: group.handler({
    func: async ({ data, send, done }) => {
      await send("hello world!");
      await send(data);
      await done();
    },
    input: z.string(),
    output: z.string(),
  }),
  your_own_endpoint: group.handler({
    func: async ({ data, send, done }) => {
      ...
    },
    input: ...,
    output: ...,
  }),
};
```

Finally, pass the endpoints to the `peer` function to start a metapoint node,
metapoint will automatically serve your endpoints

```ts {16}
import { h, MetaType, peer, z } from "metapoint";

const group = h();

const endpoint = {
  helloworld: group.handler({
    func: async ({ data, send, done }) => {
      await send("hello world!");
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

Here we exported the meta and printed our address for client connection

```ts {18-19}
import { h, MetaType, peer, z } from "metapoint";

const group = h();

const endpoint = {
  helloworld: group.handler({
    func: async ({ data, send, done }) => {
      await send("hello world!");
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

::: info What's meta?

meta is just the type definition of endpoints, used for type hinting and
autocompletion on the client

you can also export the Meta like this:

```ts {12}
const endpoint = {
  helloworld: group.handler({
    func: async ({ data, send, done }) => {
      await send("hello world!");
      await send(data);
      await done();
    },
    input: z.string(),
    output: z.string(),
  }),
};
export type Meta = typeof endpoint;
```

:::
