import type { Libp2p } from "libp2p";
import type { Func, InitOptions, IterableFunc, Service } from "./types";
import { consume, transform } from "streaming-iterables";
import { defaultInitOptions } from "./common";
import { Channel } from "queueable";
import { newChan } from "./utils";

export const server = async <T>(node: Libp2p, options?: InitOptions<T>) => {
  const runtimeOptions = {
    ...defaultInitOptions,
    ...options,
  };

  const handleStream = async <I extends T, O extends T>(
    name: string,
    func: IterableFunc<I, O>,
  ) =>
    await node.handle(name, async (incomingData) => {
      // decode input
      const inputIterator = transform(
        Infinity,
        async (data) =>
          await runtimeOptions.codec.decoder(data.subarray()) as Awaited<I>,
        incomingData.stream.source,
      );
      // process func
      const outputIterator = transform(
        Infinity,
        (data) => runtimeOptions.codec.encoder(data),
        await func(inputIterator, incomingData),
      );
      // return output
      incomingData.stream.sink(outputIterator);
    });

  const serve = async <I extends T, O extends T>(
    name: string,
    func: Service<I, O>,
  ) =>
    await handleStream<I, O>(
      name,
      async (input, incomingData) => {
        const outputChannel = new Channel<O>();
        const chan = newChan(outputChannel);
        const process = await func();

        // transform input
        consume(
          transform(
            Infinity,
            async (data) => {
              try {
                await process(data, chan);
              } catch (error) {
                // todo 错误控制 pass error to client
                console.log(error);
                await chan.done();
              }
            },
            input,
          ),
        ).then(chan.done);

        return outputChannel;
      },
    );

  const handle = async <I extends T, O extends T>(
    name: string,
    func: Func<I, O>,
  ) => await serve<I, O>(name, () => func);

  // todo 错误控制 pass error to client
  const pname = "libp2p-transport/error";
  if (!node.getProtocols().some((p) => p === pname)) {
    await serve(pname, () => (_, chan) => {});
  }

  return { handle, serve };
};
