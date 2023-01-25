import { createLibp2p } from "libp2p";
import { mplex } from "@libp2p/mplex";
import { noise } from "@chainsafe/libp2p-noise";
import { tcp } from "@libp2p/tcp";
import { newPRPC } from "../src";

export const startServer = async () => {
  const libp2p = await createLibp2p({
    transports: [tcp()],
    streamMuxers: [mplex()],
    addresses: {
      listen: ["/ip4/0.0.0.0/tcp/0"],
    },
    connectionEncryption: [noise()],
  });

  const { handle } = newPRPC(libp2p);

  await handle("add", (data: number) => {
    console.log("server received: " + data);
    return data + 1;
  });

  return libp2p.getMultiaddrs()[0];
};
