import { AxiosResponse } from 'axios';

import NZBFacade from '../../src/facade/nzbFacade';
import historyService from '../../src/service/historyService';
import loggingService from '../../src/service/loggingService';
import NZBGetService from '../../src/service/nzb/NZBGetService';
import SabNZBDService from '../../src/service/nzb/SabNZBDService';
import { App } from '../../src/types/App';
import { VideoType } from '../../src/types/IPlayerSearchResult';
import { QueueEntryStatus } from '../../src/types/responses/sabnzbd/QueueResponse';

jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-uuid') }));
jest.mock('../../src/service/historyService');
jest.mock('../../src/service/loggingService');
jest.mock('../../src/service/nzb/NZBGetService');
jest.mock('../../src/service/nzb/SabNZBDService');

describe('NZBFacade', () => {
    const app: App = {
        id: 'app-id',
        name: 'TestApp',
        type: 'sabnzbd',
    } as unknown as App;

    const fakeFile = { originalname: 'test.nzb' } as Express.Multer.File;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('testConnection', () => {
        it('should delegate to SabNZBDService by default', async () => {
            const testConnectionMock = jest.fn().mockResolvedValue(true);
            (SabNZBDService.testConnection as jest.Mock) = testConnectionMock;

            const result = await NZBFacade.testConnection('sabnzbd', 'http://test', 'key');

            expect(testConnectionMock).toHaveBeenCalledWith('http://test', {
                apiKey: 'key',
                username: undefined,
                password: undefined,
            });
            expect(result).toBe(true);
        });

        it('should delegate to NZBGetService when type is nzbget', async () => {
            const testConnectionMock = jest.fn().mockResolvedValue('success');
            (NZBGetService.testConnection as jest.Mock) = testConnectionMock;

            const result = await NZBFacade.testConnection('nzbget', 'http://test');

            expect(testConnectionMock).toHaveBeenCalled();
            expect(result).toBe('success');
        });
    });

    describe('addFile', () => {
        it('should log, create relay entry, and call service.addFile', async () => {
            const addFileMock = jest.fn().mockResolvedValue({ data: 'ok' } as AxiosResponse);
            (SabNZBDService.addFile as jest.Mock) = addFileMock;

            const result = await NZBFacade.addFile(app, [fakeFile], 'MyNZB');

            expect(loggingService.log).toHaveBeenCalledWith('Received Real NZB, trying to add MyNZB to TestApp');
            expect(historyService.addRelay).toHaveBeenCalledWith(expect.objectContaining({
                pid: 'mock-uuid',
                nzbName: 'MyNZB',
                appId: 'app-id',
                status: QueueEntryStatus.FORWARDED,
                type: VideoType.UNKNOWN,
                details: { start: expect.any(Date) },
            }));
            expect(addFileMock).toHaveBeenCalledWith(app, [fakeFile]);
            expect(result).toEqual({ data: 'ok' });
        });
    });

    describe('createRelayEntry', () => {
        it('should call historyService.addRelay with correct data', () => {
            NZBFacade.createRelayEntry(app, 'TestNZB');

            expect(historyService.addRelay).toHaveBeenCalledWith(expect.objectContaining({
                pid: 'mock-uuid',
                nzbName: 'TestNZB',
                appId: 'app-id',
                status: QueueEntryStatus.FORWARDED,
                type: VideoType.UNKNOWN,
                details: { start: expect.any(Date) },
            }));
        });
    });
});
