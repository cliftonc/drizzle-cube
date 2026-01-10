# Flow Query Builder: Lateral Join Performance Plan

## Goal
Replace the per-depth windowed scans in `FlowQueryBuilder` with index-backed lateral lookups on databases that support them, and explicitly reject flow queries on SQLite. This reduces repeated sorts and large scans for deep (before/after) flows.

## Dialect Support
- Postgres/MySQL/SingleStore: Drizzle exposes `crossJoinLateral` / `innerJoinLateral` / `leftJoinLateral`; use these to express ordered `LIMIT 1` seeks per step.
- SQLite: Drizzle’s SQLite builder has no lateral helpers; we will throw a clear error (`Flow queries are not supported on SQLite`) during validation/build.

## High-Level Approach
1) Keep the existing starting_entities CTE shape (filters + optional entityLimit).
2) For each before/after depth, replace the windowed ROW_NUMBER approach with a lateral subquery that orders by time and `LIMIT 1`, constrained by binding key and direction (before uses `< ref_time DESC`, after uses `> ref_time ASC`).
3) Build these per-depth CTEs only once per direction; reuse the existing nodes/links aggregation unchanged (it only depends on CTE outputs).
4) Gate the lateral implementation by adapter engine type; fallback/error on unsupported dialects.

## Drizzle Expression Shape (pg/mysql/singlestore)
- Pattern for a “before” step (`prevAlias` = `starting_entities` or previous before step):
  ```ts
  const ranked = context.db
    .select({
      binding_key: sql`${bindingKeyExpr}`.as('binding_key'),
      step_time: sql`${timeExpr}`.as('step_time'),
      event_type: sql`${eventExpr}`.as('event_type'),
      event_path: isSunburst
        ? sql`${eventExpr} || ${'→'} || ${sql.identifier(prevAlias)}.event_path`
        : sql`${eventExpr}`,
    })
    .from(cubeBase.from)
    .where(sql`${bindingKeyExpr} = ${sql.identifier(prevAlias)}.binding_key`)
    .where(sql`${timeExpr} < ${sql.identifier(prevAlias)}.${sql.identifier(prevTimeColumn)}`)
    .orderBy(sql`${timeExpr} DESC`)
    .limit(1)

  const cte = context.db.$with(alias).as(
    context.db
      .select({ binding_key: sql`binding_key`, step_time: sql`step_time`, event_type: sql`event_type`, event_path: sql`event_path` })
      .from(sql`${sql.identifier(prevAlias)}`)
      .crossJoinLateral(ranked.as('e'))
  )
  ```
- “After” step is the same but `>` and `ORDER BY ASC` and event_path concatenation flipped.

## Error Handling for SQLite
- In `FlowQueryBuilder.buildFlowQuery` (or earlier validation), check `context.dbAdapter.getEngineType()`. If `sqlite`, throw an error with the message above. This avoids generating unsupported SQL and signals the limitation clearly to clients.

## Implementation Steps
1) Add a helper to map adapter engine type to a `supportsLateral` flag.
2) In `buildFlowQuery`, branch: if lateral supported, use new lateral-based before/after builders; otherwise keep current windowed version (for compatibility) or throw for SQLite per above.
3) Implement lateral-based `buildBeforeCTEs`/`buildAfterCTEs` (new helpers) that emit one `LIMIT 1` seek per depth via `crossJoinLateral`.
4) Keep nodes/links aggregation intact; ensure aliases match existing contract so downstream transforms stay unchanged.
5) Add validation path: when engine is SQLite, fail with a descriptive error early (e.g., in executor when flow is detected).
6) Tests:
   - Postgres + MySQL flow queries still return data (reuse existing fixtures; add a small deterministic dataset with depth>1 to prove ordering).
   - SQLite flow query returns the “not supported” error.
   - Optional: unit test that lateral SQL generation contains `LATERAL` for pg/mysql engines.

## Rollout Notes
- No schema changes required. Recommend indexes on `(organisation_id, binding_key, timestamp)` with `INCLUDE(event_type)` to maximize the benefit of lateral seeks.
- Sunburst path concatenation logic is unchanged; ensure concatenation stays in the lateral subquery so paths accumulate correctly.
- Keep `entityLimit` behavior in `starting_entities` to cap work for large populations.
