<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Utility;

final class CalendarFeedRequestUtility
{
    private const DEFAULT_START_TIMESTAMP = 0;
    private const DEFAULT_END_TIMESTAMP = 253402300799;

    /**
     * @param array<string, mixed> $queryParams
     */
    public static function getStartTimestamp(array $queryParams): int
    {
        return self::parseTimestamp($queryParams['start'] ?? null, self::DEFAULT_START_TIMESTAMP);
    }

    /**
     * @param array<string, mixed> $queryParams
     */
    public static function getEndTimestamp(array $queryParams): int
    {
        return self::parseTimestamp($queryParams['end'] ?? null, self::DEFAULT_END_TIMESTAMP);
    }

    /**
     * @param array<string, mixed> $queryParams
     * @return int[]
     */
    public static function getCalendarUids(array $queryParams): array
    {
        return array_map('intval', (array)($queryParams['calendars'] ?? []));
    }

    public static function getRecordTypes(array $queryParams): array
    {
        $values = self::getListValues($queryParams['types'] ?? []);

        return array_values(array_unique(array_filter(
            array_map(static fn (string $value): string => trim($value), $values),
            static fn (string $value): bool => $value !== '',
        )));
    }

    public static function getCategoryUids(array $queryParams): array
    {
        return self::getIntegerList($queryParams['categories'] ?? []);
    }

    public static function getStatuses(array $queryParams): array
    {
        $values = self::getListValues($queryParams['statuses'] ?? []);

        return array_values(array_unique(array_filter(
            array_map(static fn (string $item): int|string => is_numeric($item) ? (int)$item : $item, $values),
            static fn (int|string $item): bool => is_int($item) ? $item >= 0 : $item === 'canceled',
        )));
    }

    private static function getListValues(mixed $value): array
    {
        $values = is_array($value) ? $value : [$value];
        $result = [];
        foreach ($values as $item) {
            if (!is_scalar($item)) {
                continue;
            }

            foreach (explode(',', (string)$item) as $part) {
                $result[] = trim($part);
            }
        }

        return $result;
    }

    private static function getIntegerList(mixed $value): array
    {
        $values = self::getListValues($value);

        return array_values(array_unique(array_filter(
            array_map(static fn (string $item): int => is_numeric($item) ? (int)$item : 0, $values),
            static fn (int $item): bool => $item > 0,
        )));
    }

    private static function parseTimestamp(mixed $value, int $default): int
    {
        if (!is_scalar($value) || trim((string)$value) === '') {
            return $default;
        }

        try {
            return (new \DateTimeImmutable((string)$value))->getTimestamp();
        } catch (\Exception) {
            return $default;
        }
    }
}
