import type { Libp2p } from "libp2p";
import type {
  Codec,
  EventFunc,
  Func,
  InitOptions,
  IteratorFunc,
} from "./types";
import { consume, transform } from "streaming-iterables";
import { Evt } from "evt";
import { defaultInitOptions } from "./common";

export const serve = <T>(node: Libp2p, options?: InitOptions<T>) => {
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
        async (data) => {
          let result = await codec.decoder(data.subarray()) as Awaited<I>;
          if (codec.parser) {
            result = await codec.parser(result);
          }
          return result;
        },
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
      // transform input
      (input) => transform(Infinity, (data) => func(data), input),
      runtimeOptions.codec,
    );

  const channel = async <I extends T, O extends T>(
    name: string,
    func: EventFunc<I, O>,
  ) => {
    const inputChannel = Evt.create<I>();
    const outputChannel = Evt.create<O>();
    return await handleStream<T, I, O>(
      name,
      // transform input
      (input) => {
        // send input to inputChannel
        consume(
          transform(Infinity, (data) => inputChannel.post(data), input),
        );
        // process func
        func({ inputChannel, outputChannel });
        // return outputChannel
        return outputChannel;
      },
      runtimeOptions.codec,
    );
  };

  return { handle, channel };
};
