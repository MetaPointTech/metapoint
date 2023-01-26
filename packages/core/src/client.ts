import { Stream } from "@libp2p/interface-connection";
import { decode, encode } from "./utils";
import { consume, transform } from "streaming-iterables";
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

const open = <I, O, C = void>(
  stream: Stream,
  ctx = Evt.newCtx<C>(),
) => {
  const inputChannel: Evt<I> = Evt.create<I>();
  const outputChannel: Evt<O> = Evt.create<O>();
  const outputIterator = fetchStream<I, O>(stream, inputChannel.iter(ctx));

  consume(transform(
    Infinity,
    (data) => outputChannel.post(data),
    outputIterator,
  ));

  outputChannel[Symbol.asyncIterator] = () =>
    outputChannel.iter(ctx)[Symbol.asyncIterator]();

  return {
    inputChannel,
    outputChannel,
    ctx,
  };
};

const fetch = async <I, O>(stream: Stream, input: I): Promise<O> =>
  await (await fetchStream<I, O>(stream, [input]).next()).value;

export { fetch, open };
