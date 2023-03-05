import { h, peer, z } from "metapoint";
import type { Meta } from "./server";
import addr from "./server";
const node = await peer();
const channel = await node.connect<Meta>(addr);
const plus = await channel("plus");
console.log(await plus(1)); // [2]
