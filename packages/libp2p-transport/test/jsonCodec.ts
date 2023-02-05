import { stringToUint8Array, uint8ArrayToString } from "binconv";
import { Codec } from "../src";
import { Json } from "./types";
import destr from "destr";

export const jsonCodec: Codec<Json> = {
  encoder: (data) => stringToUint8Array(JSON.stringify(data)),
  decoder: (data) => destr(uint8ArrayToString(data)),
};
