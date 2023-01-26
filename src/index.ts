import type { Libp2p } from "libp2p";
import { decode, encode } from "./utils";
import { consume, transform } from "streaming-iterables";
import { Ctx, Evt } from "evt";

type IteratorFunc<I, O> = (
  input: AsyncIterable<I> | Iterable<I>,
) => AsyncIterable<O> | Iterable<O>;

export type Func<I, O> = (
  input?: I,
) => Promise<O> | O;

export type EventFunc<I, O, C> = (
  { inputChannel, outputChannel }: {
    inputChannel: Evt<I>;
    outputChannel: Evt<O>;
  },
  ctx?: Ctx<C>,
) => Promise<void> | void;

export const serve = (node: Libp2p) => {
  const handleStream = async <I, O>(name: string, func: IteratorFunc<I, O>) =>
    await node.handle(name, ({ stream }) => {
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
    channel: async <I, O, C = void>(
      name: string,
      func: EventFunc<I, O, C>,
      ctx = Evt.newCtx<C>(),
    ) => {
      const inputChannel = Evt.create<I>().pipe(ctx);
      const outputChannel = Evt.create<O>().pipe(ctx);
      return await handleStream<I, O>(
        name,
        // transform input
        (input) => {
          // send input to inputChannel
          consume(
            transform(Infinity, (data) => inputChannel.post(data), input),
          );
          // process func
          func({ inputChannel, outputChannel }, ctx);
          // return outputChannel
          return outputChannel;
        },
      );
    },
  };
};

export * from "./fetch";
