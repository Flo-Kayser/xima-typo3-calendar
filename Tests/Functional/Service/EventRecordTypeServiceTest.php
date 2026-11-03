<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Tests\Functional\Service;

use PHPUnit\Framework\Attributes\Test;
use TYPO3\CMS\Backend\Form\FormDataCompiler;
use TYPO3\CMS\Core\Core\SystemEnvironmentBuilder;
use TYPO3\CMS\Core\Database\ConnectionPool;
use TYPO3\CMS\Core\Http\ServerRequest;
use TYPO3\CMS\Core\Localization\LanguageServiceFactory;
use Xima\XimaTypo3Calendar\Service\EventRecordTypeService;
use Xima\XimaTypo3Calendar\Tests\Functional\AbstractCalendarFunctionalTestCase;

/**
 * The test extension adds the record type "plain-event" next to the default "event".
 */
final class EventRecordTypeServiceTest extends AbstractCalendarFunctionalTestCase
{
    private const ADMIN = 1;
    private const EDITOR = 2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->importCSVDataSet(__DIR__ . '/../Fixtures/backend-permissions.csv');
    }

    #[Test]
    public function offersEveryRecordTypeByDefault(): void
    {
        $this->actAs(self::EDITOR);

        self::assertSame(['event', 'plain-event'], $this->recordTypeValues(2));
    }

    #[Test]
    public function translatesTheLabels(): void
    {
        $this->actAs(self::EDITOR);

        $recordTypes = $this->service()->getRecordTypes($this->request(), 2);

        self::assertSame(['Event', 'Event without workflow'], array_column($recordTypes, 'label'));
    }

    #[Test]
    public function respectsRemoveItemsFromPageTsConfig(): void
    {
        $this->setPageTsConfig(2, 'TCEFORM.tx_ximatypo3calendar_domain_model_event.record_type.removeItems = plain-event');
        $this->actAs(self::EDITOR);

        self::assertSame(['event'], $this->recordTypeValues(2));
    }

    #[Test]
    public function readsThePageTsConfigOfTheGivenPage(): void
    {
        $this->setPageTsConfig(2, 'TCEFORM.tx_ximatypo3calendar_domain_model_event.record_type.removeItems = plain-event');
        $this->actAs(self::EDITOR);

        self::assertSame(['event', 'plain-event'], $this->recordTypeValues(1));
    }

    #[Test]
    public function hidesRecordTypesTheGroupIsNotAllowedToUseWithAuthMode(): void
    {
        $GLOBALS['TCA']['tx_ximatypo3calendar_domain_model_event']['columns']['record_type']['config']['authMode'] = 'explicitAllow';
        $this->get(ConnectionPool::class)->getConnectionForTable('be_groups')->update(
            'be_groups',
            ['explicit_allowdeny' => 'tx_ximatypo3calendar_domain_model_event:record_type:plain-event'],
            ['uid' => 2],
        );

        $this->actAs(self::EDITOR);
        self::assertSame(['plain-event'], $this->recordTypeValues(2));

        $this->actAs(self::ADMIN);
        self::assertSame(['event', 'plain-event'], $this->recordTypeValues(2));
    }

    /**
     * @return list<string>
     */
    private function recordTypeValues(int $pid): array
    {
        return array_column($this->service()->getRecordTypes($this->request(), $pid), 'value');
    }

    private function service(): EventRecordTypeService
    {
        return new EventRecordTypeService($this->get(FormDataCompiler::class), $this->get(ConnectionPool::class));
    }

    private function setPageTsConfig(int $pageUid, string $tsConfig): void
    {
        $this->get(ConnectionPool::class)
            ->getConnectionForTable('pages')
            ->update('pages', ['TSconfig' => $tsConfig], ['uid' => $pageUid]);
    }

    private function actAs(int $backendUserUid): void
    {
        $backendUser = $this->setUpBackendUser($backendUserUid);
        $GLOBALS['LANG'] = $this->get(LanguageServiceFactory::class)->createFromUserPreferences($backendUser);
    }

    private function request(): ServerRequest
    {
        return (new ServerRequest('https://example.com/typo3/'))
            ->withAttribute('applicationType', SystemEnvironmentBuilder::REQUESTTYPE_BE);
    }
}
