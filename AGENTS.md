# Sushi Deck Client — Repository Agent Instructions

These instructions apply to the entire `binarylawyer/sushi-deck-client` repository.

## 1. Repository role

This repository remains a compatibility/standalone Deck client and an evidence-bearing source for UI/product behavior during consolidation into `binarylawyer/sushii-deck`.

The separated compatibility backend already exists at `binarylawyer/sushi-deck-backend`.

Read first:

1. `README.md`;
2. `docs/SUSHII-DL-COMPATIBILITY-STATUS-2026-09-17.md`;
3. current `main` and open PRs; and
4. current Sushii Deck/World architecture for cross-repo work.

ARCH-10 / SUSHII-DL is CLOSED at 52/52, but this repository was not the accepted first-party runtime subject.

## 2. Migration boundary

The accepted runtime subject was `binarylawyer/sushii-deck` at:

```text
a3eb05f682996bf135fe40b431ef793d3212648a
```

Do not infer that client/UI parity, Vercel cutover, backend cutover, URL migration, customer-facing deployment or repository retirement is complete.

Do not delete/archive this repo until explicit parity/migration closeout.

## 3. Compatibility data distinction

The compatibility deployment's older shared `public.decks` / service-role model is distinct from the accepted private Sushii production canary:

```text
schema: sushii_deck
role:   sushii_deck_app
```

Do not treat successful ARCH-10 canary evidence as authority to migrate/drop compatibility data or change this client's production backend.

## 4. CI classification

Classify CI from what executed:

- `CI_PASS`: required relevant steps executed and passed.
- `CI_FAIL`: a required relevant build/test/check step actually executed and failed.
- `CI_DEFERRED`: infrastructure prevented the intended source from running.

A job with `runner_id=0`, empty runner name and `steps=[]` is `CI_DEFERRED` even if GitHub reports conclusion `failure`. `startup_failure` with zero jobs is also deferred.

Deferred is never PASS. Record exact merged SHAs for backfill; a later real FAIL requires a corrective PR.

## 5. Fresh cost approval

Stop for fresh explicit product-owner approval immediately before creating or purchasing any new billable, recurring or usage-charged resource, including domains, cloud instances, hosted DBs/projects/paid branches, paid SaaS/add-ons, subscriptions or metered provider activation.

## 6. Exact-SHA evidence

Accepted runtime evidence proves its exact subject/source basis, not every descendant `main` commit.

Terminal cross-repo receipts:

```text
DL-08D  92a10ac06049a4253ebd6be1f9c9295b175d9ad972c84841d627376b3895a1cf
DL-08F  98794d4827196c6c2f2d61a6dbe9b57983e573aa02344ac83dd20e94d57db3a4
```

## 7. Runtime/integration acceptance

If this client participates in a future Sushii aggregate, use the A0-A14 aggregate acceptance model unless superseded.

A healthy API/client deployment is not an end-to-end pass. Exercise the intended API workflow, ownership/tenancy, persistence, negative access where applicable, repeatability, cleanup and correlation evidence.

Preserve the first failed stage and retest the smallest necessary chain after a bounded fix.

## 8. Secrets

Never commit or paste `.env` contents, decrypted secret values, credential-bearing DB URLs, secret/service-role keys, private keys, bearer tokens/Authorization headers or generated passwords.

Use opaque references and sanitized evidence.

## 9. Public ingress and OPS

ARCH-10 did not authorize public deployment changes for this client. Domain/URL choices, Vercel production routing, DNS/TLS, Traefik, Keycloak/OIDC, CORS/trusted-origin, redirects and customer traffic remain separately reviewed work.

Permanent namespace/OPS decisions remain separate. New cost-bearing resources require fresh approval.

## 10. Documentation

Keep README/current architecture accurate. Preserve historical evidence and old migration snapshots rather than rewriting them as if they were current.
