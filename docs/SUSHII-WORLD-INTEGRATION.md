# Sushii World in Sushi Deck

## Repository responsibilities

Sushii World uses the existing two-layer Sushi Deck architecture rather than creating a third presentation product:

- **`sushi-deck-kit`** owns the reusable presentation system: the typed React runtime, blocks, serializable `DeckJson`, edit operations, store/API contracts, generation interfaces, and canonical reference artifacts.
- **`sushi-deck-client`** owns the product shell: gallery, admin/editor, authentication boundary, API routes, and present/scroll/PDF views.
- **`sushi-deck-backend`** remains the future extraction target for the API/database tier. Nothing in this integration requires changing it.

## Canonical Sushii World artifact

The complete visual reference lives in the installed kit package at:

```text
examples/sushii-world/sushii-world-presentation.html
```

The reference preserves the 19-slide Sushii World briefing design and interaction model: watercolor sushi imagery, wrappers, bento-box composition, jubako stacking, Kitchen / Legal / Deck relationships, connection surfaces, adapters, local AI, software sourcing, speaker notes, audience views, navigation, and print behavior.

The kit owns the canonical reference artifact. The client must **not** carry a second copy of the presentation in `public/`. The `/sushii-world` route resolves the installed kit package so the browser receives the version that was installed with the application.

The source workspace remains authoritative for its substantive work:

- **Kitchen** builds and operates systems.
- **Legal / Law** own domain workflows and substantive conclusions.
- **Deck** assembles, explains, reviews, versions, and hands off the work.

## Current client integration

The first integration deliberately keeps the finished HTML intact as the visual/reference implementation while exposing it through the live Sushi Deck product:

```text
GET /sushii-world
→ resolve @binarylawyer/sushi-deck-kit/examples/sushii-world/presentation.html
→ serve HTML through the Node runtime
```

The reference markup, presentation JavaScript, speaker notes, print behavior, and audience modes remain owned by the artifact itself.

## Native DeckJson migration

The HTML is the **visual source of truth while the native version is developed**, not the final runtime architecture.

The migration target is:

```text
GET /api/decks/slug/sushii-world
→ DeckJson
→ deckFromJson(deck)
→ DeckRuntime (present)
→ ScrollView (context / review)
```

The refactor should proceed by extracting reusable concepts rather than manually redrawing the presentation inside the client:

1. Add a first-class image/asset primitive to the kit's `DeckJson` contract.
2. Extract the watercolor artwork into versioned assets referenced by the native deck rather than hard-coding it into client UI.
3. Map each existing HTML slide into native `DeckJson` while preserving slide order, hierarchy, callouts, notes, audience intent, and visual vocabulary.
4. Reuse kit blocks where they already express the design; add narrowly scoped primitives where the reference artifact proves a real missing capability.
5. Render the native deck through `DeckRuntime` and `ScrollView` and store/version it through the existing Deck API.
6. Keep the full HTML available as an offline review/export artifact and regression reference after the native version ships.

The goal is not to make the HTML disappear. It is to use the finished artifact as a design fixture from which the reusable Sushii Deck implementation can be derived and reviewed slide by slide.

## Deployment

The Vercel project `sushi-deck-client` is linked to `binarylawyer/sushi-deck-client`. Once this change is merged and the dependent kit export is available to the client dependency, Vercel can expose the briefing at `/sushii-world` without an external GitHub URL, runtime network dependency, or duplicated copy in the client repository.
