import { stringToUint8Array, uint8ArrayToString } from "binconv";
import { Codec } from "../src";
import { Json } from "./types";

export const jsonCodec: Codec<Json> = {
  encoder: (data) => stringToUint8Array(JSON.stringify(data)),
  decoder: (data) => JSON.parse(uint8ArrayToString(data)),
};
