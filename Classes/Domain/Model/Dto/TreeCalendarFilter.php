<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Domain\Model\Dto;

final class TreeCalendarFilter extends AbstractCalendarFilter
{

    public function __construct(
        private readonly string $identifier,
        private readonly string $title = '',
        private readonly bool $colorCoded = false,
    ) {
    }

    /**
     * @var list<TreeCalendarFilterItem>
     */
    public array $items = [];
    public function getIdentifier(): string
    {
        return $this->identifier;
    }

    public function addItem(TreeCalendarFilterItem $item): void
    {
        $this->items[] = $item;
    }

    /**
     * @return array{
     *     identifier: string,
     *     title: string,
     *     colorCoded: bool,
     *     items: list<TreeCalendarFilterItem>
     *         }
     */
    public function jsonSerialize(): array
    {
        return [
            'identifier' => $this->identifier,
            'title' => $this->title,
            'colorCoded' => $this->colorCoded,
            'items' => $this->items,
        ];
    }
}
