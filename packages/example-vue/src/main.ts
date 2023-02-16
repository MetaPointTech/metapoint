import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

import { h, peer, z } from "metapoint";
const node = await peer();

const meta = h.router({
  numberAdd: h.handler({
    func: async (data, { send, done }) => {
      await send(data + 1);
      await done();
    },
    input: z.number(),
    output: z.number(),
  }),
  stringAdd: h.handler({
    func: async (data, { send, done }) => {
      await send(data + "!");
      await done();
    },
    input: z.string(),
    output: z.string(),
  }),
  addChan: h.service({
    func: () => async (data, { send }) => {
      await send(data + 1);
    },
    input: z.number(),
    output: z.number(),
  }),
});

const channel = await node.connect<typeof meta>(
  "/ip4/127.0.0.1/tcp/54089/ws/p2p/12D3KooWBYdmDHdZnLx7DqEuPTH1RCm3VPKjHNjJzxRdgNHWFmWE",
);
const add = await channel("numberAdd");

console.log(await add(1));
// console.log(await add(1));
// console.log(await add(1));

createApp(App).mount("#app");
