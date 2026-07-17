import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Pinned so the OAuth/magic-link redirect URL registered in Supabase
  // stays valid — otherwise Vite falls back to a different port whenever
  // something else on the machine is already using 5173.
  server: {
    port: 5183,
    strictPort: true,
  },
});
