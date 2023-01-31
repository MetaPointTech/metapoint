# libp2p-transport

peer to peer rpc/channel communication based on libp2p

## Features

- Data codec agnostic
- Transport protocol agnostic
- AsyncIterator style

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
const add = await defaultClient<number, number>("add");
const channelAdd = await add();
await channelAdd.send(1);
(await channelAdd.next()).value; // 2
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
const adding = await defaultClient<number, number>("adding");
const channelAdding = await adding();
await channelAdding.send(1);
(await channelAdding.next()).value; // 2
(await channelAdding.next()).value; // 3
(await channelAdding.next()).value; // 4
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
const channelAdd = await defaultClient<number, number>("channelAdd");
const channel = await channelAdd();
let num = 0;
while (true) {
  await channel.send(num);
  num++;
  (await channelAdding.next()).value === num; // true
}
```
