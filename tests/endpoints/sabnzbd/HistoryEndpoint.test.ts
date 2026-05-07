import { NextFunction, Request, Response } from 'express';

import handler from '../../../src/endpoints/sabnzbd/HistoryEndpoint';
import configService from '../../../src/service/configService';
import historyService from '../../../src/service/historyService';
import { IplayarrParameter } from '../../../src/types/IplayarrParameters';
import { VideoType } from '../../../src/types/IPlayerSearchResult';
import { HistoryEntry } from '../../../src/types/QueueEntry';
import { QueueEntryStatus } from '../../../src/types/responses/sabnzbd/QueueResponse';

jest.mock('../../../src/service/configService');
jest.mock('../../../src/service/historyService');

describe('sabnzbdActionEndpoint', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = { query: {} };
        res = { json: jest.fn() };
        next = jest.fn();
    });

    describe('delete handler', () => {
        it('should delete an entry when value is provided and ARCHIVE_ENABLED is true', async () => {
            req.query = { value: 'test-id', name: 'delete' };

            (configService.getParameter as jest.Mock).mockResolvedValue('true');

            await handler(req as Request, res as Response, next);

            expect(configService.getParameter).toHaveBeenCalledWith(IplayarrParameter.ARCHIVE_ENABLED);
            expect(historyService.removeHistory).toHaveBeenCalledWith('test-id', true);
            expect(res.json).toHaveBeenCalledWith({ status: true });
        });

        it('should respond with false when value is missing', async () => {
            req.query = { name: 'delete' };

            await handler(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({ status: false });
        });
    });

    describe('_default handler', () => {
        it('should return filtered and formatted history', async () => {
            const queueEntries: HistoryEntry[] = [
                {
                    pid: 'id1',
                    nzbName: 'testfile',
                    status: QueueEntryStatus.COMPLETE,
                    details: { size: 1 },
                    type: VideoType.TV,
                    category: 'tv',
                    completedAt: '2026-05-07T18:35:36.000Z',
                },
                {
                    pid: 'id2',
                    nzbName: 'skipfile',
                    status: QueueEntryStatus.CANCELLED,
                    details: { size: 2 },
                    type: VideoType.TV
                },
                {
                    pid: 'id3',
                    nzbName: 'skipfile2',
                    status: QueueEntryStatus.FORWARDED,
                    details: { size: 3 },
                    type: VideoType.TV
                },
            ];

            (historyService.getHistory as jest.Mock).mockResolvedValue(queueEntries);
            (configService.getParameter as jest.Mock).mockResolvedValueOnce('/complete');
            (configService.getParameter as jest.Mock).mockResolvedValueOnce('mp4');

            await handler(req as Request, res as Response, next);

            expect(historyService.getHistory).toHaveBeenCalled();
            expect(configService.getParameter).toHaveBeenCalledWith(IplayarrParameter.COMPLETE_DIR);

            const responseArg = (res.json as jest.Mock).mock.calls[0][0];
            expect(responseArg.history.slots).toHaveLength(1);
            expect(responseArg.history.slots[0]).toMatchObject({
                duplicate_key: 'id1',
                nzb_name: 'testfile.nzb',
                name: 'testfile.mp4',
                storage: '/complete/testfile.mp4',
                path: '/complete/testfile.mp4',
                url: 'testfile.nzb',
                bytes: 1048576,
                completed: 1778178936,
                downloaded: 1048576,
                size: '1 MB',
                category: 'tv',
            });
        });

        it('should fall back to the queue start timestamp for older history entries without completedAt', async () => {
            const queueEntries: HistoryEntry[] = [
                {
                    pid: 'old-id',
                    nzbName: 'oldfile',
                    status: QueueEntryStatus.COMPLETE,
                    details: {
                        size: 2,
                        start: '2026-05-07T18:30:00.000Z' as unknown as Date,
                    },
                    type: VideoType.TV,
                },
            ];

            (historyService.getHistory as jest.Mock).mockResolvedValue(queueEntries);
            (configService.getParameter as jest.Mock).mockResolvedValueOnce('/complete');
            (configService.getParameter as jest.Mock).mockResolvedValueOnce('mp4');

            await handler(req as Request, res as Response, next);

            const responseArg = (res.json as jest.Mock).mock.calls[0][0];
            expect(responseArg.history.slots[0]).toMatchObject({
                bytes: 2097152,
                completed: 1778178600,
                downloaded: 2097152,
            });
        });

        it('should fall back to zero for legacy history entries without a stable timestamp', async () => {
            const queueEntries: HistoryEntry[] = [
                {
                    pid: 'legacy-id',
                    nzbName: 'legacyfile',
                    status: QueueEntryStatus.COMPLETE,
                    details: { size: 1 },
                    type: VideoType.TV,
                },
            ];

            (historyService.getHistory as jest.Mock).mockResolvedValue(queueEntries);
            (configService.getParameter as jest.Mock).mockResolvedValueOnce('/complete');
            (configService.getParameter as jest.Mock).mockResolvedValueOnce('mp4');

            await handler(req as Request, res as Response, next);

            const responseArg = (res.json as jest.Mock).mock.calls[0][0];
            expect(responseArg.history.slots[0]).toMatchObject({
                bytes: 1048576,
                completed: 0,
                downloaded: 1048576,
            });
        });

        it('should expose a Sonarr-compatible SAB history slot for a completed iPlayarr download', async () => {
            const queueEntries: HistoryEntry[] = [
                {
                    pid: 'b00jwbtr',
                    nzbName: 'Law.and.Order.S01E04.A.Prisoners.Tale.WEBDL.720p-BBC',
                    status: QueueEntryStatus.COMPLETE,
                    details: { size: 3441.94, start: new Date('2026-05-07T18:35:41.000Z') },
                    type: VideoType.TV,
                    category: 'iplayer',
                    completedAt: '2026-05-07T18:36:45.000Z',
                },
            ];

            (historyService.getHistory as jest.Mock).mockResolvedValue(queueEntries);
            (configService.getParameter as jest.Mock).mockResolvedValueOnce('/downloads/iplayer');
            (configService.getParameter as jest.Mock).mockResolvedValueOnce('mp4');

            await handler(req as Request, res as Response, next);

            const responseArg = (res.json as jest.Mock).mock.calls[0][0];
            const [slot] = responseArg.history.slots;

            expect(slot).toMatchObject({
                status: 'Completed',
                category: 'iplayer',
                duplicate_key: 'b00jwbtr',
                nzo_id: 'b00jwbtr',
                nzb_name: 'Law.and.Order.S01E04.A.Prisoners.Tale.WEBDL.720p-BBC.nzb',
                name: 'Law.and.Order.S01E04.A.Prisoners.Tale.WEBDL.720p-BBC.mp4',
                storage: '/downloads/iplayer/Law.and.Order.S01E04.A.Prisoners.Tale.WEBDL.720p-BBC.mp4',
                path: '/downloads/iplayer/Law.and.Order.S01E04.A.Prisoners.Tale.WEBDL.720p-BBC.mp4',
                url: 'Law.and.Order.S01E04.A.Prisoners.Tale.WEBDL.720p-BBC.nzb',
                completed: 1778179005,
                downloaded: Math.round(3441.94 * 1048576),
            });
            expect(slot.bytes).toBe(Math.round(3441.94 * 1048576));
            expect(slot.completed).not.toBe(slot.bytes);
            expect(slot.downloaded).toBe(slot.bytes);
            expect(slot.completed).toBeLessThan(2000000000);
            expect(slot.downloaded).toBeGreaterThan(2000000000);
        });
    });
});
