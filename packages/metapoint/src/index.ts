import { client, server } from "libp2p-transport";
import { Libp2p } from "libp2p";
import { makeProtocol } from "./utils";
import type {
  EndpointMeta,
  EndpointMetaServer,
  Meta,
  PeerInitOptions,
  ServerMeta,
} from "./types";
import { newNode } from "./node";

export const peerServer = async <T = any, I extends T = T, O extends T = T>(
  metaInit?: EndpointMetaServer<I, O>[],
  options?: PeerInitOptions<T>,
) => {
  let libp2p: Libp2p;
  if (options?.libp2p === undefined) {
    libp2p = await newNode();
  } else {
    libp2p = options.libp2p;
  }
  const { handle, serve } = server(libp2p, options);
  const metaStore = new Map<string, EndpointMeta<I, O>>();
  const handleMeta = async <HI extends I, HO extends O>(
    meta: EndpointMetaServer<HI, HO>,
  ) => {
    const name = makeProtocol(meta.name, meta.version);
    if (meta.type === "service") {
      await serve(name, meta.func);
    } else if (meta.type === "handler") {
      await handle(name, meta.func);
    }
    metaStore.set(name, meta);
  };

  const unhandle = async <I extends Pick<Meta<I, O>, "name" | "version">>(
    ...name: I[] | string[]
  ) => {
    await libp2p.unhandle(
      name.map((item: I | string) => {
        let name: string;
        if (typeof item === "string") {
          name = item;
        } else {
          name = makeProtocol(item.name, item.version);
        }
        metaStore.delete(name);
        return name;
      }),
    );
  };

  const conn = async <I, O>(meta: ServerMeta<I, O>) => {
    // todo retry addrs
    const newFetch = await client(libp2p, meta.addrs[0], options);
    // type a = ServerMeta<I, O>["endpoint"];
    for (const i of meta.endpoint) {
      const name = makeProtocol(i.name, i.version);

      const c = await newFetch(name);
      // i.
    }

    const fetch = (name: string) => {
      c();
    };
  };

  return {
    start: async () => {
      if (metaInit) {
        for (const item of metaInit) {
          await handleMeta(item);
        }
      }
      await libp2p.start();
    },
    stop: async () => {
      await libp2p.unhandle(Array.from(metaStore.keys()));
      metaStore.clear();
      await libp2p.stop();
    },
    meta: (): ServerMeta<I, O> => ({
      addrs: libp2p.getMultiaddrs().map((d) => d.toString()),
      endpoint: Array.from(metaStore.values()),
    }),
    handle: handleMeta,
    unhandle,
  };
};

// todo 通过 ip/domain & port & ServerMeta 生成 proxy 对象
// fetcher: () => {},
// connect: async <I, O, C>(meta: Meta<I, O>, addr: string) => {
//   const stream = await libp2p.dialProtocol(
//     addr,
//     makeProtocol(meta.name, meta.version),
//   );
//   const ctx = Evt.newCtx<C>();
//   return {
//     fetch: async (input: InferIOType<typeof meta.input, I>) => {
//       if (meta.input) input = await meta.input.parseAsync(input);
//       let output = await fetch<
//         InferIOType<typeof meta.input, I>,
//         InferIOType<typeof meta.output, O>
//       >(stream, input);
//       if (meta.output) output = await meta.output.parseAsync(output);
//       return output;
//     },
//     open: () => {
//       let { inputChannel, outputChannel } = open<
//         InferIOType<typeof meta.input, I>,
//         InferIOType<typeof meta.output, O>,
//         C
//       >(stream, ctx);

//       inputChannel = channelValidate(meta.input, inputChannel, ctx);
//       outputChannel = channelValidate(meta.output, outputChannel, ctx);

//       return {
//         inputChannel,
//         outputChannel,
//       };
//     },
//     close: (result: C) => {
//       ctx.done(result);
//       stream.close();
//     },
//   };
// },
