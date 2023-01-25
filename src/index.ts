import { Libp2p } from "libp2p";
import { decode, encode } from "./utils";
import { transform } from "streaming-iterables";
import { Stream } from "@libp2p/interface-connection";
import { Evt } from "evt";

export type IteratorFunc<I, O> = (
  input: AsyncIterable<I> | Iterable<I>,
) => AsyncIterable<O> | Iterable<O>;

export type Func<I, O> = (
  input?: I,
) => Promise<O> | O;

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

const channel = <I, O>(stream: Stream) => {
  const inputChannel = Evt.create<I>();
  const outputChannel = Evt.create<O>();
  const outputIterator = fetchStream<I, O>(stream, inputChannel);

  (async () => {
    for await (
      const _ of transform(
        Infinity,
        (data) => outputChannel.post(data),
        outputIterator,
      )
    ) {}
  })();

  return {
    inputChannel,
    outputChannel,
  };
};

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
    handleStream,
    fetchStream,
    handle: async <I, O>(name: string, func: Func<I, O>) =>
      await handleStream<I, O>(
        name,
        // transform input
        (input) => transform(Infinity, (data) => func(data), input),
      ),
    channel,
  };
};
