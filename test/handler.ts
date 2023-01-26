import { createLibp2p } from "libp2p";
import { mplex } from "@libp2p/mplex";
import { noise } from "@chainsafe/libp2p-noise";
import { tcp } from "@libp2p/tcp";
import { serve } from "../src";

export const startServer = async () => {
  const libp2p = await createLibp2p({
    transports: [tcp()],
    streamMuxers: [mplex()],
    addresses: {
      listen: ["/ip4/0.0.0.0/tcp/0"],
    },
    connectionEncryption: [noise()],
  });

  const { handle, channel } = serve(libp2p);

  await handle("add", (data: number) => {
    console.log("server received: " + data);
    return data + 1;
  });

  await channel<number, number>("adding", (channel) => {
    const { inputChannel, outputChannel } = channel;
    inputChannel.attach((data) => {
      let n = 1;
      const task = setInterval(() => {
        outputChannel.post(data + n);
        // add 3 times
        if (n === 3) {
          clearInterval(task);
        }
        n += 1;
      }, 100);
    });
  });

  return libp2p.getMultiaddrs()[0];
};
