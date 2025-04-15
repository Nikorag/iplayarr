import { spawn } from 'child_process';
import fs from 'fs';
import { timestampFile } from 'src/constants/iPlayarrConstants';
import configService from 'src/service/configService';
import episodeCacheService from 'src/service/episodeCacheService';
import getIplayerExecutableService from 'src/service/getIplayerExecutableService';
import iplayerService from 'src/service/iplayerService';

jest.mock('fs');
jest.mock('child_process', () => ({
    spawn: jest.fn()
}));
jest.mock('src/service/configService');
jest.mock('src/service/loggingService');
jest.mock('src/service/queueService');
jest.mock('src/service/getIplayerExecutableService');
jest.mock('src/service/episodeCacheService');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedSpawn = spawn as jest.Mock;

describe('iplayerService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createPidDirectory', () => {
        it('creates directory and writes timestamp file', async () => {
            (configService.getParameter as jest.Mock).mockResolvedValue('/downloads');
            await iplayerService.createPidDirectory('abc123');

            expect(mockedFs.mkdirSync).toHaveBeenCalledWith('/downloads/abc123', { recursive: true });
            expect(mockedFs.writeFileSync).toHaveBeenCalledWith('/downloads/abc123/' + timestampFile, '');
        });
    });

    describe('download', () => {
        it('spawns a download process and wires events', async () => {
            const on = jest.fn();
            const stdout = { on };
            const child = { stdout, on };
            (getIplayerExecutableService.getAllDownloadParameters as jest.Mock).mockResolvedValue({ exec: 'get_iplayer', args: ['--pid=abc'] });
            (configService.getParameter as jest.Mock).mockResolvedValue('/downloads');
            mockedSpawn.mockReturnValue(child as any);

            await iplayerService.download('abc');

            expect(mockedSpawn).toHaveBeenCalledWith('get_iplayer', ['--pid=abc']);
            expect(on).toHaveBeenCalledWith('data', expect.any(Function));
        });
    });

    describe('refreshCache', () => {
        it('spawns a cache refresh process and logs output', async () => {
            const on = jest.fn();
            const child = { stdout: { on }, stderr: { on } };
            (getIplayerExecutableService.getIPlayerExec as jest.Mock).mockResolvedValue({ exec: 'get_iplayer', args: ['--type=tv'] });
            mockedSpawn.mockReturnValue(child as any);

            const cleanupSpy = jest.spyOn(iplayerService, 'cleanupFailedDownloads').mockResolvedValue();

            await iplayerService.refreshCache();

            expect(mockedSpawn).toHaveBeenCalledWith('get_iplayer', ['--type=tv', '--cache-rebuild'], { shell: true });
            expect(cleanupSpy).toHaveBeenCalled();
        });
    });

    describe('episodeDetails', () => {
        it('returns correct episode details from metadata', async () => {
            const pid = 'abc123';
            (episodeCacheService.getMetadata as jest.Mock).mockResolvedValue({
                programme: {
                    display_title: { title: 'Title' },
                    versions: [{ duration: 1800 }],
                    categories: [{ title: 'Sci-Fi' }],
                    ownership: { service: { title: 'BBC One' } },
                    medium_synopsis: 'Cool episode.',
                    first_broadcast_date: '2023-12-10',
                    image: { pid: 'imagepid' },
                    position: 2,
                    parent: {
                        programme: {
                            type: 'series',
                            title: 'Series V',
                            position: 5,
                            aggregated_episode_count: 12
                        }
                    }
                }
            });

            const result = await iplayerService.episodeDetails(pid);
            expect(result.title).toBe('Title');
            expect(result.series).toBeGreaterThan(0);
            expect(result.episode).toBe(2);
            expect(result.thumbnail).toContain('imagepid');
        });
    });
});
