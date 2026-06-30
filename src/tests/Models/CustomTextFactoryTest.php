<?php

namespace YNotRadio\Tests\Models;

use YNotRadio\Tests\TestCase;
use YNotRadio\Models\CustomTextFactory;
use YNotRadio\Models\Implementations\SqlCustomText;

/**
 * Tests for CustomTextFactory backend selection.
 *
 * Custom text reads are toggled between MySQL and Postgres via the
 * `use_postgres_customtext` feature flag while the Postgres/Payload
 * front-end output is validated. The factory must default to MySQL
 * (SqlCustomText) and only return the Postgres implementation when the
 * flag is explicitly enabled. The Postgres branch is not exercised here
 * because it requires a live Postgres connection (Database::getPostgres()).
 */
class CustomTextFactoryTest extends TestCase
{
    public function testDefaultsToSqlCustomText(): void
    {
        $db = $this->createMock(\mysqli::class);

        $model = CustomTextFactory::create($db);

        $this->assertInstanceOf(SqlCustomText::class, $model);
    }

    public function testEnvFlagFalseKeepsSqlCustomText(): void
    {
        putenv('USE_POSTGRES_CUSTOMTEXT=false');

        $db = $this->createMock(\mysqli::class);
        $model = CustomTextFactory::create($db);

        $this->assertInstanceOf(SqlCustomText::class, $model);

        putenv('USE_POSTGRES_CUSTOMTEXT');
    }

    public function testControlPanelRequestForcesSqlCustomText(): void
    {
        // Even with the flag enabled, /cp routes must resolve to MySQL so the
        // restored CP edit screens read and write the legacy custom_texts table.
        $originalScriptName = $_SERVER['SCRIPT_NAME'] ?? null;
        $_SERVER['SCRIPT_NAME'] = '/cp/custom_text_view_all.php';
        putenv('USE_POSTGRES_CUSTOMTEXT=true');

        $db = $this->createMock(\mysqli::class);
        $model = CustomTextFactory::create($db);

        $this->assertInstanceOf(SqlCustomText::class, $model);

        putenv('USE_POSTGRES_CUSTOMTEXT');
        if ($originalScriptName === null) {
            unset($_SERVER['SCRIPT_NAME']);
        } else {
            $_SERVER['SCRIPT_NAME'] = $originalScriptName;
        }
    }
}
