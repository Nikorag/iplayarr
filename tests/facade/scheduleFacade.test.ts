import scheduleFacade from '../../src/facade/scheduleFacade';
import configService from '../../src/service/configService';
import GetIplayerScheduleService from '../../src/service/schedule/GetIplayerScheduleService';
import NativeScheduleService from '../../src/service/schedule/NativeScheduleService';
import { IplayarrParameter } from '../../src/types/IplayarrParameters';

jest.mock('../../src/service/configService');
jest.mock('../../src/service/schedule/GetIplayerScheduleService', () => ({
    refreshCache: jest.fn(),
    getFeed: jest.fn()
}));
jest.mock('../../src/service/schedule/NativeScheduleService', () => ({
    refreshCache: jest.fn(),
    getFeed: jest.fn()
}));

describe('ScheduleFacade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('refreshCache', () => {
    it('uses NativeScheduleService when native search is enabled', async () => {
      (configService.getParameter as jest.Mock).mockResolvedValue('true');
      (NativeScheduleService.refreshCache as jest.Mock).mockResolvedValue(undefined);

      await scheduleFacade.refreshCache();

      expect(configService.getParameter).toHaveBeenCalledWith(IplayarrParameter.NATIVE_SEARCH);
      expect(NativeScheduleService.refreshCache).toHaveBeenCalled();
    });

    it('uses GetIplayerScheduleService when native search is disabled', async () => {
      (configService.getParameter as jest.Mock).mockResolvedValue('false');
      (GetIplayerScheduleService.refreshCache as jest.Mock).mockResolvedValue(undefined);

      await scheduleFacade.refreshCache();

      expect(configService.getParameter).toHaveBeenCalledWith(IplayarrParameter.NATIVE_SEARCH);
      expect(GetIplayerScheduleService.refreshCache).toHaveBeenCalled();
    });
  });

  describe('getFeed', () => {
    it('uses NativeScheduleService when native search is enabled', async () => {
      const fakeFeed = [{ title: 'Native result' }];
      (configService.getParameter as jest.Mock).mockResolvedValue('true');
      (NativeScheduleService.getFeed as jest.Mock).mockResolvedValue(fakeFeed);

      const result = await scheduleFacade.getFeed();

      expect(configService.getParameter).toHaveBeenCalledWith(IplayarrParameter.NATIVE_SEARCH);
      expect(NativeScheduleService.getFeed).toHaveBeenCalled();
      expect(result).toEqual(fakeFeed);
    });

    it('uses GetIplayerScheduleService when native search is disabled', async () => {
      const fakeFeed = [{ title: 'Iplayer result' }];
      (configService.getParameter as jest.Mock).mockResolvedValue('false');
      (GetIplayerScheduleService.getFeed as jest.Mock).mockResolvedValue(fakeFeed);

      const result = await scheduleFacade.getFeed();

      expect(configService.getParameter).toHaveBeenCalledWith(IplayarrParameter.NATIVE_SEARCH);
      expect(GetIplayerScheduleService.getFeed).toHaveBeenCalled();
      expect(result).toEqual(fakeFeed);
    });
  });
});
