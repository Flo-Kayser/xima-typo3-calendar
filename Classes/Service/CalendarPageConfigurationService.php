<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Service;

use TYPO3\CMS\Backend\Utility\BackendUtility;
use TYPO3\CMS\Extbase\Mvc\RequestInterface;

final class CalendarPageConfigurationService
{
    /** @var array<int, array<string, mixed>> */
    private array $pageTsConfig = [];

    public function isOptionEnabled(RequestInterface $request, string $option, bool $default = true): bool
    {
        return (int)$this->getValue($request, $option, $default ? 1 : 0) === 1;
    }

    public function getValue(RequestInterface $request, string $option, mixed $default = null): mixed
    {
        $value = $this->getCalendarPageTsConfig($request);
        foreach (explode('.', $option) as $part) {
            if (!is_array($value)) {
                return $default;
            }

            $nestedKey = $part . '.';
            if (array_key_exists($nestedKey, $value)) {
                $value = $value[$nestedKey];
            } elseif (array_key_exists($part, $value)) {
                $value = $value[$part];
            } else {
                return $default;
            }
        }

        return $value;
    }

    /** @return array<string, mixed> */
    private function getCalendarPageTsConfig(RequestInterface $request): array
    {
        $pageId = (int)($request->getQueryParams()['id'] ?? 0);
        if (!array_key_exists($pageId, $this->pageTsConfig)) {
            $pageTsConfig = BackendUtility::getPagesTSconfig($pageId);
            $this->pageTsConfig[$pageId] = is_array($pageTsConfig['mod.']['tx_ximatypo3calendar.'] ?? null)
                ? $pageTsConfig['mod.']['tx_ximatypo3calendar.']
                : [];
        }

        return $this->pageTsConfig[$pageId];
    }
}
