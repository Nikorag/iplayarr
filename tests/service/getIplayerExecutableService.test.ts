import fs from 'fs';
import configService from 'src/service/configService';
import { GetIplayerExecutableService } from 'src/service/getIplayerExecutableService';
import historyService from 'src/service/historyService';
import queueService from 'src/service/queueService';
import socketService from 'src/service/socketService';
import { IPlayerSearchResult, VideoType } from 'src/types/data/IPlayerSearchResult';
import { IplayarrParameter } from 'src/types/enums/IplayarrParameters';
import { Synonym } from 'src/types/models/Synonym';

jest.mock('src/service/configService');
jest.mock('src/service/queueService');
jest.mock('src/service/socketService');
jest.mock('src/service/historyService');
jest.mock('src/service/loggingService');
jest.mock('fs');
jest.mock('path');

describe('GetIplayerExecutableService', () => {
    let service: GetIplayerExecutableService;

    beforeEach(() => {
        service = new GetIplayerExecutableService();
        jest.clearAllMocks();
    });

    describe('getIPlayerExec', () => {
        it('should return exec and args with profile-dir if cacheLocation exists', async () => {
            const mockCacheLocation = '/mock/cache';
            process.env.CACHE_LOCATION = mockCacheLocation;
            const mockExec = 'mock_exec';
            const mockArgs = ['arg1', 'arg2'];

            (configService.getParameter as jest.Mock).mockImplementation((key: IplayarrParameter) => {
                if (key === IplayarrParameter.GET_IPLAYER_EXEC) return `${mockExec} ${mockArgs.join(' ')}`;
            });

            const result = await service.getIPlayerExec();

            expect(result.exec).toBe(mockExec);
            expect(result.args).toContain('--encoding-console-out');
            expect(result.args).toContain('UTF-8');
            expect(result.args).toContain('--profile-dir');
            expect(result.args).toContain('"/mock/cache"');
            mockArgs.forEach((arg) => {
                expect(result.args).toContain(arg);
            });
        });

        it('should return exec and args without profile-dir if cacheLocation does not exist', async () => {
            delete process.env.CACHE_LOCATION;
            const mockExec = 'mock_exec';
            const mockArgs = ['arg1', 'arg2'];

            (configService.getParameter as jest.Mock).mockImplementation((key: IplayarrParameter) => {
                if (key === IplayarrParameter.GET_IPLAYER_EXEC) return `${mockExec} ${mockArgs.join(' ')}`;
            });

            const result = await service.getIPlayerExec();

            expect(result.exec).toBe(mockExec);
            expect(result.args).toContain('--encoding-console-out');
            expect(result.args).toContain('UTF-8');
            expect(result.args).not.toContain('--profile-dir');
        });

        it('should fallback to get_iplayer exec if GET_IPLAYER_EXEC is not set', async () => {
            (configService.getParameter as jest.Mock).mockImplementation((key: IplayarrParameter) => {
                if (key === IplayarrParameter.GET_IPLAYER_EXEC) return undefined;
            });

            const result = await service.getIPlayerExec();

            expect(result.exec).toBe('get_iplayer');
        });
    });

    describe('getAllDownloadParameters', () => {
        it('should return download parameters with the correct args', async () => {
            const mockPid = '12345';
            const mockDownloadDir = '/mock/download';
            const mockExec = 'mock_exec';
            const mockArgs = ['arg1', 'arg2'];

            (configService.getParameter as jest.Mock).mockImplementation((key: IplayarrParameter) => {
                if (key === IplayarrParameter.GET_IPLAYER_EXEC) return `${mockExec} ${mockArgs.join(' ')}`;
                if (key === IplayarrParameter.DOWNLOAD_DIR) return mockDownloadDir;
                if (key === IplayarrParameter.ADDITIONAL_IPLAYER_DOWNLOAD_PARAMS) return 'extraParam';
            });

            const result = await service.getAllDownloadParameters(mockPid);

            expect(result.exec).toBe(mockExec);
            expect(result.args).toContain('--output');
            expect(result.args).toContain(`${mockDownloadDir}/${mockPid}`);
            expect(result.args).toContain(`--pid=${mockPid}`);
        });
    });

    describe('getSearchParameters', () => {
        it('should return search parameters with the correct args', async () => {
            const mockTerm = 'mock_term';
            const mockSynonym: Synonym = {
                exemptions: 'exempt1,exempt2',
                id: 'synonym-1',
                from: 'Gladiators',
                target: 'Doctor Who'
            };

            const mockExec = 'mock_exec';
            const mockArgs = ['arg1', 'arg2'];

            (configService.getParameter as jest.Mock).mockImplementation((key: IplayarrParameter) => {
                if (key === IplayarrParameter.GET_IPLAYER_EXEC) return `${mockExec} ${mockArgs.join(' ')}`;
            });

            const result = await service.getSearchParameters(mockTerm, mockSynonym);

            expect(result.exec).toBe(mockExec);
            expect(result.args).toContain(`"${mockTerm}"`);
            expect(result.args).toContain('--exclude');
            mockSynonym.exemptions.split(',').forEach((exemption: string) => {
                expect(result.args).toContain(`"${exemption}"`);
            })

        });

        it('should handle "*" as term and add available-since parameter', async () => {
            const mockTerm = '*';
            const mockRssHours = '24';

            const mockExec = 'mock_exec';
            const mockArgs = ['arg1', 'arg2'];

            (configService.getParameter as jest.Mock).mockImplementation((key: IplayarrParameter) => {
                if (key === IplayarrParameter.GET_IPLAYER_EXEC) return `${mockExec} ${mockArgs.join(' ')}`;
                if (key === IplayarrParameter.RSS_FEED_HOURS) return mockRssHours;
            });

            const result = await service.getSearchParameters(mockTerm);

            expect(result.args).toContain('--available-since');
            expect(result.args).toContain(mockRssHours);
        });
    });

    describe('logProgress', () => {
        it('should log progress and emit log event', () => {
            const mockPid = '12345';
            const mockData = 'mock progress data';
            const emitSpy = jest.spyOn(socketService, 'emit');

            service.logProgress(mockPid, mockData);

            expect(emitSpy).toHaveBeenCalledWith('log', expect.objectContaining({ id: mockPid, message: mockData }));
        });
    });

    describe('parseProgress', () => {
        it('should return download details if progress regex matches', () => {
            const mockPid = '12345';
            const mockData = '50% of ~24.5 MB @ 30.8 MB/s ETA: 15:20:54  [audio+video]';

            const result = service.parseProgress(mockPid, mockData);

            expect(result).toHaveProperty('progress', 50);
            expect(result).toHaveProperty('size', 24.5);
            expect(result).toHaveProperty('speed', 30.8);
            expect(result).toHaveProperty('eta', '15:20:54');
        });

        it('should return undefined if no progress line matches', () => {
            const mockPid = '12345';
            const mockData = 'no progress data';

            const result = service.parseProgress(mockPid, mockData);

            expect(result).toBeUndefined();
        });
    });

    describe('processCompletedDownload', () => {
        it('should handle completed download and move files', async () => {
            const mockPid = '12345';
            const mockQueueItem = { nzbName: 'mock_nzb' };
            const mockDownloadDir = '/mock/download';
            const mockCompleteDir = '/mock/complete';
            const mockFiles = ['mockfile.mp4'];

            queueService.getFromQueue = jest.fn().mockReturnValue(mockQueueItem);

            (configService.getParameters as jest.Mock).mockImplementation(() => {
                return [mockDownloadDir, mockCompleteDir];
            });

            fs.readdirSync = jest.fn().mockReturnValue(mockFiles);
            fs.copyFileSync = jest.fn();
            fs.rmSync = jest.fn();

            await service.processCompletedDownload(mockPid, 0);

            expect(fs.copyFileSync).toHaveBeenCalled();
            expect(fs.rmSync).toHaveBeenCalled();
            expect(historyService.addHistory).toHaveBeenCalled();
        });

        it('should remove from queue even if no MP4 file found', async () => {
            const mockPid = '12345';
            const mockQueueItem = { nzbName: 'mock_nzb' };
            const mockDownloadDir = '/mock/download';
            const mockCompleteDir = '/mock/complete';

            queueService.getFromQueue = jest.fn().mockReturnValue(mockQueueItem);
            
            (configService.getParameters as jest.Mock).mockImplementation(() => {
                return [mockDownloadDir, mockCompleteDir];
            });

            fs.readdirSync = jest.fn().mockReturnValue([]);
            fs.copyFileSync = jest.fn();
            fs.rmSync = jest.fn();

            await service.processCompletedDownload(mockPid, 0);

            expect(queueService.removeFromQueue).toHaveBeenCalled();
        });
    });

    describe('parseResults', () => {
        it('should correctly parse search results and return structured data', () => {
            const mockTerm = 'test';
            const mockData = 'RESULT|:|12345|:|test title|:| |:| |:|1|:|BBC|:|120|:|2021-01-01|:|episode title';
            const mockSizeFactor = 1;

            const results = service.parseResults(mockTerm, mockData, mockSizeFactor);

            expect(results).toHaveLength(1);
            expect(results[0]).toHaveProperty('pid', '12345');
            expect(results[0]).toHaveProperty('title', 'test title');
        });
    });

    describe('processCompletedSearch', () => {
        it('should process results and create NZB name', async () => {
            const mockResults : IPlayerSearchResult[] = [{
                pid: '12345', title: 'Test Title',
                number: 0,
                channel: 'BBC One',
                request: {
                    term : 'Term',
                    line : 'line'
                },
                type: VideoType.TV
            }];
            const mockSynonym : Synonym = {
                filenameOverride: 'test.nzb',
                id: 'synonym-1',
                from: 'From',
                target: 'To',
                exemptions: ''
            };

            (configService.getParameter as jest.Mock).mockImplementation((key: IplayarrParameter) => {
                if (key === IplayarrParameter.VIDEO_QUALITY) return 'hd';
                if (key === IplayarrParameter.TV_FILENAME_TEMPLATE) return 'TV-{{title}}-{{quality}}';
                if (key === IplayarrParameter.MOVIE_FILENAME_TEMPLATE) return 'Movie-{{title}}-{{quality}}';
            });

            const results = await service.processCompletedSearch(mockResults, mockSynonym);

            expect(results[0]).toHaveProperty('nzbName', 'TV-Test.Title-720p');
        });
    });
});
