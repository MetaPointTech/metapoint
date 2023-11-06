import { createLibp2p } from "libp2p";
import { mplex } from "@libp2p/mplex";
import { noise } from "@chainsafe/libp2p-noise";
import { webSockets } from "@libp2p/websockets";
import { all } from "@libp2p/websockets/filters";

export const newNode = async () =>
  await createLibp2p({
    transports: [
      webSockets({
        filter: all,
      }),
    ],
    streamMuxers: [mplex()],
    addresses: {
      listen: typeof window === "object" ? [] : ["/ip4/0.0.0.0/tcp/0/ws"],
    },
    connectionEncryption: [noise()],
  });
