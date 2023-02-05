import { client, server, TransportChannel } from "libp2p-transport";
import type { Libp2p } from "libp2p";
import type {
  ConnectEndpoint,
  Endpoint,
  EndpointMeta,
  InferIOType,
  PeerInitOptions,
  ServerMeta,
  UnPromisify,
} from "./types";
import { newNode } from "./node";

export const peer = async <T extends Endpoint<any, any>>(
  metaInit?: T,
  options?: PeerInitOptions<any>,
) => {
  // todo 使用 JSON codec 并增加 zod 校验器
  let libp2p: Libp2p;
  if (options?.libp2p === undefined) {
    libp2p = await newNode();
  } else {
    libp2p = options.libp2p;
  }
  const { handle, serve } = server(libp2p, options);
  const metaStore = new Map<string, EndpointMeta<any, any>>();

  const addEndpoint = async <I, O>(
    endpoint: Endpoint<I, O>,
  ) => {
    for (const [name, meta] of Object.entries(endpoint)) {
      switch (meta.type) {
        case "handler":
          await handle(name, meta.func);
          metaStore.set(name, meta as unknown as EndpointMeta<I, O>);
          break;
        case "service":
          await serve(name, meta.func);
          metaStore.set(name, meta as unknown as EndpointMeta<I, O>);
          break;
        default:
          break;
      }
    }
  };

  const unhandle = async (...names: string[]) =>
    await libp2p.unhandle(
      names.map((name: string) => {
        metaStore.delete(name);
        return name;
      }),
    );

  const connect = async <T extends ConnectEndpoint<any, any>>(
    peer: string,
  ) => {
    // todo retry addrs
    const channel = await client(libp2p, peer, options);
    return async <F extends keyof T>(name: F) => {
      return await channel<
        InferIOType<T[F]["input"], any>,
        InferIOType<T[F]["output"], any>
      >(name.toString());
    };
  };

  const start = async () => {
    if (metaInit) {
      await addEndpoint(metaInit);
    }
    await libp2p.start();
  };

  const stop = async () => {
    await libp2p.unhandle(Array.from(metaStore.keys()));
    metaStore.clear();
    await libp2p.stop();
  };

  const meta = (): ServerMeta<T> => ({
    addrs: libp2p.getMultiaddrs().map((d) => d.toString()),
    endpoint: Object.fromEntries(metaStore.entries()),
  } as ServerMeta<T>);

  await start();
  return {
    start,
    stop,
    meta,
    handle: addEndpoint,
    unhandle,
    connect,
  };
};

type PeerReturn<T extends Endpoint<any, any>> = UnPromisify<
  ReturnType<typeof peer<T>>
>;

export type MetaType<T extends PeerReturn<any>> = ReturnType<
  T["meta"]
>["endpoint"];
export * from "./helper";
