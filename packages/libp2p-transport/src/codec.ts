import { decode, encode } from "@xobj/core";
import { Codec } from "./types";

export const defaultCodec: Codec<any> = {
  decoder: (array) =>
    decode(
      array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset),
    ),
  encoder: (data) => new Uint8Array(encode(data)),
};
