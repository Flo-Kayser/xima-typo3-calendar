<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Controller\Backend;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use TYPO3\CMS\Core\Http\JsonResponse;
use Xima\XimaTypo3Calendar\Service\CalendarEventCreationService;
use Xima\XimaTypo3Calendar\Service\CalendarPermissionService;
use Xima\XimaTypo3Calendar\Service\CalendarStoragePidResolver;

final class CalendarEventCreationController
{
    private const CREATION_TYPES = ['event', 'event-appointment'];

    public function __construct(
        private readonly CalendarStoragePidResolver $storagePidResolver,
        private readonly CalendarPermissionService $permissionService,
        private readonly CalendarEventCreationService $eventCreationService,
    ) {
    }

    public function createEventAction(ServerRequestInterface $request): ResponseInterface
    {
        $data = $request->getParsedBody();
        if (!is_array($data)) {
            return $this->invalidEventDataResponse();
        }

        $start = (int)($data['start'] ?? 0);
        $end = (int)($data['end'] ?? 0);
        $allDay = (int)($data['allDay'] ?? 0) === 1;
        $creationType = (string)($data['type'] ?? 'event-appointment');
        $pid = $this->storagePidResolver->resolveStoragePid();

        if (!in_array($creationType, self::CREATION_TYPES, true)) {
            return new JsonResponse(['success' => false, 'message' => 'Invalid creation type.'], 400);
        }

        if ($pid <= 0 || $start <= 0 || $end <= $start) {
            return $this->invalidEventDataResponse();
        }

        if (!$this->canCreateEvents($pid)) {
            return new JsonResponse(['success' => false, 'message' => 'No permission to create events.'], 403);
        }

        $result = $this->eventCreationService->create($pid, $start, $end, $allDay);

        return new JsonResponse($result, $result['success'] ? 200 : 500);
    }

    public function cleanupEventAction(ServerRequestInterface $request): ResponseInterface
    {
        $eventUid = (int)($request->getQueryParams()['eventUid'] ?? 0);
        if ($eventUid <= 0) {
            return new JsonResponse(['success' => false], 400);
        }

        if (!$this->canCreateEvents($this->storagePidResolver->resolveStoragePid())) {
            return new JsonResponse(['success' => false], 403);
        }

        return new JsonResponse(['success' => $this->eventCreationService->cleanup($eventUid)]);
    }

    private function canCreateEvents(int $pid): bool
    {
        return $this->canCreateEvent($pid) && $this->canCreateAppointment($pid);
    }

    private function canCreateEvent(int $pid): bool
    {
        return $pid > 0 && $this->permissionService->canCreateEventAtPid($pid);
    }

    private function canCreateAppointment(int $pid): bool
    {
        return $pid > 0 && $this->permissionService->canCreateAppointmentAtPid($pid);
    }

    private function invalidEventDataResponse(): JsonResponse
    {
        return new JsonResponse(['success' => false, 'message' => 'Invalid event data.'], 400);
    }
}
