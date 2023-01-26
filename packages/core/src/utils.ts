import { decode as uint8Decode, encode as encode2Uint8 } from "@xobj/core";

export const decode = <T>(array: Uint8Array): T =>
  uint8Decode(
    array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset),
  );
export const encode = <T>(data: T): Uint8Array =>
  new Uint8Array(encode2Uint8(data));
