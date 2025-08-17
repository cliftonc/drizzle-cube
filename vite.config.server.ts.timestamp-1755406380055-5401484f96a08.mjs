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
      exclude: ["src/server/yaml-loader.ts", "src/server/yaml-types.ts", "src/server/join-resolver.ts"],
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuc2VydmVyLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2NsaWZ0b25jL3dvcmsvZHJpenpsZS1jdWJlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvY2xpZnRvbmMvd29yay9kcml6emxlLWN1YmUvdml0ZS5jb25maWcuc2VydmVyLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9jbGlmdG9uYy93b3JrL2RyaXp6bGUtY3ViZS92aXRlLmNvbmZpZy5zZXJ2ZXIudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnXG5pbXBvcnQgZHRzIGZyb20gJ3ZpdGUtcGx1Z2luLWR0cydcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIGR0cyh7XG4gICAgICBpbnNlcnRUeXBlc0VudHJ5OiB0cnVlLFxuICAgICAgcm9sbHVwVHlwZXM6IHRydWUsXG4gICAgICBpbmNsdWRlOiBbJ3NyYy9zZXJ2ZXIvKiovKi50cyddLFxuICAgICAgZXhjbHVkZTogWydzcmMvc2VydmVyL3lhbWwtbG9hZGVyLnRzJywgJ3NyYy9zZXJ2ZXIveWFtbC10eXBlcy50cycsICdzcmMvc2VydmVyL2pvaW4tcmVzb2x2ZXIudHMnXSxcbiAgICAgIHRzY29uZmlnUGF0aDogJy4vdHNjb25maWcuc2VydmVyLmpzb24nXG4gICAgfSlcbiAgXSxcbiAgYnVpbGQ6IHtcbiAgICBsaWI6IHtcbiAgICAgIGVudHJ5OiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9zZXJ2ZXIvaW5kZXgudHMnKSxcbiAgICAgIG5hbWU6ICdEcml6emxlQ3ViZVNlcnZlcicsXG4gICAgICBmb3JtYXRzOiBbJ2VzJ10sXG4gICAgICBmaWxlTmFtZTogJ2luZGV4J1xuICAgIH0sXG4gICAgb3V0RGlyOiAnZGlzdC9zZXJ2ZXInLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGV4dGVybmFsOiBbJ2RyaXp6bGUtb3JtJywgJ3lhbWwnLCAnZnMnXSxcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBnbG9iYWxzOiB7XG4gICAgICAgICAgJ2RyaXp6bGUtb3JtJzogJ0RyaXp6bGVPUk0nXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn0pIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFtUyxTQUFTLG9CQUFvQjtBQUNoVSxTQUFTLGVBQWU7QUFDeEIsT0FBTyxTQUFTO0FBRmhCLElBQU0sbUNBQW1DO0FBSXpDLElBQU8sNkJBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLElBQUk7QUFBQSxNQUNGLGtCQUFrQjtBQUFBLE1BQ2xCLGFBQWE7QUFBQSxNQUNiLFNBQVMsQ0FBQyxvQkFBb0I7QUFBQSxNQUM5QixTQUFTLENBQUMsNkJBQTZCLDRCQUE0Qiw2QkFBNkI7QUFBQSxNQUNoRyxjQUFjO0FBQUEsSUFDaEIsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLEtBQUs7QUFBQSxNQUNILE9BQU8sUUFBUSxrQ0FBVyxxQkFBcUI7QUFBQSxNQUMvQyxNQUFNO0FBQUEsTUFDTixTQUFTLENBQUMsSUFBSTtBQUFBLE1BQ2QsVUFBVTtBQUFBLElBQ1o7QUFBQSxJQUNBLFFBQVE7QUFBQSxJQUNSLGVBQWU7QUFBQSxNQUNiLFVBQVUsQ0FBQyxlQUFlLFFBQVEsSUFBSTtBQUFBLE1BQ3RDLFFBQVE7QUFBQSxRQUNOLFNBQVM7QUFBQSxVQUNQLGVBQWU7QUFBQSxRQUNqQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
