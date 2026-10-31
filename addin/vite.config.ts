import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Certificados gerados por `npm run certs` (office-addin-dev-certs).
const certDir = path.join(os.homedir(), ".office-addin-dev-certs");
const key = path.join(certDir, "localhost.key");
const cert = path.join(certDir, "localhost.crt");
// SEM_HTTPS=1 serve em http, só para pré-visualizar o editor num navegador comum (fora do Word).
const https =
  !process.env.SEM_HTTPS && fs.existsSync(key) && fs.existsSync(cert)
    ? { key: fs.readFileSync(key), cert: fs.readFileSync(cert) }
    : undefined;

// BASE_PATH: subpasta de publicação (ex.: /word-fluxo/ no GitHub Pages); local fica na raiz.
export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [react()],
  server: { host: true, port: Number(process.env.PORT ?? 3100), strictPort: true, https },
  build: {
    rollupOptions: { input: { taskpane: "taskpane.html", editor: "editor.html" } },
  },
});
