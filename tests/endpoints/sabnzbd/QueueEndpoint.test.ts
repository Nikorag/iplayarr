import { NextFunction, Request, Response } from 'express';

import handler from '../../../src/endpoints/sabnzbd/QueueEndpoint';
import configService from '../../../src/service/configService';
import historyService from '../../../src/service/historyService';
import queueService from '../../../src/service/queueService';
import { QueueEntryStatus } from '../../../src/types/responses/sabnzbd/QueueResponse';


jest.mock('../../../src/service/configService');
jest.mock('../../../src/service/queueService');
jest.mock('../../../src/service/historyService');

describe('AbstractSabNZBDActionEndpoint', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = { query: {} };
        res = { json: jest.fn() };
        next = jest.fn();
    });

    describe('delete action', () => {
        it('should cancel item and return status true if value is provided', async () => {
            (configService.getParameter as jest.Mock).mockResolvedValue('true');
            req.query = { value: 'abc123', name: 'delete' };

            await handler(req as Request, res as Response, next);

            expect(configService.getParameter).toHaveBeenCalledWith('ARCHIVE_ENABLED');
            expect(queueService.cancelItem).toHaveBeenCalledWith('abc123', true);
            expect(res.json).toHaveBeenCalledWith({ status: true });
        });

        it('should return status false if value is not provided', async () => {
            (configService.getParameter as jest.Mock).mockResolvedValue('false');
            req.query = { name: 'delete' };

            await handler(req as Request, res as Response, next);

            expect(configService.getParameter).toHaveBeenCalledWith('ARCHIVE_ENABLED');
            expect(queueService.cancelItem).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ status: false });
        });
    });

    describe('_default action', () => {
        it('should return formatted queue response with status DOWNLOADING', async () => {
            const mockQueue = [
                {
                    status: QueueEntryStatus.DOWNLOADING,
                    pid: 'pid1',
                    nzbName: 'example.nzb',
                    details: {
                        size: 500,
                        sizeLeft: 100,
                        eta: '00:05:00',
                        progress: 80.5,
                    },
                },
            ];
            const mockHistory = [{ id: 1 }, { id: 2 }];

            (queueService.getQueue as jest.Mock).mockReturnValue(mockQueue);
            (historyService.getHistory as jest.Mock).mockResolvedValue(mockHistory);

            await handler(req as Request, res as Response, next);

            expect(queueService.getQueue).toHaveBeenCalled();
            expect(historyService.getHistory).toHaveBeenCalled();

            expect(res.json).toHaveBeenCalledWith({
                'queue': {
                    'speedlimit': 9,
                    'speedlimit_abs': 4718592,
                    'paused': false,
                    'limit': 10,
                    'start': 0,
                    'have_warnings': 0,
                    'pause_int': 0,
                    'left_quota': 0,
                    'version': '3.x.x',
                    'cache_art': 16,
                    'cache_size': '6 MB',
                    'finishaction': null,
                    'paused_all': false,
                    'quota': 0,
                    'have_quota': false,
                    'diskspace1': '100',
                    'diskspacetotal1': '100',
                    'diskspace1_norm': '100 G',
                    'status': 'Downloading',
                    'noofslots_total': 1,
                    'noofslots': 1,
                    'finish': 2,
                    'slots': [
                        {
                            'password': '',
                            'avg_age': '0d',
                            'script': 'None',
                            'direct_unpack': '10/30',
                            'labels': [],
                            'priority': 'Normal',
                            'cat': 'iplayer',
                            'unpackopts': 3,
                            'status': 'Downloading',
                            'index': 0,
                            'mb': 500,
                            'mbleft': 100,
                            'filename': 'example.nzb',
                            'timeleft': '00:05:00',
                            'percentage': 80,
                            'nzo_id': 'pid1'
                        }
                    ]
                }
            });
        });

        it('should return status IDLE if no items are downloading', async () => {
            const mockQueue = [
                {
                    status: QueueEntryStatus.QUEUED,
                    pid: 'pid2',
                    nzbName: 'another.nzb',
                    details: {
                        size: 700,
                        sizeLeft: 700,
                        eta: '01:00:00',
                        progress: 0,
                    },
                },
            ];
            const mockHistory: any[] = [];

            (queueService.getQueue as jest.Mock).mockReturnValue(mockQueue);
            (historyService.getHistory as jest.Mock).mockResolvedValue(mockHistory);

            await handler(req as Request, res as Response, next);

            expect(res.json).toHaveBeenCalledWith({
                'queue': {
                    'speedlimit': 9,
                    'speedlimit_abs': 4718592,
                    'paused': false,
                    'limit': 10,
                    'start': 0,
                    'have_warnings': 0,
                    'pause_int': 0,
                    'left_quota': 0,
                    'version': '3.x.x',
                    'cache_art': 16,
                    'cache_size': '6 MB',
                    'finishaction': null,
                    'paused_all': false,
                    'quota': 0,
                    'have_quota': false,
                    'diskspace1': '100',
                    'diskspacetotal1': '100',
                    'diskspace1_norm': '100 G',
                    'status': 'Idle',
                    'noofslots_total': 1,
                    'noofslots': 1,
                    'finish': 0,
                    'slots': [
                        {
                            'password': '',
                            'avg_age': '0d',
                            'script': 'None',
                            'direct_unpack': '10/30',
                            'labels': [],
                            'priority': 'Normal',
                            'cat': 'iplayer',
                            'unpackopts': 3,
                            'status': 'Queued',
                            'index': 0,
                            'mb': 700,
                            'mbleft': 700,
                            'filename': 'another.nzb',
                            'timeleft': '01:00:00',
                            'percentage': 0,
                            'nzo_id': 'pid2'
                        }
                    ]
                }
            });
        });
    });
});
