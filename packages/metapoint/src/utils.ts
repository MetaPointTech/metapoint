import type { z } from "zod";

// export const channelValidate = <T, C>(
//   meta: z.ZodType<T> | undefined,
//   channel: Evt<T>,
//   ctx?: Ctx<C>,
// ) => {
//   if (meta !== undefined) {
//     const validator = (data: T) => {
//       const parsedValue = (meta as Exclude<typeof meta, undefined>)
//         .safeParse(data);
//       if (parsedValue.success === false) {
//       }
//       return parsedValue.success;
//     };

//     if (ctx) {
//       channel = channel.pipe(ctx, validator);
//     } else {
//       channel = channel.pipe(validator);
//     }
//   }

//   return channel;
// };
