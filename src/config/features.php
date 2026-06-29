<?php

return [
    // Top 11 @ 11 has no Postgres/Payload adapter yet, so it stays on MySQL.
    // Stories and custom text were cut over to Postgres directly (their
    // factories no longer consult a flag).
    'use_postgres_top11' => false,
];
