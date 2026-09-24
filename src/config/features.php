<?php

return [
    // Top 11 @ 11 reads from Postgres/Payload. Cut over 2026-09-20.
    'use_postgres_top11' => true,

    // Custom text reads are flagged between MySQL and Postgres while the
    // Postgres/Payload front-end output is validated. Default off (MySQL);
    // flip to true (env var USE_POSTGRES_CUSTOMTEXT or `?ff=use_postgres_customtext`)
    // to serve ALL custom text pages from Postgres. CP edit screens always use
    // MySQL regardless (use_postgres_* is suppressed on /cp routes).
    // Stories were cut over to Postgres directly (factory does not consult a flag).
    'use_postgres_customtext' => false,

    // Per-permalink cutover allowlist. Individual custom-text pages can move to
    // Postgres ahead of the global `use_postgres_customtext` flip, once their
    // Payload output is trusted -- letting clean pages cut over first instead of
    // all-or-nothing. A permalink here (or in the comma-separated env var
    // USE_POSTGRES_CUSTOMTEXT_PERMALINKS, unioned with this list) serves from
    // Postgres even while the global flag is off. CP routes still force MySQL.
    'postgres_customtext_permalinks' => [],
];
