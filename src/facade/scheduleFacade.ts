import configService from '../service/configService';
import { AbstractScheduleService } from '../service/schedule/AbstractScheduleService';
import GetIplayerShceduleService from '../service/schedule/GetIplayerShceduleService';
import NativeScheduleService from '../service/schedule/NativeScheduleService';
import { IplayarrParameter } from '../types/IplayarrParameters';
import { IPlayerSearchResult } from '../types/IPlayerSearchResult';

class ScheduleFacade {
    async refreshCache () : Promise<void> {
        const service = await this.#getService();
        await service.refreshCache();
    }

    async getFeed () : Promise<IPlayerSearchResult[]> {
        const service = await this.#getService();
        return await service.getFeed();
    }

    async #getService(): Promise<AbstractScheduleService> {
        const nativeSearchEnabled = await configService.getParameter(IplayarrParameter.NATIVE_SEARCH);
        return nativeSearchEnabled == 'true' ? NativeScheduleService : GetIplayerShceduleService;
    }
}

export default new ScheduleFacade();