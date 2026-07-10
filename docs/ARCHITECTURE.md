# Sushi Deck — System Architecture, Repos & Deployments

> **Canonical source of truth** for how the Sushi Deck product is structured:
> the repositories (and their former names), the database, the Vercel
> deployments, the env-var contract, and the two consumers. Companion to the
> library-level contract in the kit's `docs/ARCHITECTURE.md`.
>
> **Secrets rule:** this file names **env var NAMES only** — never key values.
>
> _Last buttoned-down: 2026-07-10, when the backend went live._

---

## 1. The shape — Option A (3-tier), one API, two consumers

```
                ┌──────────────────── BACKEND TIER ────────────────────┐
                │  @binarylawyer/sushi-deck (library: store·api·generate)│
                │  + Supabase Postgres `decks`   + Claude (LLM)          │
                │  exposes ONE HTTP API  (key-auth, owner-scoped)        │
                └───────────────┬───────────────────────┬───────────────┘
                                │ API (bearer key)       │ API (bearer key)
                    ┌───────────┴──────────┐   ┌──────────┴───────────────────┐
                    │ CONSUMER 1           │   │ CONSUMER 2                   │
                    │ sushi-deck-app's own │   │ moye-law-os                  │
                    │ front-end (the       │   │ /admin/present/sushi         │
                    │ "sample client app") │   │ (embedded in the firm OS)    │
                    │ owner = "sushi-deck" │   │ owner = "moye-law-os"        │
                    └──────────────────────┘   └──────────────────────────────┘
```

- **One backend.** All deck data + generation live behind a single HTTP API.
  Neither front-end touches Supabase or the LLM directly.
- **Two consumers.** Both are pure API clients that authenticate with a bearer
  key which resolves to an **`owner`**; the server never trusts a client-supplied
  tenant. Decks are **owner-scoped** — each consumer only ever sees its own.
- **Today the backend is *hosted inside* `sushi-deck-app`** (that repo plays two
  roles: it hosts the API **and** serves the "sample client" front-end). See
  §7 for the option to extract the backend into its own deployable later.

---

## 2. Repositories (exact names + former names)

| Repo | Role | Package / deploy name | Former name(s) |
|---|---|---|---|
| **`binarylawyer/sushi-deck`** | The **library / kit** — pure, testable deck logic: `runtime`, `json`, `store`, `generate`, `api`, `editor`, `gate`. Published as `@binarylawyer/sushi-deck` (currently **v0.7.1**). | npm pkg `@binarylawyer/sushi-deck` | was **`deck-kit`** |
| **`binarylawyer/sushi-deck-app`** | The **backend tier + the "sample" consumer front-end**. Hosts the HTTP API (`src/app/api/**`) and serves the gallery/present/scroll/admin UI. | Vercel project **`sushi-deck-client-app`** (⚠️ name ≠ repo name) | — |
| **`binarylawyer/moye-law-os`** | The firm OS. Its **`/admin/present/sushi`** surface is **Consumer 2**. Not part of the Sushi Deck product — it just consumes the API. | Vercel project **`moye-law-os`** | — |
| **`binarylawyer/sushi-kitchen`** | ⚠️ **Unrelated to the deck code.** A separate self-hosted infra monorepo. It only shares a *name* with the Supabase **project** ("Sushi-Kitchen") that happens to host the `decks` table. Do not look here for deck code. | — | — |

**Name gotchas to remember:**
- The kit repo was renamed `deck-kit → sushi-deck`.
- The app **repo** is `sushi-deck-app`; its **Vercel project** is `sushi-deck-client-app`. Same thing, two names.
- "Sushi-Kitchen" is both an (unrelated) **repo** and the **Supabase project** that stores decks. When someone says "Sushi-Kitchen" in the deck context, they mean the **Supabase project**, not the repo.

---

## 3. The library (`@binarylawyer/sushi-deck`)

Pure and unit-tested; the API app and every consumer wire it to infra. Modules
(subpath exports): `.` (runtime + primitives), `./json` (DeckJson schema + ops +
`validateDeckJson`), `./store` (`DeckStore` interface + `InMemoryDeckStore` +
`SupabaseDeckStore` + shared contract), `./generate` (`generateDeck` + injected
`LlmClient`), `./api` (`createDeckHandlers`), `./editor` (`DeckEditor`), `./gate`
(password gate), `./styles.css`.

**How each consumer installs it (they differ — important):**
- `sushi-deck-app` → from **git**: `"@binarylawyer/sushi-deck": "git+https://github.com/binarylawyer/sushi-deck.git"` (tracks the default branch; redeploy to pull a new version).
- `moye-law-os` → **vendored tarball**: `"file:vendor/binarylawyer-sushi-deck-0.6.1.tgz"` (offline, `--frozen-lockfile`). moye is only a *consumer* (it uses types + its own HTTP client + `DeckRuntime`/`DeckEditor`), so it does **not** need the in-store owner filter that landed in 0.7.x — re-vendoring to 0.7.1 is optional/cosmetic for moye.

---

## 4. Database — Supabase project "Sushi-Kitchen"

- **Project:** `Sushi-Kitchen` — ref **`awomcxrkxtxwkygoschf`** — `SUPABASE_URL=https://awomcxrkxtxwkygoschf.supabase.co`.
- **Table:** `public.decks` — migration lives in the kit at `supabase/migrations/0001_decks.sql`.

```sql
decks(
  id uuid pk default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  deck jsonb not null,     -- the DeckJson
  theme jsonb,             -- optional brand overrides
  owner text,              -- app/tenant id (the consumer's owner)
  version int not null default 1,   -- optimistic concurrency
  created_at timestamptz, updated_at timestamptz
)
```

- **Access model:** RLS is **ON with no policies**, and privileges are granted to
  **`service_role` only** (added in kit migration 0001; a raw-SQL table does not
  inherit Supabase's grants, which caused the launch-day `permission denied for
  table decks [42501]`). So **only the secret/service key** can touch `decks` —
  every read/write flows through the server-side store. `anon`/`authenticated`
  have no grants.
- **Owner isolation** is enforced a second time in `SupabaseDeckStore` (kit
  ≥0.7.0): a store built with an `owner` filters every read/write to that owner.

---

## 5. Vercel deployments

- **Team:** `team_6ve0UzALDXNZffWnw2WLbHa8`
- **Backend + sample client:** project **`sushi-deck-client-app`** — `prj_HnKd31eFgMIOBpFlJz2ydRs83xIR` — domain **`https://sushi-deck-client-app.vercel.app`** (deploys `binarylawyer/sushi-deck-app` `main`).
- **Consumer (firm OS):** project **`moye-law-os`** — `prj_skJHCX4n7iRGJ2edAtaySFcEGTRF` (deploys `binarylawyer/moye-law-os` `main`).
- **Deployment Protection:** **OFF** on `sushi-deck-client-app` (the API has its
  own key auth + the admin gate; and Option A self-calls would otherwise hit the
  SSO wall). If it's ever turned back on, both consumers can send a bypass token
  (`VERCEL_AUTOMATION_BYPASS_SECRET` → `x-vercel-protection-bypass` header).

---

## 6. Env-var contract (NAMES only)

**Backend (`sushi-deck-client-app`):**

| Name | Purpose |
|---|---|
| `SUPABASE_URL` | Sushi-Kitchen project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | the **Secret** key (`sb_secret_…`) — full access, bypasses RLS. NOT the publishable key, NOT a legacy JWT |
| `SUSHI_DECK_API_KEYS` | JSON map `{ "<key>": "<owner>" }` — the allow-list of consumer keys → owners |
| `SUSHI_DECK_API_KEY` | this app's own key (Option A: its front-end consumes its own API). Resolves to `SUSHI_DECK_ADMIN_OWNER` |
| `SUSHI_DECK_API_URL` | base URL the front-end calls (defaults to the deployment's own origin) |
| `SUSHI_DECK_ADMIN_OWNER` | owner the app's admin writes under (default `sushi-deck`) |
| `ADMIN_PASSWORD_HASH`, `ADMIN_GATE_SECRET` | the admin UI password gate |
| `ANTHROPIC_API_KEY` | optional — only for "Generate with AI" |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | optional — only if Deployment Protection is ON |

**Each consumer (e.g. `moye-law-os`):**

| Name | Purpose |
|---|---|
| `SUSHI_DECK_API_URL` | the backend base URL (`https://sushi-deck-client-app.vercel.app`) |
| `SUSHI_DECK_API_KEY` | the bare key matching this consumer's entry in the backend's `SUSHI_DECK_API_KEYS` (owner = the consumer) |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | optional — only if the backend keeps Deployment Protection ON |

---

## 7. API surface & auth

`createDeckHandlers({ store, llm })` (kit `./api`) mounts these under
`src/app/api/**`; every route calls `authenticate(req)` → an `owner`, and passes
it to an owner-scoped `SupabaseDeckStore`.

| Method · Path | Purpose |
|---|---|
| `GET /api/decks` | list (owner-scoped) |
| `POST /api/decks` | create `{ slug?, deck }` |
| `GET /api/decks/:id` · `GET /api/decks/slug/:slug` | fetch |
| `PUT /api/decks/:id` | update (optimistic `expectedVersion`) |
| `DELETE /api/decks/:id` | delete |
| `POST /api/generate` | brief → validated DeckJson (Claude) |
| `POST /api/admin-gate` | exchange the admin password for a session cookie (the app's own UI only) |

Errors map to JSON: `422` invalid, `409` conflict, `404` not found, `500`
`{ error, message }` (read handlers included, as of kit 0.7.1).

---

## 8. Current live state (2026-07-10)

- Backend **live and verified**: `sushi-deck-client-app` reads/writes `decks`;
  API returns owner-scoped results for both keys; present/scroll/PDF render.
- Seeded decks: `product-tour` (owner `sushi-deck`, a full feature showcase) and
  `moye-welcome` (owner `moye-law-os`, a neutral sample).
- Kit at **v0.7.1**. Deployment Protection OFF. Supabase grant applied.
- **moye's 5 real firm decks** (estate-audit, patent onboarding, deed-stewardship,
  document-generation, fiduciary-audit) exist as DeckJson in
  `moye-law-os/src/lib/present/sushi/decks/` but are **not yet seeded** into the
  API — that's the next moye-side task.

---

## 9. Project split — who owns what

This system is now split across **two conversations**:

- **Sushi Deck product** (its own conversation): owns `binarylawyer/sushi-deck`
  (kit) + `binarylawyer/sushi-deck-app` (backend + sample client) + the
  `sushi-deck-client-app` Vercel project + the `decks` table. See the kickoff
  prompt in `docs/KICKOFF.md`.
- **moye-law-os** (the firm OS conversation): owns the `/admin/present/sushi`
  **consumer** surface + seeding the firm's decks via the API. Treats the Sushi
  Deck API as an external dependency (this document).

**Guardrail across both:** the Sushi Deck work must not touch moye's live client
data; the moye work must not fork the backend — it consumes the API.

### Possible next architectural step (for the product conversation)
Extract the backend into its **own** deployable (a thin API app from `@…/api`, or
Supabase Edge Functions). Then `sushi-deck-app` becomes purely the **sample
client**, a true peer of moye, and the "backend hosted inside the sample app"
dual-role in §1 goes away. Not required today — everything works — but it's the
clean end-state of Option A.
