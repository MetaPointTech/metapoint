import { client, InitOptions, PeerAddr, server } from "libp2p-transport";
import type {
  ConnectEndpoint,
  Endpoint,
  EndpointMeta,
  InferIOType,
  PeerInitOptions,
  UnPromisify,
} from "./types";
import { newNode } from "./node";

const parseOptions = async <Context extends {}, Codec>(
  options: PeerInitOptions<Context, Codec>,
) => ({
  libp2p: options.libp2p ?? await newNode(),
  initStart: options.initStart ?? true,
  endpoint: options.endpoint ?? {},
  ...options,
});

export const peer = async <Context extends {}, Codec>(
  options?: PeerInitOptions<Context, Codec>,
) => {
  const { libp2p, initStart, endpoint } = await parseOptions(options ?? {});
  const { handle, serve } = await server(libp2p);
  const metadata = new Map<string, EndpointMeta<Context, Codec, any, any>>();

  const addEndpoint = async (endpoint: Endpoint<any, any>) => {
    for (const [name, meta] of Object.entries(endpoint)) {
      switch (meta.type) {
        case "handler":
          await handle(name, meta.func, meta);
          metadata.set(name, meta);
          break;
        case "service":
          await serve(name, meta.func, meta);
          metadata.set(name, meta);
          break;
        default:
          break;
      }
    }
  };

  const unhandle = async (...names: string[]) =>
    await libp2p.unhandle(
      names.map((name: string) => {
        metadata.delete(name);
        return name;
      }),
    );

  const connect = async <
    T extends ConnectEndpoint<any, any>,
    Context extends {} = {},
  >(
    peer: PeerAddr | PeerAddr[],
    options?: InitOptions<any, Context>,
  ) => {
    const channel = await client(libp2p, peer);
    return Object.assign(async <F extends keyof T>(name: F) =>
      await channel<
        InferIOType<T[F]["input"], any>,
        InferIOType<T[F]["output"], any>,
        any,
        Context
      >(name.toString(), options), { close: channel.close });
  };

  const start = async () => {
    await addEndpoint(endpoint);
    await libp2p.start();
  };

  const stop = async () => {
    await libp2p.unhandle(Array.from(metadata.keys()));
    metadata.clear();
    await libp2p.stop();
  };

  const getMeta = () => ({
    addrs: libp2p.getMultiaddrs().map((d) => d.toString()),
    endpoint: Object.fromEntries(metadata.entries()),
  });

  if (initStart) await start();

  return {
    start,
    stop,
    meta: getMeta,
    handle: addEndpoint,
    unhandle,
    connect,
  };
};

type PeerReturn<S extends {}, Codec> = UnPromisify<
  ReturnType<typeof peer<S, Codec>>
>;

export type MetaType<T extends PeerReturn<{}, any>> = ReturnType<
  T["meta"]
>["endpoint"];

export * from "./helper";
export { z } from "zod";
