import type { Libp2p } from "libp2p";
import type {
  Chan,
  ControlMsg,
  Func,
  InitOptions,
  IterableFunc,
  Service,
} from "./types";
import { consume, transform } from "streaming-iterables";
import { control_name, defaultInitOptions } from "./common";
import { Channel } from "queueable";
import { newChannel } from "./utils";
import { logger, StreamID } from ".";
import { runtimeError } from "./error";

const ccs = new Map<string, Channel<ControlMsg>>();

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
        let chan: Chan<O> = undefined as unknown as Chan<O>;

        // first msg is id, use id to make chan
        for await (const id of input) {
          const sid = JSON.parse(id as string) as StreamID;
          const cc = ccs.get(sid.connection);
          if (cc === undefined && name !== control_name) {
            throw runtimeError("ChannelNotFound", "Control channel not found");
          }
          chan = newChannel(
            outputChannel,
            incomingData,
            cc,
            sid,
          );
          logger.trace(`New connection with ${id}`);
          break;
        }

        try {
          const process = await func(chan);
          // transform input
          consume(
            transform(
              Infinity,
              async (data) => {
                logger.trace(`Incoming data: ${JSON.stringify(data)}`);
                try {
                  if (process instanceof Function) await process(data, chan);
                } catch (error) {
                  await chan.done(error);
                }
              },
              input,
            ),
          ).then(() => chan.done());
        } catch (error) {
          await chan.done(error);
        }
        return outputChannel;
      },
    );

  const handle = async <I extends T, O extends T>(
    name: string,
    func: Func<I, O>,
  ) => await serve<I, O>(name, () => func);

  // collect status and send them to client
  if (!node.getProtocols().some((p) => p === control_name)) {
    await serve(control_name, (chan) => {
      const id = chan.ctx.id.connection;
      const cc = new Channel<ControlMsg>();
      ccs.set(id, cc);
      consume(
        transform(Infinity, (i) => chan.send(JSON.stringify(i) as T), cc),
      );
    });
  }

  node.addEventListener(
    "peer:disconnect",
    async ({ detail }) => {
      await ccs.get(detail.id)?.return();
      ccs.delete(detail.id);
    },
  );

  return { handle, serve };
};
