import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Certificados gerados por `npm run certs` (office-addin-dev-certs).
const certDir = path.join(os.homedir(), ".office-addin-dev-certs");
const key = path.join(certDir, "localhost.key");
const cert = path.join(certDir, "localhost.crt");
const https =
  fs.existsSync(key) && fs.existsSync(cert)
    ? { key: fs.readFileSync(key), cert: fs.readFileSync(cert) }
    : undefined;

export default defineConfig({
  plugins: [react()],
  server: { port: 3000, strictPort: true, https },
  build: {
    rollupOptions: { input: { taskpane: "taskpane.html" } },
  },
});
