# sushi-deck-client

> Repo renamed `sushi-deck-app → sushi-deck-client` (naming sync, 2026-07-11)
> to match its Vercel project. The compatibility backend extraction has since
> landed in `binarylawyer/sushi-deck-backend`; the Sushii product consolidation
> target is now `binarylawyer/sushii-deck`.

This repository remains the free-standing **Sushi Deck** client/product source during consolidation. Its UI and deployment behavior are evidence-bearing until parity is explicitly proven in `sushii-deck`. The extracted compatibility backend is `sushi-deck-backend`; this client should no longer be treated as the canonical future backend location.

ARCH-10 / SUSHII-DL is **CLOSED at 52/52** in `binarylawyer/sushii-world`. The accepted first-party runtime subject was `binarylawyer/sushii-deck` at `a3eb05f682996bf135fe40b431ef793d3212648a`, not this repository. See [`docs/SUSHII-DL-COMPATIBILITY-STATUS-2026-09-17.md`](docs/SUSHII-DL-COMPATIBILITY-STATUS-2026-09-17.md).

The app consumes the portable
[`@binarylawyer/sushi-deck-kit`](https://github.com/binarylawyer/sushi-deck-kit)
kit — the deck logic lives in the kit and is unit-tested there.

Under the decided **Option A** architecture the app's pages/actions no longer touch Supabase or the LLM directly; they call the Deck API through `src/lib/deck-client.ts`. Configure `SUSHI_DECK_API_URL` + `SUSHI_DECK_API_KEY` for the app's API consumption — see `.env.example`.

```
                     ┌────────────── sushi-deck-client (this repo) ──────────────┐
                     │  front-end: gallery · /present · /scroll · Print→PDF      │
                     │  admin:     <DeckEditor> via gated server actions          │
                     └──────────────────────────┬─────────────────────────────────┘
                                                │ HTTP + bearer key
                                                ▼
                                   sushi-deck-backend compatibility API
                                                │
                                Supabase / model provider boundaries
```

The broader consolidation target is `binarylawyer/sushii-deck`; this repository is retained until client/product parity and Deck Roll migration decisions are explicitly closed.

## API

All routes require an API key (`Authorization: Bearer <key>` or `x-api-key`).
Keys map to an `owner` via `SUSHI_DECK_API_KEYS`; the server never trusts a
client-supplied tenant.

| Method & path | Body | Purpose |
|---|---|---|
| `GET /api/decks` | — | List decks |
| `POST /api/decks` | `{ slug?, deck }` | Create |
| `GET /api/decks/:id` | — | Get by id |
| `PUT /api/decks/:id` | `{ deck, slug?, expectedVersion? }` | Update (optimistic lock) |
| `DELETE /api/decks/:id` | — | Delete |
| `GET /api/decks/slug/:slug` | — | Get by slug |
| `POST /api/generate` | `{ brief, title?, slides?, brand? }` | AI-generate a `DeckJson` |

Store errors map to HTTP: **422** invalid deck · **409** slug/version conflict ·
**404** not found. These handlers are `createDeckHandlers({ store, llm })` from
the kit — the exact same behavior the kit unit-tests.

## Backend

The compatibility deployment's `decks` table lives in the **Sushi-Kitchen** Supabase project
(`awomcxrkxtxwkygoschf`); migration is `supabase/migrations/0001_decks.sql` in
the kit repo. RLS is enabled with no policies, so only the **service role** can
read/write.

This is distinct from the ARCH-10 private production-canary boundary, which used the isolated `sushii_deck` schema and `sushii_deck_app` role. Do not conflate the compatibility deployment model with the accepted Sushii runtime boundary.

## Develop

```bash
npm install
cp .env.example .env.local   # fill in API URL/key plus any local compatibility settings
npm run dev
```

- Gallery: `/` · Present: `/present/<slug>` · Scroll: `/scroll/<slug>`
- Admin (password-gated): `/admin` — generate, create, edit via `<DeckEditor>`.

The admin UI writes through **gated server actions**; the bearer-key REST API is for programmatic consumers.

```bash
npm run typecheck
npm run build
```

## Notes

- The kit is source-only TypeScript, so it's listed in `transpilePackages`
  (see `next.config.mjs`).
- Tenancy: `owner` is written on create **and** enforced on read — a
  `SupabaseDeckStore` built with an `owner` filters every read/write to that
  owner (kit ≥0.7.0), so each consumer sees only its own decks. See
  `docs/ARCHITECTURE.md §4`.
