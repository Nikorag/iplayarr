import { redis } from 'src/service/redisService';
import { QueuedStorage } from 'src/types/QueuedStorage';

jest.mock('src/service/redisService', () => ({
    redis: {
        keys: jest.fn(),
        mget: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        save: jest.fn()
    }
}));

describe('QueuedStorage', () => {
    let storage: QueuedStorage;

    beforeEach(() => {
        storage = new QueuedStorage();
        jest.clearAllMocks();
    });

    it('should get all values', async () => {
        (redis.keys as jest.Mock).mockResolvedValue(['key1', 'key2']);
        (redis.mget as jest.Mock).mockResolvedValue([
            JSON.stringify({ a: 1 }),
            JSON.stringify({ b: 2 })
        ]);

        const values = await storage.values();

        expect(redis.keys).toHaveBeenCalled();
        expect(redis.mget).toHaveBeenCalledWith(['key1', 'key2']);
        expect(values).toEqual([{ a: 1 }, { b: 2 }]);
    });

    it('should get all keys', async () => {
        (redis.keys as jest.Mock).mockResolvedValue(['key1', 'key2']);

        const keys = await storage.keys();

        expect(redis.keys).toHaveBeenCalled();
        expect(keys).toEqual(['key1', 'key2']);
    });

    it('should get a single item', async () => {
        (redis.get as jest.Mock).mockResolvedValue(JSON.stringify({ a: 1 }));

        const item = await storage.getItem('key1');

        expect(redis.get).toHaveBeenCalledWith('key1');
        expect(item).toEqual({ a: 1 });
    });

    it('should return undefined if getItem returns null', async () => {
        (redis.get as jest.Mock).mockResolvedValue(null);

        const item = await storage.getItem('missing');

        expect(redis.get).toHaveBeenCalledWith('missing');
        expect(item).toBeUndefined();
    });

    it('should set an item', async () => {
        (redis.set as jest.Mock).mockResolvedValue('OK');
        (redis.save as jest.Mock).mockResolvedValue('OK');

        await storage.setItem('key1', { a: 1 });

        expect(redis.set).toHaveBeenCalledWith('key1', JSON.stringify({ a: 1 }));
    });

    it('should remove an item', async () => {
        (redis.del as jest.Mock).mockResolvedValue(1);
        (redis.save as jest.Mock).mockResolvedValue('OK');

        await storage.removeItem('key1');

        expect(redis.del).toHaveBeenCalledWith('key1');
    });

    it('should call save after altering changes', async () => {
        (redis.set as jest.Mock).mockResolvedValue('OK');
        (redis.del as jest.Mock).mockResolvedValue(1);
        (redis.save as jest.Mock).mockResolvedValue('OK');

        await storage.setItem('a', { foo: 'bar' });
        await storage.removeItem('a');

        expect(redis.save).toHaveBeenCalledTimes(2);
    });

    it('should queue operations in order', async () => {
        const order: string[] = [];

        (redis.set as jest.Mock).mockImplementation(async (key) => {
            order.push(`set:${key}`);
            return 'OK';
        });
        (redis.save as jest.Mock).mockImplementation(async () => {
            order.push('save');
            return 'OK';
        });

        await Promise.all([
            storage.setItem('key1', { a: 1 }),
            storage.setItem('key2', { b: 2 }),
            storage.setItem('key3', { c: 3 })
        ]);

        expect(order).toEqual([
            'set:key1', 'save',
            'set:key2', 'save',
            'set:key3', 'save'
        ]);
    });
});
