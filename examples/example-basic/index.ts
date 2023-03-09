import { peer } from "metapoint";
import type { Meta } from "./server";
import addr from "./server";
const node = await peer();
const channel = await node.connect<Meta>(addr);
const add = await channel("add");
console.log(await add(1)); // [2]
