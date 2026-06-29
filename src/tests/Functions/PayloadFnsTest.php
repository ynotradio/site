<?php

namespace YNotRadio\Tests\Functions;

use YNotRadio\Tests\TestCase;

require_once __DIR__ . '/../../functions/payload_fns.php';

class PayloadFnsTest extends TestCase
{
    protected function setUp(): void
    {
        $this->clearPayloadEnv();
    }

    protected function tearDown(): void
    {
        $this->clearPayloadEnv();
    }

    private function clearPayloadEnv(): void
    {
        unset($_ENV['PAYLOAD_ADMIN_SERVER_URL'], $_ENV['PAYLOAD_PUBLIC_SERVER_URL']);
        putenv('PAYLOAD_ADMIN_SERVER_URL');
        putenv('PAYLOAD_PUBLIC_SERVER_URL');
    }

    public function testPayloadAdminUrlDefaultsToNetlifyAdmin(): void
    {
        $this->assertSame('https://ynotradio-admin.netlify.app/admin', get_payload_admin_url());
    }

    public function testPayloadAdminUrlUsesAdminOverride(): void
    {
        $_ENV['PAYLOAD_ADMIN_SERVER_URL'] = 'https://example-admin.netlify.app/';

        $this->assertSame('https://example-admin.netlify.app/admin', get_payload_admin_url());
    }

    public function testPayloadAdminUrlAllowsLocalPayloadPublicServer(): void
    {
        $_ENV['PAYLOAD_PUBLIC_SERVER_URL'] = 'http://localhost:3000';

        $this->assertSame('http://localhost:3000/admin', get_payload_admin_url());
    }

    public function testPayloadAdminUrlIgnoresPublicSiteUrl(): void
    {
        $_ENV['PAYLOAD_PUBLIC_SERVER_URL'] = 'https://www.ynotradio.net';

        $this->assertSame('https://ynotradio-admin.netlify.app/admin', get_payload_admin_url());
    }

    public function testPayloadCollectionUrlUsesPayloadAdminUrl(): void
    {
        $_ENV['PAYLOAD_ADMIN_SERVER_URL'] = 'https://example-admin.netlify.app';

        $this->assertSame(
            'https://example-admin.netlify.app/admin/collections/shows',
            get_payload_collection_url('shows')
        );
    }
}
