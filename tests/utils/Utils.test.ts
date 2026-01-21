import { Request } from 'express';

import appService from '../../src/service/appService';
import configService from '../../src/service/configService';
import SkyhookService from '../../src/service/skyhook/SkyhookService';
import { App } from '../../src/types/App';
import { AppType } from '../../src/types/AppType';
import { IplayarrParameter } from '../../src/types/IplayarrParameters';
import { IPlayerSearchResult, VideoType } from '../../src/types/IPlayerSearchResult';
import { IPlayerMetadataResponse } from '../../src/types/responses/IPlayerMetadataResponse';
import { Synonym } from '../../src/types/Synonym';
import * as Utils from '../../src/utils/Utils';
import b008m7xk from '../data/b008m7xk.json';
import b0211hsl from '../data/b0211hsl.json';
import m000jbtq from '../data/m000jbtq.json';
import m001kscd from '../data/m001kscd.json';
import m001zh3r from '../data/m001zh3r.json';
import m001zh50 from '../data/m001zh50.json';
import m001zr9t from '../data/m001zr9t.json';
import m002b3cb from '../data/m002b3cb.json';
import m0026fkl from '../data/m0026fkl.json';
import m0029c0g from '../data/m0029c0g.json';
import m00255nq from '../data/m00255nq.json';
import p00bp2rm from '../data/p00bp2rm.json';
import p0fq3s31 from '../data/p0fq3s31.json';
import p09t2pyf from '../data/p09t2pyf.json';


jest.mock('../../src/service/configService');
jest.mock('../../src/service/appService');
jest.mock('../../src/service/skyhook/SkyhookService');
const mockedConfigService = jest.mocked(configService);
const mockedAppService = jest.mocked(appService);
const mockedSkyhookService = jest.mocked(SkyhookService);

describe('Utils', () => {
    

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
                socket: { localPort: 3000 },
            } as unknown as Request;

            expect(Utils.getBaseUrl(req)).toBe('http://localhost:3000');
        });
    });

    describe('createNZBDownloadLink', () => {
        it('builds download link correctly with and without app', async () => {
            const base: IPlayerSearchResult = {
                pid: '123',
                nzbName: 'test.nzb',
                type: VideoType.MOVIE,
            } as IPlayerSearchResult;

            const req = {
                protocol: 'http',
                hostname: 'localhost',
                socket: {
                    localPort: 4404
                }
            } as unknown as Request

            await expect(Utils.createNZBDownloadLink(req, base, 'apikey')).resolves.toBe(
                'http://localhost:4404/api?mode=nzb-download&pid=123&nzbName=test.nzb&type=MOVIE&apikey=apikey'
            );

            // Mock appService.getApp to return an app
            const mockApp: App = {
                id: 'radarr-id',
                name: 'Radarr',
                type: AppType.RADARR,
                url: 'http://radarr.example.com:7878',
                iplayarr: {
                    host: 'iplayarr.example.com',
                    port: 443,
                    useSSL: true
                }
            } as App;
            mockedAppService.getApp.mockResolvedValue(mockApp);

            await expect(Utils.createNZBDownloadLink(req, base, 'apikey', 'radarr')).resolves.toBe(
                'https://iplayarr.example.com:443/api?mode=nzb-download&pid=123&nzbName=test.nzb&type=MOVIE&apikey=apikey&app=radarr'
            );
        });
    });

    describe('removeAllQueryParams', () => {
        it('removes all query params from a URL', () => {
            expect(Utils.removeAllQueryParams('http://example.com/path?foo=bar&baz=qux')).toBe(
                'http://example.com/path'
            );
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
            mockedConfigService.getParameter.mockResolvedValue('hd');
            const result = await Utils.getQualityProfile();
            expect(result.id).toBe('hd');
        });
    });

    describe('createNZBName', () => {
        describe('TV', () => {
            it('title only', async () => {
                await expect(
                    Utils.createNZBName({
                        title: synonym.target,
                        pid: '',
                        type: VideoType.TV,
                        series: 1,
                        episode: 2,
                    })
                ).resolves.toBe('Thats.a.Title.S01E02.WEBDL.720p-BBC');
            });

        it('synonym replaces title when title matches target', async () => {
            await expect(
                Utils.createNZBName(
                    {
                        title: synonym.target,
                        pid: '',
                        type: VideoType.TV,
                        series: 1,
                        episode: 2,
                    },
                    synonym
                )
            ).resolves.toBe('Syno-Nym.Bus.S01E02.WEBDL.720p-BBC');
        });

        it('synonym does not replace title when title does not match target', async () => {
            await expect(
                Utils.createNZBName(
                    {
                        title: 'Different Title',
                        pid: '',
                        type: VideoType.TV,
                        series: 1,
                        episode: 2,
                    },
                    synonym
                )
            ).resolves.toBe('Different.Title.S01E02.WEBDL.720p-BBC');
        });

        it('synonym override replaces title when title matches target', async () => {
            await expect(
                Utils.createNZBName(
                    {
                        title: synonym.target,
                        pid: '',
                        type: VideoType.TV,
                        series: 1,
                        episode: 2,
                    },
                    synonymWithOverride
                )
            ).resolves.toBe('O.Ver_Ride.2.S01E02.WEBDL.720p-BBC');
        });

        it('synonym override does not replace title when title does not match target', async () => {
            await expect(
                Utils.createNZBName(
                    {
                        title: 'Different Title',
                        pid: '',
                        type: VideoType.TV,
                        series: 1,
                        episode: 2,
                    },
                    synonymWithOverride
                )
            ).resolves.toBe('Different.Title.S01E02.WEBDL.720p-BBC');
        });

        it('double digits', async () => {
            await expect(
                Utils.createNZBName({
                    title: synonym.target,
                    pid: '',
                    type: VideoType.TV,
                    series: 12,
                    episode: 34,
                })
            ).resolves.toBe('Thats.a.Title.S12E34.WEBDL.720p-BBC');
        });

        it('yearly', async () => {
            await expect(
                Utils.createNZBName({
                    title: synonym.target,
                    pid: '',
                    type: VideoType.TV,
                    series: 2025,
                    episode: 365,
                })
            ).resolves.toBe('Thats.a.Title.S2025E365.WEBDL.720p-BBC');
        });

        it('specials', async () => {
            await expect(
                Utils.createNZBName({
                    title: synonym.target,
                    pid: '',
                    type: VideoType.TV,
                    series: 0,
                    episode: 0,
                })
            ).resolves.toBe('Thats.a.Title.S00E00.WEBDL.720p-BBC');
        });

        it('episode title', async () => {
            await expect(
                Utils.createNZBName({
                    title: synonym.target,
                    pid: '',
                    type: VideoType.TV,
                    series: 1,
                    episode: 2,
                    episodeTitle: '14/04/2025: We Call That... an Episode.',
                })
            ).resolves.toBe('Thats.a.Title.S01E02.14.04.2025.We.Call.That.an.Episode.WEBDL.720p-BBC');
        });

        it('quality', async () => {
            mockedConfigService.getParameter.mockImplementation((parameter: IplayarrParameter) =>
                Promise.resolve(
                    parameter == IplayarrParameter.VIDEO_QUALITY ? 'fhd' : configService.defaultConfigMap[parameter]
                )
            );
            await expect(
                Utils.createNZBName({
                    title: synonym.target,
                    pid: '',
                    type: VideoType.TV,
                    series: 1,
                    episode: 2,
                })
            ).resolves.toBe('Thats.a.Title.S01E02.WEBDL.1080p-BBC');
        });

        it('missing series', async () => {
            await expect(
                Utils.createNZBName({
                    title: synonym.target,
                    pid: '',
                    type: VideoType.TV,
                    episode: 2,
                })
            ).resolves.toBe('Thats.a.Title.S00E00.WEBDL.720p-BBC');
        });

        it('missing episode', async () => {
            await expect(
                Utils.createNZBName({
                    title: synonym.target,
                    pid: '',
                    type: VideoType.TV,
                    series: 1,
                })
            ).resolves.toBe('Thats.a.Title.S00E00.WEBDL.720p-BBC');
        });
    });

        describe('MOVIE', () => {
            it('title only', async () => {
                await expect(
                    Utils.createNZBName({
                        title: synonym.target,
                        pid: '',
                        type: VideoType.MOVIE,
                    })
                ).resolves.toBe('Thats.a.Title.WEBDL.720p-BBC');
            });

        it('synonym replaces title when title matches target', async () => {
            await expect(
                Utils.createNZBName(
                    {
                        title: synonym.target,
                        pid: '',
                        type: VideoType.MOVIE,
                    },
                    synonym
                )
            ).resolves.toBe('Syno-Nym.Bus.WEBDL.720p-BBC');
        });

        it('synonym does not replace title when title does not match target', async () => {
            await expect(
                Utils.createNZBName(
                    {
                        title: 'Different Title',
                        pid: '',
                        type: VideoType.MOVIE,
                    },
                    synonym
                )
            ).resolves.toBe('Different.Title.WEBDL.720p-BBC');
        });

        it('synonym override replaces title when title matches target', async () => {
            await expect(
                Utils.createNZBName(
                    {
                        title: synonym.target,
                        pid: '',
                        type: VideoType.MOVIE,
                    },
                    synonymWithOverride
                )
            ).resolves.toBe('O.Ver_Ride.2.WEBDL.720p-BBC');
        });

        it('synonym override does not replace title when title does not match target', async () => {
            await expect(
                Utils.createNZBName(
                    {
                        title: 'Different Title',
                        pid: '',
                        type: VideoType.MOVIE,
                    },
                    synonymWithOverride
                )
            ).resolves.toBe('Different.Title.WEBDL.720p-BBC');
        });

        it('quality', async () => {
            mockedConfigService.getParameter.mockImplementation((parameter: IplayarrParameter) =>
                Promise.resolve(
                    parameter == IplayarrParameter.VIDEO_QUALITY ? 'fhd' : configService.defaultConfigMap[parameter]
                )
            );
            await expect(
                Utils.createNZBName({
                    title: synonym.target,
                    pid: '',
                    type: VideoType.MOVIE,
                })
            ).resolves.toBe('Thats.a.Title.WEBDL.1080p-BBC');
        });
    });

        const synonym: Synonym = {
            id: '',
            from: 'Syno-Nym Bus?',
            target: 'That\'s a Title!',
            exemptions: '',
        };

        const synonymWithOverride: Synonym = {
            ...synonym,
            filenameOverride: 'O.Ver_Ride: 2',
        };
    });

    describe('removeLastFourDigitNumber', () => {
        it('removes the last 4-digit number', () => {
            expect(Utils.removeLastFourDigitNumber('Some title 2024')).toBe('Some title');
            expect(Utils.removeLastFourDigitNumber('Another 1999 title 2022')).toBe('Another 1999 title');
            expect(Utils.removeLastFourDigitNumber('No year here')).toBe('No year here');
        });
    });

    describe('parseEpisodeDetailStrings', () => {
        it('extracts number from title using regex', () => {
            const [title, episode, series] = Utils.parseEpisodeDetailStrings('Doctor Who: Series 3', '4', '1');
            expect(title.trim()).toBe('Doctor Who');
            expect(episode).toBe(4);
            expect(series).toBe(3);
        });

        it('falls back to default series number if no match', () => {
            const [title, episode, series] = Utils.parseEpisodeDetailStrings('Doctor Who', '4', '2');
            expect(title).toBe('Doctor Who');
            expect(episode).toBe(4);
            expect(series).toBe(2);
        });

        it('returns undefined for invalid series and episode values', () => {
            const [title, episode, series] = Utils.parseEpisodeDetailStrings('Doctor Who', 'SEVEN', 'TWO');
            expect(title).toBe('Doctor Who');
            expect(episode).toBeUndefined();
            expect(series).toBeUndefined();
        });

        it('extracts titles with special characters', () => {
            const [title, episode, series] = Utils.parseEpisodeDetailStrings(
                'The Apprentice: You\'re Fired!: Series 19',
                '12',
                '1'
            );
            expect(title.trim()).toBe('The Apprentice: You\'re Fired!');
            expect(episode).toBe(12);
            expect(series).toBe(19);
        });

        it('fall back still extracts titles with special characters', () => {
            const [title, episode, series] = Utils.parseEpisodeDetailStrings(
                'The Apprentice: You\'re Fired!',
                '12',
                '19'
            );
            expect(title.trim()).toBe('The Apprentice: You\'re Fired!');
            expect(episode).toBe(12);
            expect(series).toBe(19);
        });
    });

    describe('getPotentialRoman', () => {
        it('parses valid roman numerals', () => {
            expect(Utils.getPotentialRoman('X')).toBe(10);
            expect(Utils.getPotentialRoman('IV')).toBe(4);
        });

        it('falls back to integer if not roman', () => {
            expect(Utils.getPotentialRoman('12')).toBe(12);
            expect(Utils.getPotentialRoman('not-a-number')).toBeNaN();
        });
    });

    describe('sanitizeLunrQuery', () => {
        it('removes colons that would be interpreted as field specifiers', () => {
            expect(Utils.sanitizeLunrQuery('Call the Midwife:')).toBe('Call the Midwife');
            expect(Utils.sanitizeLunrQuery('title:search')).toBe('title search');
        });

        it('removes other Lunr special characters', () => {
            expect(Utils.sanitizeLunrQuery('test+required')).toBe('test required');
            expect(Utils.sanitizeLunrQuery('test-prohibited')).toBe('test prohibited');
            expect(Utils.sanitizeLunrQuery('test*wildcard')).toBe('test wildcard');
            expect(Utils.sanitizeLunrQuery('test~fuzzy')).toBe('test fuzzy');
            expect(Utils.sanitizeLunrQuery('test^boost')).toBe('test boost');
        });

        it('handles multiple special characters', () => {
            expect(Utils.sanitizeLunrQuery('Call: the +Midwife* 2024')).toBe('Call the Midwife 2024');
        });

        it('collapses multiple spaces', () => {
            expect(Utils.sanitizeLunrQuery('Call   the   Midwife')).toBe('Call the Midwife');
        });

        it('returns empty string for query with only special characters', () => {
            expect(Utils.sanitizeLunrQuery(':+*~^')).toBe('');
            expect(Utils.sanitizeLunrQuery(':')).toBe('');
        });

        it('preserves normal search terms', () => {
            expect(Utils.sanitizeLunrQuery('Doctor Who')).toBe('Doctor Who');
            expect(Utils.sanitizeLunrQuery('EastEnders')).toBe('EastEnders');
        });

        it('handles empty input', () => {
            expect(Utils.sanitizeLunrQuery('')).toBe('');
        });
    });

    describe('calculateSeasonAndEpisode', () => {
        describe('episodes', () => {
            it('standard series', async () => await assertSeasonAndEpisode(m0029c0g, VideoType.TV,
                'Doctor Who', 3, 1, 'Episode 1'));

            it('season finale', async () => await assertSeasonAndEpisode(m00255nq, VideoType.TV,
                'Return to Paradise', 1, 6, 'Oh Mine Papa'));

            it('yearly series', async () => await assertSeasonAndEpisode(m001zh50, VideoType.TV,
                'Gardeners\' World', 2024, 1, 'Episode 1'));

            it('parsed series title', async () => await assertSeasonAndEpisode(p09t2pyf, VideoType.TV,
                'The Goes Wrong Show', 2, 1, 'Summer Once Again'));

            it('parsed roman numerals series', async () => await assertSeasonAndEpisode(p00bp2rm, VideoType.TV,
                'Red Dwarf', 4, 5, 'Dimension Jump'));

            it('no series data', async () => await assertSeasonAndEpisode(m002b3cb, VideoType.TV,
                'BBC News', 0, 0, '13/04/2025', true));

            describe('specials', () => {
                it('with no series', async () => await assertSeasonAndEpisode(m0026fkl, VideoType.TV,
                    'Beyond Paradise', 0, 0, 'Christmas Special 2024', true));

                it('only one in series', async () => await assertSeasonAndEpisode(p0fq3s31, VideoType.TV,
                    'Red Dwarf', 13, 0, 'The Promised Land', true));

                it('episode before series', async () => await assertSeasonAndEpisode(m001zh3r, VideoType.TV,
                    'RHS Chelsea Flower Show', 2024, 0, 'RHS: Countdown to Chelsea', true));

                it('episode within series', async () => await assertSeasonAndEpisode(m001zr9t, VideoType.TV,
                    'RHS Chelsea Flower Show', 2024, 0, 'Highlights', true));

                it('episode after series', async () => await assertSeasonAndEpisode(b0211hsl, VideoType.TV,
                    'RHS Chelsea Flower Show', 0, 0, 'Red Button Special', true));

                it('from series of specials', async () => await assertSeasonAndEpisode(m000jbtq, VideoType.TV,
                    'RHS Chelsea Flower Show', 0, 0, 'Making the Most of Your Time', true));
            });
        });

        describe('movies', () => {
            it('standalone', async () =>
                await assertSeasonAndEpisode(m001kscd, VideoType.MOVIE, 'Some Movie'));

            it('sequel', async () =>
                await assertSeasonAndEpisode(b008m7xk, VideoType.MOVIE, 'Another Movie'));
        });

        describe('fallback to Skyhook', () => {
            it('uses Skyhook result when full data returned', async () => {
                mockedSkyhookService.lookupSeriesDetails.mockResolvedValue({ series: 5, episode: 12 });
                await assertSeasonAndEpisode(m002b3cb, VideoType.TV, 'BBC News', 5, 12, '13/04/2025', true);
            });

            it('keeps 0/0 when Skyhook returns nothing', async () => {
                mockedSkyhookService.lookupSeriesDetails.mockResolvedValue(undefined);
                await assertSeasonAndEpisode(m002b3cb, VideoType.TV, 'BBC News', 0, 0, '13/04/2025', true);
            });

            it('uses partial data when Skyhook returns series only', async () => {
                mockedSkyhookService.lookupSeriesDetails.mockResolvedValue({ series: 3, episode: undefined });
                await assertSeasonAndEpisode(m002b3cb, VideoType.TV, 'BBC News', 3, 0, '13/04/2025', true);
            });
        });

        const assertSeasonAndEpisode = async (
            metadata: unknown,
            type: VideoType,
            showTitle: string,
            season: number | undefined = undefined,
            episode: number | undefined = undefined,
            episodeTitle: string | undefined = undefined,
            expectSkyhook: boolean = false
        ) => {
            const programme = (metadata as IPlayerMetadataResponse).programme;
            const result = await Utils.calculateSeasonAndEpisode(programme);
            expect(result).toEqual([type, episode, episodeTitle, season]);

            if (expectSkyhook) {
                expect(mockedSkyhookService.lookupSeriesDetails).toHaveBeenCalledWith(showTitle, episodeTitle);
            } else {
                expect(mockedSkyhookService.lookupSeriesDetails).not.toHaveBeenCalled();
            }
        };
    });

    beforeEach(() => {
        mockedSkyhookService.lookupSeriesDetails.mockClear();
        mockedConfigService.getParameter.mockImplementation((parameter: IplayarrParameter) =>
            Promise.resolve(configService.defaultConfigMap[parameter])
        );
        mockedAppService.getApp.mockClear();
    });
});
