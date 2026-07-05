<?php

return [
    // Top 11 @ 11 has no Postgres/Payload adapter yet, so it stays on MySQL.
    'use_postgres_top11' => false,

    // Custom text reads are flagged between MySQL and Postgres while the
    // Postgres/Payload front-end output is validated. Default off (MySQL);
    // flip to true (env var USE_POSTGRES_CUSTOMTEXT or `?ff=use_postgres_customtext`)
    // to serve custom text pages from Postgres. CP edit screens always use
    // MySQL regardless (use_postgres_* is suppressed on /cp routes).
    // Stories were cut over to Postgres directly (factory does not consult a flag).
    'use_postgres_customtext' => false,
];
