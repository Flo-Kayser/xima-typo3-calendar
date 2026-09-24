<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Controller\Backend;

use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use TYPO3\CMS\Backend\Routing\UriBuilder;
use TYPO3\CMS\Backend\Template\Components\ButtonBar;
use TYPO3\CMS\Backend\Template\ModuleTemplate;
use TYPO3\CMS\Backend\Template\ModuleTemplateFactory;
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
use Xima\XimaTypo3Calendar\Service\CalendarPageConfigurationService;
use Xima\XimaTypo3Calendar\Service\CalendarPermissionService;
use Xima\XimaTypo3Calendar\Service\CalendarStoragePidResolver;
use Xima\XimaTypo3Calendar\Utility\CalendarFeedRequestUtility;
use Xima\XimaTypo3Calendar\Utility\RecordTypeUtility;

class CalendarController extends ActionController
{
    private const EVENT_TABLE = 'tx_ximatypo3calendar_domain_model_event';
    private const ENTRY_TABLE = 'tx_ximatypo3calendar_domain_model_entry';

    public function __construct(
        protected IconFactory $iconFactory,
        protected PageRenderer $pageRenderer,
        protected UriBuilder $backendUriBuilder,
        protected ContainerInterface $container,
        protected ModuleTemplateFactory $moduleTemplateFactory,
        protected ResourceFactory $resourceFactory,
        protected CalendarRepository $calendarRepository,
        protected EntryRepository $entryRepository,
        protected CalendarPermissionService $permissionService,
        protected CalendarPageConfigurationService $pageConfigurationService,
        protected CalendarStoragePidResolver $storagePidResolver,
    ) {
    }

    public function processRequest(RequestInterface $request): ResponseInterface
    {
        $moduleTemplate = $this->moduleTemplateFactory->create($request);

        $ajaxUrl = (string)$this->backendUriBuilder->buildUriFromRoute('ajax_xima_calendar_events');
        $createEventUrl = (string)$this->backendUriBuilder->buildUriFromRoute('ajax_xima_calendar_create_event');
        $cleanupEventUrl = (string)$this->backendUriBuilder->buildUriFromRoute('ajax_xima_calendar_cleanup_event');
        $appointmentPid = $this->storagePidResolver->resolveStoragePid();
        $eventRecordType = RecordTypeUtility::getDefault(self::EVENT_TABLE);
        $canCreateEvent = $this->canCreateEvent($appointmentPid);
        $canCreateAppointment = $this->canCreateAppointment($appointmentPid);

        $this->addNewRecordButtons(
            $moduleTemplate,
            $request,
            $appointmentPid,
            $eventRecordType,
            $canCreateEvent,
            $canCreateAppointment,
        );

        $this->pageRenderer->loadJavaScriptModule('@xima/xima-typo3-calendar/calendar.js');

        $labels = $this->getNewEventLabels();
        $calendarConfig = json_encode([
            'ajaxUrl' => $ajaxUrl,
            'createEventUrl' => $createEventUrl,
            'cleanupEventUrl' => $cleanupEventUrl,
            'appointmentPid' => $appointmentPid,
            'createAllowed' => $canCreateEvent && $canCreateAppointment,
            'enableDragNewEvent' => $this->pageConfigurationService->isOptionEnabled($request, 'newEvent.interaction.enableDrag'),
            'enableClickNewEvent' => $this->pageConfigurationService->isOptionEnabled($request, 'newEvent.interaction.enableClick'),
            'defaultStartTime' => $this->pageConfigurationService->getValue($request, 'newEvent.defaults.startTime', '09:00'),
            'defaultEndTime' => $this->pageConfigurationService->getValue($request, 'newEvent.defaults.endTime', '09:30'),
            'defaultAllDay' => $this->pageConfigurationService->isOptionEnabled($request, 'newEvent.defaults.allDay'),
            'labels' => [
                'title' => $labels['newEventTypeModalTitle'],
                'event' => $labels['newEventTypeEventLabel'],
                'appointment' => $labels['newEventTypeAppointmentLabel'],
                'start' => $labels['newEventStartLabel'],
                'end' => $labels['newEventEndLabel'],
                'allDay' => $labels['newEventAllDayLabel'],
                'create' => $labels['newEventCreateLabel'],
            ],
        ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);

        $moduleTemplate->assignMultiple([
            'calendarConfig' => $calendarConfig,
            'enableEventPreview' => $this->pageConfigurationService->isOptionEnabled(
                $request,
                'enableEventPreview',
            ),
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

    private function addNewRecordButtons(
        ModuleTemplate $moduleTemplate,
        RequestInterface $request,
        int $pid,
        ?string $eventRecordType,
        bool $canCreateEvent,
        bool $canCreateAppointment,
    ): void {
        $buttonBar = $moduleTemplate->getDocHeaderComponent()->getButtonBar();
        $returnUrl = (string)$request->getUri();

        if ($canCreateEvent) {
            $eventUrl = $this->backendUriBuilder->buildUriFromRoute('record_edit', [
                'edit' => [self::EVENT_TABLE => [$pid => 'new']],
                'defVals' => $eventRecordType === null ? [] : [
                    self::EVENT_TABLE => ['record_type' => $eventRecordType],
                ],
                'returnUrl' => $returnUrl,
            ]);
            $this->addNewRecordButton(
                $buttonBar,
                (string)$eventUrl,
                $this->getLanguageLabel('newEvent', 'New Event'),
            );
        }

        if ($canCreateAppointment) {
            $appointmentUrl = $this->backendUriBuilder->buildUriFromRoute('record_edit', [
                'edit' => [self::ENTRY_TABLE => [$pid => 'new']],
                'defVals' => [self::ENTRY_TABLE => ['record_type' => 'event-appointment']],
                'returnUrl' => $returnUrl,
            ]);
            $this->addNewRecordButton(
                $buttonBar,
                (string)$appointmentUrl,
                $this->getLanguageLabel('newEventAppointment', 'New Event Appointment'),
            );
        }
    }

    private function addNewRecordButton(ButtonBar $buttonBar, string $url, string $title): void
    {
        $button = $buttonBar->makeLinkButton()
            ->setHref($url)
            ->setTitle($title)
            ->setShowLabelText(true)
            ->setIcon($this->iconFactory->getIcon('actions-plus', IconSize::SMALL));
        $buttonBar->addButton($button, ButtonBar::BUTTON_POSITION_RIGHT, 1);
    }

    /** @return array<string, string> */
    private function getNewEventLabels(): array
    {
        return [
            'newEventTypeModalTitle' => $this->getLanguageLabel('newEventType.title', 'Create new record'),
            'newEventTypeEventLabel' => $this->getLanguageLabel('newEventType.event', 'Event'),
            'newEventTypeAppointmentLabel' => $this->getLanguageLabel('newEventType.appointment', 'Event Appointment'),
            'newEventStartLabel' => $this->getLanguageLabel('newEventType.start', 'Start'),
            'newEventEndLabel' => $this->getLanguageLabel('newEventType.end', 'End'),
            'newEventAllDayLabel' => $this->getLanguageLabel('newEventType.allDay', 'All-day'),
            'newEventCreateLabel' => $this->getLanguageLabel('newEventType.create', 'Create'),
        ];
    }

    private function getLanguageLabel(string $key, string $fallback): string
    {
        $label = $GLOBALS['LANG']->sL(
            'LLL:EXT:xima_typo3_calendar/Resources/Private/Language/locallang_mod_calendar.xlf:' . $key,
        );

        return $label === '' || str_starts_with($label, 'LLL:') ? $fallback : $label;
    }

    private function canCreateEvent(int $pid): bool
    {
        return $pid > 0 && $this->permissionService->canCreateEventAtPid($pid);
    }

    private function canCreateAppointment(int $pid): bool
    {
        return $pid > 0 && $this->permissionService->canCreateAppointmentAtPid($pid);
    }
}
