<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Domain\Model\Dto;

final class CheckboxCalendarFilter extends AbstractCalendarFilter
{
    public function __construct(
        private readonly string $identifier,
        private readonly string $title = '',
    ) {
    }

    /**
     * @var list<CheckboxCalendarFilterItem>
     */
    public array $items = [];

    public function getIdentifier(): string
    {
        return $this->identifier;
    }

    public function addItem(CheckboxCalendarFilterItem $item): void
    {
        $this->items[] = $item;
    }

    /**
     * @return array{
     *     type: 'checkbox-list',
     *     identifier: string,
     *     title: string,
     *     items: list<CheckboxCalendarFilterItem>,
     * }
     */
    public function jsonSerialize(): array
    {
        return [
            'type' => 'checkbox-list',
            'identifier' => $this->identifier,
            'title' => $this->title,
            'items' => $this->items,
        ];
    }
}
