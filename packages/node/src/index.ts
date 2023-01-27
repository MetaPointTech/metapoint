import { fetch, open, serve } from "libp2p-transport";
import { createLibp2p } from "libp2p";
import { channelValidate, makeProtocol } from "./utils";
import { Evt } from "evt";
import type { Multiaddr } from "@multiformats/multiaddr";
import type {
  EndpointMeta,
  EndpointMetaNoFunc,
  InferIOType,
  Meta,
  ServerMeta,
} from "./types";

export const peer = async () => {
  const libp2p = await createLibp2p({
    // transports: [tcp()],
    // streamMuxers: [mplex()],
    // addresses: {
    //   listen: ["/ip4/0.0.0.0/tcp/0"],
    // },
    // connectionEncryption: [noise()],
  });

  const endpoints = new Map<string, EndpointMetaNoFunc<any, any>>();
  const { handle, channel } = serve(libp2p);

  return {
    start: async () => {
      await libp2p.start();
    },
    stop: async () => {
      await libp2p.stop();
    },
    meta: (): ServerMeta => ({
      addrs: libp2p.getMultiaddrs().map((d) => d.toString()),
      endpoint: Array.from(endpoints.values()),
    }),
    handle: async <I, O>(meta: EndpointMeta<I, O>) => {
      const name = makeProtocol(meta.meta.name, meta.meta.version);
      if (meta.type === "channel") {
        await channel<
          InferIOType<typeof meta.meta.input, I>,
          InferIOType<typeof meta.meta.output, O>
        >(
          name,
          async ({ inputChannel, outputChannel }) => {
            inputChannel = channelValidate(meta.meta.input, inputChannel);
            outputChannel = channelValidate(meta.meta.output, outputChannel);
            try {
              await meta.func({
                inputChannel,
                outputChannel,
              });
            } catch (error) {
              // todo process func process error
            }
          },
        );
      } else {
        await handle<
          InferIOType<typeof meta.meta.input, I>,
          InferIOType<typeof meta.meta.output, O>
        >(
          name,
          async (input) => {
            try {
              if (meta.meta.input) {
                input = await meta.meta.input.parseAsync(input);
              }
              let output = await meta.func(input);
              if (meta.meta.output) {
                output = await meta.meta.output.parseAsync(output);
              }
              return output;
            } catch (error) {
              // todo process func process & type valid error
              return {} as O;
            }
          },
        );
      }
      endpoints.set(name, {
        type: meta.type,
        meta: meta.meta,
      });
    },
    unhandle: async <I, O>(...name: Meta<I, O>[]) => {
      await libp2p.unhandle(
        name.map((item) => {
          const name = makeProtocol(item.name, item.version);
          endpoints.delete(name);
          return name;
        }),
      );
    },
    // todo 通过 ip/domain & port & ServerMeta 生成 proxy 对象
    fetcher: () => {},
    connect: async <I, O, C>(meta: Meta<I, O>, addr: Multiaddr) => {
      const stream = await libp2p.dialProtocol(
        addr,
        makeProtocol(meta.name, meta.version),
      );
      const ctx = Evt.newCtx<C>();
      return {
        fetch: async (input: InferIOType<typeof meta.input, I>) => {
          if (meta.input) input = await meta.input.parseAsync(input);
          let output = await fetch<
            InferIOType<typeof meta.input, I>,
            InferIOType<typeof meta.output, O>
          >(stream, input);
          if (meta.output) output = await meta.output.parseAsync(output);
          return output;
        },
        open: () => {
          let { inputChannel, outputChannel } = open<
            InferIOType<typeof meta.input, I>,
            InferIOType<typeof meta.output, O>,
            C
          >(stream, ctx);

          inputChannel = channelValidate(meta.input, inputChannel, ctx);
          outputChannel = channelValidate(meta.output, outputChannel, ctx);

          return {
            inputChannel,
            outputChannel,
          };
        },
        close: (result: C) => {
          ctx.done(result);
          stream.close();
        },
      };
    },
  };
};
