import { createDeckHandlers } from "@binarylawyer/sushi-deck-kit/api";
import { claudeLlm } from "./llm";
import { PostgresDeckStore } from "./PostgresDeckStore";
import { databasePool } from "./postgres";

/**
 * The backend tier remains the single owner-scoped Deck API.
 *
 * DB-DECK-01 changes only the persistence adapter: DATABASE_URL authenticates
 * as sushii_deck_app, whose pinned search_path resolves unqualified "decks"
 * queries to the canonical sushii_deck.decks table.
 *
 * The resolved owner still comes from the authenticated API key and is applied
 * to every store operation.
 */
export function handlersFor(owner: string) {
  const store = new PostgresDeckStore(databasePool(), owner);
  return createDeckHandlers({ store, llm: claudeLlm() });
}
