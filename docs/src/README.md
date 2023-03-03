---
home: true
icon: home
title: MetaPoint
heroImage: /logo.png
heroText: MetaPoint
tagline: ⚡Meta first and low-code. Peer-to-Peer typesafe APIs or Channels made easy.
actions:
  - text: QuickStart 💡
    link: /guide/
    type: primary

  - text: ⭐ Star
    link: https://github.com/SOVLOOKUP/metapoint/stargazers

features:
  - title: ⚡Efficient
    details: HTTP frequent connections waste your time? MetaPoint connect only once, communicate unlimited times.

  - title: 🤝Bidirectional channel
    details: MetaPoint establish a bidirectional channel between devices, so that you no longer have to worry about server-side push.

  - title: 🪞Shadow functions
    details: Painlessly calling a function on another device, just like...local calls (Even includes error catching).

  - title: 👌Autocompletion
    details: Just like calling native functions, TypeScript gives you autocompletion across devices!

  - title: 🎡Run everywhere
    details: Nodejs and Browser? Metapoint can all run!

  - title: 🪐P2P or C/S 
    details: Whether there is a centralized server or not, you have the final say.

  - title: 🔢Data codec agnostic
    details: JSON, Protobuff, xml, Thrift, MessagePack ...

  - title: 📡Transport protocol agnostic
    details: tcp, ws, webtransport, quic...

  - title: 🔒Automatic typesafety
    details: Something changed? TypeScript will warn you of errors in the call before you even save the file!

  - title: ⚙Auto management
    details: Streams are managed by MetaPoint. All you have to do is use!

  - title: 🔐Secure transmission
    details: Devices communicate with each other over encrypted channels

  - title: 🧩Plugin support
    details: Extend MetaPoint through plugins

copyright: Copyright © 2022 SOVLOOKUP
footer: Apache-2.0 Licensed
---

## 🛠Install

Install MetaPoint:

::: code-tabs#shell

@tab:active pnpm

```bash
pnpm add metapoint
```

@tab yarn

```bash
yarn add metapoint
```

@tab npm

```bash
npm i metapoint
```

:::

## 🚀Usage

👉 Define endpoints

```ts
// server.ts
import { h, MetaType, peer, z } from "metapoint";

const group = h({ context: { addnum: 1 } });

const endpoint = {
  plus: g.handler({
    func: async ({ data, send, done, context }) => {
      await send(data + context.addnum);
      await done();
    },
    input: z.number(),
    output: z.number(),
  }),
};

const node = await peer({ endpoint });
export type Meta = MetaType<typeof node>;

console.log("MetaPoint addr: ", node1.meta().addrs);
// /ipv4/127.0.0.1/xxxxxx (it's your server's connect addr)
```

👉 Call endpoints

```ts
// client.ts
import { h, peer, z } from "metapoint";
import type { Meta } from "./server";
const node = await peer();
const channel = await node.connect<Meta>("your server addr");
const plus = await channel("plus");
console.log(await plus(1)); // [2]
```

## 🎉Try it out for yourself!

<StackBlitz id="vuepress-theme-hope" />
