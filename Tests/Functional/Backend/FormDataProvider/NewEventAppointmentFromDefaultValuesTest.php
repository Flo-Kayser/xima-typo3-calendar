<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Tests\Functional\Backend\FormDataProvider;

use PHPUnit\Framework\Attributes\Test;
use TYPO3\CMS\Backend\Form\FormDataCompiler;
use TYPO3\CMS\Backend\Form\FormDataGroup\TcaDatabaseRecord;
use TYPO3\CMS\Core\Core\SystemEnvironmentBuilder;
use TYPO3\CMS\Core\Http\ServerRequest;
use TYPO3\CMS\Core\Localization\LanguageServiceFactory;
use Xima\XimaTypo3Calendar\Tests\Functional\AbstractCalendarFunctionalTestCase;

/**
 * Compiles the event form the way EditDocumentController does for
 * `record_edit` with `defVals`, without rendering it.
 */
final class NewEventAppointmentFromDefaultValuesTest extends AbstractCalendarFunctionalTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->importCSVDataSet(__DIR__ . '/../../Fixtures/pages.csv');
        $this->importCSVDataSet(__DIR__ . '/../../Fixtures/be_users.csv');
        $this->importCSVDataSet(__DIR__ . '/../../Fixtures/calendar.csv');
        $GLOBALS['LANG'] = $this->get(LanguageServiceFactory::class)->createFromUserPreferences($this->setUpBackendUser(1));
    }

    #[Test]
    public function addsOnePrefilledAppointmentToANewEvent(): void
    {
        $children = $this->compileAppointments('new', 2, [
            self::TABLE_ENTRY => [
                'start_date' => '1767225600',
                'end_date' => '1767229200',
                'all_day' => '1',
                'calendar' => '1',
            ],
        ]);

        self::assertCount(1, $children);
        $row = $children[0]['databaseRow'];
        self::assertSame('new', $children[0]['command']);
        self::assertStringStartsWith('NEW', (string)$row['uid']);
        self::assertSame(2, (int)$row['pid']);
        self::assertSame(
            ['1767225600', '1767229200', '1', ['1'], ['event-appointment']],
            [$row['start_date'], $row['end_date'], $row['all_day'], $row['calendar'], $row['record_type']],
        );
    }

    #[Test]
    public function leavesANewEventWithoutAppointmentDefaultsAlone(): void
    {
        self::assertSame([], $this->compileAppointments('new', 2, [
            self::TABLE_EVENT => ['title' => 'Only event defaults'],
        ]));
    }

    #[Test]
    public function doesNotAddAnAppointmentWhenAnExistingEventIsOpened(): void
    {
        $children = $this->compileAppointments('edit', 1, [
            self::TABLE_ENTRY => ['start_date' => '1767225600'],
        ]);

        self::assertSame([1], array_map(static fn (array $child): int => (int)$child['databaseRow']['uid'], $children));
    }

    /**
     * @param array<string, array<string, string>> $defaultValues
     * @return list<array<string, mixed>>
     */
    private function compileAppointments(string $command, int $vanillaUid, array $defaultValues): array
    {
        $request = (new ServerRequest('https://example.com/typo3/record/edit'))
            ->withAttribute('applicationType', SystemEnvironmentBuilder::REQUESTTYPE_BE);

        $result = $this->get(FormDataCompiler::class)->compile(
            [
                'request' => $request,
                'tableName' => self::TABLE_EVENT,
                'vanillaUid' => $vanillaUid,
                'command' => $command,
                'defaultValues' => $defaultValues,
            ],
            $this->get(TcaDatabaseRecord::class),
        );

        return $result['processedTca']['columns']['appointments']['children'];
    }
}
