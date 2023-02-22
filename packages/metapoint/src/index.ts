import { client, PeerAddr, server } from "libp2p-transport";
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

const parseOptions = async <
  Meta extends Endpoint<any, any>,
  Codec,
  S extends {},
>(
  options: PeerInitOptions<Meta, Codec, S>,
) => {
  return {
    libp2p: options.libp2p ?? await newNode(),
    initStart: options.initStart ?? true,
    meta: options.meta ?? {},
    store: options.store ?? {} as S,
    ...options,
  };
};

export const peer = async <
  Meta extends Endpoint<any, any>,
  Codec extends any,
  S extends {},
>(
  options?: PeerInitOptions<Meta, Codec, S>,
) => {
  const { libp2p, initStart, meta, ...runtimeOptions } = await parseOptions(
    options ?? {},
  );

  const { handle, serve } = await server(libp2p, runtimeOptions);
  const metadata = new Map<string, EndpointMeta<any, any>>();

  const addEndpoint = async <I extends Codec, O extends Codec>(
    endpoint: Endpoint<I, O>,
  ) => {
    for (const [name, meta] of Object.entries(endpoint)) {
      switch (meta.type) {
        case "handler":
          await handle(name, meta.func);
          metadata.set(name, meta);
          break;
        case "service":
          await serve(name, meta.func);
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

  const connect = async <T extends ConnectEndpoint<any, any>>(
    peer: PeerAddr | PeerAddr[],
  ) => {
    const channel = await client(libp2p, peer, runtimeOptions);
    return Object.assign(async <F extends keyof T>(name: F) =>
      await channel<
        InferIOType<T[F]["input"], any>,
        InferIOType<T[F]["output"], any>
      >(name.toString()), { close: channel.close });
  };

  const start = async () => {
    await addEndpoint(meta);
    await libp2p.start();
  };

  const stop = async () => {
    await libp2p.unhandle(Array.from(metadata.keys()));
    metadata.clear();
    await libp2p.stop();
  };

  const getMeta = (): ServerMeta<Meta> => ({
    addrs: libp2p.getMultiaddrs().map((d) => d.toString()),
    endpoint: Object.fromEntries(metadata.entries()),
  } as ServerMeta<Meta>);

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

type PeerReturn<T extends Endpoint<any, any>, Codec, S extends {}> =
  UnPromisify<ReturnType<typeof peer<T, Codec, S>>>;

export type MetaType<T extends PeerReturn<any, any, {}>> = ReturnType<
  T["meta"]
>["endpoint"];

export * from "./helper";
export { z } from "zod";
