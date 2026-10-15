<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Controller\Backend;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use TYPO3\CMS\Core\Http\JsonResponse;
use Xima\XimaTypo3Calendar\Service\CalendarFilterService;
use Xima\XimaTypo3Calendar\Service\CalendarPageConfigurationService;

final class CalendarFilterController
{
    public function __construct(
        private readonly CalendarFilterService $filterService,
        private readonly CalendarPageConfigurationService $pageConfigurationService,
    ) {
    }

    public function optionsAction(ServerRequestInterface $request): ResponseInterface
    {
        $pageId = (int)($request->getQueryParams()['id'] ?? 0);

        return new JsonResponse([
            'success' => true,
            'filters' => $this->filterService->getFilters($pageId),
            'filterColors' => $this->pageConfigurationService->getFilterColors($request),
            'state' => $this->filterService->getState($pageId),
        ]);
    }

    public function saveStateAction(ServerRequestInterface $request): ResponseInterface
    {
        $state = $request->getParsedBody();
        if (!is_array($state) || $state === []) {
            $state = json_decode((string)$request->getBody(), true);
        }

        if (!is_array($state)) {
            return new JsonResponse(['success' => false], 400);
        }

        $pageId = (int)($request->getQueryParams()['id'] ?? 0);
        $this->filterService->saveState($state, $pageId);

        return new JsonResponse(['success' => true]);
    }

    public function saveViewAction(ServerRequestInterface $request): ResponseInterface
    {
        $body = $request->getParsedBody();
        if (!is_array($body) || !is_string($body['view'] ?? null)) {
            return new JsonResponse(['success' => false], 400);
        }

        $pageId = (int)($request->getQueryParams()['id'] ?? 0);
        $this->filterService->saveView($body['view'], $pageId);

        return new JsonResponse(['success' => true]);
    }
}
