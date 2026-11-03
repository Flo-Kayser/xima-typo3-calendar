<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Tests\Functional\EventListener;

use PHPUnit\Framework\Attributes\Test;
use TYPO3\CMS\Core\Core\SystemEnvironmentBuilder;
use TYPO3\CMS\Core\Database\ConnectionPool;
use TYPO3\CMS\Core\EventDispatcher\EventDispatcher;
use TYPO3\CMS\Core\Http\ServerRequest;
use TYPO3\CMS\Core\Localization\LanguageServiceFactory;
use Xima\XimaTypo3Calendar\Event\ConfigureCalendarFilterEvent;
use Xima\XimaTypo3Calendar\Tests\Functional\AbstractCalendarFunctionalTestCase;

/**
 * Calendars live on page 2 (first site) and on the hidden sysfolder 11 (second site).
 * The test extension adds the record type "plain-event" next to "event".
 */
final class CalendarFilterRecordTypeTest extends AbstractCalendarFunctionalTestCase
{
    private const EDITOR = 2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->importCSVDataSet(__DIR__ . '/../Fixtures/backend-permissions.csv');
        $this->importCSVDataSet(__DIR__ . '/../Fixtures/calendar.csv');
        $this->importCSVDataSet(__DIR__ . '/../Fixtures/second-site-calendar.csv');
    }

    #[Test]
    public function offersEveryRecordTypeByDefault(): void
    {
        self::assertSame(['event', 'plain-event'], $this->recordTypeFilterValues());
    }

    #[Test]
    public function hidesTheFilterWhenTheRemoveItemsLeaveOneRecordType(): void
    {
        $this->setPageTsConfig(1, 'TCEFORM.tx_ximatypo3calendar_domain_model_event.record_type.removeItems = plain-event');
        $this->setPageTsConfig(10, 'TCEFORM.tx_ximatypo3calendar_domain_model_event.record_type.removeItems = plain-event');

        self::assertSame([], $this->recordTypeFilterValues());
    }

    #[Test]
    public function keepsARecordTypeAvailableOnAnyCalendarPage(): void
    {
        $this->setPageTsConfig(10, 'TCEFORM.tx_ximatypo3calendar_domain_model_event.record_type.removeItems = plain-event');

        self::assertSame(['event', 'plain-event'], $this->recordTypeFilterValues());
    }

    #[Test]
    public function offersRecordTypesAddedByPageTsConfig(): void
    {
        $GLOBALS['TCA']['tx_ximatypo3calendar_domain_model_event']['columns']['record_type']['config']['items'] = [
            ['label' => 'Event', 'value' => 'event'],
        ];
        $this->setPageTsConfig(1, 'TCEFORM.tx_ximatypo3calendar_domain_model_event.record_type.addItems.workshop = Workshop');

        self::assertSame(['event', 'workshop'], $this->recordTypeFilterValues());
    }

    #[Test]
    public function hidesRecordTypesDeniedByAuthMode(): void
    {
        $GLOBALS['TCA']['tx_ximatypo3calendar_domain_model_event']['columns']['record_type']['config']['authMode'] = 'explicitAllow';
        $GLOBALS['TCA']['tx_ximatypo3calendar_domain_model_event']['columns']['record_type']['config']['items'][]
            = ['label' => 'Workshop', 'value' => 'workshop'];
        $this->get(ConnectionPool::class)->getConnectionForTable('be_groups')->update(
            'be_groups',
            ['explicit_allowdeny' => 'tx_ximatypo3calendar_domain_model_event:record_type:event,tx_ximatypo3calendar_domain_model_event:record_type:workshop'],
            ['uid' => 2],
        );

        self::assertSame(['event', 'workshop'], $this->recordTypeFilterValues());
    }

    /**
     * @return list<string>
     */
    private function recordTypeFilterValues(): array
    {
        $backendUser = $this->setUpBackendUser(self::EDITOR);
        $GLOBALS['LANG'] = $this->get(LanguageServiceFactory::class)->createFromUserPreferences($backendUser);
        $request = (new ServerRequest('https://example.com/typo3/'))
            ->withAttribute('applicationType', SystemEnvironmentBuilder::REQUESTTYPE_BE);
        $event = $this->get(EventDispatcher::class)->dispatch(new ConfigureCalendarFilterEvent($request));

        foreach ($event->getFilters() as $filter) {
            if ($filter->getIdentifier() === 'recordTypes') {
                return array_column($filter->jsonSerialize()['items'], 'value');
            }
        }

        return [];
    }

    private function setPageTsConfig(int $pageUid, string $tsConfig): void
    {
        $this->get(ConnectionPool::class)
            ->getConnectionForTable('pages')
            ->update('pages', ['TSconfig' => $tsConfig], ['uid' => $pageUid]);
    }
}
