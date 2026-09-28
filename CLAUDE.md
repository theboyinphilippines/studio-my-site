# Sanity Studio Project — CLAUDE.md

## Project Overview
Sanity Studio for a B2B product showcase site.
Manages product content, multi-language fields, and inquiry submissions.
Frontend (Next.js) consumes this content via API. This repo only owns the
schema, Studio configuration, and content modeling.

## Tech Stack
- Sanity Studio (v3+)
- TypeScript
- pnpm (package manager)
- Vitest (unit tests for schema validation and GROQ logic)

## Directory Conventions
- `schemaTypes/` — all document and object schemas
- `schemaTypes/index.ts` — central schema registry (exports `schemaTypes` array)
- `lib/` — shared helpers (validation, GROQ query fragments)
- `structure/` — custom Studio desk structure (if needed)
- `sanity.config.ts` — Studio config (project root)
- `sanity.cli.ts` — CLI config (project root)

## Schema Conventions

### Naming
- `name` field: lowercase, no spaces (e.g., `product`, `inquiry`).
- `title` field: human-readable, title case (e.g., `Product`, `Inquiry`).
- Field names: camelCase, descriptive (e.g., `shortDescription`, not `desc`).
- Never use reserved Sanity names: `_id`, `_type`, `_rev`, `_createdAt`, `_updatedAt`.

### Structure
- Every document type MUST have a `preview` config for readable Studio lists.
- Every document type SHOULD have `orderings` for sorting in Studio.
- Reusable field groups (e.g., `seo`, `localizedString`) SHOULD be defined as
  object types and referenced, not duplicated inline.
- Use `fieldsets` to group related fields in the Studio editor.

### Validation
- Every required field MUST have `validation: (rule) => rule.required()`.
- Slugs MUST be unique within the same language, not globally.
- Email fields MUST validate format.
- Inquiry `status` MUST use a predefined list, never free text.

### Multi-language
- Use `@sanity/document-internationalization` for document-level translations.
- Each language version is a separate document with its own slug.
- Do NOT store multiple languages in a single field unless the field is
  explicitly a localized object type.
- Every translated document MUST have its own `seo` fields.

## GROQ Conventions
- All queries live in `lib/queries.ts` or alongside the schema they serve.
- Use `defineQuery` from `next-sanity` when queries are shared with the frontend.
- Name queries in SCREAMING_SNAKE_CASE (e.g., `PRODUCTS_QUERY`).
- Always project only the fields needed; never `*[_type == "product"]` without
  a projection.
- Use `coalesce()` for multi-language fallbacks where appropriate.
- Never expose write tokens or private data through public queries.

## Testing Conventions (TDD)

### Workflow (strict)
1. ALWAYS write a FAILING test BEFORE implementation.
2. Run the test and show the failing assertion.
3. Only then write minimal implementation to pass.
4. Run tests again. If green, stop unless refactor is needed.
5. After refactor, run tests again to confirm still green.

### What to Test
- Custom validation functions in `lib/` — pure logic, easy to test.
- GROQ query logic using `groq-js` with mock datasets.
- Schema helper functions (e.g., slug generation, language fallback).
- Edge cases: missing fields, empty arrays, invalid slugs, duplicate slugs
  within the same language.

### What NOT to Test
- Sanity Studio internals or third-party plugins.
- Visual layout of the Studio editor.
- Network calls to the Sanity API (mock these).

### Test Rules
- Use AAA pattern: Arrange-Act-Assert.
- Test names describe behavior, not implementation.
  - Good: `should_reject_slug_duplicate_within_same_language`
  - Bad: `test_slug_validator`
- Never connect to a real Sanity dataset in unit tests.

## Coding Conventions
- Use `defineType` and `defineField` helpers for all schemas.
- Prefer `defineArrayMember` for array members.
- Types: derive from schema definitions where possible; avoid `any`.
- Keep `schemaTypes/index.ts` as the single source of truth for registered types.
- Use `pnpm` for all package operations. Never use `npm` or `yarn`.
- Never commit `package-lock.json` or `yarn.lock`; only `pnpm-lock.yaml`.

## Commands
- `pnpm dev` — start Sanity Studio locally
- `pnpm build` — build Studio for deployment
- `pnpm deploy` — deploy Studio to Sanity hosting
- `pnpm test` — run Vitest
- `pnpm test:watch` — Vitest in watch mode
- `pnpm lint` — ESLint
- `pnpm typecheck` — tsc --noEmit
- `pnpm add <pkg>` — add dependency
- `pnpm add -D <pkg>` — add dev dependency

## When Working on a Schema Change
1. Clarify the content modeling goal (what editors need to input).
2. Write failing test(s) for any custom validation or GROQ logic.
3. Run test, confirm failure.
4. Implement minimal schema change.
5. Run test, confirm pass.
6. Run typecheck + lint.
7. If the frontend consumes this field, note the change for the Next.js repo.

## Never
- Write implementation before tests (for testable logic).
- Skip `preview` config on new document types.
- Use `any` without justification.
- Store secrets or tokens in schema files.
- Duplicate field definitions that should be shared object types.
- Use `npm` or `yarn` commands in this project.
- Change a field name without flagging it as a breaking change for the frontend.



# Cross-Project Collaboration — Sanity ↔ Next.js

## Repos

- **sanity-studio/** — owns schema, content modeling, GROQ queries (source of truth for data shape).
- **nextjs-app/** — owns rendering, SEO, forms, UI (consumer of Sanity data).

## Core Principle

Sanity defines the contract. Next.js depends on it.
A schema change is a **breaking change** until proven otherwise.
Never change a field name, type, or structure without flagging it.

## Who Owns What

| Concern                           | Owner                                |
| --------------------------------- | ------------------------------------ |
| Field names, types, validation    | Sanity                               |
| GROQ query shape                  | Sanity (defined), Next.js (consumed) |
| SEO metadata rendering            | Next.js                              |
| Multi-language document structure | Sanity                               |
| hreflang / canonical output       | Next.js                              |
| Inquiry form submission logic     | Next.js (writes to Sanity)           |
| Inquiry document schema           | Sanity                               |
| Product page layout               | Next.js                              |

## Change Workflow

### When changing a schema field (Sanity side)

1. Determine if the change is breaking:
   - Renaming a field → **breaking**
   - Changing a field type → **breaking**
   - Removing a field → **breaking**
   - Adding an optional field → **non-breaking**
   - Adding a required field → **breaking** (existing docs lack it)
2. If breaking, do NOT merge until the Next.js side is updated.
3. Communicate the change:
   - Field name (old → new)
   - Type (old → new)
   - Required or optional
   - Migration needed for existing documents?
4. Update GROQ queries in Sanity repo.
5. Notify Next.js repo owner (or create a task).

### When consuming a field (Next.js side)

1. Confirm the field exists in the Sanity schema.
2. Check if it's required or optional; handle missing data gracefully.
3. For multi-language fields, always define a fallback.
4. Write failing test for the new field's rendering BEFORE implementing.
5. Never assume field shape; derive types from the Sanity schema where possible.

## Shared Conventions

### Field Naming

- Both sides use the exact same field names in code.
- No aliasing in GROQ unless there's a documented reason.
- If a field is renamed, both repos update in the same release window.

### Multi-language

- Sanity stores each language as a separate document (via `@sanity/document-internationalization`).
- Next.js derives hreflang and canonical from the document's language metadata.
- Fallback order: current language → English → empty state (never crash).

### GROQ Queries

- Queries that both sides need live in Sanity repo under `lib/queries.ts`.
- Next.js imports or copies them; never writes its own divergent version.
- If Next.js needs a new projection, request it from Sanity side first.

### Inquiry Form

- Schema: Sanity owns `inquiry` document type.
- Submission: Next.js owns the API route / Server Action.
- Write token: stored only in Next.js server env, never in Sanity schema files.
- Sanity Studio shows inquiries via Structure Builder menu item.

## Sync Checklist (before merging a schema change)

- [ ] Breaking change identified and labeled.
- [ ] GROQ queries updated in Sanity repo.
- [ ] Next.js repo notified (task created or PR linked).
- [ ] Next.js types/queries updated to match.
- [ ] Tests pass on both sides.
- [ ] Fallback behavior verified for missing/optional fields.
- [ ] If field renamed: old field removed only after Next.js stops using it.

## Never

- Merge a breaking schema change without updating Next.js.
- Let Next.js define its own version of a GROQ query that diverges from Sanity's.
- Store Sanity write tokens in the Sanity repo.
- Assume a field is present; always handle `null` / `undefined`.
- Rename a field in Sanity without a migration plan for existing documents.

## Communication

- Breaking changes: open an issue in both repos and link them.
- Non-breaking additions: note in the Sanity PR description.
- If unsure whether a change is breaking: treat it as breaking.
