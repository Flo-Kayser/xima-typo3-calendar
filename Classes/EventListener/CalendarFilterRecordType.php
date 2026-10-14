<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\EventListener;

use TYPO3\CMS\Core\Attribute\AsEventListener;
use TYPO3\CMS\Extbase\Utility\LocalizationUtility;
use Xima\XimaTypo3Calendar\Domain\Model\Dto\CheckboxCalendarFilter;
use Xima\XimaTypo3Calendar\Domain\Model\Dto\CheckboxCalendarFilterItem;
use Xima\XimaTypo3Calendar\Event\ConfigureCalendarFilterEvent;

final readonly class CalendarFilterRecordType
{
    #[AsEventListener(
        identifier: 'xima-typo3-calendar/calendar-filter-record-type',
        event: ConfigureCalendarFilterEvent::class,
        method: 'build',
    )]
    public function build(ConfigureCalendarFilterEvent $event): void
    {
        $filter = new CheckboxCalendarFilter(
            identifier: 'recordTypes',
            title: LocalizationUtility::translate(
                'filter.type.title',
                'xima_typo3_calendar',
            ) ?? 'Type',
        );

        $items = $GLOBALS['TCA']
            ['tx_ximatypo3calendar_domain_model_event']
            ['columns']
            ['record_type']
            ['config']
            ['items']
            ?? [];

        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $value = (string)($item['value'] ?? '');
            if ($value === '') {
                continue;
            }

            $label = (string)($item['label'] ?? $value);
            $translatedLabel = LocalizationUtility::translate(
                $label,
                'xima_typo3_calendar',
            ) ?? $value;

            $filter->addItem(
                new CheckboxCalendarFilterItem(
                    label: $translatedLabel,
                    value: $value,
                    icon: is_string($item['icon'] ?? null) ? $item['icon'] : null,
                ),
            );
        }

        if ($filter->items !== []) {
            $event->addFilter($filter);
        }
    }
}
