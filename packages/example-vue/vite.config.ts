import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// @ts-ignore
import addr from "../example/server";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    addr,
  },
  plugins: [vue()],
})
