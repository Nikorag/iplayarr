import fs from 'fs';
import os from 'os';
import path from 'path';

import { copyWithFallbackAsync } from '../../server/utils/Utils';

jest.mock('bcrypt', () => ({
    hash: jest.fn().mockResolvedValue('$2b$10$mockedhash'),
    compare: jest.fn().mockResolvedValue(false),
}));

describe('copyWithFallbackAsync', () => {
    let dir: string;

    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'iplayarr-copy-'));
    });

    afterEach(() => {
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it('copies the file contents', async () => {
        const src = path.join(dir, 'src.mp4');
        const dst = path.join(dir, 'dst.mp4');
        fs.writeFileSync(src, 'video data');

        await copyWithFallbackAsync(src, dst);

        expect(fs.readFileSync(dst, 'utf-8')).toBe('video data');
    });

    it('rejects when the source does not exist', async () => {
        await expect(copyWithFallbackAsync(path.join(dir, 'missing.mp4'), path.join(dir, 'dst.mp4'))).rejects.toMatchObject({
            code: 'ENOENT',
        });
    });
});
