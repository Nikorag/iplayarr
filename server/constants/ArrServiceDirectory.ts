import AbstractArrService from '../service/arr/AbstractArrService';
import V1ArrService from '../service/arr/V1ArrService';
import V3ArrService from '../service/arr/V3ArrService';
import { AppType } from '../types/AppType';

export const ArrServiceDirectory: Partial<Record<AppType, AbstractArrService>> = {
    [AppType.SONARR]: V3ArrService,
    [AppType.RADARR]: V3ArrService,
    [AppType.PROWLARR]: V1ArrService,
}