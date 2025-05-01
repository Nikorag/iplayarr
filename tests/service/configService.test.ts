
import searchFacade from '../../src/facade/searchFacade';
import configService from '../../src/service/configService';
import { IplayarrParameter } from '../../src/types/IplayarrParameters';

jest.mock('../../src/facade/searchFacade', () => ({
  clearSearchCache: jest.fn(),
}));

const mockStorage: Record<string, any> = {};

jest.mock('../../src/types/QueuedStorage', () => {
  return {
    QueuedStorage: jest.fn().mockImplementation(() => ({
      getItem: jest.fn(async (key) => mockStorage[key]),
      setItem: jest.fn(async (key, value) => {
        mockStorage[key] = value;
      }),
      removeItem: jest.fn(async (key) => {
        delete mockStorage[key];
      }),
    })),
  };
});

describe('configService', () => {
  beforeEach(() => {
    for (const key in mockStorage) {
      delete mockStorage[key];
    }
    jest.clearAllMocks();
  });

  it('returns parameter from stored config', async () => {
    mockStorage['config'] = {
      [IplayarrParameter.DEBUG]: 'true',
    };
    const result = await configService.getParameter(IplayarrParameter.DEBUG);
    expect(result).toBe('true');
  });

  it('returns parameter from env', async () => {
    process.env[IplayarrParameter.RSS_FEED_HOURS] = '99';
    const result = await configService.getParameter(IplayarrParameter.RSS_FEED_HOURS);
    expect(result).toBe('99');
    delete process.env[IplayarrParameter.RSS_FEED_HOURS];
  });

  it('returns parameter from default config', async () => {
    const result = await configService.getParameter(IplayarrParameter.ACTIVE_LIMIT);
    expect(result).toBe('3');
  });

  it('returns multiple parameters', async () => {
    const [debug, quality] = await configService.getParameters(IplayarrParameter.DEBUG, IplayarrParameter.VIDEO_QUALITY);
    expect(debug).toBe('false');
    expect(quality).toBe('hd');
  });

  it('sets and gets parameter', async () => {
    await configService.setParameter(IplayarrParameter.DEBUG, 'true');
    const value = await configService.getParameter(IplayarrParameter.DEBUG);
    expect(value).toBe('true');
  });

  it('removes parameter', async () => {
    await configService.setParameter(IplayarrParameter.DEBUG, 'true');
    await configService.removeParameter(IplayarrParameter.DEBUG);
    const value = await configService.getParameter(IplayarrParameter.DEBUG);
    expect(value).toBe('false'); // falls back to default
  });

  it('clears search cache when NATIVE_SEARCH changes', async () => {
    mockStorage['config'] = {
      [IplayarrParameter.NATIVE_SEARCH]: 'false',
    };
    await configService.setParameter(IplayarrParameter.NATIVE_SEARCH, 'true');
    expect(searchFacade.clearSearchCache).toHaveBeenCalled();
  });

  it('does not clear search cache when NATIVE_SEARCH is unchanged', async () => {
    mockStorage['config'] = {
      [IplayarrParameter.NATIVE_SEARCH]: 'true',
    };
    await configService.setParameter(IplayarrParameter.NATIVE_SEARCH, 'true');
    expect(searchFacade.clearSearchCache).not.toHaveBeenCalled();
  });

  it('getAllConfig returns merged config map', async () => {
    mockStorage['config'] = {
      [IplayarrParameter.DEBUG]: 'true',
    };
    const config = await configService.getAllConfig();
    expect(config.DEBUG).toBe('true');
    expect(config.REFRESH_SCHEDULE).toBe('0 * * * *');
  });
});
