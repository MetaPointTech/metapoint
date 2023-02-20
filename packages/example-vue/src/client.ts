import { peer } from "metapoint";
import type { meta } from "../server";

const client = await peer();

export const newChan = async (...addrs: string[]) =>
  await client.connect<meta>(addrs);
