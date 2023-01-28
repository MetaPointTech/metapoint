import { Stream } from "@libp2p/interface-connection";
import { consume, transform } from "streaming-iterables";
import { Evt } from "evt";
import { defaultOptions } from "./common";
import type { Codec, InitOptions, OpenInitOptions } from "./types";

const fetchStream = <T, I extends T, O extends T>(
  stream: Stream,
  input: AsyncIterable<I> | Iterable<I>,
  codec: Codec<T>,
) => {
  const inputIterator = transform(
    Infinity,
    (data) => codec.encoder(data),
    input,
  );
  const outputIterator = transform(
    Infinity,
    (data) => codec.decoder(data.subarray()),
    stream.source,
  ) as AsyncIterableIterator<O>;
  // todo 校验 T 能断言为 O

  stream.sink(inputIterator);
  return outputIterator;
};

const open = <I extends T, O extends T, T = any, C = void>(
  stream: Stream,
  options?: OpenInitOptions<C, T>,
) => {
  const runtimeOptions = {
    ...defaultOptions,
    ctx: Evt.newCtx<C>(),
    ...options,
  } as Required<OpenInitOptions<C, T>>;

  const inputChannel: Evt<I> = Evt.create<I>();
  const outputChannel: Evt<O> = Evt.create<O>();
  const outputIterator = fetchStream<T, I, O>(
    stream,
    inputChannel.iter(runtimeOptions.ctx),
    runtimeOptions.codec,
  );

  consume(transform(
    Infinity,
    (data) => outputChannel.post(data),
    outputIterator,
  ));

  outputChannel[Symbol.asyncIterator] = () =>
    outputChannel.iter(runtimeOptions.ctx)[Symbol.asyncIterator]();

  return {
    inputChannel,
    outputChannel,
  };
};

const fetch = async <I extends T, O extends T, T = any>(
  stream: Stream,
  input: I,
  options?: InitOptions<T>,
): Promise<O> => {
  const runtimeOptions = {
    ...defaultOptions,
    ...options,
  } as Required<InitOptions<T>>;

  return (await fetchStream<T, I, O>(stream, [input], runtimeOptions.codec)
    .next())
    .value;
};

export { fetch, open };