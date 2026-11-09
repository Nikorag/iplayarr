import { v4 as uuidv4 } from 'uuid';

import arrFacade from '../../server/facade/arrFacade';
import nzbFacade from '../../server/facade/nzbFacade';
import appService from '../../server/service/appService';
import configService from '../../server/service/configService';
import socketService from '../../server/service/socketService';
import { App } from '../../server/types/App';
import { AppType } from '../../server/types/AppType';
import { QueuedStorage } from '../../server/types/QueuedStorage';

jest.mock('uuid', () => ({ v4: jest.fn() }));

const mockStorageData: Record<string, any> = {};
jest.mock('../../server/types/QueuedStorage', () => {
    const mockStorageInstance = {
        getItem: jest.fn((key: string) => {
            return Promise.resolve(mockStorageData[key]);
        }),
        setItem: jest.fn((key: string, value: any) => {
            mockStorageData[key] = value;
            return Promise.resolve();
        }),
    };
    return {
        QueuedStorage: jest.fn(() => mockStorageInstance),
        __esModule: true,
    };
});

jest.mock('../../server/facade/arrFacade', () => ({
    testConnection: jest.fn(),
    upsertDownloadClient: jest.fn(),
    upsertIndexer: jest.fn(),
}));

jest.mock('../../server/service/configService', () => ({
    getParameter: jest.fn(),
}));

jest.mock('../../server/facade/nzbFacade', () => ({
    testConnection: jest.fn(),
}));

jest.mock('../../server/service/socketService', () => ({
    emit: jest.fn(),
}));

const mockStorage = (QueuedStorage as jest.Mock).mock.results[0].value;

describe('appService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Object.keys(mockStorageData).forEach((k) => delete mockStorageData[k]);
    });

    it('adds a new app and assigns an ID if not present', async () => {
        const id = 'test-id';
        (uuidv4 as jest.Mock).mockReturnValue(id);
        const app: App = {
            id: undefined,
            type: AppType.RADARR,
            url: 'http://localhost',
            tags: [],
            iplayarr: { host: 'localhost', port: 7878, useSSL: false },
        } as any;

        const result = await appService.addApp(app);

        expect(result?.id).toBe(id);
        expect(mockStorage.setItem).toHaveBeenCalledWith(
            'apps',
            expect.arrayContaining([expect.objectContaining({ id })])
        );
    });

    it('removes an app', async () => {
        const app: App = { id: '123', type: AppType.RADARR } as any;
        await appService.addApp(app);

        await appService.removeApp('123');

        expect(mockStorage.setItem).toHaveBeenCalledWith('apps', []);
    });

    it('updates an app by merging and re-adding it', async () => {
        const app: App = { id: '123', name: 'Old Name', type: AppType.RADARR } as any;
        await appService.addApp(app);

        await appService.updateApp({ id: '123', name: 'New Name' });

        expect(mockStorage.setItem).toHaveBeenCalledWith('apps', [expect.objectContaining({ name: 'New Name' })]);
    });

    it('returns undefined when updating non-existent app', async () => {
        const result = await appService.updateApp({ id: 'does-not-exist', name: 'Test' });

        expect(result).toBeUndefined();
    });

    it('tests connection for NZBGET app', async () => {
        const form = { type: AppType.NZBGET, url: 'url', api_key: 'key', username: 'u', password: 'p' } as any;
        await appService.testAppConnection(form);
        expect(nzbFacade.testConnection).toHaveBeenCalledWith('nzbget', 'url', 'key', 'u', 'p');
    });

    it('updates API key and emits socket events', async () => {
        const app: App = { id: 'abc', type: AppType.RADARR } as any;
        await appService.addApp(app);

        const mockCreateUpdate = jest.spyOn(appService, 'createUpdateIntegrations').mockResolvedValue(app);

        await appService.updateApiKey();

        expect(socketService.emit).toHaveBeenCalledWith(
            'app_update_status',
            expect.objectContaining({ status: 'In Progress' })
        );
        expect(mockCreateUpdate).toHaveBeenCalled();
    });

    describe('createUpdateIntegrations without an API key', () => {
        const form = (): App =>
            ({
                id: 'abc',
                type: AppType.SONARR,
                url: 'http://sonarr',
                api_key: 'key',
                iplayarr: { host: 'iplayarr', port: 4404, useSSL: false },
                download_client: { name: 'iPlayarr' },
            }) as any;

        beforeEach(() => {
            // An earlier test spies on this method and leaves the mock in place
            (appService.createUpdateIntegrations as unknown as jest.SpyInstance).mockRestore?.();
        });

        it('fails with a clear error instead of calling the app', async () => {
            (configService.getParameter as jest.Mock).mockResolvedValue(undefined);

            await expect(appService.createUpdateIntegrations(form())).rejects.toMatchObject({
                message: expect.stringContaining('no API key'),
                type: 'download_client',
            });
            expect(arrFacade.upsertDownloadClient).not.toHaveBeenCalled();
        });
    });
});
