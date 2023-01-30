import { createLibp2p } from "libp2p";
import { mplex } from "@libp2p/mplex";
import { noise } from "@chainsafe/libp2p-noise";
import { tcp } from "@libp2p/tcp";
import { server } from "../src";
import { jsonCodec } from "./jsonCodec";
import type { Data } from "./types";

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
  const handle = server(libp2p);

  await handle("add", (data: number) => data + 1);

  await handle<number, number>(
    "adding",
    async (data, send) => {
      await send(data + 1);
      await send(data + 2);
      return data + 3;
    },
  );

  // json codec
  const handle2 = server(libp2p, { codec: jsonCodec });

  await handle2<Data, Data>("addJson", (data) => {
    return { value: data.value + 1 };
  });

  await handle2<Data, Data>(
    "addingJson",
    async (input, send) => {
      await send({ value: input.value + 1 });
      await send({ value: input.value + 2 });
      return { value: input.value + 3 };
    },
  );

  return libp2p.getMultiaddrs()[0];
};
