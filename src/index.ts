import type { Libp2p } from "libp2p";
import type { Stream } from "@libp2p/interface-connection";
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

const fetchStream = <I, O>(
  stream: Stream,
  input: AsyncIterable<I> | Iterable<I>,
) => {
  const inputIterator = transform(
    Infinity,
    (data) => encode(data),
    input,
  );
  const outputIterator = transform(
    Infinity,
    (data) => decode<O>(data.subarray()),
    stream.source,
  );
  stream.sink(inputIterator);
  return outputIterator;
};

const fetchEvent = <I, O>(stream: Stream) => {
  const inputChannel: Evt<I> = stream.metadata.inputChannel ??
    (stream.metadata.inputChannel = Evt.create<I>());
  const outputChannel: Evt<O> = stream.metadata.outputChannel ??
    (stream.metadata.outputChannel = Evt.create<O>());
  const outputIterator = fetchStream<I, O>(stream, inputChannel);

  consume(transform(
    Infinity,
    (data) => outputChannel.post(data),
    outputIterator,
  ));

  return {
    inputChannel,
    outputChannel,
  };
};

function fetch<I, O>(stream: Stream): ReturnType<typeof fetchEvent<I, O>>;
function fetch<I, O>(stream: Stream, input: I, timeout?: number): Promise<O>;
function fetch<I, O>(stream: Stream, input?: I, timeout?: number) {
  if (input === undefined) {
    return fetchEvent<I, O>(stream);
  } else {
    const { inputChannel, outputChannel } = fetchEvent<I, O>(stream);
    inputChannel.post(input);
    return outputChannel.waitFor(timeout);
  }
}

export const newPRPC = (node: Libp2p) => {
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
    fetch,
  };
};
