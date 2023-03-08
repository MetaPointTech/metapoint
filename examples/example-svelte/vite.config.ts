import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
// @ts-ignore
import addr from "../example-basic/server";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    addr,
  },
  plugins: [svelte()],
});
