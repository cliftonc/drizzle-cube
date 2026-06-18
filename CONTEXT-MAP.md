# Context Map

drizzle-cube is a single package but a multi-area codebase. Domain vocabulary is split per area, mirroring the per-area `CLAUDE.md` files. When a skill needs the ubiquitous language for an area, read that area's `CONTEXT.md`.

| Area | Context glossary | Covers |
| ---- | ---------------- | ------ |
| Server / semantic layer | `src/server/CONTEXT.md` | cube, measure, dimension, semantic query, logical/physical plan, executor — the foundational vocabulary the other areas build on |
| Client / dashboard | `src/client/CONTEXT.md` | dashboard, portlet, chart registry, analysis builder, query mode |
| Adapters / transport | `src/adapters/CONTEXT.md` | handler protocol, HttpPort, CubeHttpHandler core, MCP transport, security context, locale propagation |

System-wide architectural decisions live in `docs/adr/` at the root; area-specific decisions live in `src/<area>/docs/adr/`.

Glossaries are created **lazily** by `/domain-modeling` as terms get resolved — a missing `CONTEXT.md` is normal. The server and client glossaries will be seeded when their terms next crystallize; the adapters glossary exists now (seeded from the issue-906 grilling).
