# libp2p-transport

peer to peer rpc/channel communication based on libp2p

## Quickstart

**rpc**

```typescript
import { fetch, serve } from "libp2p-transport";

// server side
const { handle } = serve(libp2p);
await handle("add", (data: number) => data + 1);

// client side
const stream = await libp2p.dialProtocol(addr, "add");
await fetch(stream, 1); // 2
```

**channel**

```typescript
import { open, serve } from "libp2p-transport";

// server side
const { channel } = serve(libp2p);
await channel(
  "adding",
  ({ inputChannel, outputChannel }) =>
    inputChannel.attach((data: number) => {
      let n = 0;
      setInterval(() => {
        n += 1;
        outputChannel.post(data + n);
      }, 1000);
    }),
);

// client side
const stream = await libp2p.dialProtocol(addr, "adding");
const { inputChannel, outputChannel } = open(stream);
inputChannel.post(1);
outputChannel.attach((msg) => console.log(msg)); // 2 3 4 5 ...
```

## Features

- Data codec agnostic
- Transport protocol agnostic
