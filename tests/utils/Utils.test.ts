import { Request } from 'express';

import { IplayarrParameter } from '../../src/types/IplayarrParameters';
import { IPlayerSearchResult, VideoType } from '../../src/types/IPlayerSearchResult';
import * as Utils from '../../src/utils/Utils';

jest.mock('../../src/service/configService', () => ({
    __esModule: true,
    default: {
        getParameter: jest.fn()
    }
}));

import configService from '../../src/service/configService';

describe('Utils', () => {
    describe('formatBytes', () => {
        it('formats bytes correctly', () => {
            expect(Utils.formatBytes(0)).toBe('0 Bytes');
            expect(Utils.formatBytes(1024)).toBe('1 KB');
            expect(Utils.formatBytes(1048576)).toBe('1 MB');
        });

        it('returns without unit when unit = false', () => {
            expect(Utils.formatBytes(1024, false)).toBe('1');
        });
    });

    describe('md5', () => {
        it('returns correct md5 hash', () => {
            expect(Utils.md5('hello')).toBe('5d41402abc4b2a76b9719d911017c592');
        });
    });

    describe('getBaseUrl', () => {
        it('returns correct base URL', () => {
            const req = {
                protocol: 'http',
                hostname: 'localhost',
                socket: { localPort: 3000 }
            } as unknown as Request;

            expect(Utils.getBaseUrl(req)).toBe('http://localhost:3000');
        });
    });

    describe('createNZBDownloadLink', () => {
        it('builds download link correctly with and without app', () => {
            const base : IPlayerSearchResult = {
                pid: '123',
                nzbName: 'test.nzb',
                type: VideoType.MOVIE
            } as IPlayerSearchResult;

            expect(Utils.createNZBDownloadLink(base, 'apikey')).toBe(
                '/api?mode=nzb-download&pid=123&nzbName=test.nzb&type=MOVIE&apikey=apikey'
            );

            expect(Utils.createNZBDownloadLink(base, 'apikey', 'radarr')).toBe(
                '/api?mode=nzb-download&pid=123&nzbName=test.nzb&type=MOVIE&apikey=apikey&app=radarr'
            );
        });
    });

    describe('removeAllQueryParams', () => {
        it('removes all query params from a URL', () => {
            expect(Utils.removeAllQueryParams('http://example.com/path?foo=bar&baz=qux')).toBe('http://example.com/path');
        });
    });

    describe('splitArrayIntoChunks', () => {
        it('splits an array into chunks', () => {
            const result = Utils.splitArrayIntoChunks([1, 2, 3, 4, 5], 2);
            expect(result).toEqual([[1, 2], [3, 4], [5]]);
        });
    });

    describe('getQualityProfile', () => {
        it('returns the matching quality profile', async () => {
            (configService.getParameter as jest.Mock).mockResolvedValue('hd');
            const result = await Utils.getQualityProfile();
            expect(result.id).toBe('hd');
        });
    });

    describe('createNZBName', () => {
        it('renders the template using Handlebars', async () => {
            (configService.getParameter as jest.Mock).mockImplementation((key: IplayarrParameter) => {
                if (key === IplayarrParameter.TV_FILENAME_TEMPLATE) return 'TV - {{title}} - {{quality}}';
                if (key === IplayarrParameter.MOVIE_FILENAME_TEMPLATE) return 'Movie - {{title}} - {{quality}}';
                if (key === IplayarrParameter.VIDEO_QUALITY) return 'hd';
            });

            const name = await Utils.createNZBName(VideoType.TV, { title: 'Doctor Who', quality: '' });
            expect(name).toBe('TV - Doctor Who - 720p');
        });
    });
});
