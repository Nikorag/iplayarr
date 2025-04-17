import { Request } from 'express';
import configService from 'src/service/configService';
import { IplayarrParameter } from 'src/types/enums/IplayarrParameters';
import { IPlayerSearchResult, VideoType } from 'src/types/IPlayerSearchResult';
import { IPlayerMetadataResponse } from 'src/types/responses/IPlayerMetadataResponse';
import { Synonym } from 'src/types/Synonym';
import * as Utils from 'src/utils/Utils';
import b008m7xk from 'tests/data/b008m7xk';
import b0211hsl from 'tests/data/b0211hsl';
import m000jbtq from 'tests/data/m000jbtq';
import m001kscd from 'tests/data/m001kscd';
import m001zh3r from 'tests/data/m001zh3r';
import m001zh50 from 'tests/data/m001zh50';
import m001zr9t from 'tests/data/m001zr9t';
import m002b3cb from 'tests/data/m002b3cb';
import m0026fkl from 'tests/data/m0026fkl';
import m0029c0g from 'tests/data/m0029c0g';
import p00bp2rm from 'tests/data/p00bp2rm';
import p0fq3s31 from 'tests/data/p0fq3s31';

jest.mock('src/service/configService');
const mockedConfigService = jest.mocked(configService);

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
            mockedConfigService.getParameter.mockResolvedValue('hd');
            const result = await Utils.getQualityProfile();
            expect(result.id).toBe('hd');
        });
    });

    describe('createNZBName', () => {
        describe('TV', () => {
            it('title only', async () => {
                await expect(Utils.createNZBName({
                    title: synonym.target,
                    pid: '',
                    type: VideoType.TV,
                    series: 1,
                    episode: 2,
                    allCategories: []
                })).resolves.toBe('Thats.a.Title.S01E02.WEBDL.720p-BBC');
            });
    
            it('synonym replaces title', async () => {
                await expect(Utils.createNZBName({
                    title: synonym.target,
                    pid: '',
                    type: VideoType.TV,
                    series: 1,
                    episode: 2,
                    allCategories: []
                }, synonym)).resolves.toBe('Syno-Nym.Bus.S01E02.WEBDL.720p-BBC');
            });
    
            it('synonym override replaces title', async () => {
                await expect(Utils.createNZBName({
                    title: synonym.target,
                    pid: '',
                    type: VideoType.TV,
                    series: 1,
                    episode: 2,
                    allCategories: []
                }, synonymWithOverride)).resolves.toBe('O.Ver_Ride.2.S01E02.WEBDL.720p-BBC');
            });
    
            it('double digits', async () => {
                await expect(Utils.createNZBName({
                    title: synonym.target,
                    pid: '',
                    type: VideoType.TV,
                    series: 12,
                    episode: 34,
                    allCategories: []
                })).resolves.toBe('Thats.a.Title.S12E34.WEBDL.720p-BBC');
            });
    
            it('yearly', async () => {
                await expect(Utils.createNZBName({
                    title: synonym.target,
                    pid: '',
                    type: VideoType.TV,
                    series: 2025,
                    episode: 365,
                    allCategories: []
                })).resolves.toBe('Thats.a.Title.S2025E365.WEBDL.720p-BBC');
            });
    
            it('specials', async () => {
                await expect(Utils.createNZBName({
                    title: synonym.target,
                    pid: '',
                    type: VideoType.TV,
                    series: 0,
                    episode: 0,
                    allCategories: []
                })).resolves.toBe('Thats.a.Title.S00E00.WEBDL.720p-BBC');
            });
    
            it('episode title', async () => {
                await expect(Utils.createNZBName({
                    title: synonym.target,
                    pid: '',
                    type: VideoType.TV,
                    series: 1,
                    episode: 2,
                    episodeTitle: '14/04/2025: We Call That... an Episode.',
                    allCategories: []
                })).resolves.toBe('Thats.a.Title.S01E02.14.04.2025.We.Call.That.an.Episode.WEBDL.720p-BBC');
            });
    
            it('quality', async () => {
                mockedConfigService.getParameter.mockImplementation((parameter: IplayarrParameter) => 
                    Promise.resolve(parameter == IplayarrParameter.VIDEO_QUALITY ? 'fhd' : configService.defaultConfigMap[parameter]));
                await expect(Utils.createNZBName({
                    title: synonym.target,
                    pid: '',
                    type: VideoType.TV,
                    series: 1,
                    episode: 2,
                    allCategories: []
                })).resolves.toBe('Thats.a.Title.S01E02.WEBDL.1080p-BBC');
            });
    
            it('missing series', async () => {
                await expect(Utils.createNZBName({
                    title: synonym.target,
                    pid: '',
                    type: VideoType.TV,
                    episode: 2,
                    allCategories: []
                })).resolves.toBe('Thats.a.Title.S00E00.WEBDL.720p-BBC');
            });
    
            it('missing episode', async () => {
                await expect(Utils.createNZBName({
                    title: synonym.target,
                    pid: '',
                    type: VideoType.TV,
                    series: 1,
                    allCategories: []
                })).resolves.toBe('Thats.a.Title.S00E00.WEBDL.720p-BBC');
            });
        });
    
        describe('MOVIE', () => {
            it('title only', async () => {
                await expect(Utils.createNZBName({
                    title: synonym.target,
                    pid: '',
                    type: VideoType.MOVIE,
                    allCategories: []
                })).resolves.toBe('Thats.a.Title.WEBDL.720p-BBC');
            });
    
            it('synonym replaces title', async () => {
                await expect(Utils.createNZBName({
                    title: synonym.target,
                    pid: '',
                    type: VideoType.MOVIE,
                    allCategories: []
                }, synonym)).resolves.toBe('Syno-Nym.Bus.WEBDL.720p-BBC');
            });
    
            it('synonym override replaces title', async () => {
                await expect(Utils.createNZBName({
                    title: synonym.target,
                    pid: '',
                    type: VideoType.MOVIE,
                    allCategories: []
                }, synonymWithOverride)).resolves.toBe('O.Ver_Ride.2.WEBDL.720p-BBC');
            });
    
            it('quality', async () => {
                mockedConfigService.getParameter.mockImplementation((parameter: IplayarrParameter) => 
                    Promise.resolve(parameter == IplayarrParameter.VIDEO_QUALITY ? 'fhd' : configService.defaultConfigMap[parameter]));
                await expect(Utils.createNZBName({
                    title: synonym.target,
                    pid: '',
                    type: VideoType.MOVIE,
                    allCategories: []
                })).resolves.toBe('Thats.a.Title.WEBDL.1080p-BBC');
            });
        });
        
        const synonym: Synonym = {
            id: '',
            from: 'Syno-Nym Bus?',
            target: 'That\'s a Title!',
            exemptions: ''
        };
        
        const synonymWithOverride: Synonym = {
            ...synonym,
            filenameOverride: 'O.Ver_Ride: 2'
        }
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
        })
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

    describe('calculateSeasonAndEpisode', () => {
        describe('episodes', () => {
            it('series episode', async () => assertSeasonAndEpisode(m0029c0g, [ VideoType.TV, expect.any(Array), 1, 'Episode 1', 3]));        
            it('roman numerals series', async () => assertSeasonAndEpisode(p00bp2rm, [ VideoType.TV, expect.any(Array), 5, 'Dimension Jump', 4 ]));        
            it('yearly series', async () => assertSeasonAndEpisode(m001zh50, [ VideoType.TV, expect.any(Array), 1, 'Episode 1', 2024]));        
            it('no series', async () => assertSeasonAndEpisode(m002b3cb, [ VideoType.TV, expect.any(Array), 0, '13/04/2025', 0]));
        
            describe('specials', () => {
                it('with no series', async () => assertSeasonAndEpisode(m0026fkl, [ VideoType.TV, expect.any(Array), 0, 'Christmas Special 2024', 0]));
                it('only one in series', async () => assertSeasonAndEpisode(p0fq3s31, [ VideoType.TV, expect.any(Array), 0, 'The Promised Land', 13]));
                it('episode before series', async () => assertSeasonAndEpisode(m001zh3r, [ VideoType.TV, expect.any(Array), 0, 'RHS: Countdown to Chelsea', 2024]));
                it('episode within series', async () => assertSeasonAndEpisode(m001zr9t, [ VideoType.TV, expect.any(Array), 0, 'Highlights', 2024]));
                it('episode after series', async () => assertSeasonAndEpisode(b0211hsl, [ VideoType.TV, expect.any(Array), 0, 'Red Button Special', 0]));
                it('from series of specials', async () => assertSeasonAndEpisode(m000jbtq, [ VideoType.TV, expect.any(Array), 0, 'Your Chelsea Flower Show, Making the Most of Your Time', 0]));
            });
        });
        
        describe('movies', () => {
            it('standalone', async () => assertSeasonAndEpisode(m001kscd, [ VideoType.MOVIE, expect.any(Array), undefined, undefined, undefined]));        
            it('sequel', async () => assertSeasonAndEpisode(b008m7xk, [ VideoType.MOVIE, expect.any(Array), undefined, undefined, undefined]));
        });

        const assertSeasonAndEpisode = (metadata: IPlayerMetadataResponse, expected: [ VideoType, string[], number | undefined, string | undefined, number | undefined ]) => {
            expect(Utils.calculateSeasonAndEpisode(metadata.programme)).toEqual(expected);
        }
    });
    
    beforeEach(() => {
        mockedConfigService.getParameter.mockImplementation((parameter: IplayarrParameter) => Promise.resolve(configService.defaultConfigMap[parameter]));
    })
});
