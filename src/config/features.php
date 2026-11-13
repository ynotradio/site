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
    // All 35 active pages were imported to Payload and cut over 2026-10-22.
    // Listed here, not only in the env var, because every deploy rewrites the
    // prod .env from a secret that has USE_POSTGRES_CUSTOMTEXT=false.
    'postgres_customtext_permalinks' => [
        'donate',
        'contests',
        'modern-rock-madness',
        'y-not-contests-2',
        'future-friday',
        'y100-rocks',
        'shows',
        'rodney-anonymous',
        'words-with-nerds',
        'modern-rock-madness-draft',
        'top1000',
        'quarantine-takeovers',
        'top220of2020',
        'yearendpoll2020',
        'ynotsessions2020',
        'top221of2021',
        'yearendpoll2021',
        'ynotsessions2021',
        'dollar-stroll-raffle-contest-1',
        'player-test',
        'top222of2022',
        'yearendpoll2022',
        'ynotsessions2022',
        'top223of2023',
        'yearendpoll2023',
        'ynotsessions2023',
        't-shirts',
        'top224of2024',
        'yearendpoll2024',
        'ynotsessions2024',
        'y100:-20-years-gone',
        'remembering-starla',
        'top225of2025',
        'yearendpoll2025',
        'ynotsessions2025',
    ],
];
