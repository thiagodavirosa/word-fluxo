import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Editor empacotado dentro da extensão do SEI (caminhos relativos, sem Office.js).
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "../extensao-sei/editor",
    emptyOutDir: true,
    rollupOptions: { input: { "sei-editor": "sei-editor.html" } },
  },
});
