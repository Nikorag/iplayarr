import arrFacade from '../../server/facade/arrFacade';
import { saveApp } from '../../server/service/appSaveService';
import appService from '../../server/service/appService';
import { AppType } from '../../server/types/AppType';

jest.mock('../../server/facade/arrFacade');
jest.mock('../../server/service/appService');
const mockValidate = jest.fn();
jest.mock('../../server/validators/AppFormValidator', () => ({
    AppFormValidator: class {
        validate = (...args: any[]) => mockValidate(...args);
    },
}));

const mockedApp = appService as jest.Mocked<typeof appService>;
const mockedFacade = arrFacade as jest.Mocked<typeof arrFacade>;

describe('saveApp', () => {
    const makeApp = (): any => ({
        id: 'app1',
        type: AppType.SONARR,
        download_client: { name: 'iPlayarr' },
        indexer: { name: 'iPlayarr' },
    });

    beforeEach(() => {
        jest.resetAllMocks();
        mockValidate.mockResolvedValue({});
    });

    it('reports the failure message and removes a new app', async () => {
        const app = makeApp();
        mockedApp.addApp.mockResolvedValue(app);
        mockedApp.createUpdateIntegrations.mockRejectedValue({ type: 'download_client', message: 'Host: unreachable' });

        const { status, body } = await saveApp(app, 'add');

        expect(status).toBe(400);
        expect(body).toMatchObject({
            message: 'Failed to create the download client: Host: unreachable',
            invalid_fields: { download_client_name: 'Host: unreachable' },
        });
        expect(mockedApp.removeApp).toHaveBeenCalledWith('app1');
        expect(mockedFacade.deleteDownloadClient).not.toHaveBeenCalled();
    });

    it('removes a download client created in a failed attempt', async () => {
        const app = makeApp();
        mockedApp.addApp.mockResolvedValue(app);
        mockedApp.createUpdateIntegrations.mockImplementation(async (a: any) => {
            a.download_client.id = 7;
            throw { type: 'indexer', message: 'bad indexer' };
        });

        const { body } = await saveApp(app, 'add');

        expect(mockedFacade.deleteDownloadClient).toHaveBeenCalledWith(app, 7);
        expect((body as any).message).toBe('Failed to create the indexer: bad indexer');
    });

    it('keeps an existing download client when the indexer fails', async () => {
        const app = makeApp();
        app.download_client.id = 3;
        mockedApp.updateApp.mockResolvedValue(app);
        mockedApp.createUpdateIntegrations.mockRejectedValue({ type: 'indexer', message: 'bad indexer' });

        await saveApp(app, 'update');

        expect(mockedFacade.deleteDownloadClient).not.toHaveBeenCalled();
        expect(mockedApp.removeApp).not.toHaveBeenCalled();
    });

    it('says when cleanup fails', async () => {
        const app = makeApp();
        mockedApp.addApp.mockResolvedValue(app);
        mockedApp.createUpdateIntegrations.mockImplementation(async (a: any) => {
            a.download_client.id = 7;
            throw { type: 'indexer', message: 'bad indexer' };
        });
        mockedFacade.deleteDownloadClient.mockRejectedValue(new Error('nope'));

        const { body } = await saveApp(app, 'add');

        expect((body as any).message).toContain('\'iPlayarr\' was created but could not be removed: nope');
    });
});
