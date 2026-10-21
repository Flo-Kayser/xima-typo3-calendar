<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Service;

use Psr\Http\Message\ServerRequestInterface;
use TYPO3\CMS\Backend\Utility\BackendUtility;
use TYPO3\CMS\Extbase\Mvc\RequestInterface;

final class CalendarPageConfigurationService
{
    private const DEFAULT_START_TIME = '09:00';
    private const DEFAULT_END_TIME = '09:30';
    private const DEFAULT_ALL_DAY = false;
    private const DEFAULT_ENABLE_DRAG = true;
    private const DEFAULT_ENABLE_CLICK = true;
    private const DEFAULT_TIME_SLOT_MINUTES = 15;
    private const DEFAULT_SCROLL_TIME = '08:00:00';

    /** @var array<int, array<string, mixed>> */
    private array $pageTsConfig = [];

    public function isEventPreviewEnabled(RequestInterface $request): bool
    {
        return $this->isEnabled(
            $this->getCalendarPageTsConfig($request)['enableEventPreview'] ?? null,
            false,
        );
    }

    /** @return array{enableDragNewEvent: bool, enableClickNewEvent: bool, defaultStartTime: string, defaultEndTime: string, defaultAllDay: bool, timeSlotMinutes: int, scrollStartTime: string} */
    public function getNewEventConfiguration(RequestInterface $request): array
    {
        $config = $this->getCalendarPageTsConfig($request);
        $weekViewGrid = $this->asArray($config['weekViewGrid.'] ?? $config['weekViewGrid'] ?? []);
        $newEvent = $this->asArray($config['newEvent.'] ?? $config['newEvent'] ?? []);
        $interaction = $this->asArray($newEvent['interaction.'] ?? $newEvent['interaction'] ?? []);
        $defaults = $this->asArray($newEvent['defaults.'] ?? $newEvent['defaults'] ?? []);

        return [
            'enableDragNewEvent' => $this->isEnabled(
                $interaction['enableDrag'] ?? null,
                self::DEFAULT_ENABLE_DRAG,
            ),
            'enableClickNewEvent' => $this->isEnabled(
                $interaction['enableClick'] ?? null,
                self::DEFAULT_ENABLE_CLICK,
            ),
            'defaultStartTime' => $this->getValidTime(
                $defaults['startTime'] ?? null,
                self::DEFAULT_START_TIME,
            ),
            'defaultEndTime' => $this->getValidTime(
                $defaults['endTime'] ?? null,
                self::DEFAULT_END_TIME,
            ),
            'defaultAllDay' => $this->isEnabled(
                $defaults['allDay'] ?? null,
                self::DEFAULT_ALL_DAY,
            ),
            'timeSlotMinutes' => $this->getValidTimeSlotMinutes(
                $weekViewGrid['timeSlotMinutes'] ?? $config['timeSlotMinutes'] ?? null,
            ),
            'scrollStartTime' => $this->getValidTimeWithSeconds(
                $weekViewGrid['scrollStartTime']
                    ?? $weekViewGrid['scrollTime']
                    ?? $config['scrollStartTime']
                    ?? $config['scrollTime']
                    ?? null,
                self::DEFAULT_SCROLL_TIME,
            ),
        ];
    }

    /**
     * @return list<string>
     */
    public function getTooltipOrder(RequestInterface $request): array
    {
        $config = $this->getCalendarPageTsConfig($request);
        $configuredOrder = $config['tooltipOrder'] ?? '';

        if (is_array($configuredOrder)) {
            $configuredOrder = implode(',', array_map('strval', $configuredOrder));
        }

        if (!is_string($configuredOrder)) {
            return [];
        }

        $identifiers = array_map('trim', explode(',', $configuredOrder));
        $identifiers = array_filter(
            $identifiers,
            static fn (string $identifier): bool => $identifier !== '',
        );

        return array_values(array_unique($identifiers));
    }

    /** @return array<string, array<string, string>> */
    public function getFilterColors(RequestInterface|ServerRequestInterface $request): array
    {
        $config = $this->getCalendarPageTsConfig($request);
        $filterColors = $this->asArray($config['filterColors.'] ?? $config['filterColors'] ?? []);
        $result = [];

        foreach ($filterColors as $identifier => $colors) {
            $identifier = rtrim((string)$identifier, '.');
            $colors = $this->asArray($colors);
            $validatedColors = [];

            foreach ($colors as $itemValue => $color) {
                if (!is_numeric($itemValue) || !is_string($color) || !preg_match('/^#[0-9a-fA-F]{6}$/', $color)) {
                    continue;
                }

                $validatedColors[(string)(int)$itemValue] = $color;
            }

            if ($identifier !== '' && $validatedColors !== []) {
                $result[$identifier] = $validatedColors;
            }
        }

        return $result;
    }

    /**
     * @return array{
     *     iconSource: string,
     *     appearanceSource: string,
     *     colorSource: string
     * }
     */
    public function getEventAppearanceConfiguration(
        RequestInterface $request,
    ): array {
        $config = $this->getCalendarPageTsConfig($request);
        $eventAppearance = $this->asArray(
            $config['eventAppearance.'] ?? $config['eventAppearance'] ?? [],
        );

        return [
            'iconSource' => $this->getFilterIdentifier(
                $eventAppearance['iconSource'] ?? null,
                'recordTypes',
            ),
            'appearanceSource' => $this->getFilterIdentifier(
                $eventAppearance['appearanceSource'] ?? null,
                'statuses',
            ),
            'colorSource' => $this->getFilterIdentifier(
                $eventAppearance['colorSource'] ?? null,
                'categories',
            ),
        ];
    }

    private function getFilterIdentifier(
        mixed $value,
        string $default,
    ): string {
        if (!is_string($value) || trim($value) === '') {
            return $default;
        }

        return trim($value);
    }

    private function getValidTime(mixed $value, string $default): string
    {
        if (!is_string($value) || !preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $value)) {
            return $default;
        }

        return $value;
    }

    private function getValidTimeWithSeconds(mixed $value, string $default): string
    {
        if (!is_string($value)) {
            return $default;
        }

        if (preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $value)) {
            return $value . ':00';
        }

        if (preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/', $value)) {
            return $value;
        }

        return $default;
    }

    private function getValidTimeSlotMinutes(mixed $value): int
    {
        $minutes = null;
        if (is_int($value)) {
            $minutes = $value;
        } elseif (is_string($value) && preg_match('/^\s*(15|30|60)(?:\s|$)/', $value, $matches)) {
            $minutes = (int)$matches[1];
        }

        if ($minutes === 15 || $minutes === 30 || $minutes === 60) {
            return $minutes;
        }

        return self::DEFAULT_TIME_SLOT_MINUTES;
    }

    private function isEnabled(mixed $value, bool $default): bool
    {
        return (int)($value ?? ($default ? 1 : 0)) === 1;
    }

    /** @return array<string, mixed> */
    private function asArray(mixed $value): array
    {
        return is_array($value) ? $value : [];
    }

    /** @return array<string, mixed> */
    private function getCalendarPageTsConfig(RequestInterface|ServerRequestInterface $request): array
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
