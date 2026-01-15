import { Dirent, Stats } from 'fs';
import fs from 'fs/promises';

import { timestampFile } from '../../src/constants/iPlayarrConstants';
import downloadFacade from '../../src/facade/downloadFacade';
import configService from '../../src/service/configService';
import GetIplayerDownloadService from '../../src/service/download/GetIplayerDownloadService';
import { DownloadClient } from '../../src/types/enums/DownloadClient';

// Mocks
jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn(),
  readdir: jest.fn(),
  copyFile: jest.fn(),
  rm: jest.fn(),
  stat: jest.fn(),
}));

jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

jest.mock('../../src/service/configService', () => ({
  getParameter: jest.fn(),
}));

jest.mock('../../src/service/download/GetIplayerDownloadService', () => ({
  download: jest.fn(),
  postProcess: jest.fn(),
}));

jest.mock('../../src/service/download/YTDLPDownloadService', () => ({
  download: jest.fn(),
  postProcess: jest.fn(),
}));

jest.mock('../../src/service/queueService', () => ({
  updateQueue: jest.fn(),
  getFromQueue: jest.fn(),
  removeFromQueue: jest.fn(),
}));

jest.mock('../../src/service/loggingService', () => ({
  error: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
}));

jest.mock('../../src/service/socketService', () => ({
  emit: jest.fn(),
}));

describe('DownloadFacade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('download', () => {
    it('should correctly create directory, select service and handle process events', async () => {
      const pid = 'test-pid';
      const downloadDir = '/downloads';
      const pidDir = '/downloads/test-pid';

      // Mocks
      (configService.getParameter as jest.Mock)
        .mockResolvedValueOnce(downloadDir) // For DOWNLOAD_DIR
        .mockResolvedValueOnce(DownloadClient.GET_IPLAYER); // For DOWNLOAD_CLIENT

      const mockChildProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
      };

      (GetIplayerDownloadService.download as jest.Mock).mockResolvedValue(mockChildProcess);

      // Act
      const result = await downloadFacade.download(pid);

      // Asserts
      expect(configService.getParameter).toHaveBeenCalledWith('DOWNLOAD_DIR');
      expect(fs.mkdir).toHaveBeenCalledWith(pidDir, { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(`${pidDir}/${timestampFile}`, '');

      expect(configService.getParameter).toHaveBeenCalledWith('DOWNLOAD_CLIENT');
      expect(GetIplayerDownloadService.download).toHaveBeenCalledWith(pid, pidDir);

      expect(mockChildProcess.stderr.on).toHaveBeenCalledWith('data', expect.any(Function));
      expect(mockChildProcess.stdout.on).toHaveBeenCalledWith('data', expect.any(Function));
      expect(mockChildProcess.on).toHaveBeenCalledWith('close', expect.any(Function));

      expect(result).toBe(mockChildProcess);
    });
  });

  describe('cleanupFailedDownloads', () => {
    it('should delete old download directories', async () => {
      const downloadDir = '/downloads';
      const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;

      const mockDirEntry = {
        name: 'oldDir',
        isDirectory: () => true,
      } as Dirent;

      (configService.getParameter as jest.Mock).mockResolvedValue(downloadDir);
      (fs.readdir as jest.Mock).mockResolvedValue([mockDirEntry]);
      (fs.stat as jest.Mock).mockResolvedValue({ mtimeMs: threeHoursAgo - 10000 } as Stats);
      (fs.rm as jest.Mock).mockResolvedValue(undefined);

      await downloadFacade.cleanupFailedDownloads();

      expect(fs.rm).toHaveBeenCalledWith(
        expect.stringContaining('oldDir'),
        { recursive: true, force: true }
      );
    });

    it('should not delete recent directories', async () => {
      const downloadDir = '/downloads';
      const now = Date.now();

      const mockDirEntry = {
        name: 'recentDir',
        isDirectory: () => true,
      } as Dirent;

      (configService.getParameter as jest.Mock).mockResolvedValue(downloadDir);
      (fs.readdir as jest.Mock).mockResolvedValue([mockDirEntry]);
      (fs.stat as jest.Mock).mockResolvedValue({ mtimeMs: now } as Stats);

      await downloadFacade.cleanupFailedDownloads();

      expect(fs.rm).not.toHaveBeenCalled();
    });
  });
});