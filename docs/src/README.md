---
home: true
icon: home
title: MetaPoint
heroImage: /logo.png
heroText: MetaPoint
tagline: ⚡Meta first and low-code. Peer-to-Peer typesafe APIs or Channels made easy.
actions:
  - text: Guide 💡
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
    details: Call APIs painlessly, just like using local functions(Even includes error catching).

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
    details: Something changed? TypeScript will warn you of errors before you even save the file.

  - title: ⚙Auto management
    details: Streams are managed by MetaPoint. You only need to consider the business code!

  - title: 🔐Secure transmission
    details: Devices communicate with each other over encrypted channels.

  - title: 🧩Plugin support
    details: Extend MetaPoint through plugins.

copyright: Copyright © 2023 SOVLOOKUP
footer: Apache-2.0 Licensed
---

## ❓️What's MetaPoint?

<figure>
    <img src="https://user-images.githubusercontent.com/53158137/224494201-7e70b6d7-e29a-45ac-b534-e1d3c04dea48.gif" alt="Demo" />
    <figcaption>
      <p align="center">
        Metapoint lets you <strong>focus on</strong> what you want to do
      </p>
  </figcaption>
</figure>

- MetaPoint works well with nodejs and _**any**_ front-end framework.

- You _**no longer**_ need to pay attention to tedious network layer coding,
  just write business code. Save a lot of time and energy.

- MetaPoint saves your team _**a lot of communication time**_ because the SDK is
  _**automatically**_ generated. API documentation is also no longer needed.

- Thanks to the extensibility of libp2p, you can use _**any**_ transport
  protocol, including any in the _**future**_, which means _**zero**_ upgrade
  cost.

- You will _**never**_ get your API called incorrectly. TypeScript will warn you
  of errors in the call before you even save the file.

- MetaPoint is great for making _**real-time**_ applications.

- MetaPoint is great for making _**client-first**_ apps.

- Using metapoints makes your app to be _**more immune to malicious crawlers**_.

- Metapoint's _**secure transmission**_ protects you from man-in-the-middle
  attacks.

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

```ts {7-14}
// server.ts
import { h, MetaType, peer, z } from "metapoint";

const group = h({ context: { addnum: 1 } });

const endpoint = {
  add: group.handler({
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

console.log("MetaPoint addr: ", node.meta().addrs);
// /ipv4/127.0.0.1/xxxxxx (it's your server's connect addr)
```

👉 Call endpoints

```ts {6-7}
// client.ts
import { peer } from "metapoint";
import type { Meta } from "./server";
const node = await peer();
const channel = await node.connect<Meta>("your server addr");
const add = await channel("add");
console.log(await add(1)); // [2]
```

## 🎉Try it out for yourself!

<div style="height: 80vh;">
<iframe src="https://stackblitz.com/github/SOVLOOKUP/metapoint/tree/master/examples/example-basic?embed=1&view=editor" width="100%" style=" border-radius: 6px; border: none;" height="100%" ></iframe>
</div>
