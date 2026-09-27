import pg from "pg";

const { Client } = pg;

const EXPECTED = new Map([
  ["140ecae6-77f7-434f-9813-37a0fd65aec3", "product-tour"],
  ["eab3bbf5-187c-4ec8-b820-bdf54277f4c8", "moye-welcome"],
]);

function fail(message) {
  console.error(`DB-DECK-01 acceptance failed: ${message}`);
  process.exitCode = 2;
}

async function main() {
  // This is a temporary cutover gate, not a general local-development
  // requirement. Vercel Preview/Production must prove the canonical role.
  if (!process.env.VERCEL) {
    console.log("DB-DECK-01 acceptance skipped outside Vercel.");
    return;
  }

  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for DB-DECK-01 Vercel acceptance");
  }

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 5000,
    application_name: "db-deck-01-vercel-acceptance",
  });

  await client.connect();
  try {
    const identity = await client.query(
      "select current_user, current_setting('search_path') as search_path",
    );
    const user = identity.rows[0]?.current_user;
    const searchPath = identity.rows[0]?.search_path ?? "";

    if (user !== "sushii_deck_app") {
      throw new Error(`unexpected database role: ${String(user)}`);
    }
    if (!String(searchPath).includes("sushii_deck")) {
      throw new Error(`unexpected search_path: ${String(searchPath)}`);
    }

    const preserved = await client.query(
      `select id::text, slug
         from decks
         where id = any($1::uuid[])
         order by id`,
      [[...EXPECTED.keys()]],
    );

    if (preserved.rowCount !== 2) {
      throw new Error(
        `expected 2 preserved Deck rows, found ${String(preserved.rowCount)}`,
      );
    }
    for (const row of preserved.rows) {
      if (EXPECTED.get(row.id) !== row.slug) {
        throw new Error(`preserved Deck mismatch for ${row.id}`);
      }
    }

    const marker = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "local";
    const id = "00000000-0000-4000-8000-000000000001";
    const slug = `db-deck-01-${marker}`;

    await client.query("begin");
    try {
      // Clean only our fixed acceptance identity inside the transaction so a
      // previously-aborted Vercel build cannot create a false conflict.
      await client.query("delete from decks where id = $1", [id]);

      const created = await client.query(
        `insert into decks
           (id, slug, title, deck, owner, version)
         values
           ($1, $2, 'DB-DECK-01 acceptance',
            '{"v":1,"title":"DB-DECK-01 acceptance","slides":[]}'::jsonb,
            'db-deck-01-acceptance', 1)
         returning id::text, slug, version`,
        [id, slug],
      );
      if (created.rowCount !== 1 || created.rows[0]?.version !== 1) {
        throw new Error("synthetic create proof failed");
      }

      const updated = await client.query(
        `update decks
         set version = version + 1, updated_at = now()
         where id = $1 and owner = 'db-deck-01-acceptance'
         returning version`,
        [id],
      );
      if (updated.rowCount !== 1 || updated.rows[0]?.version !== 2) {
        throw new Error("synthetic update proof failed");
      }

      const removed = await client.query(
        `delete from decks
         where id = $1 and owner = 'db-deck-01-acceptance'
         returning id`,
        [id],
      );
      if (removed.rowCount !== 1) {
        throw new Error("synthetic delete proof failed");
      }
    } finally {
      await client.query("rollback");
    }

    const residue = await client.query(
      "select count(*)::int as count from decks where owner = 'db-deck-01-acceptance'",
    );
    if (residue.rows[0]?.count !== 0) {
      throw new Error("synthetic acceptance residue exists after rollback");
    }

    console.log(
      "DB-DECK-01 acceptance PASS: canonical role, search_path, preserved rows and rollback CRUD verified.",
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
