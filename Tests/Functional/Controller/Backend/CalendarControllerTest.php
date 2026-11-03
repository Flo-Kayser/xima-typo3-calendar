<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Tests\Functional\Controller\Backend;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use Psr\Http\Message\ResponseInterface;
use TYPO3\CMS\Backend\Routing\UriBuilder;
use TYPO3\CMS\Core\Database\ConnectionPool;
use TYPO3\CMS\Core\Http\ServerRequest;
use TYPO3\CMS\Core\Localization\LanguageServiceFactory;
use Xima\XimaTypo3Calendar\Controller\Backend\CalendarEventCreationController;
use Xima\XimaTypo3Calendar\Service\CalendarPermissionService;
use Xima\XimaTypo3Calendar\Service\CalendarSelectionService;
use Xima\XimaTypo3Calendar\Service\CalendarStoragePidResolver;
use Xima\XimaTypo3Calendar\Tests\Functional\AbstractCalendarFunctionalTestCase;
use Xima\XimaTypo3Calendar\Tests\Functional\Fixtures\RecordingEventListener;

/**
 * Runs as real backend users from Fixtures/backend-permissions.csv, so the
 * permission check sees the same table, page and mount rights as DataHandler.
 */
final class CalendarControllerTest extends AbstractCalendarFunctionalTestCase
{
    private const ADMIN = 1;
    private const EDITOR = 2;
    private const EDITOR_WITHOUT_TABLES = 3;
    private const EDITOR_WITHOUT_PAGE_ACCESS = 4;
    private const EDITOR_WITHOUT_MOUNT = 5;
    private const APPOINTMENT_EDITOR = 6;

    protected function setUp(): void
    {
        parent::setUp();

        $this->importCSVDataSet(__DIR__ . '/../../Fixtures/backend-permissions.csv');
        $this->importCSVDataSet(__DIR__ . '/../../Fixtures/calendar.csv');
        $this->get(ConnectionPool::class)
            ->getConnectionForTable('pages')
            ->update('pages', ['module' => 'events'], ['uid' => 2]);
    }

    #[Test]
    public function rejectsANonArrayPayload(): void
    {
        $this->actAs(self::ADMIN);

        $response = $this->controller()->newRecordAction(
            (new ServerRequest('https://example.com/typo3/'))->withParsedBody(new \stdClass())
        );

        self::assertSame(400, $response->getStatusCode());
        self::assertSame(['success' => false, 'message' => 'Invalid event data.'], $this->decode($response));
    }

    #[Test]
    public function rejectsAnUnknownCreationType(): void
    {
        $this->actAs(self::ADMIN);

        $response = $this->newRecord(['type' => 'unknown']);

        self::assertSame(400, $response->getStatusCode());
        self::assertSame(['success' => false, 'message' => 'Invalid creation type.'], $this->decode($response));
    }

    #[Test]
    public function opensANewAppointmentFormPrefilledWithTheSelection(): void
    {
        $this->actAs(self::EDITOR);

        $query = $this->formQuery($this->newRecord(['type' => 'event-appointment', 'allDay' => 1]));

        self::assertSame([self::TABLE_ENTRY => [2 => 'new']], $query['edit'] ?? null);
        self::assertSame(
            [
                self::TABLE_ENTRY => [
                    'record_type' => 'event-appointment',
                    'start_date' => '1767225600',
                    'end_date' => '1767229200',
                    'all_day' => '1',
                    'calendar' => '1',
                ],
            ],
            $query['defVals'] ?? null,
        );
        self::assertStringContainsString('/module/calendar/calendar', (string)($query['returnUrl'] ?? ''));
    }

    #[Test]
    public function opensANewEventFormWithTheSelectionAsAppointmentDefaults(): void
    {
        $this->actAs(self::EDITOR);

        $query = $this->formQuery($this->newRecord(['type' => 'event', 'recordType' => 'plain-event']));

        self::assertSame([self::TABLE_EVENT => [2 => 'new']], $query['edit'] ?? null);
        self::assertSame(['record_type' => 'plain-event'], $query['defVals'][self::TABLE_EVENT] ?? null);
        self::assertSame(
            [
                'record_type' => 'event-appointment',
                'start_date' => '1767225600',
                'end_date' => '1767229200',
                'all_day' => '0',
                'calendar' => '1',
            ],
            $query['defVals'][self::TABLE_ENTRY] ?? null,
        );
    }

    #[Test]
    public function writesNoRecordAndDispatchesNoChangeEventBeforeTheFormIsSaved(): void
    {
        $this->actAs(self::ADMIN);
        $listener = $this->get(RecordingEventListener::class);
        $listener->reset();
        $eventsBefore = $this->countRows(self::TABLE_EVENT);
        $entriesBefore = $this->countRows(self::TABLE_ENTRY);

        foreach (['event', 'event-appointment'] as $type) {
            self::assertSame(200, $this->newRecord(['type' => $type])->getStatusCode());
        }

        self::assertSame($eventsBefore, $this->countRows(self::TABLE_EVENT));
        self::assertSame($entriesBefore, $this->countRows(self::TABLE_ENTRY));
        self::assertSame([], $listener->all());
    }

    /**
     * @return iterable<string, array{int, string}>
     */
    public static function allowedCreationDataProvider(): iterable
    {
        yield 'admin, event' => [self::ADMIN, 'event'];
        yield 'admin, appointment' => [self::ADMIN, 'event-appointment'];
        yield 'editor with table and page permission, event' => [self::EDITOR, 'event'];
        yield 'editor with table and page permission, appointment' => [self::EDITOR, 'event-appointment'];
        yield 'appointment editor, appointment' => [self::APPOINTMENT_EDITOR, 'event-appointment'];
    }

    #[Test]
    #[DataProvider('allowedCreationDataProvider')]
    public function opensTheFormWhenTheUserMayEditTheStoragePage(int $backendUserUid, string $type): void
    {
        $this->actAs($backendUserUid);

        $response = $this->newRecord(['type' => $type]);

        self::assertSame(200, $response->getStatusCode(), (string)$response->getBody());
        self::assertTrue($this->decode($response)['success'] ?? false);
    }

    /**
     * @return iterable<string, array{int, string}>
     */
    public static function refusedCreationDataProvider(): iterable
    {
        yield 'editor without tables_modify, event' => [self::EDITOR_WITHOUT_TABLES, 'event'];
        yield 'editor without tables_modify, appointment' => [self::EDITOR_WITHOUT_TABLES, 'event-appointment'];
        yield 'editor without content-edit permission, event' => [self::EDITOR_WITHOUT_PAGE_ACCESS, 'event'];
        yield 'editor without content-edit permission, appointment' => [self::EDITOR_WITHOUT_PAGE_ACCESS, 'event-appointment'];
        yield 'editor without web mount, appointment' => [self::EDITOR_WITHOUT_MOUNT, 'event-appointment'];
        yield 'appointment editor, event' => [self::APPOINTMENT_EDITOR, 'event'];
    }

    #[Test]
    #[DataProvider('refusedCreationDataProvider')]
    public function refusesCreationWhenTheUserMayNotEditTheStoragePage(int $backendUserUid, string $type): void
    {
        $this->actAs($backendUserUid);

        $response = $this->newRecord(['type' => $type]);

        self::assertSame(403, $response->getStatusCode());
        self::assertSame(['success' => false, 'message' => 'No permission to create events.'], $this->decode($response));
    }

    #[Test]
    public function translatesTheRefusalMessage(): void
    {
        $this->actAs(self::EDITOR_WITHOUT_TABLES);
        $GLOBALS['LANG'] = $this->get(LanguageServiceFactory::class)->create('de');

        $response = $this->newRecord();

        self::assertSame(403, $response->getStatusCode());
        self::assertSame('Keine Berechtigung, Events anzulegen.', $this->decode($response)['message'] ?? null);
    }

    #[Test]
    public function refusesACalendarThatDoesNotBelongToTheStoragePage(): void
    {
        $this->actAs(self::EDITOR);

        $response = $this->newRecord(['calendarUid' => 999]);

        self::assertSame(400, $response->getStatusCode());
        self::assertSame(['success' => false, 'message' => 'Invalid calendar.'], $this->decode($response));
    }

    private function actAs(int $backendUserUid): void
    {
        $backendUser = $this->setUpBackendUser($backendUserUid);
        $GLOBALS['LANG'] = $this->get(LanguageServiceFactory::class)->createFromUserPreferences($backendUser);
    }

    /**
     * @param array<string, mixed> $overrides
     */
    private function newRecord(array $overrides = []): ResponseInterface
    {
        $payload = array_replace([
            'start' => 1767225600,
            'end' => 1767229200,
            'allDay' => 0,
            'type' => 'event-appointment',
            'calendarUid' => 1,
        ], $overrides);

        return $this->controller()->newRecordAction(
            (new ServerRequest('https://example.com/typo3/'))->withParsedBody($payload)
        );
    }

    /**
     * @return array<string, mixed> the query of the returned record_edit URL
     */
    private function formQuery(ResponseInterface $response): array
    {
        self::assertSame(200, $response->getStatusCode(), (string)$response->getBody());
        $url = (string)($this->decode($response)['url'] ?? '');
        self::assertStringContainsString('/record/edit', $url);
        parse_str((string)parse_url($url, PHP_URL_QUERY), $query);

        return $query;
    }

    private function countRows(string $table): int
    {
        return $this->get(ConnectionPool::class)->getConnectionForTable($table)->count('*', $table, []);
    }

    private function controller(): CalendarEventCreationController
    {
        return new CalendarEventCreationController(
            $this->get(CalendarStoragePidResolver::class),
            new CalendarPermissionService(),
            $this->get(CalendarSelectionService::class),
            $this->get(UriBuilder::class),
        );
    }

    /** @return array<string, mixed> */
    private function decode(ResponseInterface $response): array
    {
        return (array)json_decode((string)$response->getBody(), true, 512, JSON_THROW_ON_ERROR);
    }
}
