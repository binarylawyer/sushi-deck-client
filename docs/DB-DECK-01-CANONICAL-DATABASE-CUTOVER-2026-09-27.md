# DB-DECK-01 — Canonical Deck database cutover

**Date:** 2026-09-27  
**Status:** CLOSED  
**Supabase project:** `awomcxrkxtxwkygoschf`

## Outcome

The legacy compatibility persistence path is retired:

```text
service_role -> public.decks
```

The production Deck API now uses the accepted Sushii Deck database boundary:

```text
DATABASE_URL
  -> sushii_deck_app
  -> search_path = sushii_deck, pg_catalog
  -> sushii_deck.decks
```

The cutover preserved DeckJson behavior, owner scoping, API routes, optimistic
versioning, and the two production compatibility Deck records.

## Canonical authority

```text
schema       sushii_deck
role         sushii_deck_app
search_path  sushii_deck, pg_catalog
table        sushii_deck.decks
```

The role remains LOGIN, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION,
NOBYPASSRLS. The Deck table has RLS enabled and policy
`sushii_deck_app_full_access` scoped to that role.

## 01A — data migration

Preflight proved:

```text
public.decks rows        2
sushii_deck.decks rows   0
ID overlap               0
slug overlap             0
```

The preserved rows were:

- `product-tour`;
- `moye-welcome`.

All nine columns were copied without transformation: id, slug, title, DeckJson,
theme, owner, version, created_at, and updated_at.

Bidirectional equality proof:

```text
legacy rows       2
canonical rows    2
legacy-only       0
canonical-only    0

digest
fd8c5469d37c6dca54376149894d04f2
```

## 01B — compatibility source cutover

PR:

```text
binarylawyer/sushi-deck-client#14
merged SHA 678ae6209de2e715c55f7ffbd83025a280ef90f2
```

The compatibility API storage adapter changed from
`SupabaseDeckStore + SUPABASE_SERVICE_ROLE_KEY` to a PostgreSQL DeckStore using
`DATABASE_URL`.

Authentication was tightened during the cutover: configured API keys must resolve
to a non-empty owner. The canonical store was not weakened to accept a null
tenant.

The local service-role Supabase helper was removed. Production persistence no
longer uses `@supabase/supabase-js`. The package remains installed only because
the pinned Deck Kit `./store` barrel re-exports `SupabaseDeckStore` and its
optional peer must be present for the current build graph. It is not a database
authority or runtime persistence path.

## 01C — Preview and Production acceptance

A temporary Vercel prebuild gate verified the real restricted database identity
before allowing deployment.

Preview proof:

```text
deployment  dpl_2GA3zZoGvVtdMUgLXg6YJWwcU62Y
source SHA  cbaba3e2bb583db553cdb7a37c4fa4af15cbf8f8
state       READY
```

Production proof:

```text
deployment  dpl_HrTEcRdeuL3pRNSXqRvNvfMSaJXY
source SHA  678ae6209de2e715c55f7ffbd83025a280ef90f2
state       READY
alias       sushi-deck-client-app.vercel.app
```

The gate required:

- `current_user = sushii_deck_app`;
- search path containing `sushii_deck`;
- both preserved Deck IDs/slugs visible;
- synthetic INSERT, UPDATE, and DELETE success;
- transaction rollback;
- zero synthetic residue.

The temporary acceptance hook was removed after terminal acceptance.

GitHub Actions remained `CI_DEFERRED`: job records existed with zero executed
steps. Vercel was therefore the executed source/runtime acceptance path.

## 01C — legacy privilege revoke

Immediately before revoke:

```text
legacy rows       2
canonical rows    2
legacy digest     fd8c5469d37c6dca54376149894d04f2
canonical digest  fd8c5469d37c6dca54376149894d04f2
service_role      SELECT/INSERT/UPDATE/DELETE = true
```

Migration:

```text
db_deck_01c_revoke_legacy_service_role
```

After revoke:

```text
service_role SELECT  false
service_role INSERT  false
service_role UPDATE  false
service_role DELETE  false
legacy rows          2
canonical rows       2
```

Production continued to render `product-tour`, and unauthenticated
`/api/decks` continued to return 401.

## 01D — legacy table retirement

Migration:

```text
db_deck_01d_drop_legacy_public_decks
```

The drop used `RESTRICT` after re-proving:

- exactly 2 legacy rows;
- exactly 2 canonical rows;
- matching full-row digest;
- no remaining service-role DML privilege.

Terminal database state:

```text
public.decks absent          true
sushii_deck.decks rows       2
canonical digest             fd8c5469d37c6dca54376149894d04f2
public tables                64
public RLS-disabled tables    0
```

Production runtime after the drop:

- gallery HTTP 200;
- `product-tour` and its preserved ID rendered from the new production
  deployment;
- unauthenticated `/api/decks` returned 401.

## Advisor state after closeout

Security:

```text
rls_enabled_no_policy                            69
security_definer_view                             4
authenticated_security_definer_function_executable 9
auth_leaked_password_protection                   1
```

Performance:

```text
unindexed_foreign_keys 101
unused_index           537
duplicate_index         16
auth_db_connections_absolute 1
```

The one RLS/no-policy finding attributable to `public.decks` disappeared and
one additional unused-index finding disappeared with the table.

These remaining advisor items are separate follow-up work. Do not rewrite vendor
schemas or intentional server-only boundaries merely to reduce linter counts.

## Secret handling

The canonical Deck password remains sourced from Supabase Vault secret reference:

```text
secret://supabase-vault/sushii_deck_app_database_password_v1
```

Vercel stores the resulting `DATABASE_URL` as a Sensitive secret. No decrypted
password or credential-bearing URL is committed to Git or this receipt.

The legacy `SUPABASE_SERVICE_ROLE_KEY` is no longer required by Deck
persistence and should not remain in this Vercel project after final environment
cleanup.

## Non-effects

DB-DECK-01 did not authorize or perform:

- repository archival;
- domain/namespace migration;
- Keycloak/OIDC changes;
- public-ingress redesign;
- customer-data migration;
- changes to Moye Law matter/client Deck ownership;
- commerce, wallet, Payload, Medusa, or LiteLLM authority changes.

It retires only the legacy Deck database boundary.
