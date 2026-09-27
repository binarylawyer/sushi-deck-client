import type { Pool } from "pg";
import { validateDeckJson, type DeckJson } from "@binarylawyer/sushi-deck-kit/json";
import {
  DeckConflictError,
  DeckNotFoundError,
  DeckValidationError,
  slugify,
  type CreateDeckInput,
  type DeckListItem,
  type DeckStore,
  type StoredDeck,
  type UpdateDeckInput,
} from "@binarylawyer/sushi-deck-kit/store";

interface DeckRow {
  id: string;
  slug: string;
  title: string;
  deck: DeckJson;
  owner: string;
  version: number;
  created_at: Date | string;
  updated_at: Date | string;
}

const UNIQUE_VIOLATION = "23505";

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toStored(row: DeckRow): StoredDeck {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    deck: row.deck,
    version: row.version,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function databaseError(op: string, error: unknown): Error {
  if (
    error instanceof DeckConflictError ||
    error instanceof DeckNotFoundError ||
    error instanceof DeckValidationError
  ) {
    return error;
  }
  if (error instanceof Error) return error;
  return new Error(`Deck PostgreSQL ${op} failed`);
}

/**
 * PostgreSQL-backed compatibility store for DB-DECK-01.
 *
 * DATABASE_URL authenticates as sushii_deck_app. That role has a pinned
 * search_path of "sushii_deck, pg_catalog", so the intentionally unqualified
 * "decks" relation resolves only to the canonical Sushii Deck boundary.
 *
 * Owner scoping remains application-enforced exactly as it was in the legacy
 * SupabaseDeckStore path.
 */
export class PostgresDeckStore implements DeckStore {
  constructor(
    private readonly pool: Pool,
    private readonly owner: string,
  ) {
    if (!owner) throw new Error("Deck owner is required");
  }

  private assertValid(deck: unknown): asserts deck is DeckJson {
    const result = validateDeckJson(deck);
    if (!result.ok) throw new DeckValidationError(result.errors);
  }

  async create(input: CreateDeckInput): Promise<StoredDeck> {
    this.assertValid(input.deck);
    const slug = input.slug ?? slugify(input.deck.title);
    try {
      const result = await this.pool.query(
        `insert into decks (slug, title, deck, owner, version)
         values ($1, $2, $3::jsonb, $4, 1)
         returning *`,
        [slug, input.deck.title, JSON.stringify(input.deck), this.owner],
      );
      return toStored(result.rows[0] as DeckRow);
    } catch (error) {
      if ((error as { code?: string }).code === UNIQUE_VIOLATION) {
        throw new DeckConflictError(`Slug already in use: ${slug}`);
      }
      throw databaseError("create", error);
    }
  }

  async get(id: string): Promise<StoredDeck | null> {
    const result = await this.pool.query(
      "select * from decks where id = $1 and owner = $2",
      [id, this.owner],
    );
    const row = result.rows[0] as DeckRow | undefined;
    return row ? toStored(row) : null;
  }

  async getBySlug(slug: string): Promise<StoredDeck | null> {
    const result = await this.pool.query(
      "select * from decks where slug = $1 and owner = $2",
      [slug, this.owner],
    );
    const row = result.rows[0] as DeckRow | undefined;
    return row ? toStored(row) : null;
  }

  async list(): Promise<DeckListItem[]> {
    const result = await this.pool.query(
      `select id, slug, title, version, updated_at
       from decks
       where owner = $1
       order by updated_at desc`,
      [this.owner],
    );
    return result.rows.map((row) => {
      const value = row as Pick<DeckRow, "id" | "slug" | "title" | "version" | "updated_at">;
      return {
        id: value.id,
        slug: value.slug,
        title: value.title,
        version: value.version,
        updatedAt: iso(value.updated_at),
      };
    });
  }

  async update(id: string, input: UpdateDeckInput): Promise<StoredDeck> {
    const existing = await this.get(id);
    if (!existing) throw new DeckNotFoundError(id);
    if (input.expectedVersion != null && input.expectedVersion !== existing.version) {
      throw new DeckConflictError(
        `Version mismatch: expected ${input.expectedVersion}, have ${existing.version}`,
      );
    }
    if (input.deck) this.assertValid(input.deck);

    const deck = input.deck ?? existing.deck;
    const slug = input.slug ?? existing.slug;

    try {
      const result = await this.pool.query(
        `update decks
         set slug = $1,
             title = $2,
             deck = $3::jsonb,
             version = version + 1,
             updated_at = now()
         where id = $4 and owner = $5 and version = $6
         returning *`,
        [
          slug,
          deck.title,
          JSON.stringify(deck),
          id,
          this.owner,
          existing.version,
        ],
      );
      const row = result.rows[0] as DeckRow | undefined;
      if (!row) throw new DeckConflictError("Concurrent update — version moved");
      return toStored(row);
    } catch (error) {
      if ((error as { code?: string }).code === UNIQUE_VIOLATION) {
        throw new DeckConflictError(`Slug already in use: ${slug}`);
      }
      throw databaseError("update", error);
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.pool.query(
      "delete from decks where id = $1 and owner = $2 returning id",
      [id, this.owner],
    );
    if (result.rowCount === 0) throw new DeckNotFoundError(id);
  }
}
