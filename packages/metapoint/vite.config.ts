import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        emptyOutDir: false,
        target: "esnext",
        lib: {
            entry: 'src/index.ts',
            formats: ["es"],
        },
    }
})