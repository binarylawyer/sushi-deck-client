# Seed decks

Neutral **sample** `DeckJson` files (no client data) so the backend has
something to present on day one. Both are already present in the canonical
Sushi-Kitchen `sushii_deck.decks` table:

| File | Slug | Owner | Surface that lists it |
|---|---|---|---|
| `product-tour.json` | `product-tour` | `sushi-deck` | the standalone app's gallery |
| `moye-welcome.json` | `moye-welcome` | `moye-law-os` | moye's `/admin/present/sushi` |

Each row is **owner-scoped**: the compatibility PostgreSQL store applies the
resolved API-key owner to every read/write, and the canonical table is protected
by the restricted `sushii_deck_app` role plus RLS.

## Re-seeding

**The Option-A way (through the API).** POST a file with a bearer key whose
`owner` matches the intended tenant — the server sets `owner` from the key, never
from the body:

```bash
curl -sS -X POST "$SUSHI_DECK_API_URL/api/decks" \
  -H "Authorization: Bearer $SUSHI_DECK_API_KEY" \
  -H "Content-Type: application/json" \
  --data "{\"deck\": $(cat seed/product-tour.json)}"
```

(Use the key that resolves to `sushi-deck` for `product-tour.json`, and the key
that resolves to `moye-law-os` for `moye-welcome.json`.)

Do not seed through `public.decks`, a Supabase service-role key, or ad hoc SQL.
DB-DECK-01 retired that compatibility boundary. Use the owner-scoped API so
tenancy, validation, and optimistic-version behavior remain consistent.
