import { ZodType } from "zod";
import type {
  EndpointMeta,
  HandlerFunc,
  InferIOType,
  Json,
  ServiceFunc,
} from "./types";

export interface ProcedureReturn<I, O> {
  io: (
    { input, output }: { input?: ZodType<I>; output?: ZodType<O> },
  ) => ProcedureReturn<I, O>;
  info: (value: Json) => ProcedureReturn<I, O>;
  serve: (
    func: ServiceFunc<I, O>,
  ) => EndpointMeta<I, O>;
  handle: (
    func: HandlerFunc<I, O>,
  ) => EndpointMeta<I, O>;
}

// todo meta编写的辅助函数
export const n = <I, O>() => {
  const meta = {} as EndpointMeta<I, O>;

  const result = {
    io: ({ input, output }) => {
      if (output) meta.output = output;
      if (input) meta.input = input;
      return result as ProcedureReturn<
        InferIOType<typeof input, I>,
        InferIOType<typeof output, O>
      >;
    },
    info: (value: Json) => {
      meta.info = value;
      return result;
    },
    serve: (func: ServiceFunc<I, O>) => {
      meta.type = "service";
      meta.func = func;
      return meta;
    },
    handle: (func: HandlerFunc<I, O>) => {
      meta.type = "handler";
      meta.func = func;
      return meta;
    },
  };

  return result;
};

// export { meta, n };
// // Object.entries(value).map((i) => ({
// //     ...i[1],
// //     name: i[0],
// //   })) as EndpointMetaServer<I, O>[]
// const a = meta({
//   ssss: n().input(z.string()).handle(
//     async (_, send, done) => {
//       await send("func undefined");
//       await done();
//     },
//   ),
// });

// export const n = <I = any, O = any>(
//   meta?: EndpointMeta<I, O>,
// ): ProcedureReturn<I, O> => {
//   if (meta === undefined) meta = {} as EndpointMeta<I, O>;

//   // type a =
//   return {
//     input: <Input extends I>(value: ZodType<Input>) => {
//       meta!.input = value;
//       return n<z.infer<typeof value>, O>(meta as EndpointMeta<Input, O>);
//     },
//     output: <Output extends O>(value: ZodType<Output>) => {
//       meta!.output = value;
//       return n<I, z.infer<typeof value>>(meta as EndpointMeta<I, Output>);
//     },
//     info: (value: Json) => {
//       meta!.info = value;
//       return n(meta);
//     },
//     serve: (func: ServiceFunc<I, O>) => {
//       meta!.type = "service";
//       meta!.func = func;
//       return meta!;
//     },
//     handle: (func: HandlerFunc<I, O>) => {
//       meta!.type = "handler";
//       meta!.func = func;
//       return meta!;
//     },
//   };
// };
