import type { Libp2p } from "libp2p";
import type { Func, InitOptions, IterableFunc, Service } from "./types";
import { consume, transform } from "streaming-iterables";
import { defaultInitOptions } from "./common";
import { Channel } from "queueable";
import { newCtx } from "./utils";

export const server = <T>(node: Libp2p, options?: InitOptions<T>) => {
  const runtimeOptions = {
    ...defaultInitOptions,
    ...options,
  };

  const handleStream = async <I extends T, O extends T>(
    name: string,
    func: IterableFunc<I, O>,
  ) =>
    await node.handle(name, async ({ stream }) => {
      // decode input
      const inputIterator = transform(
        Infinity,
        async (data) =>
          await runtimeOptions.codec.decoder(data.subarray()) as Awaited<I>,
        stream.source,
      );
      // process func
      const outputIterator = transform(
        Infinity,
        (data) => runtimeOptions.codec.encoder(data),
        await func(inputIterator),
      );
      // return output
      stream.sink(outputIterator);
    });

  const serve = async <I extends T, O extends T>(
    name: string,
    func: Service<I, O>,
  ) =>
    await handleStream<I, O>(
      name,
      async (input) => {
        const outputChannel = new Channel<O>();
        const ctx = newCtx(outputChannel);
        const process = await func();

        // transform input
        consume(
          transform(
            Infinity,
            (data) => process(data, ctx),
            input,
          ),
        ).then(ctx.done);

        return outputChannel;
      },
    );

  const handle = async <I extends T, O extends T>(
    name: string,
    func: Func<I, O>,
  ) => await serve<I, O>(name, () => func);

  return { handle, serve };
};
