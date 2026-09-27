import { Pool } from "pg";

let cached: Pool | null = null;

/**
 * Canonical DB-DECK-01 connection.
 *
 * Production DATABASE_URL must authenticate as sushii_deck_app. The password
 * remains in Supabase Vault / deployment secret storage; it is never committed.
 */
export function databasePool(): Pool {
  if (cached) return cached;

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL must be set to the sushii_deck_app PostgreSQL connection",
    );
  }

  cached = new Pool({
    connectionString: databaseUrl,
    max: 4,
    connectionTimeoutMillis: 1500,
  });

  cached.on("error", (error) => {
    console.error("Sushi Deck PostgreSQL idle client error:", error.message);
  });

  return cached;
}
