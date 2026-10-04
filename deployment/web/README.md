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

The installed Deck Kit reference HTML currently contains a path to a past
upload instead of the actual World briefing. A successful HTTP status alone
does not prove that presentation works; the local checker validates content
and reports partial acceptance until the canonical source is recovered.

For Linux hosting, build for the server architecture, supply approved runtime
configuration and put the app behind HTTPS routing before production cutover.
