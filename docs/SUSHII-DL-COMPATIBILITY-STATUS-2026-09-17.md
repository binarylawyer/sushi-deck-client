# Sushi Deck Client — SUSHII-DL Compatibility Status

**Date:** 2026-09-17  
**Role:** compatibility/standalone Deck client and conceptual source for Deck Roll  
**ARCH-10 / SUSHII-DL:** CLOSED — 52/52 in `binarylawyer/sushii-world`

## Current architecture relationship

Backend extraction is no longer a future step: `binarylawyer/sushi-deck-backend` already exists as the separated compatibility backend.

The Sushii product consolidation target is `binarylawyer/sushii-deck`. The standalone client remains an evidence-bearing source for UI behavior, deployment assumptions, and the conceptual Deck Roll boundary until parity/migration work is explicitly closed.

## ARCH-10 runtime result

ARCH-10 did not use this repository as the first-party runtime subject. The accepted Deck subject was:

```text
binarylawyer/sushii-deck
a3eb05f682996bf135fe40b431ef793d3212648a
```

The behavior-contract dependency used by that subject was pinned to `binarylawyer/sushi-deck-kit` commit `d49546d800ae0afe35c9672d7624f503811da94c`.

Terminal receipts:

```text
DL-08D  92a10ac06049a4253ebd6be1f9c9295b175d9ad972c84841d627376b3895a1cf
DL-08F  98794d4827196c6c2f2d61a6dbe9b57983e573aa02344ac83dd20e94d57db3a4
```

The accepted Sushii production canary used an isolated `sushii_deck` schema/role and remained loopback-only. It did not migrate this client's existing deployment or authorize customer traffic to the canary.

## Repository status

Do not delete/archive this repo or treat it as fully superseded until the Deck consolidation audit proves the relevant client/product behavior has been migrated or intentionally retained elsewhere.

Do not infer from ARCH-10 closure that the public Deck product migration, URL/domain choice, Vercel routing, backend cutover, or customer-facing production deployment is complete.

## Canonical authority

- Cross-product ARCH/SUSHII-DL ledger: `binarylawyer/sushii-world`.
- Deck product consolidation target: `binarylawyer/sushii-deck`.
- Compatibility backend: `binarylawyer/sushi-deck-backend`.
- Portable behavior contracts: `binarylawyer/sushi-deck-kit`.
