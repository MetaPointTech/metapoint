import { createLibp2p } from "libp2p";
import { mplex } from "@libp2p/mplex";
import { noise } from "@chainsafe/libp2p-noise";
import { tcp } from "@libp2p/tcp";

export const newNode = async () =>
  await createLibp2p({
    transports: [tcp()],
    streamMuxers: [mplex()],
    addresses: {
      listen: ["/ip4/0.0.0.0/tcp/0"],
    },
    connectionEncryption: [noise()],
  });
