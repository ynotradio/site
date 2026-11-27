<?php

namespace YNotRadio\Tests\Functions;

use YNotRadio\Tests\TestCase;

class YearEndPollVotePartialTest extends TestCase
{
    private function render(array $options, string $pollName = 'songs'): string
    {
        $controller = new class ($options) {
            private $options;

            public function __construct(array $options)
            {
                $this->options = $options;
            }

            public function getPollValues(string $pollName): array
            {
                return $this->options;
            }

            public function getColumnNames(string $pollName): array
            {
                return ['id', 'label', 'votes'];
            }

            public function getMaxPicks(string $pollName): int
            {
                return 2;
            }

            public function formatPollHeader(string $pollName, string $category): string
            {
                return 'Vote';
            }
        };

        ob_start();
        include __DIR__ . '/../../partials/_year_end_poll_vote.php';
        return ob_get_clean();
    }

    public function testNomineeLabelsAreEscaped(): void
    {
        $html = $this->render([['id' => 'n1', 'label' => 'Sleigh Bells - <3 <script>x</script>', 'votes' => 0]]);

        $this->assertStringContainsString('Sleigh Bells - &lt;3 &lt;script&gt;x&lt;/script&gt;', $html);
        $this->assertStringNotContainsString('<script>x', $html);
    }

    public function testExistingEntitiesAreNotDoubleEncoded(): void
    {
        $html = $this->render([['id' => 'n1', 'label' => 'Mumford &amp; Sons', 'votes' => 0]]);

        $this->assertStringContainsString('Mumford &amp; Sons', $html);
        $this->assertStringNotContainsString('&amp;amp;', $html);
    }

    public function testPollNameIsEscaped(): void
    {
        $html = $this->render([], 'songs"><b>');

        $this->assertStringContainsString('value="songs&quot;&gt;&lt;b&gt;"', $html);
    }
}
