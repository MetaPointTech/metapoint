import type { Stream } from "@libp2p/interface-connection";
import { decode, encode } from "./utils";
import { consume, transform } from "streaming-iterables";
// todo Ctx
import { Evt } from "evt";

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

export { fetch };
