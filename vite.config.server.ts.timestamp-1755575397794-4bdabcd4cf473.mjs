// vite.config.server.ts
import { defineConfig } from "file:///Users/cliftonc/work/drizzle-cube/node_modules/vite/dist/node/index.js";
import { resolve } from "path";
import dts from "file:///Users/cliftonc/work/drizzle-cube/node_modules/vite-plugin-dts/dist/index.mjs";
var __vite_injected_original_dirname = "/Users/cliftonc/work/drizzle-cube";
var vite_config_server_default = defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
      include: ["src/server/**/*.ts"],
      tsconfigPath: "./tsconfig.server.json"
    })
  ],
  build: {
    lib: {
      entry: resolve(__vite_injected_original_dirname, "src/server/index.ts"),
      name: "DrizzleCubeServer",
      formats: ["es"],
      fileName: "index"
    },
    outDir: "dist/server",
    rollupOptions: {
      external: ["drizzle-orm", "yaml", "fs"],
      output: {
        globals: {
          "drizzle-orm": "DrizzleORM"
        }
      }
    }
  }
});
export {
  vite_config_server_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuc2VydmVyLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2NsaWZ0b25jL3dvcmsvZHJpenpsZS1jdWJlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvY2xpZnRvbmMvd29yay9kcml6emxlLWN1YmUvdml0ZS5jb25maWcuc2VydmVyLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9jbGlmdG9uYy93b3JrL2RyaXp6bGUtY3ViZS92aXRlLmNvbmZpZy5zZXJ2ZXIudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnXG5pbXBvcnQgZHRzIGZyb20gJ3ZpdGUtcGx1Z2luLWR0cydcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIGR0cyh7XG4gICAgICBpbnNlcnRUeXBlc0VudHJ5OiB0cnVlLFxuICAgICAgcm9sbHVwVHlwZXM6IHRydWUsXG4gICAgICBpbmNsdWRlOiBbJ3NyYy9zZXJ2ZXIvKiovKi50cyddLFxuICAgICAgdHNjb25maWdQYXRoOiAnLi90c2NvbmZpZy5zZXJ2ZXIuanNvbidcbiAgICB9KVxuICBdLFxuICBidWlsZDoge1xuICAgIGxpYjoge1xuICAgICAgZW50cnk6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjL3NlcnZlci9pbmRleC50cycpLFxuICAgICAgbmFtZTogJ0RyaXp6bGVDdWJlU2VydmVyJyxcbiAgICAgIGZvcm1hdHM6IFsnZXMnXSxcbiAgICAgIGZpbGVOYW1lOiAnaW5kZXgnXG4gICAgfSxcbiAgICBvdXREaXI6ICdkaXN0L3NlcnZlcicsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgZXh0ZXJuYWw6IFsnZHJpenpsZS1vcm0nLCAneWFtbCcsICdmcyddLFxuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIGdsb2JhbHM6IHtcbiAgICAgICAgICAnZHJpenpsZS1vcm0nOiAnRHJpenpsZU9STSdcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufSkiXSwKICAibWFwcGluZ3MiOiAiO0FBQW1TLFNBQVMsb0JBQW9CO0FBQ2hVLFNBQVMsZUFBZTtBQUN4QixPQUFPLFNBQVM7QUFGaEIsSUFBTSxtQ0FBbUM7QUFJekMsSUFBTyw2QkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsSUFBSTtBQUFBLE1BQ0Ysa0JBQWtCO0FBQUEsTUFDbEIsYUFBYTtBQUFBLE1BQ2IsU0FBUyxDQUFDLG9CQUFvQjtBQUFBLE1BQzlCLGNBQWM7QUFBQSxJQUNoQixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsS0FBSztBQUFBLE1BQ0gsT0FBTyxRQUFRLGtDQUFXLHFCQUFxQjtBQUFBLE1BQy9DLE1BQU07QUFBQSxNQUNOLFNBQVMsQ0FBQyxJQUFJO0FBQUEsTUFDZCxVQUFVO0FBQUEsSUFDWjtBQUFBLElBQ0EsUUFBUTtBQUFBLElBQ1IsZUFBZTtBQUFBLE1BQ2IsVUFBVSxDQUFDLGVBQWUsUUFBUSxJQUFJO0FBQUEsTUFDdEMsUUFBUTtBQUFBLFFBQ04sU0FBUztBQUFBLFVBQ1AsZUFBZTtBQUFBLFFBQ2pCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
