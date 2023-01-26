import type { Libp2p } from "libp2p";
import { decode, encode } from "./utils";
import { consume, transform } from "streaming-iterables";
import { Evt } from "evt";

type IteratorFunc<I, O> = (
  input: AsyncIterable<I> | Iterable<I>,
) => AsyncIterable<O> | Iterable<O>;

type Func<I, O> = (
  input?: I,
) => Promise<O> | O;

type EventFunc<I, O, C> = (
  { inputChannel, outputChannel }: {
    inputChannel: Evt<I>;
    outputChannel: Evt<O>;
  },
) => Promise<void> | void;

const handleStream =
  (node: Libp2p) => async <I, O>(name: string, func: IteratorFunc<I, O>) =>
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

const serve = (node: Libp2p) => {
  const handle = async <I, O>(name: string, func: Func<I, O>) =>
    await handleStream(node)<I, O>(
      name,
      // transform input
      (input) => transform(Infinity, (data) => func(data), input),
    );

  const channel = async <I, O, C = void>(
    name: string,
    func: EventFunc<I, O, C>,
  ) => {
    const inputChannel = Evt.create<I>();
    const outputChannel = Evt.create<O>();
    return await handleStream(node)<I, O>(
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
  };

  return { handle, channel };
};

export type { EventFunc, Func };
export { serve };
