import { spawn } from 'child_process';
import fs from 'fs';

import configService from '../../../src/service/configService';
import ytdlpDownloadService from '../../../src/service/download/YTDLPDownloadService';
import loggingService from '../../../src/service/loggingService';

jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));
jest.mock('fs', () => ({
  rmSync: jest.fn(),
}));
jest.mock('../../../src/service/configService', () => ({
  getParameter: jest.fn(),
}));
jest.mock('../../../src/service/loggingService', () => ({
  debug: jest.fn(),
}));

describe('YTDLPDownloadService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('download', () => {
    it('should call spawn with correct parameters', async () => {
      const pid = 'test-pid';
      const directory = '/fake/dir';
      const ytdlpExecConf = 'yt-dlp';
      const videoQualityId = '720p';
      
      (configService.getParameter as jest.Mock)
        .mockResolvedValueOnce(ytdlpExecConf)
        .mockResolvedValueOnce(videoQualityId); 

      const mockChildProcess = { stdout: { on: jest.fn() }, stderr: { on: jest.fn() } };
      (spawn as jest.Mock).mockReturnValue(mockChildProcess);

      const result = await ytdlpDownloadService.download(pid, directory);

      expect(configService.getParameter).toHaveBeenCalledWith('YTDLP_EXEC');
      expect(configService.getParameter).toHaveBeenCalledWith('VIDEO_QUALITY');
      expect(loggingService.debug).toHaveBeenCalledWith(
        pid,
        expect.stringContaining('Running command: yt-dlp')
      );
      expect(spawn).toHaveBeenCalledWith(
        'yt-dlp',
        expect.arrayContaining([
          '--progress-template',
          expect.any(String),
          '-o',
          expect.stringContaining(directory),
          expect.stringContaining(pid)
        ])
      );
      expect(result).toBe(mockChildProcess);

    });
  });

  describe('postProcess', () => {
    it('should remove directory if code is not 0', async () => {
      const directory = '/fake/dir';
      const code = 1;

      await ytdlpDownloadService.postProcess('some-pid', directory, code);

      expect(fs.rmSync).toHaveBeenCalledWith(directory, { recursive: true, force: true });
    });

    it('should not remove directory if code is 0', async () => {
      const directory = '/fake/dir';
      const code = 0;

      await ytdlpDownloadService.postProcess('some-pid', directory, code);

      expect(fs.rmSync).not.toHaveBeenCalled();
    });
  });
});
