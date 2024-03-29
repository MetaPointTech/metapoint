import type { Libp2p } from "libp2p";
import type {
  Chan,
  Codec,
  ControlMsg,
  Func,
  IterableFunc,
  ServerInitOptions,
  Service,
  StreamID,
} from "./types";
import { consume, transform } from "streaming-iterables";
import { control_name, defaultInitOptions } from "./common";
import { Channel } from "queueable";
import { makeNext, newChannel } from "./utils";
import { runtimeError } from "./error";
import { defaultCodec } from "./codec";
import { logger } from "./logger";

const ccs = new Map<string, Channel<ControlMsg>>();

export const server = async (node: Libp2p) => {
  const makeHandleStream =
    <HT>(codec: Codec<HT>) =>
    async <I extends HT, O extends HT>(
      name: string,
      func: IterableFunc<I, O>,
    ) =>
      await node.handle(name, async (incomingData) => {
        // decode input
        const inputIterator = transform(
          Infinity,
          async (data) => await codec.decoder(data.subarray()) as Awaited<I>,
          incomingData.stream.source,
        );
        // process func
        const outputIterator = transform(
          Infinity,
          (data) => codec.encoder(data),
          await func(inputIterator, incomingData),
        );
        // return output
        incomingData.stream.sink(outputIterator);
      });

  const serve = async <
    I extends T,
    O extends T,
    T = any,
    Context extends {} = {},
  >(
    name: string,
    func: Service<I, O, Context>,
    options?: ServerInitOptions<I, O, T, Context>,
  ) => {
    const runtimeOptions = {
      ...defaultInitOptions,
      ...options,
    };
    await makeHandleStream(runtimeOptions.codec)<I, O>(
      name,
      async (input, incomingData) => {
        const outputChannel = new Channel<O>();
        let chan!: Chan<O, Context>;

        // first msg is id, use id to make chan
        for await (const id of input) {
          const sid: StreamID = JSON.parse(id as string);
          // sync the id
          incomingData.connection.id = sid.connection;
          incomingData.stream.id = sid.stream;
          const cc = ccs.get(sid.connection);
          if (cc === undefined && name !== control_name) {
            throw runtimeError("ChannelNotFound", "Control channel not found");
          }
          chan = newChannel<O, Context>(
            outputChannel,
            incomingData,
            cc,
            runtimeOptions.context,
          );
          logger.trace(`New connection with ${id}`);
          break;
        }

        try {
          const process: Func<I, O, Context> =
            (await func(chan) ?? (() => {})) as Func<I, O, Context>;
          // transform input
          consume(
            transform(
              Infinity,
              async (data) => {
                logger.trace(`Incoming data: ${JSON.stringify(data)}`);
                try {
                  if (runtimeOptions.middleware) {
                    await runtimeOptions.middleware({
                      data,
                      ...chan,
                      next: makeNext({ data, ...chan, next: process }),
                    });
                  } else {
                    await process({ data, ...chan });
                  }
                } catch (error) {
                  await chan.done(error);
                }
              },
              input,
            ),
          ).then(() => chan?.done());
        } catch (error) {
          await chan?.done(error);
        }
        return outputChannel;
      },
    );
  };

  const handle = async <
    I extends T,
    O extends T,
    T = any,
    Context extends {} = {},
  >(
    name: string,
    func: Func<I, O, Context>,
    options?: ServerInitOptions<I, O, T, Context>,
  ) => await serve<I, O, T, Context>(name, () => func, options);

  // collect status and send them to client
  if (!node.getProtocols().some((p) => p === control_name)) {
    await serve(control_name, (chan) => {
      const id = chan.id.connection;
      const cc = new Channel<ControlMsg>();
      ccs.set(id, cc);
      consume(
        transform(Infinity, async (i) => {
          try {
            await chan.send(JSON.stringify(i));
          } catch (error) {
            if (error === "channel has already closed") {
              // connection has already been closed forcely
              await cc.return();
              ccs.delete(id);
            } else throw error;
          }
        }, cc),
      );
    }, {
      codec: defaultCodec,
    });
  }

  return { handle, serve };
};
