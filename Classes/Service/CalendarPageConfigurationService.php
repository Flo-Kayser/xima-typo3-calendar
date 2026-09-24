<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Service;

use TYPO3\CMS\Backend\Utility\BackendUtility;
use TYPO3\CMS\Extbase\Mvc\RequestInterface;

final class CalendarPageConfigurationService
{
    private const DEFAULT_START_TIME = '09:00';
    private const DEFAULT_END_TIME = '09:30';
    private const DEFAULT_ALL_DAY = false;
    private const DEFAULT_ENABLE_DRAG = true;
    private const DEFAULT_ENABLE_CLICK = true;

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

    /** @return array{enableDragNewEvent: bool, enableClickNewEvent: bool, defaultStartTime: string, defaultEndTime: string, defaultAllDay: bool} */
    public function getNewEventConfiguration(RequestInterface $request): array
    {
        return [
            'enableDragNewEvent' => $this->isOptionEnabled(
                $request,
                'newEvent.interaction.enableDrag',
                self::DEFAULT_ENABLE_DRAG,
            ),
            'enableClickNewEvent' => $this->isOptionEnabled(
                $request,
                'newEvent.interaction.enableClick',
                self::DEFAULT_ENABLE_CLICK,
            ),
            'defaultStartTime' => $this->getValidTime(
                $request,
                'newEvent.defaults.startTime',
                self::DEFAULT_START_TIME,
            ),
            'defaultEndTime' => $this->getValidTime(
                $request,
                'newEvent.defaults.endTime',
                self::DEFAULT_END_TIME,
            ),
            'defaultAllDay' => $this->isOptionEnabled(
                $request,
                'newEvent.defaults.allDay',
                self::DEFAULT_ALL_DAY,
            ),
        ];
    }

    private function getValidTime(RequestInterface $request, string $option, string $default): string
    {
        $value = $this->getValue($request, $option, $default);
        if (!is_string($value) || !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $value)) {
            return $default;
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
