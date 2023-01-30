import { Stream } from "@libp2p/interface-connection";
import { AnyIterable, transform } from "streaming-iterables";
import { defaultInitOptions } from "./common";
import type { Codec, InitOptions, TransportChannel } from "./types";
import { Channel } from "queueable";

const fetchStream = <T, I extends T, O extends T>(
  stream: Stream,
  input: AnyIterable<I>,
  codec: Codec<T>,
) => {
  const inputIterator = transform(
    Infinity,
    (data) => codec.encoder(data),
    input,
  );
  const outputIterator = transform(
    Infinity,
    async (data) => await codec.decoder(data.subarray()) as Awaited<O>,
    stream.source,
  );
  stream.sink(inputIterator);
  return outputIterator;
};

export const client = <I extends T, O extends T, T = any>(
  stream: Stream,
  options?: InitOptions<T>,
): TransportChannel<I, O> => {
  const runtimeOptions = {
    ...defaultInitOptions,
    ...options,
  };
  const inputChannel = new Channel<I>();
  const outputIterator = fetchStream<T, I, O>(
    stream,
    inputChannel,
    runtimeOptions.codec,
  );

  return {
    ...outputIterator,
    send: async (value: I) => {
      await inputChannel.push(value);
    },
  };
};
