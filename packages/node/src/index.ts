import { EventFunc, fetch, Func, open, serve } from "libp2p-transport";
import { z, ZodType } from "zod";
import { createLibp2p } from "libp2p";
import type { Multiaddr } from "@multiformats/multiaddr";
import { makeProtocol } from "./utils";
import { Ctx, Evt } from "evt";

export interface Meta<I, O> {
  name: string;
  version: number;
  input?: ZodType<I>;
  output?: ZodType<O>;
}

export interface HandleEndpointMeta<I, O> {
  type: "handle";
  meta: Meta<I, O>;
  func?: Func<
    InferIOType<Meta<I, O>["input"], I>,
    InferIOType<Meta<I, O>["output"], O>
  >;
}

export interface ChannelEndpointMeta<I, O> {
  type: "channel";
  meta: Meta<I, O>;
  func?: EventFunc<
    InferIOType<Meta<I, O>["input"], I>,
    InferIOType<Meta<I, O>["output"], O>
  >;
}

export type EndpointMeta<I, O> =
  | HandleEndpointMeta<I, O>
  | ChannelEndpointMeta<I, O>;

type IsEqual<T, U> = (<T1>() => T1 extends T ? 1 : 2) extends
  (<T2>() => T2 extends U ? 1 : 2) ? true
  : false;

type InferIOType<Meta extends ZodType | undefined, T> =
  IsEqual<Meta, undefined> extends true ? T : z.infer<Exclude<Meta, undefined>>;

const channelValidate = <T, C>(
  meta: z.ZodType<T> | undefined,
  channel: Evt<T>,
  ctx?: Ctx<C>,
) => {
  if (meta !== undefined) {
    const validator = (data: T) => {
      const parsedValue = (meta as Exclude<typeof meta, undefined>)
        .safeParse(data);
      if (parsedValue.success === false) {
        // todo process error
      }
      return parsedValue.success;
    };

    if (ctx) {
      channel = channel.pipe(ctx, validator);
    } else {
      channel = channel.pipe(validator);
    }
  }

  return channel;
};

export const peer = async () => {
  const libp2p = await createLibp2p({
    // transports: [tcp()],
    // streamMuxers: [mplex()],
    // addresses: {
    //   listen: ["/ip4/0.0.0.0/tcp/0"],
    // },
    // connectionEncryption: [noise()],
  });
  await libp2p.start();
  const { handle, channel } = serve(libp2p);

  return {
    // todo unhanle
    // todo stop/start
    // todo ServerMeta
    // peerid
    // protocal info
    // endpoint EndpointMeta[]
    meta: () => {},
    // todo 通过 EndpointMeta 生成 handle/channel
    channel: async <I, O>(
      meta: Meta<I, O>,
      func: EventFunc<
        InferIOType<typeof meta.input, I>,
        InferIOType<typeof meta.output, O>
      >,
    ) => {
      await channel<
        InferIOType<typeof meta.input, I>,
        InferIOType<typeof meta.output, O>
      >(
        makeProtocol(meta.name, meta.version),
        async ({ inputChannel, outputChannel }) => {
          inputChannel = channelValidate(meta.input, inputChannel);
          outputChannel = channelValidate(meta.output, outputChannel);

          try {
            await func({
              inputChannel,
              outputChannel,
            });
          } catch (error) {
            // todo process error
          }
        },
      );
    },
    handle: async <I, O>(
      meta: Meta<I, O>,
      func: Func<
        InferIOType<typeof meta.input, I>,
        InferIOType<typeof meta.output, O>
      >,
    ) => {
      return await handle<
        InferIOType<typeof meta.input, I>,
        InferIOType<typeof meta.output, O>
      >(
        makeProtocol(meta.name, meta.version),
        async (input) => {
          try {
            if (meta.input) input = await meta.input.parseAsync(input);
            let output = await func(input);
            if (meta.output) output = await meta.output.parseAsync(output);
            return output;
          } catch (error) {
            // todo process error
            return {} as O;
          }
        },
      );
    },
    // todo 通过 ip/domain & port & ServerMeta 生成 proxy 对象
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

// const node = await createLibp2p({});

// const { newHandle } = start(node);

// const f = await newHandle({
//   name: "123",
//   version: 1,
//   input: z.number(),
//   output: z.number(),
// }, (data) => data! + 1);

// const s = f({} as any);

// export { s };
