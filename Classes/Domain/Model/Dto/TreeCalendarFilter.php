<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Domain\Model\Dto;

final class TreeCalendarFilter extends AbstractCalendarFilter
{
    /**
     * @var list<TreeCalendarFilterItem>
     */
    public array $items = [];

    public function __construct(
        private readonly string $identifier,
    ){}

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
     *     items: list<TreeCalendarFilterItem>
     *         }
     */
    public function jsonSerialize(): array
    {
        return [
            'identifier' => $this->identifier,
            'items' => $this->items,
        ];
    }
}
