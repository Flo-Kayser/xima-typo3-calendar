<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Tests\Functional\Domain\Repository;

use PHPUnit\Framework\Attributes\Test;
use Xima\XimaTypo3Calendar\Domain\Repository\EntryRepository;
use Xima\XimaTypo3Calendar\Tests\Functional\AbstractCalendarFunctionalTestCase;

final class EntryRepositoryTest extends AbstractCalendarFunctionalTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->importCSVDataSet(__DIR__ . '/../../Fixtures/pages.csv');
        $this->importCSVDataSet(__DIR__ . '/../../Fixtures/calendar.csv');
        $this->importCSVDataSet(__DIR__ . '/../../Fixtures/calendar-categories.csv');
    }

    #[Test]
    public function backendCalendarEntriesIncludeAppointmentsOverlappingTheRequestedWindow(): void
    {
        $rows = $this->get(EntryRepository::class)->getBackendCalendarEntries(
            1767227400,
            1767231000,
        );

        self::assertContains(1, array_map('intval', array_column($rows, 'uid')));
    }

    #[Test]
    public function backendCalendarEntriesCanBeFilteredByEventStatus(): void
    {
        $rows = $this->get(EntryRepository::class)->getBackendCalendarEntries(
            1767225600,
            1767229200,
            [],
            ['statuses' => [2]],
        );

        self::assertSame([1], array_map('intval', array_column($rows, 'uid')));
    }

    #[Test]
    public function backendCalendarEntriesCanBeFilteredByCanceledStatus(): void
    {
        $rows = $this->get(EntryRepository::class)->getBackendCalendarEntries(
            1767225600,
            1767229200,
            [],
            ['statuses' => ['canceled']],
        );

        self::assertSame([2], array_map('intval', array_column($rows, 'uid')));
    }

    #[Test]
    public function canceledStatusNarrowsSelectedEventStatuses(): void
    {
        $rows = $this->get(EntryRepository::class)->getBackendCalendarEntries(
            1767225600,
            1767229200,
            [],
            ['statuses' => [2, 'canceled']],
        );

        self::assertSame([], $rows);
    }

    #[Test]
    public function backendCalendarEntriesCanBeFilteredByParentEventType(): void
    {
        $rows = $this->get(EntryRepository::class)->getBackendCalendarEntries(
            1767225600,
            1767229200,
            [],
            ['types' => ['event']],
        );

        self::assertCount(2, $rows);

        $rows = $this->get(EntryRepository::class)->getBackendCalendarEntries(
            1767225600,
            1767229200,
            [],
            ['types' => ['event-appointment']],
        );

        self::assertSame([], $rows);
    }

    #[Test]
    public function backendCalendarEntriesCanBeFilteredByCategory(): void
    {
        $rows = $this->get(EntryRepository::class)->getBackendCalendarEntries(
            1767225600,
            1767229200,
            [],
            ['categories' => [2]],
        );

        self::assertSame([2], array_map('intval', array_column($rows, 'uid')));
    }
}
