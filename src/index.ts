import type { Libp2p } from "libp2p";
import { decode, encode } from "./utils";
import { consume, transform } from "streaming-iterables";
// todo Ctx
import { Evt } from "evt";

type IteratorFunc<I, O> = (
  input: AsyncIterable<I> | Iterable<I>,
) => AsyncIterable<O> | Iterable<O>;

export type Func<I, O> = (
  input?: I,
) => Promise<O> | O;

export type EventFunc<I, O> = (
  { inputChannel, outputChannel }: {
    inputChannel: Evt<I>;
    outputChannel: Evt<O>;
  },
) => Promise<void> | void;

export const serve = (node: Libp2p) => {
  const handleStream = async <I, O>(name: string, func: IteratorFunc<I, O>) =>
    await node.handle(name, ({ stream, connection }) => {
      // decode input
      const inputIterator = transform(
        Infinity,
        (data) => decode<I>(data.subarray()),
        stream.source,
      );
      // process func
      const outputIterator = transform(
        Infinity,
        (data) => encode(data),
        func(inputIterator),
      );
      // return output
      stream.sink(outputIterator);
    });

  return {
    handle: async <I, O>(name: string, func: Func<I, O>) =>
      await handleStream<I, O>(
        name,
        // transform input
        (input) => transform(Infinity, (data) => func(data), input),
      ),
    channel: async <I, O>(name: string, func: EventFunc<I, O>) => {
      const inputChannel = Evt.create<I>();
      const outputChannel = Evt.create<O>();
      return await handleStream<I, O>(
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
      );
    },
  };
};

export { fetch } from "./fetch";
