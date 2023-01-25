import { createLibp2p } from "libp2p";
import { mplex } from "@libp2p/mplex";
import { noise } from "@chainsafe/libp2p-noise";
import { tcp } from "@libp2p/tcp";
import { Multiaddr } from "@multiformats/multiaddr";
import { newPRPC } from "../src";

export const startClient = async (addr: Multiaddr) => {
  const libp2p = await createLibp2p({
    transports: [tcp()],
    streamMuxers: [mplex()],
    addresses: {
      listen: ["/ip4/0.0.0.0/tcp/0"],
    },
    connectionEncryption: [noise()],
  });

  const { channel } = newPRPC(libp2p);

  const stream = await libp2p.dialProtocol(addr, "log");

  const { inputChannel, outputChannel } = channel<number, number>(stream);

  console.time("total");
  for (let i = 0; i < 20; i++) {
    inputChannel.post(i);
    console.time(i.toString());
    const result = await outputChannel.waitFor();
    console.log("client received: " + result);
    console.timeEnd(i.toString());
  }
  console.timeEnd("total");
};
