<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Controller\Backend;

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use TYPO3\CMS\Backend\Routing\UriBuilder;
use TYPO3\CMS\Backend\Template\Components\ButtonBar;
use TYPO3\CMS\Backend\Template\ModuleTemplateFactory;
use TYPO3\CMS\Backend\Utility\BackendUtility;
use TYPO3\CMS\Core\Database\Connection;
use TYPO3\CMS\Core\Database\ConnectionPool;
use TYPO3\CMS\Core\Http\JsonResponse;
use TYPO3\CMS\Core\Imaging\IconFactory;
use TYPO3\CMS\Core\Imaging\IconSize;
use TYPO3\CMS\Core\Page\PageRenderer;
use TYPO3\CMS\Core\Resource\ResourceFactory;
use TYPO3\CMS\Extbase\Mvc\Controller\ActionController;
use TYPO3\CMS\Extbase\Mvc\RequestInterface;
use Xima\XimaTypo3Calendar\Domain\Repository\CalendarRepository;
use Xima\XimaTypo3Calendar\Domain\Repository\EntryRepository;
use Xima\XimaTypo3Calendar\Serializer\VkurkoCalendarSerializer;
use Xima\XimaTypo3Calendar\Service\CalendarEventCreationService;
use Xima\XimaTypo3Calendar\Service\CalendarPermissionService;
use Xima\XimaTypo3Calendar\Utility\CalendarFeedRequestUtility;
use Xima\XimaTypo3Calendar\Utility\RecordTypeUtility;

class CalendarController extends ActionController
{
    private const EVENT_TABLE = 'tx_ximatypo3calendar_domain_model_event';

    public function __construct(
        protected ConnectionPool $connectionPool,
        protected IconFactory $iconFactory,
        protected PageRenderer $pageRenderer,
        protected UriBuilder $backendUriBuilder,
        protected ContainerInterface $container,
        protected ModuleTemplateFactory $moduleTemplateFactory,
        protected ResourceFactory $resourceFactory,
        protected CalendarRepository $calendarRepository,
        protected EntryRepository $entryRepository,
        protected CalendarPermissionService $permissionService,
        protected CalendarEventCreationService $eventCreationService,
    ) {
    }

    public function processRequest(RequestInterface $request): ResponseInterface
    {
        $moduleTemplate = $this->moduleTemplateFactory->create($request);

        $ajaxUrl = (string)$this->backendUriBuilder->buildUriFromRoute('ajax_xima_calendar_events');
        $createEventUrl = (string)$this->backendUriBuilder->buildUriFromRoute('ajax_xima_calendar_create_event');
        $cleanupEventUrl = (string)$this->backendUriBuilder->buildUriFromRoute('ajax_xima_calendar_cleanup_event');
        $appointmentPid = $this->getAppointmentPid();
        $eventRecordType = RecordTypeUtility::getDefault(self::EVENT_TABLE);

        if ($this->canCreateEvents()) {
            $newEventUrl = $this->backendUriBuilder->buildUriFromRoute('record_edit', [
                'edit' => [
                    self::EVENT_TABLE => [
                        $appointmentPid => 'new',
                    ],
                ],
                'defVals' => $eventRecordType === null ? [] : [
                    self::EVENT_TABLE => [
                        'record_type' => $eventRecordType,
                    ],
                ],
                'returnUrl' => (string)$request->getUri(),
            ]);
            $buttonBar = $moduleTemplate->getDocHeaderComponent()->getButtonBar();
            $newEventButton = $buttonBar->makeLinkButton()
                ->setHref((string)$newEventUrl)
                ->setTitle($GLOBALS['LANG']->sL('LLL:EXT:xima_typo3_calendar/Resources/Private/Language/locallang_mod_calendar.xlf:newEvent'))
                ->setShowLabelText(true)
                ->setIcon($this->iconFactory->getIcon('actions-plus', IconSize::SMALL));
            $buttonBar->addButton($newEventButton, ButtonBar::BUTTON_POSITION_RIGHT, 1);
        }

        $this->pageRenderer->loadJavaScriptModule('@xima/xima-typo3-calendar/calendar.js');

        $moduleTemplate->assignMultiple([
            'ajaxUrl' => $ajaxUrl,
            'createEventUrl' => $createEventUrl,
            'cleanupEventUrl' => $cleanupEventUrl,
            'appointmentPid' => $appointmentPid,
            'canCreateAppointments' => $this->canCreateEvents(),
            'enableDragNewEvent' => $this->isPageTsConfigEnabled($request, 'newEvent.interaction.enableDrag'),
            'enableClickNewEvent' => $this->isPageTsConfigEnabled($request, 'newEvent.interaction.enableClick'),
            'newEventDefaultStartTime' => $this->getPageTsConfigValue($request, 'newEvent.defaults.startTime', '09:00'),
            'newEventDefaultEndTime' => $this->getPageTsConfigValue($request, 'newEvent.defaults.endTime', '09:30'),
            'newEventDefaultAllDay' => $this->isPageTsConfigEnabled($request, 'newEvent.defaults.allDay'),
            'enableEventPreview' => $this->isEventPreviewEnabled($request),
        ]);

        return $moduleTemplate->renderResponse('Backend/Calendar');
    }

    public function eventsAction(ServerRequestInterface $request): ResponseInterface
    {
        $params = $request->getQueryParams();

        $startDatetime = CalendarFeedRequestUtility::getStartTimestamp($params);
        $endDatetime = CalendarFeedRequestUtility::getEndTimestamp($params);
        $calendarUids = CalendarFeedRequestUtility::getCalendarUids($params);

        $rows = $this->entryRepository->getBackendCalendarEntries($startDatetime, $endDatetime, $calendarUids);

        $events = VkurkoCalendarSerializer::serializeBackendEntries($rows);

        return new JsonResponse($events);
    }

    public function createEventAction(ServerRequestInterface $request): ResponseInterface
    {
        $data = $request->getParsedBody();
        $start = (int)($data['start'] ?? 0);
        $end = (int)($data['end'] ?? 0);
        $allDay = (int)($data['allDay'] ?? 0) === 1;
        $pid = $this->getAppointmentPid();

        if ($pid <= 0 || $start <= 0 || $end <= $start) {
            return new JsonResponse(['success' => false, 'message' => 'Invalid event data.'], 400);
        }

        if (!$this->canCreateEvents()) {
            return new JsonResponse(['success' => false, 'message' => 'No permission to create events.'], 403);
        }

        $result = $this->eventCreationService->create($pid, $start, $end, $allDay);

        return new JsonResponse($result, $result['success'] ? 200 : 500);
    }

    public function cleanupEventAction(ServerRequestInterface $request): ResponseInterface
    {
        $eventUid = (int)($request->getQueryParams()['eventUid'] ?? 0);
        if ($eventUid <= 0 || !$this->canCreateEvents()) {
            return new JsonResponse(['success' => false], 400);
        }

        return new JsonResponse(['success' => $this->eventCreationService->cleanup($eventUid)]);
    }

    private function isEventPreviewEnabled(RequestInterface $request): bool
    {
        $pageId = (int)($request->getQueryParams()['id'] ?? 0);
        $pageTsConfig = BackendUtility::getPagesTSconfig($pageId);

        return (bool)($pageTsConfig['mod.']['tx_ximatypo3calendar.']['enableEventPreview'] ?? false);
    }

    private function isPageTsConfigEnabled(RequestInterface $request, string $option): bool
    {
        return (int)$this->getPageTsConfigValue($request, $option, 1) === 1;
    }

    private function getPageTsConfigValue(RequestInterface $request, string $option, mixed $default): mixed
    {
        $pageId = (int)($request->getQueryParams()['id'] ?? 0);
        $pageTsConfig = BackendUtility::getPagesTSconfig($pageId);
        $value = $pageTsConfig['mod.']['tx_ximatypo3calendar.'] ?? [];

        foreach (explode('.', $option) as $part) {
            if (!is_array($value)) {
                return $default;
            }

            $nestedKey = $part . '.';
            if (array_key_exists($nestedKey, $value)) {
                $value = $value[$nestedKey];
            } elseif (array_key_exists($part, $value)) {
                $value = $value[$part];
            } else {
                return $default;
            }
        }

        return $value;
    }

    private function getAppointmentPid(): int
    {
        $queryBuilder = $this->connectionPool->getQueryBuilderForTable('pages');
        $pid = $queryBuilder
            ->select('uid')
            ->from('pages')
            ->where($queryBuilder->expr()->eq('module', $queryBuilder->createNamedParameter('events')))
            ->orderBy('uid')
            ->setMaxResults(1)
            ->executeQuery()
            ->fetchOne();

        if ($pid) {
            return (int)$pid;
        }

        $queryBuilder = $this->connectionPool->getQueryBuilderForTable('tx_ximatypo3calendar_domain_model_entry');

        return (int)$queryBuilder
            ->select('pid')
            ->from('tx_ximatypo3calendar_domain_model_entry')
            ->where($queryBuilder->expr()->eq('deleted', $queryBuilder->createNamedParameter(0, Connection::PARAM_INT)))
            ->orderBy('pid')
            ->setMaxResults(1)
            ->executeQuery()
            ->fetchOne();
    }

    private function canCreateEvents(): bool
    {
        $pid = $this->getAppointmentPid();

        return $pid > 0
            && $this->permissionService->canCreateEventAtPid($pid)
            && $this->permissionService->canCreateAppointmentAtPid($pid);
    }
}
