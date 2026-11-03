<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Service;

use TYPO3\CMS\Core\Authentication\BackendUserAuthentication;
use TYPO3\CMS\Core\Database\ConnectionPool;

/**
 * The calendars the current backend user can create records in from the calendar module.
 *
 * New records are stored on the page of the chosen calendar, so a calendar is only
 * offered if the user may create appointments on that page.
 */
final class CalendarSelectionService
{
    private const TABLE = 'tx_ximatypo3calendar_domain_model_calendar';
    private const MODULE_DATA_KEY = 'calendar_calendar_creation';

    public function __construct(
        private readonly ConnectionPool $connectionPool,
        private readonly CalendarPermissionService $permissionService,
    ) {
    }

    /**
     * @return list<array{uid: int, title: string, pid: int, canCreateEvent: bool}>
     */
    public function getAvailableCalendars(): array
    {
        $queryBuilder = $this->connectionPool->getQueryBuilderForTable(self::TABLE);
        $rows = $queryBuilder
            ->select('uid', 'pid', 'title')
            ->from(self::TABLE)
            ->orderBy('title', 'ASC')
            ->addOrderBy('uid', 'ASC')
            ->executeQuery()
            ->fetchAllAssociative();

        $calendars = [];
        foreach ($rows as $row) {
            $pid = (int)$row['pid'];
            if (!$this->permissionService->canCreateAppointmentAtPid($pid)) {
                continue;
            }
            $calendars[] = [
                'uid' => (int)$row['uid'],
                'title' => (string)$row['title'],
                'pid' => $pid,
                'canCreateEvent' => $this->permissionService->canCreateEventAtPid($pid),
            ];
        }

        return $calendars;
    }

    /**
     * @return array{uid: int, title: string, pid: int, canCreateEvent: bool}|null
     */
    public function findAvailableCalendar(int $calendarUid): ?array
    {
        foreach ($this->getAvailableCalendars() as $calendar) {
            if ($calendar['uid'] === $calendarUid) {
                return $calendar;
            }
        }

        return null;
    }

    /**
     * The calendar the user created the last record in, as long as it's still available.
     *
     * @param list<array{uid: int, title: string, pid: int, canCreateEvent: bool}> $availableCalendars
     */
    public function getLastUsedCalendarUid(array $availableCalendars): ?int
    {
        $uid = (int)($this->getBackendUser()?->getModuleData(self::MODULE_DATA_KEY)['calendar'] ?? 0);

        return in_array($uid, array_column($availableCalendars, 'uid'), true) ? $uid : null;
    }

    public function rememberCalendar(int $calendarUid): void
    {
        $this->getBackendUser()?->pushModuleData(self::MODULE_DATA_KEY, ['calendar' => $calendarUid]);
    }

    private function getBackendUser(): ?BackendUserAuthentication
    {
        $backendUser = $GLOBALS['BE_USER'] ?? null;

        return $backendUser instanceof BackendUserAuthentication ? $backendUser : null;
    }
}
