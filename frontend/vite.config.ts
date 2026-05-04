// ── frontend/vite.config.ts ───────────────────────────────────────────────────
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        // Forma de función — compatible con todas las versiones de Vite
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return;
          if (id.includes("framer-motion")) return "vendor-motion";
          if (id.includes("@paypal")) return "vendor-paypal";
          if (id.includes("@tanstack")) return "vendor-virtual";
          if (id.includes("zustand") || id.includes("supabase"))
            return "vendor-state";
          if (id.includes("react") || id.includes("react-router"))
            return "vendor-react";
        },
      },
    },
  },
});
