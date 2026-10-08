<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\EventListener;

use TYPO3\CMS\Core\Attribute\AsEventListener;
use TYPO3\CMS\Core\Database\Connection;
use TYPO3\CMS\Core\Database\ConnectionPool;
use Xima\XimaTypo3Calendar\Domain\Model\Dto\TreeCalendarFilter;
use Xima\XimaTypo3Calendar\Domain\Model\Dto\TreeCalendarFilterItem;
use Xima\XimaTypo3Calendar\Event\ApplyCalendarFilterEvent;
use Xima\XimaTypo3Calendar\Event\ConfigureCalendarFilterEvent;

final readonly class CalendarFilterCategory
{

    public function __construct(
        private ConnectionPool $connectionPool,
    ) {
    }

    /**
     * @return list<TreeCalendarFilterItem>
     */
    private function getCategories(): array
    {
        $queryBuilder = $this->connectionPool->getQueryBuilderForTable('sys_category');


        $rows = $queryBuilder
            ->select('uid', 'title', 'parent')
            ->from('sys_category')
            ->where(
                $queryBuilder->expr()->eq(
                    'deleted',
                    $queryBuilder->createNamedParameter(0, Connection::PARAM_INT,
                    ),
                ),
                $queryBuilder->expr()->eq(
                    'sys_language_uid',
                    $queryBuilder->createNamedParameter(0, Connection::PARAM_INT,
                    ),
                ),

            )
            ->orderBy('sorting')
            ->addOrderBy('title')
            ->executeQuery()
            ->fetchAllAssociative();

        $categoriesByUid = [];
        foreach ($rows as $row) {
            $categoriesByUid[(int)$row['uid']] = $row;
        }

        $usedUids = $this->getUsedCategoryUids();

        $visibleUids = [];

        foreach ($usedUids as $uid) {
            while ($uid > 0 && isset($categoriesByUid[$uid])) {
                if (isset($visibleUids[$uid])) {
                    break;
                }

                $visibleUids[$uid] = true;
                $uid = (int)$categoriesByUid[$uid]['parent'];
            }
        }

        $items = [];

        foreach (array_keys($visibleUids) as $uid) {
            $row = $categoriesByUid[$uid];

            $items[$uid] = new TreeCalendarFilterItem(
                label: (string)$row['title'],
                value: $uid,
            );
        }

        foreach (array_keys($visibleUids) as $uid) {
            $parentUid = (int)$categoriesByUid[$uid]['parent'];

            if ($parentUid > 0 && isset($items[$parentUid])) {
                $items[$uid]->parent = $items[$parentUid];
            }
        }

        return array_values($items);
    }

    /**
     * @return list<int>
     */
    private function getUsedCategoryUids(): array
    {
        $queryBuilder = $this->connectionPool->getQueryBuilderForTable('sys_category_record_mm');

        $eventTable = 'tx_ximatypo3calendar_domain_model_event';

        $rows = $queryBuilder
            ->select('mm.uid_local')
            ->distinct()
            ->from('sys_category_record_mm', 'mm')
            ->innerJoin(
                'mm',
                $eventTable,
                'event',
                'event.uid = mm.uid_foreign'
            )
            ->innerJoin(
                'mm',
                'sys_category',
                'category',
                'category.uid = mm.uid_local'
            )
            ->where(
                $queryBuilder->expr()->eq(
                    'mm.tablenames',
                    $queryBuilder->createNamedParameter($eventTable, Connection::PARAM_STR),
                ),
                $queryBuilder->expr()->eq(
                    'mm.fieldname',
                    $queryBuilder->createNamedParameter('categories', Connection::PARAM_STR),
                ),
                $queryBuilder->expr()->eq(
                    'event.deleted',
                    $queryBuilder->createNamedParameter(0, Connection::PARAM_INT),
                ),
                $queryBuilder->expr()->eq(
                    'category.deleted',
                    $queryBuilder->createNamedParameter(0, Connection::PARAM_INT),
                ),
            )
            ->executeQuery()
            ->fetchFirstColumn();

        return array_map(
            static fn (mixed $value): int => (int)$value,
            $rows,
        );
    }


    #[AsEventListener(
        identifier: 'xima-typo3-calendar/configure-calendar-filter',
        event: ConfigureCalendarFilterEvent::class,
        method: 'build',
    )]
    public function build(ConfigureCalendarFilterEvent $event): void
    {
        $filter = new TreeCalendarFilter('categories');

        foreach ($this->getCategories() as $item) {
            $filter->addItem($item);
        }

        $event->addFilter($filter);
    }

    #[AsEventListener(
        identifier: 'xima-typo3-calendar/apply-category-filter',
        event: ApplyCalendarFilterEvent::class,
        method: 'apply',
    )]
    public function apply(ApplyCalendarFilterEvent $event): void
    {
        //
    }
}
