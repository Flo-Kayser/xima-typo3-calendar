<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Controller\Backend;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
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

    public function saveStateAction(ServerRequestInterface $request): ResponseInterface
    {
        $state = $request->getParsedBody();
        if (!is_array($state)) {
            return new JsonResponse(['success' => false], 400);
        }

        $this->filterService->saveState($state);

        return new JsonResponse(['success' => true]);
    }
}
