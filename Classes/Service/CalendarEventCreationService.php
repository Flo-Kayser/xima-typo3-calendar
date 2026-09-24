<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Service;

use TYPO3\CMS\Core\Database\Connection;
use TYPO3\CMS\Core\Database\ConnectionPool;
use TYPO3\CMS\Core\DataHandling\DataHandler;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Core\Utility\StringUtility;
use Xima\XimaTypo3Calendar\Utility\RecordTypeUtility;

final class CalendarEventCreationService
{
    private const EVENT_TABLE = 'tx_ximatypo3calendar_domain_model_event';
    private const ENTRY_TABLE = 'tx_ximatypo3calendar_domain_model_entry';

    public function __construct(
        private readonly ConnectionPool $connectionPool,
    ) {
    }

    /**
     * @return array{success: bool, eventUid?: int, entryUid?: int, errors?: array<int, mixed>, message?: string}
     */
    public function create(int $pid, int $start, int $end, bool $allDay): array
    {
        $newEventId = StringUtility::getUniqueId('NEW');
        $eventData = ['pid' => $pid];
        $eventRecordType = RecordTypeUtility::getDefault(self::EVENT_TABLE);
        if ($eventRecordType !== null) {
            $eventData['record_type'] = $eventRecordType;
        }

        $dataMap = [
            self::EVENT_TABLE => [
                $newEventId => $eventData,
            ],
        ];

        $newEntryId = StringUtility::getUniqueId('NEW');
        $dataMap[self::ENTRY_TABLE] = [
            $newEntryId => [
                'pid' => $pid,
                'record_type' => 'event-appointment',
                'event' => $newEventId,
                'start_date' => $start,
                'end_date' => $end,
                'all_day' => $allDay ? 1 : 0,
            ],
        ];

        $dataHandler = GeneralUtility::makeInstance(DataHandler::class);
        $dataHandler->start($dataMap, []);
        $dataHandler->process_datamap();

        if ($dataHandler->errorLog !== []) {
            return ['success' => false, 'errors' => $dataHandler->errorLog];
        }

        $eventUid = (int)($dataHandler->substNEWwithIDs[$newEventId] ?? 0);
        if ($eventUid <= 0) {
            return ['success' => false, 'message' => 'Event could not be created.'];
        }

        $result = ['success' => true, 'eventUid' => $eventUid];
        $entryUid = (int)($dataHandler->substNEWwithIDs[$newEntryId] ?? 0);
        if ($entryUid <= 0) {
            return ['success' => false, 'message' => 'Appointment could not be created.'];
        }
        $result['entryUid'] = $entryUid;

        return $result;
    }

    public function cleanup(int $eventUid): bool
    {
        $eventQueryBuilder = $this->connectionPool->getQueryBuilderForTable(self::EVENT_TABLE);
        $event = $eventQueryBuilder
            ->select('uid', 'title')
            ->from(self::EVENT_TABLE)
            ->where($eventQueryBuilder->expr()->eq(
                'uid',
                $eventQueryBuilder->createNamedParameter($eventUid, Connection::PARAM_INT)
            ))
            ->setMaxResults(1)
            ->executeQuery()
            ->fetchAssociative();

        if ($event === false) {
            return true;
        }

        $entryQueryBuilder = $this->connectionPool->getQueryBuilderForTable(self::ENTRY_TABLE);
        $entries = $entryQueryBuilder
            ->select('uid', 'title')
            ->from(self::ENTRY_TABLE)
            ->where($entryQueryBuilder->expr()->eq(
                'event',
                $entryQueryBuilder->createNamedParameter($eventUid, Connection::PARAM_INT)
            ))
            ->executeQuery()
            ->fetchAllAssociative();

        $hasContent = trim((string)$event['title']) !== ''
            || array_reduce(
                $entries,
                static fn (bool $hasTitle, array $entry): bool => $hasTitle || trim((string)$entry['title']) !== '',
                false,
            );
        if ($hasContent) {
            return true;
        }

        $commandMap = [self::EVENT_TABLE => [$eventUid => ['delete' => 1]]];
        foreach ($entries as $entry) {
            $commandMap[self::ENTRY_TABLE][(int)$entry['uid']] = ['delete' => 1];
        }

        $dataHandler = GeneralUtility::makeInstance(DataHandler::class);
        $dataHandler->start([], $commandMap);
        $dataHandler->process_cmdmap();

        return $dataHandler->errorLog === [];
    }
}
