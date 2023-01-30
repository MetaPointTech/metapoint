import type { Libp2p } from "libp2p";
import type { Codec, Func, InitOptions, IteratorFunc } from "./types";
import { consume, transform } from "streaming-iterables";
import { defaultInitOptions } from "./common";
import { Channel } from "queueable";

export const server = <T>(node: Libp2p, options?: InitOptions<T>) => {
  const runtimeOptions = {
    ...defaultInitOptions,
    ...options,
  };

  const handleStream = async <T, I extends T, O extends T>(
    name: string,
    func: IteratorFunc<I, O>,
    codec: Codec<T>,
  ) =>
    await node.handle(name, ({ stream }) => {
      // decode input
      const inputIterator = transform(
        Infinity,
        async (data) => await codec.decoder(data.subarray()) as Awaited<I>,
        stream.source,
      );
      // process func
      const outputIterator = transform(
        Infinity,
        (data) => codec.encoder(data),
        func(inputIterator),
      );
      // return output
      stream.sink(outputIterator);
    });

  const handle = async <I extends T, O extends T>(
    name: string,
    func: Func<I, O>,
  ) =>
    await handleStream<T, I, O>(
      name,
      (input) => {
        const outputChannel = new Channel<O>();
        const send = async (value: O) => {
          await outputChannel.push(value);
        };
        // transform input
        consume(transform(Infinity, async (data) =>
          await outputChannel.push(await func(data, send)), input));

        return outputChannel;
      },
      runtimeOptions.codec,
    );

  return handle;
};
