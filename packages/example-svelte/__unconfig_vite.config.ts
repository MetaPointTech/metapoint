
let __unconfig_data;
let __unconfig_stub = function (data = {}) { __unconfig_data = data };
__unconfig_stub.default = (data = {}) => { __unconfig_data = data };
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
// @ts-ignore
import addr from "../example/server";

// https://vitejs.dev/config/
const __unconfig_default =  defineConfig({
  define: {
    addr,
  },
  plugins: [svelte()],
});

if (typeof __unconfig_default === "function") __unconfig_default(...[{"command":"serve","mode":"development"}]);export default __unconfig_data;