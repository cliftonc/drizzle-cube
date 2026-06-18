# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

This is a **multi-context** repo: a `CONTEXT-MAP.md` at the root points to one `CONTEXT.md` per area, mirroring the per-area `CLAUDE.md` files.

## Before exploring, read these

- **`CONTEXT-MAP.md`** at the repo root — the index of per-area glossaries. Read the `CONTEXT.md` for the area(s) your task touches:
  - `src/server/CONTEXT.md` — semantic layer / query pipeline (the foundational vocabulary)
  - `src/client/CONTEXT.md` — dashboard / chart / analysis builder
  - `src/adapters/CONTEXT.md` — HTTP + MCP transport (handler protocol, HttpPort, etc.)
- **`docs/adr/`** — system-wide architecture decisions. Also check **`src/<area>/docs/adr/`** for area-specific decisions in the area you're working in.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved. The server and client glossaries are created lazily; the adapters glossary already exists.

## File structure

```
/
├── CONTEXT-MAP.md                     ← index of per-area glossaries
├── docs/adr/                          ← system-wide decisions (created lazily)
└── src/
    ├── server/
    │   ├── CONTEXT.md                  ← (created lazily)
    │   ├── CLAUDE.md
    │   └── docs/adr/                   ← area-specific decisions (created lazily)
    ├── client/
    │   ├── CONTEXT.md                  ← (created lazily)
    │   └── CLAUDE.md
    └── adapters/
        ├── CONTEXT.md                  ← seeded
        └── CLAUDE.md
```

Note: the per-area `CLAUDE.md` files are implementation/convention guides, not glossaries — the area's `CONTEXT.md` is the source of domain vocabulary.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in the relevant area's `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 — but worth reopening because…_
