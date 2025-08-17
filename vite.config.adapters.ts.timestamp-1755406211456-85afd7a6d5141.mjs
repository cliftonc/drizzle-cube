// vite.config.adapters.ts
import { defineConfig } from "file:///Users/cliftonc/work/drizzle-cube/node_modules/vite/dist/node/index.js";
import { resolve } from "path";
import dts from "file:///Users/cliftonc/work/drizzle-cube/node_modules/vite-plugin-dts/dist/index.mjs";
var __vite_injected_original_dirname = "/Users/cliftonc/work/drizzle-cube";
var vite_config_adapters_default = defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      include: ["src/adapters/**/*.ts"]
    })
  ],
  build: {
    lib: {
      entry: {
        "hono/index": resolve(__vite_injected_original_dirname, "src/adapters/hono/index.ts")
      },
      formats: ["es"]
    },
    outDir: "dist/adapters",
    rollupOptions: {
      external: ["hono"]
    }
  }
});
export {
  vite_config_adapters_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuYWRhcHRlcnMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvY2xpZnRvbmMvd29yay9kcml6emxlLWN1YmVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9jbGlmdG9uYy93b3JrL2RyaXp6bGUtY3ViZS92aXRlLmNvbmZpZy5hZGFwdGVycy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvY2xpZnRvbmMvd29yay9kcml6emxlLWN1YmUvdml0ZS5jb25maWcuYWRhcHRlcnMudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnXG5pbXBvcnQgZHRzIGZyb20gJ3ZpdGUtcGx1Z2luLWR0cydcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIGR0cyh7XG4gICAgICBpbnNlcnRUeXBlc0VudHJ5OiB0cnVlLFxuICAgICAgcm9sbHVwVHlwZXM6IHRydWUsXG4gICAgICBpbmNsdWRlOiBbJ3NyYy9hZGFwdGVycy8qKi8qLnRzJ11cbiAgICB9KVxuICBdLFxuICBidWlsZDoge1xuICAgIGxpYjoge1xuICAgICAgZW50cnk6IHtcbiAgICAgICAgJ2hvbm8vaW5kZXgnOiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9hZGFwdGVycy9ob25vL2luZGV4LnRzJylcbiAgICAgIH0sXG4gICAgICBmb3JtYXRzOiBbJ2VzJ11cbiAgICB9LFxuICAgIG91dERpcjogJ2Rpc3QvYWRhcHRlcnMnLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGV4dGVybmFsOiBbJ2hvbm8nXVxuICAgIH1cbiAgfVxufSkiXSwKICAibWFwcGluZ3MiOiAiO0FBQXVTLFNBQVMsb0JBQW9CO0FBQ3BVLFNBQVMsZUFBZTtBQUN4QixPQUFPLFNBQVM7QUFGaEIsSUFBTSxtQ0FBbUM7QUFJekMsSUFBTywrQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsSUFBSTtBQUFBLE1BQ0Ysa0JBQWtCO0FBQUEsTUFDbEIsYUFBYTtBQUFBLE1BQ2IsU0FBUyxDQUFDLHNCQUFzQjtBQUFBLElBQ2xDLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxLQUFLO0FBQUEsTUFDSCxPQUFPO0FBQUEsUUFDTCxjQUFjLFFBQVEsa0NBQVcsNEJBQTRCO0FBQUEsTUFDL0Q7QUFBQSxNQUNBLFNBQVMsQ0FBQyxJQUFJO0FBQUEsSUFDaEI7QUFBQSxJQUNBLFFBQVE7QUFBQSxJQUNSLGVBQWU7QUFBQSxNQUNiLFVBQVUsQ0FBQyxNQUFNO0FBQUEsSUFDbkI7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
