# Local standalone Deck client
Open http://localhost:13680. This compatibility client is separate from the
newer Atelier at localhost:13480 and is retained until parity is proven.

Run `bash scripts/local-web.sh build`, then `bash scripts/local-web.sh up`.
The script also supports `check`, `status`, `logs`, `stop`, and `down`.
Builds run in a dedicated 3 GiB / two-CPU container, stopped afterward.
Only one website should build at a time. Runtime is capped at 512 MiB;
that limit is not reserved memory.

The added npm lockfile preserves the existing commit-pinned Deck Kit
dependency. The standalone production image serves pages with a nonroot,
read-only Node process and loopback-only port publishing.

No API key, admin secret, database or model credentials are supplied.
The gallery and admin gates therefore show their existing unconfigured state.
Positive login, deck creation/editing, persistence and model generation remain
unverified. The read-only API check must reject anonymous requests.

The initial reference request failed: the pinned kit has a path-only artifact,
and the bundled module could not resolve the exported presentation. This
local Compose stack sets SUSHII_WORLD_LOCAL_BRIEFING_ORIGIN to
http://localhost:13380, so /sushii-world redirects to the restored canonical
World briefing. Only loopback HTTP origins are accepted by this local option;
when unset, the existing package-backed behavior is unchanged. World must be
running for the briefing link and its acceptance check; the gallery and admin
shell still start independently. No copy of World artwork is placed in this client.

For Linux hosting, build for the server architecture, supply approved runtime
configuration and put the app behind HTTPS routing before production cutover.

Evidence: [2026-10-04 receipt](evidence/2026-10-04.json) and [gallery image](evidence/2026-10-04-gallery.png).
