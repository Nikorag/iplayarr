import { spawn } from 'child_process';

import downloadFacade from '../../../server/facade/downloadFacade';
import getIplayerExecutableService from '../../../server/service/getIplayerExecutableService';
import GetIplayerScheduleService from '../../../server/service/schedule/GetIplayerScheduleService';
import GetIplayerSearchService from '../../../server/service/search/GetIplayerSearchService';


jest.mock('../../../server/service/getIplayerExecutableService');
jest.mock('../../../server/service/search/GetIplayerSearchService');

jest.mock('child_process', () => ({
    spawn: jest.fn(),
}));

describe('GetIplayerScheduleService', () => {
    describe('getFeed', () => {
        it('Should call GetIplayerSearchService.search and return results', async () => {
            const test_results = [{
                pid: '12345',
                title: 'Test Title'
            }];
            (GetIplayerSearchService.search as jest.Mock).mockResolvedValue(test_results);

            const results = await GetIplayerScheduleService.getFeed();

            expect(GetIplayerSearchService.search).toHaveBeenCalledWith('*');
            expect(results).toEqual(test_results);
        });
    });

    describe('refreshCache', () => {
        it('spawns a cache refresh process and logs output', async () => {
            const on = jest.fn();
            const child = { stdout: { on }, stderr: { on } };
            (getIplayerExecutableService.getIPlayerExec as jest.Mock).mockResolvedValue({
                exec: 'get_iplayer',
                args: ['--type=tv'],
            });
            (spawn as jest.Mock).mockReturnValue(child as any);

            const cleanupSpy = jest.spyOn(downloadFacade, 'cleanupFailedDownloads').mockResolvedValue();

            await GetIplayerScheduleService.refreshCache();

            expect(spawn).toHaveBeenCalledWith('get_iplayer', ['--type=tv', '--cache-rebuild'], { shell: true });
            expect(cleanupSpy).toHaveBeenCalled();
        });
    });
});