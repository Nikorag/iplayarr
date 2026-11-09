import request from 'supertest';

import deleteHistory from '../../../server/routes/json-api/queue/history.delete';
import getHistory from '../../../server/routes/json-api/queue/history.get';
import deleteQueue from '../../../server/routes/json-api/queue/queue.delete';
import getQueue from '../../../server/routes/json-api/queue/queue.get';
import historyService from '../../../server/service/historyService';
import queueService from '../../../server/service/queueService';
import socketService from '../../../server/service/socketService';
import { nodeApp } from '../../helpers/h3';

jest.mock('../../../server/service/queueService');
jest.mock('../../../server/service/historyService');
jest.mock('../../../server/service/socketService');

const app = nodeApp([
    ['get', '/queue', getQueue],
    ['get', '/history', getHistory],
    ['delete', '/queue', deleteQueue],
    ['delete', '/history', deleteHistory],
]);

describe('Queue and History Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /queue', () => {
    it('returns the current queue', async () => {
      const mockQueue = [{ pid: '1', name: 'Test Item' }];
      (queueService.getQueue as jest.Mock).mockReturnValue(mockQueue);

      const res = await request(app).get('/queue');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockQueue);
    });
  });

  describe('GET /history', () => {
    it('returns the history', async () => {
      const mockHistory = [{ pid: '2', name: 'Old Item' }];
      (historyService.getHistory as jest.Mock).mockResolvedValue(mockHistory);

      const res = await request(app).get('/history');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockHistory);
    });
  });

  describe('DELETE /queue', () => {
    it('removes an item from the queue and emits update', async () => {
      const pid = '123';
      const updatedQueue = [{ pid: '456', name: 'Remaining Item' }];

      (queueService.getQueue as jest.Mock).mockReturnValue(updatedQueue);

      const res = await request(app).delete(`/queue?pid=${pid}`);
      expect(queueService.cancelItem).toHaveBeenCalledWith(pid);
      expect(socketService.emit).toHaveBeenCalledWith('queue', updatedQueue);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedQueue);
    });
  });

  describe('DELETE /history', () => {
    it('removes an item from history and emits update', async () => {
      const pid = '789';
      const updatedHistory = [{ pid: '321', name: 'Another' }];

      (historyService.removeHistory as jest.Mock).mockResolvedValue(undefined);
      (historyService.getHistory as jest.Mock).mockResolvedValue(updatedHistory);

      const res = await request(app).delete(`/history?pid=${pid}`);
      expect(historyService.removeHistory).toHaveBeenCalledWith(pid);
      expect(socketService.emit).toHaveBeenCalledWith('history', updatedHistory);
      expect(res.status).toBe(200);
      expect(res.body).toEqual(updatedHistory);
    });
  });
});
