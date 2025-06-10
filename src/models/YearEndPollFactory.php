<?php

// filepath: /workspaces/site/src/models/YearEndPollFactory.php

namespace YNotRadio\Models;

require_once(__DIR__ . "/YearEndPoll.php");
require_once(__DIR__ . "/implementations/SqlYearEndPoll.php");

/**
 * Factory class for creating YearEndPoll model instances
 */
class YearEndPollFactory
{
    /**
     * Create a new YearEndPoll model instance
     *
     * @param \mysqli $db Database connection
     * @return YearEndPoll An implementation of the YearEndPoll interface
     */
    public static function create(\mysqli $db): YearEndPoll
    {
        return new \YNotRadio\Models\Implementations\SqlYearEndPoll($db);
    }
}
