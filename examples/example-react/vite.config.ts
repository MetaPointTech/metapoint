import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
// @ts-ignore
import addr from "../example-basic/server";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    addr,
  },
  plugins: [react()],
})
