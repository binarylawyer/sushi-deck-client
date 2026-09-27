# DB-DECK-01 — Canonical Deck database cutover

**Date:** 2026-09-27  
**Status:** IN PROGRESS — data migration complete; compatibility source cutover builds READY; Vercel DATABASE_URL handoff and runtime cutover pending  
**Supabase project:** `awomcxrkxtxwkygoschf`

## Purpose

Retire the legacy Sushi Deck compatibility persistence path:

```text
service_role -> public.decks
```

and converge the compatibility deployment on the already-accepted Sushii Deck
production boundary:

```text
sushii_deck_app -> sushii_deck.decks
```

This work does not change DeckJson, API routes, owner/tenant semantics, or the
consumer contract.

## DB-DECK-01A — production data migration — COMPLETE

Production preflight proved:

- `public.decks` contained exactly 2 rows;
- `sushii_deck.decks` contained 0 rows;
- both tables have identical 9-column schemas;
- both enforce `PRIMARY KEY (id)` and `UNIQUE (slug)`;
- the legacy rows were:
  - `product-tour`;
  - `moye-welcome`;
- no ID or slug overlap existed before the copy.

The two rows were copied with IDs, slugs, titles, DeckJson, theme, owner,
version, `created_at`, and `updated_at` preserved exactly.

Terminal proof:

```text
legacy rows:     2
canonical rows:  2
legacy digest:   fd8c5469d37c6dca54376149894d04f2
canonical digest:fd8c5469d37c6dca54376149894d04f2
legacy-only rows:    0
canonical-only rows: 0
```

The legacy table was intentionally left intact. No privilege was revoked during
01A.

## Canonical authority

The accepted database boundary remains:

```text
schema       sushii_deck
role         sushii_deck_app
search_path  sushii_deck, pg_catalog
table        sushii_deck.decks
```

The role is LOGIN, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION,
NOBYPASSRLS. It has schema USAGE plus SELECT/INSERT/UPDATE/DELETE on its own Deck
table. RLS is enabled with policy `sushii_deck_app_full_access` scoped only to
that role.

The accepted DL-08F production canary already proved Deck create/read/list/delete
through this role and schema.

## DB-DECK-01B — compatibility backend source cutover

Branch:

```text
db-deck-01-canonical-postgres-cutover
```

The compatibility client still hosts its HTTP API. The storage adapter is being
changed from `SupabaseDeckStore` + `SUPABASE_SERVICE_ROLE_KEY` to a
PostgreSQL `DeckStore` + `DATABASE_URL`.

The new `DATABASE_URL` must authenticate as `sushii_deck_app`. The
application continues to use unqualified `decks` queries so the role's pinned
search path selects `sushii_deck.decks`.

Owner scoping remains unchanged: every query includes the owner resolved from the
authenticated Deck API key.

No decrypted Vault password or credential-bearing URL may be committed, logged,
pasted, or stored in this document.

## DB-DECK-01C — production deployment gate

Before revoking legacy access:

1. deploy the compatibility app with `DATABASE_URL` for `sushii_deck_app`;
2. prove the app can list its expected owner-scoped migrated rows;
3. perform one bounded create/read/update/delete synthetic Deck API smoke;
4. prove the synthetic row is removed;
5. confirm the two preserved Deck rows remain byte-equivalent to the migration
   receipt.

Only after this passes may `service_role` privileges be revoked from
`public.decks`.

Immediately after the revoke, rerun the read/API smoke. If the compatibility app
regresses, re-grant the prior table privilege and investigate before proceeding.

## DB-DECK-01D — legacy table retirement

Drop `public.decks` only after the post-revoke smoke proves that no live
compatibility path uses it.

Terminal state:

```text
sushii_deck.decks = canonical Deck persistence
sushii_deck_app   = canonical Deck database identity
public.decks      = absent
service_role      = no Deck table privilege
```

## Relationship to Sushii Deck consolidation

This cutover retires one compatibility data boundary. It does not by itself
authorize repository archival, domain changes, public ingress, customer traffic,
or removal of compatibility UI/evidence. Those remain governed by the broader
Sushii Deck parity/consolidation program.


## 2026-09-27 source/build checkpoint

Compatibility cutover PR:

```text
binarylawyer/sushi-deck-client#14
head 33bc0bdf569bbd18283c2963cfd007ffb920308d
```

The first preview builds exposed a compile-time authority mismatch: the old API
identity contract allowed `owner: string | null`, while the canonical
PostgreSQL store requires an actual tenant owner. The fix tightened
`ApiIdentity.owner` to `string` and rejects configured API keys whose owner
value is empty. The store was not weakened.

Vercel preview after that fix:

```text
deployment dpl_FeNYp2F6p3csqSKMw4oAgD96TJTs
state      READY
target     preview
```

GitHub Actions for the PR remains CI_DEFERRED: the workflow run completes with a
job record but zero executed steps. It is not counted as a source PASS or FAIL.

Production is still on the pre-cutover main deployment. No legacy privilege has
been revoked and `public.decks` remains present.

The next required operator boundary is adding a Sensitive `DATABASE_URL` to the
Vercel `sushi-deck-client` project for Preview and Production, with the value
derived from the existing Supabase Vault
`sushii_deck_app_database_password_v1` secret. The value must never be pasted
into Git, chat, logs, or ordinary shell history.
