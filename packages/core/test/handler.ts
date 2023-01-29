import { createLibp2p } from "libp2p";
import { mplex } from "@libp2p/mplex";
import { noise } from "@chainsafe/libp2p-noise";
import { tcp } from "@libp2p/tcp";
import { Codec, serve } from "../src";
import { load } from "protobufjs";

export const startServer = async () => {
  const libp2p = await createLibp2p({
    transports: [tcp()],
    streamMuxers: [mplex()],
    addresses: {
      listen: ["/ip4/0.0.0.0/tcp/0"],
    },
    connectionEncryption: [noise()],
  });

  // default codec
  const { handle, channel } = serve(libp2p);

  await handle("add", (data: number) => {
    console.log("server received: " + data);
    return data + 1;
  });

  await channel<number, number>(
    "adding",
    ({ inputChannel, outputChannel }) => {
      inputChannel.attach((data: number) => {
        let n = 0;
        const task = setInterval(() => {
          n += 1;
          outputChannel.post(data + n);
          // add 3 times
          if (n === 3) {
            clearInterval(task);
          }
        }, 100);
      });
    },
  );

  // todo json codec
  const define = await load("test/msg.proto");
  const Msg = define.lookupType("Add");

  const customCodec: Codec<number> = {
    encoder: (data: number): Uint8Array => {
      Msg.encode(Msg.create({ value: data }));
      throw new Error("Function not implemented.");
    },
    decoder: (array: Uint8Array): number => {
      throw new Error("Function not implemented.");
    },
  };
  // const customServer = serve(libp2p, { codec: customCodec });

  console.log(Msg.encode(Msg.create({
    value: 1,
  })));

  return libp2p.getMultiaddrs()[0];
};
