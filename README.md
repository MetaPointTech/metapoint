# prpc

rpc based on libp2p

```typescript
// server side
const { handle } = newPRPC(libp2p);
await handle("add", (data: number) => data + 1);

// client side
const { fetch } = newPRPC(libp2p);
const stream = await libp2p.dialProtocol(addr, "add");
await fetch(stream, 1) // 2
```
