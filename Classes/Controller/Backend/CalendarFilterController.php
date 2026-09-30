<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Controller\Backend;

use Psr\Http\Message\ResponseInterface;
use TYPO3\CMS\Core\Http\JsonResponse;
use Xima\XimaTypo3Calendar\Service\CalendarFilterService;

final class CalendarFilterController
{
    public function __construct(
        private readonly CalendarFilterService $filterService,
    ) {
    }

    public function optionsAction(): ResponseInterface
    {
        return new JsonResponse([
            'success' => true,
            'options' => $this->filterService->getOptions(),
            'state' => $this->filterService->getState(),
        ]);
    }
}
