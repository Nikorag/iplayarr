import { spawn } from 'child_process';

import getIplayerDownloadService from '../../../src/service/download/GetIplayerDownloadService';
import getIplayerExecutableService from '../../../src/service/getIplayerExecutableService';

// Mock the external dependencies
jest.mock('child_process', () => ({
    spawn: jest.fn(),
}));

jest.mock('../../../src/service/getIplayerExecutableService', () => ({
    __esModule: true,
    default: {
        getAllDownloadParameters: jest.fn(),
    },
}));

describe('GetIplayerDownloadService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should call spawn with correct parameters when download is called', async () => {
        const pid = 'test-pid';
        const directory = 'test-directory';
        const exec = 'some-executable';
        const args = ['some-arg1', 'some-arg2'];

        (getIplayerExecutableService.getAllDownloadParameters as jest.Mock).mockResolvedValue({ exec, args });
        const mockChildProcess = { stdout: { on: jest.fn() }, stderr: { on: jest.fn() } };
        (spawn as jest.Mock).mockReturnValue(mockChildProcess);

        const result = await getIplayerDownloadService.download(pid, directory);

        expect(getIplayerExecutableService.getAllDownloadParameters).toHaveBeenCalledWith(pid, directory);
        expect(spawn).toHaveBeenCalledWith(exec, args);
        expect(result).toBe(mockChildProcess);
    });
});
