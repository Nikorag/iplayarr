jest.mock('src/service/redisService', () => ({
    redis: () => jest.mock('ioredis/Redis'),
}));
