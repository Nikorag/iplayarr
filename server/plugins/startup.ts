import { defineNitroPlugin } from 'nitropack/runtime';

import { migrateFromRedisIfNeeded } from '../migration/redisMigrationService';
import sessionService from '../service/auth/sessionService';
import loggingService from '../service/loggingService';
import StatisticsService from '../service/stats/StatisticsService';
import taskService from '../service/taskService';

const start = async () => {
    // Open the database (applying schema migrations) and import any legacy Redis data before serving requests
    await migrateFromRedisIfNeeded((...args) => loggingService.log(...args));

    sessionService.startPurging();
    StatisticsService.setUptime();
    taskService.init();
    loggingService.log('iPlayarr started');
};

export default defineNitroPlugin((nitroApp) => {
    const started = start();
    started.catch((error) => {
        loggingService.error(`Failed to start iPlayarr: ${error?.message ?? error}`);
        process.exit(1);
    });

    // Plugins aren't awaited, so hold requests until startup (database + legacy import) has finished
    nitroApp.hooks.hook('request', () => started);
});
