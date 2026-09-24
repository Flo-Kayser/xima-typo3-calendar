<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Service;

use TYPO3\CMS\Core\Database\Connection;
use TYPO3\CMS\Core\Database\ConnectionPool;

final class CalendarStoragePidResolver
{
    private ?int $resolvedPid = null;

    public function __construct(
        private readonly ConnectionPool $connectionPool,
    ) {
    }

    public function resolveStoragePid(): int
    {
        if ($this->resolvedPid !== null) {
            return $this->resolvedPid;
        }

        $queryBuilder = $this->connectionPool->getQueryBuilderForTable('pages');
        $pid = $queryBuilder
            ->select('uid')
            ->from('pages')
            ->where($queryBuilder->expr()->eq('module', $queryBuilder->createNamedParameter('events')))
            ->orderBy('uid')
            ->setMaxResults(1)
            ->executeQuery()
            ->fetchOne();

        if ($pid) {
            return $this->resolvedPid = (int)$pid;
        }

        $queryBuilder = $this->connectionPool->getQueryBuilderForTable(
            'tx_ximatypo3calendar_domain_model_entry',
        );

        return $this->resolvedPid = (int)$queryBuilder
            ->select('pid')
            ->from('tx_ximatypo3calendar_domain_model_entry')
            ->where($queryBuilder->expr()->eq(
                'deleted',
                $queryBuilder->createNamedParameter(0, Connection::PARAM_INT),
            ))
            ->orderBy('pid')
            ->setMaxResults(1)
            ->executeQuery()
            ->fetchOne();
    }
}
