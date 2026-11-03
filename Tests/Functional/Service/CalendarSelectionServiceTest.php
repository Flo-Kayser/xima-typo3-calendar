<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Tests\Functional\Service;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use Xima\XimaTypo3Calendar\Service\CalendarSelectionService;
use Xima\XimaTypo3Calendar\Tests\Functional\AbstractCalendarFunctionalTestCase;

/**
 * Two sites: "Main calendar" on page 2 (site 1) and "Second site calendar" on the
 * hidden sysfolder 11 (site 10). Users come from Fixtures/backend-permissions.csv
 * and Fixtures/second-site-calendar.csv.
 */
final class CalendarSelectionServiceTest extends AbstractCalendarFunctionalTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->importCSVDataSet(__DIR__ . '/../Fixtures/backend-permissions.csv');
        $this->importCSVDataSet(__DIR__ . '/../Fixtures/calendar.csv');
        $this->importCSVDataSet(__DIR__ . '/../Fixtures/second-site-calendar.csv');
    }

    /**
     * @return iterable<string, array{int, list<int>}>
     */
    public static function availableCalendarsDataProvider(): iterable
    {
        yield 'admin sees the calendars of both sites' => [1, [1, 2]];
        yield 'editor of the first site' => [2, [1]];
        yield 'editor of the second site, calendar on a hidden sysfolder' => [7, [2]];
        yield 'appointment editor' => [6, [1]];
        yield 'editor without tables_modify' => [3, []];
        yield 'editor without content-edit permission' => [4, []];
        yield 'editor without web mount' => [5, []];
    }

    /**
     * @param list<int> $expectedUids
     */
    #[Test]
    #[DataProvider('availableCalendarsDataProvider')]
    public function offersOnlyCalendarsTheUserCanCreateRecordsIn(int $backendUserUid, array $expectedUids): void
    {
        $this->setUpBackendUser($backendUserUid);

        $calendars = $this->get(CalendarSelectionService::class)->getAvailableCalendars();

        self::assertSame($expectedUids, array_column($calendars, 'uid'));
    }

    #[Test]
    public function reportsTheStoragePageAndWhetherEventsMayBeCreated(): void
    {
        $this->setUpBackendUser(6);

        self::assertSame(
            ['uid' => 1, 'title' => 'Main calendar', 'pid' => 2, 'canCreateEvent' => false],
            $this->get(CalendarSelectionService::class)->findAvailableCalendar(1),
        );
    }

    #[Test]
    public function findsNoCalendarOutsideTheWebMounts(): void
    {
        $this->setUpBackendUser(2);

        self::assertNull($this->get(CalendarSelectionService::class)->findAvailableCalendar(2));
    }

    #[Test]
    public function remembersTheLastUsedCalendarWhileItIsAvailable(): void
    {
        $this->setUpBackendUser(1);
        $service = $this->get(CalendarSelectionService::class);

        self::assertNull($service->getLastUsedCalendarUid($service->getAvailableCalendars()));

        $service->rememberCalendar(2);

        self::assertSame(2, $service->getLastUsedCalendarUid($service->getAvailableCalendars()));
        self::assertNull($service->getLastUsedCalendarUid([]));
    }
}
