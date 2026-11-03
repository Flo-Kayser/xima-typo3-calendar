<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Service;

use TYPO3\CMS\Backend\Template\Components\ButtonBar;
use TYPO3\CMS\Backend\Template\ModuleTemplate;
use TYPO3\CMS\Core\Imaging\IconFactory;
use TYPO3\CMS\Core\Imaging\IconSize;

/**
 * "New …" buttons in the calendar module doc header. They open the same creation modal
 * as a selection in the calendar (bound in calendar.ts), so the editor picks the calendar,
 * and with it the storage page, in one place.
 */
final class CalendarRecordButtonService
{
    public function __construct(
        private readonly IconFactory $iconFactory,
    ) {
    }

    public function addButtons(
        ModuleTemplate $moduleTemplate,
        bool $canCreateEvent,
        bool $canCreateAppointment,
        string $eventTitle,
        string $appointmentTitle,
    ): void {
        $buttonBar = $moduleTemplate->getDocHeaderComponent()->getButtonBar();

        if ($canCreateEvent) {
            $this->addButton($buttonBar, 'event', $eventTitle);
        }

        if ($canCreateAppointment) {
            $this->addButton($buttonBar, 'event-appointment', $appointmentTitle);
        }
    }

    private function addButton(ButtonBar $buttonBar, string $creationType, string $title): void
    {
        $button = $buttonBar->makeLinkButton()
            ->setHref('#')
            ->setDataAttributes(['xima-calendar-new' => $creationType])
            ->setTitle($title)
            ->setShowLabelText(true)
            ->setIcon($this->iconFactory->getIcon('actions-plus', IconSize::SMALL));
        $buttonBar->addButton($button, ButtonBar::BUTTON_POSITION_RIGHT, 1);
    }
}
