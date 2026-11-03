<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Event;

use Psr\Http\Message\ServerRequestInterface;
use Xima\XimaTypo3Calendar\Domain\Model\Dto\AbstractCalendarFilter;

final class ConfigureCalendarFilterEvent
{
    /**
     * @var list<AbstractCalendarFilter>
     */
    private array $filters = [];

    /**
     * @param list<AbstractCalendarFilter> $filters
     */
    public function __construct(
        private readonly ServerRequestInterface $request,
        array $filters = [],
    ) {
        $this->filters = $filters;
    }

    public function getRequest(): ServerRequestInterface
    {
        return $this->request;
    }

    /**
     * @return list<AbstractCalendarFilter>
     */
    public function getFilters(): array
    {
        return $this->filters;
    }

    /**
     * @param list<AbstractCalendarFilter> $filters
     */
    public function setFilters(array $filters): void
    {
        $this->filters = $filters;
    }

    public function addFilter(AbstractCalendarFilter $filter): void
    {
        $this->filters[] = $filter;
    }
}
