# libp2p-transport

peer to peer channel communication based on libp2p

## Quickstart

```typescript
import { client, server } from "libp2p-transport";

// server side
const handle = server(libp2p);
// one data-in one data-out
await handle("add", (data) => data + 1);

// one data-in multi data-out
await handle("adding", async (data, send) => {
  await send(data + 1);
  await send(data + 2);
  return data + 3;
});

// client side
// one data-in one data-out
const add = client(await libp2p.dialProtocol(addr, "add"));
await add.send(1);
(await add.next()).value; // 2
// one data-in many data-out
const adding = client(await libp2p.dialProtocol(addr, "adding"));
await adding.send(1);
(await adding.next()).value; // 2
(await adding.next()).value; // 3
(await adding.next()).value; // 4
```

## Features

- Data codec agnostic
- Transport protocol agnostic
