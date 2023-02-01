# libp2p-transport

peer to peer rpc/channel communication based on libp2p

## Features

- ⚡3-10x(channel) quicker than http communication
- 🤝Bidirectional channel support
- 🎡AsyncIterator style
- 🪐Peer to peer connect
- 🔢Data codec agnostic(json, protobuff, etc.)
- 📡Transport protocol agnostic(tcp/udp, ws, webtransport, etc.)

## Quickstart

**first**

```typescript
import { client, server } from "libp2p-transport";

// server side
const { handle, serve } = server(libp2p);
// client side
const conn = await client(libp2p, addr);
```

**↓↓↓ USAGE ↓↓↓**

1. [ ] **one data-in one data-out**

```typescript
// server side
await handle<number, number>(
  "add",
  async (data, send, done) => {
    await send(data + 1);
    await done();
  },
);
// client side
const add = await conn<number, number>("add");
await add.send(1);
(await add.next()).value; // 2
```

2. [ ] **one data-in multi data-out**

```typescript
// server side
await handle<number, number>(
  "adding",
  async (data, send, done) => {
    await send(data + 1);
    await send(data + 2);
    await send(data + 3);
    await done();
  },
);
// client side
const adding = await conn<number, number>("adding");
await adding.send(1);
for await (const msg of adding) {
  console.log(msg); // 2, 3, 4
}
```

3. [ ] **bidirectional channel**

```typescript
// server side
const service = () => {
  const handle = (data, send) => send(data + 1);
  return handle;
};
await serve<number, number>(
  "channelAdd",
  service,
);
// client side
const channelAdd = await conn<number, number>("channelAdd");
let num = 0;
await channelAdd.send(num);
for await (const msg of channelAdd) {
  msg === num; // true
  num++;
  await channel.send(num);
}
```

more examples in [test](./test/index.test.ts)
